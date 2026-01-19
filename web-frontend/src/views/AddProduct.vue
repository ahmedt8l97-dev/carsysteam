<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Save, ImagePlus, X } from 'lucide-vue-next'

const router = useRouter()
const form = ref({
  product_number: '',
  product_name: '',
  car_name: '',
  type: '',
  quantity: 1,
  price_iqd: 0,
  wholesale_price_iqd: 0
})

const fileInput = ref(null)
const previewUrl = ref(null)
const loading = ref(false)

function onFileSelect(e) {
  const file = e.target.files[0]
  if (file) {
    previewUrl.value = URL.createObjectURL(file)
  }
}

const stripCommas = (str) => String(str).replace(/,/g, '');

function formatInputPrice(e, field) {
  let val = e.target.value.replace(/,/g, '');
  if (!isNaN(val) && val !== '') {
    form.value[field] = Number(val).toLocaleString();
  }
}

async function submit() {
  loading.value = true
  try {
    const formData = new FormData()
    formData.append('product_number', form.value.product_number)
    formData.append('product_name', form.value.product_name)
    formData.append('car_name', form.value.car_name)
    formData.append('product_type', form.value.type || 'قطع غيار')
    formData.append('quantity', form.value.quantity)
    formData.append('price_iqd', stripCommas(form.value.price_iqd))
    formData.append('wholesale_price_iqd', stripCommas(form.value.wholesale_price_iqd))
    
    // Add image if selected
    const file = fileInput.value?.files[0]
    if (file) {
      formData.append('image', file)
    }
    
    const res = await fetch('/api/products', {
      method: 'POST',
      body: formData
    })
    
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'فشل الحفظ')
    }

    router.push('/inventory')
  } catch (e) {
    alert('خطأ: ' + e.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="add-product-page">
    <header class="ios-header">
      <h1>إضافة قطعة</h1>
    </header>

    <form @submit.prevent="submit" class="ios-form">
      <!-- Image Picker Section -->
      <div class="image-picker-card card" @click="!previewUrl && fileInput.click()">
        <input type="file" ref="fileInput" accept="image/*" class="hidden" @change="onFileSelect">
        
        <div v-if="previewUrl" class="preview-container">
          <img :src="previewUrl" alt="Preview">
          <button type="button" class="clear-img" @click.stop="clearImage">
            <X :size="16" />
          </button>
        </div>
        
        <div v-else class="upload-placeholder">
          <ImagePlus :size="48" :stroke-width="1" />
          <span>إضافة صورة المنتج</span>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>رقم المنتج</label>
          <input v-model="form.product_number" required placeholder="مثلاً: A-123">
        </div>
        
        <div class="form-group">
          <label>اسم المنتج</label>
          <input v-model="form.product_name" required placeholder="مثلاً: محرك كورولا">
        </div>

        <div class="form-group">
          <label>السيارة</label>
          <input v-model="form.car_name" required placeholder="مثلاً: Toyota">
        </div>

        <div class="form-group">
          <label>النوع</label>
          <input v-model="form.type" placeholder="مثلاً: كهربائيات">
        </div>

        <div class="form-group">
          <label>الكمية</label>
          <input type="number" v-model="form.quantity" required min="0">
        </div>

        <div class="form-group">
          <label>السعر (IQD)</label>
          <input type="text" v-model="form.price_iqd" @input="e => formatInputPrice(e, 'price_iqd')" required placeholder="السعر">
        </div>

        <div class="form-group">
          <label>سعر الجملة (IQD)</label>
          <input type="text" v-model="form.wholesale_price_iqd" @input="e => formatInputPrice(e, 'wholesale_price_iqd')" required placeholder="سعر الجملة">
        </div>
      </div>

      <button class="btn-primary submit-btn" :disabled="loading">
        <Save v-if="!loading" :size="20" />
        <span>{{ loading ? 'جاري الحفظ...' : 'حفظ المنتج' }}</span>
      </button>
    </form>
  </div>
</template>

<style scoped>
.add-product-page { max-width: 800px; margin: 0 auto; }
.ios-header { margin-bottom: 24px; }

.ios-form { display: grid; gap: 24px; padding-bottom: 40px; }

.image-picker-card {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px dashed var(--border);
  overflow: hidden;
  padding: 0 !important;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--system-gray);
}

.preview-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.preview-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.clear-img {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0,0,0,0.5);
  border: none;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.submit-btn {
  width: 100%;
  height: 54px;
  margin-top: 10px;
}

.hidden { display: none; }

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>
