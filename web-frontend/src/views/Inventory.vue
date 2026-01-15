<script setup>
import { ref, onMounted } from 'vue'
import { convex } from '../lib/convex'
import { api } from '../../../convex/_generated/api'
import { 
  RefreshCw, 
  Trash2, 
  ImageIcon,
  X
} from 'lucide-vue-next'

const products = ref([])
const loading = ref(true)
const searchQuery = ref('')
const editingId = ref(null)
const editLoading = ref(false)
const editImageFile = ref(null)
const editForm = ref({
  product_number: '',
  product_name: '',
  car_name: '',
  model_number: '',
  type: '',
  quantity: 0,
  price_iqd: 0,
  wholesale_price_iqd: 0
})

async function load() {
  loading.value = true
  try {
    products.value = await convex.query(api.products.getProducts, { 
      search: searchQuery.value || undefined 
    })
  } finally {
    loading.value = false
  }
}

let searchTimeout = null
function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    load()
  }, 500)
}

function startEditing(p) {
  editingId.value = p._id
  editImageFile.value = null
  editForm.value = {
    product_number: p.product_number,
    product_name: p.product_name,
    car_name: p.car_name,
    model_number: p.model_number || '',
    type: p.type || '',
    quantity: p.quantity,
    price_iqd: p.price_iqd,
    wholesale_price_iqd: p.wholesale_price_iqd
  }
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit() {
  editLoading.value = true
  const p = products.value.find(item => item._id === editingId.value)
  try {
    const formData = new FormData()
    formData.append('product_name', editForm.value.product_name)
    formData.append('car_name', editForm.value.car_name)
    formData.append('model_number', editForm.value.model_number)
    formData.append('product_type', editForm.value.type)
    formData.append('quantity', editForm.value.quantity)
    formData.append('price_iqd', parseFloat(editForm.value.price_iqd) || 0)
    formData.append('wholesale_price_iqd', parseFloat(editForm.value.wholesale_price_iqd) || 0)
    
    // Add image if selected
    if (editImageFile.value) {
      formData.append('image', editImageFile.value)
    }

    const res = await fetch(`/api/products/${encodeURIComponent(p.product_number)}`, {
      method: 'PATCH',
      body: formData
    })
    
    if (!res.ok) throw new Error('فشل التحديث')
    
    await load()
    editingId.value = null
  } catch (e) {
    alert(e.message)
  } finally {
    editLoading.value = false
  }
}

async function updateStatus(productNumber, action) {
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(productNumber)}/status?action=${action}`, {
      method: 'PATCH',
    })
    if (!res.ok) throw new Error('Update failed')
    await load()
  } catch (e) {
    alert('حدث خطأ: ' + e.message)
  }
}

async function removeProduct(productNumber) {
  if (!confirm('حذف المنتج من المخزون والتليجرام؟')) return
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(productNumber)}`, {
      method: 'DELETE'
    })
    if (!res.ok) throw new Error('فشل الحذف')
    await load()
  } catch (e) {
    alert('خطأ أثناء الحذف: ' + e.message)
  }
}

function formatDate(iso) {
  if (!iso) return 'غير محدد';
  return new Date(iso).toLocaleString('ar-IQ', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

onMounted(load)
</script>

<template>
  <div class="inventory-page">
    <header class="ios-header">
      <h1>التوفر والمخزون</h1>
      <button @click="load" class="refresh-circular">
        <RefreshCw :class="{ 'spinning': loading }" :size="18" />
      </button>
    </header>

    <div class="search-section">
      <div class="search-bar">
        <input 
          v-model="searchQuery" 
          @input="handleSearch"
          type="text" 
          placeholder="بحث عن منتج، رقم، أو سيارة..."
        >
      </div>
    </div>

    <div v-if="loading && products.length === 0" class="loader">
      <RefreshCw class="spinning" />
    </div>

    <div v-else class="full-info-grid">
      <div v-for="p in products" :key="p._id" class="info-card card" :class="{ 'editing-mode': editingId === p._id }">
        <div class="card-image">
          <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.product_name">
          <div v-else class="no-image">
             <ImageIcon :size="48" :stroke-width="1" />
          </div>
          <div class="status-chip" :class="p.quantity > 0 ? 'available' : 'out'">
            {{ p.quantity > 0 ? 'متوفر' : 'نفذت' }}
          </div>
          <div class="id-tag">#{{ p.product_number }}</div>
        </div>

        <div class="card-content">
          <template v-if="editingId !== p._id">
            <div class="main-details">
              <h4 class="product-name">{{ p.product_name }}</h4>
              <p class="car-type">{{ p.car_name }}</p>
            </div>

            <div class="specs-grid">
              <div class="spec-item">
                <span class="s-label">رقم المنتج</span>
                <span class="s-value id-code">#{{ p.product_number }}</span>
              </div>
              <div class="spec-item">
                <span class="s-label">الكمية</span>
                <span class="s-value qty">{{ p.quantity }} قطع</span>
              </div>
              <div class="spec-item">
                <span class="s-label">سعر البيع</span>
                <span class="s-value price">{{ p.price_iqd.toLocaleString() }} <small>د.ع</small></span>
              </div>
              <div class="spec-item">
                <span class="s-label">سعر الجملة</span>
                <span class="s-value wholesale">{{ p.wholesale_price_iqd.toLocaleString() }} <small>د.ع</small></span>
              </div>
              <div class="spec-item full-width">
                <span class="s-label">آخر تحديث</span>
                <span class="s-value date">{{ formatDate(p.last_update) }}</span>
              </div>
            </div>

            <div class="card-actions">
              <button @click="updateStatus(p.product_number, 'sold_one')" class="action-link sell">بيع قطعة</button>
              <button @click="updateStatus(p.product_number, 'sold_all')" class="action-link sell-all">بيع الكل</button>
              <button @click="startEditing(p)" class="action-link edit">تعديل</button>
              <button @click="removeProduct(p.product_number)" class="action-link delete">حذف</button>
            </div>
          </template>

          <template v-else>
            <div class="edit-form">
              <div class="edit-field-group">
                <label class="edit-label">رقم المنتج</label>
                <input v-model="editForm.product_number" class="edit-input" placeholder="رقم المنتج" disabled>
              </div>
              
              <div class="edit-field-group">
                <label class="edit-label">اسم المنتج</label>
                <input v-model="editForm.product_name" class="edit-input" placeholder="اسم المنتج">
              </div>
              
              <div class="edit-row">
                <div class="edit-field-group">
                  <label class="edit-label">السيارة</label>
                  <input v-model="editForm.car_name" class="edit-input" placeholder="السيارة">
                </div>
                <div class="edit-field-group">
                  <label class="edit-label">الموديل</label>
                  <input v-model="editForm.model_number" class="edit-input" placeholder="الموديل">
                </div>
              </div>
              
              <div class="edit-field-group">
                <label class="edit-label">النوع</label>
                <input v-model="editForm.type" class="edit-input" placeholder="مثلاً: كهربائيات">
              </div>
              
              <div class="edit-row">
                <div class="edit-field-group">
                  <label class="edit-label">الكمية</label>
                  <input v-model.number="editForm.quantity" type="number" class="edit-input" placeholder="الكمية">
                </div>
                <div class="edit-field-group">
                  <label class="edit-label">سعر البيع</label>
                  <input v-model="editForm.price_iqd" type="text" class="edit-input" placeholder="بيع" pattern="[0-9]*" inputmode="numeric">
                </div>
              </div>
              
              <div class="edit-field-group">
                <label class="edit-label">سعر الجملة</label>
                <input v-model="editForm.wholesale_price_iqd" type="text" class="edit-input" placeholder="جملة" pattern="[0-9]*" inputmode="numeric">
              </div>
              
              <div class="edit-field-group">
                <label class="edit-label">تغيير الصورة (اختياري)</label>
                <input type="file" @change="e => editImageFile = e.target.files[0]" accept="image/*" class="edit-file-input">
              </div>
              
              <div class="edit-actions">
                <button @click="saveEdit" class="save-btn" :disabled="editLoading">
                  {{ editLoading ? 'جاري الحفظ...' : 'حفظ التعديلات' }}
                </button>
                <button @click="cancelEdit" class="cancel-btn">إلغاء</button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.full-info-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 40px;
}

.info-card {
  padding: 0 !important;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  background: var(--system-secondary-bg);
  border: 1px solid var(--border);
  min-height: 180px;
  border-radius: 16px;
}

.card-image {
  width: 140px;
  position: relative;
  background: #111;
  flex-shrink: 0;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
}

.status-chip {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 10px;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  font-weight: 700;
}
.status-chip.available { color: #30d158; border: 0.5px solid rgba(48, 209, 88, 0.3); }
.status-chip.out { color: #ff453a; border: 0.5px solid rgba(255, 69, 58, 0.3); }

.id-tag {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 10px;
  color: white;
  opacity: 0.6;
  font-family: monospace;
}

.card-content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.main-details { margin-bottom: 12px; }
.product-name { margin: 0 0 4px; font-size: 18px; font-weight: 700; }
.car-type { margin: 0; color: var(--system-gray); font-size: 14px; }

.specs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
}

.spec-item { display: flex; flex-direction: column; gap: 2px; }
.s-label { font-size: 11px; color: var(--system-gray); }
.s-value { font-size: 14px; font-weight: 600; }
.s-value.price { color: var(--system-blue); }
.s-value.wholesale { color: var(--system-green); }
.s-value.qty { color: var(--system-orange); }
.s-value.id-code { color: var(--system-gray); font-family: monospace; }
.s-value.date { font-size: 12px; opacity: 0.8; }

.spec-item.full-width {
  grid-column: span 2;
  border-top: 1px solid rgba(255,255,255,0.05);
  padding-top: 8px;
  margin-top: 4px;
}

.card-actions {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--border);
  padding-top: 12px;
  gap: 8px;
}

.action-link {
  background: transparent;
  border: none;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.action-link.sell { color: var(--system-blue); }
.action-link.sell-all { color: var(--system-green); }
.action-link.edit { color: var(--system-orange); }
.action-link.delete { color: var(--system-red); }

.edit-form { display: flex; flex-direction: column; gap: 12px; }

.edit-field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.edit-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.edit-input { background: var(--system-tertiary-bg); border: 1px solid var(--border); padding: 10px 12px; border-radius: 8px; color: white; font-size: 14px; }
.edit-input:disabled { opacity: 0.5; cursor: not-allowed; }
.edit-input:focus { outline: none; border-color: var(--system-blue); }

.edit-file-input {
  background: var(--system-tertiary-bg);
  border: 1px solid var(--border);
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
}

.edit-file-input::-webkit-file-upload-button {
  background: var(--system-blue);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-left: 10px;
}

.edit-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.edit-actions { display: flex; gap: 10px; margin-top: 12px; }
.save-btn { flex: 2; background: var(--system-blue); color: white; border: none; padding: 8px; border-radius: 8px; font-weight: 700; }
.cancel-btn { flex: 1; background: var(--system-tertiary-bg); color: white; border: none; padding: 8px; border-radius: 8px; }

.editing-mode { border-color: var(--system-blue) !important; box-shadow: 0 0 15px rgba(10, 132, 255, 0.2); }

@media (max-width: 480px) {
  .info-card { flex-direction: column; }
  .card-image { width: 100%; height: 160px; }
}

.ios-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.refresh-circular { background: var(--system-secondary-bg); border: none; color: var(--system-blue); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }

.search-section { 
  margin-bottom: 24px;
  padding: 0 4px;
}

.search-bar input { 
  width: 100%; 
  background: var(--system-secondary-bg); 
  border: 0.5px solid var(--border); 
  padding: 12px 16px; 
  border-radius: 12px; 
  color: white; 
  font-size: 15px; 
  outline: none;
  transition: all 0.2s;
}

.search-bar input:focus { 
  border-color: var(--system-blue);
  box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.1);
}

.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
