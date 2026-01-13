<script setup>
import { ref, onMounted } from 'vue'
import { convex } from '../lib/convex'
import { api } from '../../../convex/_generated/api'
import { 
  TrendingUp, 
  Package, 
  AlertTriangle 
} from 'lucide-vue-next'

const stats = ref(null)

onMounted(async () => {
  stats.value = await convex.query(api.products.getStats)
})
</script>

<template>
  <div class="dashboard-home">
    <header class="ios-header">
      <h1>لوحة التحكم</h1>
    </header>

    <div v-if="!stats" class="loader">جاري التحميل...</div>
    
    <div v-else class="stats-overview">
      <div class="stat-card card">
        <div class="icon-box blue">
          <Package :size="24" />
        </div>
        <div class="details">
          <span class="label">إجمالي المنتجات</span>
          <span class="value">{{ stats.overview.total_products }}</span>
        </div>
      </div>

      <div class="stat-card card">
        <div class="icon-box green">
          <TrendingUp :size="24" />
        </div>
        <div class="details">
          <span class="label">القيمة الكلية</span>
          <span class="value">{{ stats.overview.total_value.toLocaleString() }} <small>IQD</small></span>
        </div>
      </div>

      <div class="stat-card card">
        <div class="icon-box orange">
          <AlertTriangle :size="24" />
        </div>
        <div class="details">
          <span class="label">نواقص المخزون</span>
          <span class="value">{{ stats.overview.out_of_stock }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
}

.icon-box {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-box.blue { background: rgba(10, 132, 255, 0.15); color: var(--system-blue); }
.icon-box.green { background: rgba(48, 209, 88, 0.15); color: var(--system-green); }
.icon-box.orange { background: rgba(255, 159, 10, 0.15); color: var(--system-orange); }

.details { display: flex; flex-direction: column; }
.label { font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
.value { font-size: 24px; font-weight: 700; }
.value small { font-size: 14px; font-weight: 400; color: var(--text-secondary); margin-inline-start: 4px; }
</style>
