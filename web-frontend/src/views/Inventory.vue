<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { convex } from '../lib/convex'
import { api } from '../../../convex/_generated/api'
import { 
  RefreshCw, 
  Trash2, 
  Check,
  CheckCheck,
  Ban,
  ImageIcon,
  X,
  Edit,
  Save,
  RotateCcw
} from 'lucide-vue-next'

const products = ref([])
const loading = ref(true)
const searchQuery = ref('')
const selectedProduct = ref(null)
const isEditing = ref(false)
const editForm = ref({})
let searchTimeout = null

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

function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    load()
  }, 500) // Debounce 500ms
}

async function updateStatus(productNumber, action) {
  try {
    const auth = useAuthStore()
    const res = await fetch(`/api/products/${encodeURIComponent(productNumber)}/status?action=${action}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${auth.user?.token}`
      }
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
    const auth = useAuthStore()
    const res = await fetch(`/api/products/${encodeURIComponent(productNumber)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${auth.user?.token}`
      }
    })
    
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'فشل الحذف')
    }
    
    await load()
    selectedProduct.value = null
  } catch (e) {
    alert('خطأ أثناء الحذف: ' + e.message)
  }
}

function formatDate(iso) {
  if (!iso) return 'غير محدد';
  const date = new Date(iso);
  return date.toLocaleString('ar-IQ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function startEdit() {
  editForm.value = { ...selectedProduct.value }
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

async function saveEdit() {
  try {
    const formData = new FormData()
    // pass current product_number as key, and possibly new one in body
    formData.append('new_product_number', editForm.value.product_number)
    formData.append('product_name', editForm.value.product_name)
    formData.append('car_name', editForm.value.car_name)
    formData.append('quantity', editForm.value.quantity)
    formData.append('price_iqd', editForm.value.price_iqd)
    formData.append('wholesale_price_iqd', editForm.value.wholesale_price_iqd)
    
    const auth = useAuthStore()
    const res = await fetch(`/api/products/${encodeURIComponent(selectedProduct.value.product_number)}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${auth.user?.token}`
      },
      body: formData
    })
    
    if (!res.ok) {
       const err = await res.json()
       throw new Error(err.detail || 'فشل التحديث')
    }
    
    isEditing.value = false
    selectedProduct.value = null // Close modal
    await load()
  } catch (e) {
    alert('خطأ أثناء التحديث: ' + e.message)
  }
}

onMounted(load)
</script>

<template>
  <div class="inventory-page">
    <header class="ios-header">
      <h1>المخزون</h1>
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

    <div v-else class="compact-grid">
      <div v-for="p in products" :key="p._id" class="mini-card card" @click="selectedProduct = p">
        <div class="mini-card-image">
          <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.product_name">
          <div v-else class="mini-no-image">
             <ImageIcon :size="32" :stroke-width="1" />
          </div>
          <div class="mini-status" :class="p.quantity > 0 ? 'available' : 'out'">
            {{ p.quantity > 0 ? 'متوفر' : 'نفذ' }}
          </div>
        </div>

        <div class="mini-card-body">
          <div class="mini-title-row">
            <h4>{{ p.product_name }}</h4>
            <span class="mini-price">{{ p.price_iqd.toLocaleString() }}</span>
          </div>
          <div class="mini-subtitle">{{ p.car_name }} • {{ p.quantity }}</div>

          <div class="mini-actions" @click.stop>
            <button @click="updateStatus(p.product_number, 'sold_one')" class="m-btn sold" title="بيع قطعة">
              <Check :size="16" />
            </button>
            <button @click="updateStatus(p.product_number, 'sold_all')" class="m-btn sold-all" title="بيع الكل">
              <CheckCheck :size="16" />
            </button>
            <button @click="updateStatus(p.product_number, 'out_of_stock')" class="m-btn out" title="نفد">
              <Ban :size="16" />
            </button>
            <button @click="removeProduct(p.product_number)" class="m-btn delete" title="حذف">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Detail Modal -->
    <div v-if="selectedProduct" class="ios-modal-overlay" @click="selectedProduct = null">
      <div class="ios-modal card" @click.stop>
        <div class="modal-header">
           <h2>{{ isEditing ? 'تعديل المنتج' : 'تفاصيل المنتج' }}</h2>
           <div class="modal-header-actions">
              <button v-if="!isEditing" @click="startEdit" class="edit-mode-btn"><Edit :size="18" /></button>
              <button @click="selectedProduct = null; isEditing = false" class="close-btn"><X :size="20" /></button>
           </div>
        </div>
        
        <div class="modal-body">
           <img v-if="selectedProduct.imageUrl" :src="selectedProduct.imageUrl" class="modal-img">
           
           <div class="detail-list" v-if="!isEditing">
              <div class="detail-item">
                <span class="label">اسم المنتج</span>
                <span class="value">{{ selectedProduct.product_name }}</span>
              </div>
              <div class="detail-item">
                <span class="label">السيارة</span>
                <span class="value">{{ selectedProduct.car_name }}</span>
              </div>
              <div class="detail-item">
                <span class="label">رقم القطعة</span>
                <span class="value">{{ selectedProduct.product_number }}</span>
              </div>
              <div class="detail-item">
                <span class="label">السعر</span>
                <span class="value price">{{ selectedProduct.price_iqd.toLocaleString() }} IQD</span>
              </div>
              <div class="detail-item">
                <span class="label">سعر الجملة</span>
                <span class="value">{{ selectedProduct.wholesale_price_iqd.toLocaleString() }} IQD</span>
              </div>
              <div class="detail-item">
                <span class="label">الكمية الحالية</span>
                <span class="value">{{ selectedProduct.quantity }}</span>
              </div>
              <div class="detail-item">
                <span class="label">تاريخ الإضافة</span>
                <span class="value">{{ formatDate(selectedProduct.last_update) }}</span>
              </div>
           </div>

           <div class="edit-list" v-else>
              <div class="edit-group">
                <label>اسم المنتج</label>
                <input v-model="editForm.product_name">
              </div>
              <div class="edit-group">
                <label>السيارة</label>
                <input v-model="editForm.car_name">
              </div>
              <div class="edit-group">
                <label>رقم القطعة</label>
                <input v-model="editForm.product_number">
              </div>
              <div class="edit-group">
                <label>السعر</label>
                <input type="number" v-model="editForm.price_iqd">
              </div>
              <div class="edit-group">
                <label>سعر الجملة</label>
                <input type="number" v-model="editForm.wholesale_price_iqd">
              </div>
              <div class="edit-group">
                <label>الكمية</label>
                <input type="number" v-model="editForm.quantity">
              </div>
           </div>
        </div>

        <div class="modal-footer">
           <div v-if="isEditing" class="edit-actions">
              <button @click="saveEdit" class="save-btn"><Save :size="18" /> حفظ التعديلات</button>
              <button @click="cancelEdit" class="cancel-btn"><RotateCcw :size="18" /> إلغاء</button>
           </div>
           <button v-else @click="removeProduct(selectedProduct.product_number)" class="delete-full-btn">
             <Trash2 :size="18" /> حذف المنتج من كل مكان
           </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ios-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.refresh-circular {
  background: var(--system-secondary-bg);
  border: none;
  color: var(--system-blue);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.search-section {
  margin-bottom: 20px;
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
}

.search-bar input:focus {
  border-color: var(--system-blue);
}

.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Smaller Cards Grid */
.compact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
  gap: 12px;
}

.mini-card {
  padding: 0 !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 0.5px solid var(--border);
}

.mini-card-image {
  height: 110px;
  position: relative;
  background: #111;
}

.mini-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mini-no-image {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
}

.mini-status {
  position: absolute;
  bottom: 6px;
  left: 6px;
  font-size: 9px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: bold;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.mini-status.available { background: rgba(48, 209, 88, 0.2); color: #30d158; }
.mini-status.out { background: rgba(255, 69, 58, 0.2); color: #ff453a; }

.mini-card-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mini-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.mini-title-row h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}

.mini-price {
  font-size: 12px;
  font-weight: 700;
  color: var(--system-green);
}

.mini-subtitle {
  font-size: 11px;
  color: var(--system-gray);
}

.mini-actions {
  display: flex;
  gap: 5px;
  margin-top: 8px;
  justify-content: space-between;
}

.m-btn {
  flex: 1;
  height: 32px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--system-tertiary-bg);
  color: var(--text-primary);
  transition: background 0.2s;
}

.m-btn:active { opacity: 0.6; }

.m-btn.sold { color: var(--system-blue); }
.m-btn.sold-all { color: var(--system-green); }
.m-btn.out { color: var(--system-orange); }
.m-btn.delete { color: var(--system-red); background: rgba(255, 69, 58, 0.05); }

/* Modal Styles */
.ios-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.3s ease;
}

.ios-modal {
  width: 100%;
  max-width: 450px;
  background: var(--system-secondary-bg);
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 0.5px solid var(--border);
}

.modal-header h2 { font-size: 18px; margin: 0; }
.modal-header-actions { display: flex; gap: 8px; align-items: center; }
.edit-mode-btn { background: var(--system-tertiary-bg); border: none; color: var(--system-blue); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.close-btn { background: var(--system-tertiary-bg); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.modal-img {
  width: 100%;
  height: 220px;
  object-fit: contain;
  background: #111;
  border-radius: 12px;
  margin-bottom: 20px;
}

.detail-list { display: grid; gap: 10px; }
.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 14px;
  background: var(--system-tertiary-bg);
  border-radius: 12px;
}

.detail-item .label { font-size: 13px; color: var(--system-gray); }
.detail-item .value { font-weight: 600; font-size: 15px; }
.detail-item .value.price { color: var(--system-green); }

.modal-footer {
  padding: 16px 20px;
  border-top: 0.5px solid var(--border);
}

.delete-full-btn {
  width: 100%;
  padding: 14px;
  background: rgba(255, 69, 58, 0.1);
  border: 1px solid var(--system-red);
  color: var(--system-red);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
}

.edit-list { display: grid; gap: 12px; }
.edit-group { display: flex; flex-direction: column; gap: 6px; }
.edit-group label { font-size: 12px; color: var(--system-gray); margin-right: 4px; }
.edit-group input { 
  background: var(--system-tertiary-bg); 
  border: 1px solid var(--border); 
  border-radius: 10px; 
  padding: 10px 14px; 
  color: white; 
  font-size: 15px;
}
.edit-group input:focus { border-color: var(--system-blue); outline: none; }

.edit-actions { display: flex; gap: 10px; width: 100%; margin-bottom: 0; }
.save-btn { flex: 2; background: var(--system-blue); color: white; border: none; border-radius: 12px; padding: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; }
.cancel-btn { flex: 1; background: var(--system-tertiary-bg); color: var(--system-gray); border: none; border-radius: 12px; padding: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

@media (max-width: 400px) {
  .compact-grid {
    grid-template-columns: 1fr 1fr; /* 2 cards per row on narrow mobile */
    gap: 8px;
  }
  .mini-card-image { height: 100px; }
}
</style>
