<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { 
  TrendingUp, 
  Package, 
  AlertTriangle,
  ShoppingBag,
  Database,
  ChevronLeft,
  Bell,
  LayoutDashboard,
  CloudDownload,
  FileJson,
  Calendar,
  Settings,
  User,
  Key,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-vue-next'

import { convex } from '../lib/convex'
import { api } from '../../../convex/_generated/api'

const auth = useAuthStore()
const stats = ref(null)
const loading = ref(true)
const backups = ref([])
const backupsLoading = ref(false)
const manualBackupLoading = ref(false)
const message = ref({ text: '', type: '' })

async function loadStats() {
  loading.value = true
  try {
    const res = await fetch('/api/stats')
    if (res.ok) {
      stats.value = await res.json()
    }
  } catch (e) {
    console.error('Failed to load stats:', e)
  } finally {
    loading.value = false
  }
}

async function loadBackups() {
  backupsLoading.value = true
  try {
    const data = await convex.query(api.backups.getBackups)
    backups.value = data
  } catch (e) {
    console.error(e)
  } finally {
    backupsLoading.value = false
  }
}

async function triggerManualBackup() {
  manualBackupLoading.value = true
  message.value = { text: '', type: '' }
  try {
    const res = await fetch('/api/backup/manual', { method: 'POST' })
    const data = await res.json()
    
    if (res.ok) {
      message.value = { text: 'تم إنشاء النسخة الاحتياطية بنجاح ✅', type: 'success' }
      await loadBackups()
    } else {
      throw new Error(data.detail || 'فشل الحفظ')
    }
  } catch (e) {
    message.value = { text: 'خطأ: ' + e.message, type: 'error' }
  } finally {
    manualBackupLoading.value = false
  }
}

function downloadBackup(backup) {
  const blob = new Blob([backup.data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = backup.filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('ar-IQ', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadStats()
  loadBackups()
})
</script>

<template>
  <div class="dashboard-unified">
    <!-- Header -->
    <header class="main-header">
      <div class="header-content">
        <LayoutDashboard :size="32" class="header-icon" />
        <div class="title-stack">
          <h1>xCar - لوحة التحكم الشاملة</h1>
          <p>الإحصائيات، الإعدادات، والنسخ الاحتياطي</p>
        </div>
      </div>
      <div class="user-badge">
        <User :size="18" />
        <span>{{ auth.user?.name }}</span>
      </div>
    </header>

    <!-- Alert Messages -->
    <div v-if="message.text" :class="['alert-banner', message.type]">
      <CheckCircle v-if="message.type === 'success'" :size="18" />
      <AlertCircle v-else :size="18" />
      <span>{{ message.text }}</span>
    </div>

    <div v-if="loading" class="loading-container">
       <div class="loader-spinner"></div>
       <span>جاري التحميل...</span>
    </div>
    
    <div v-else class="unified-content">
      <!-- Section 1: Statistics Overview -->
      <section class="content-section">
        <h2 class="section-title">
          <TrendingUp :size="22" />
          <span>نظرة عامة على المخزون</span>
        </h2>
        <div class="stats-grid">
          <div class="stat-card blue">
            <div class="stat-icon"><Package :size="28" /></div>
            <div class="stat-info">
              <span class="stat-label">إجمالي القطع</span>
              <span class="stat-value">{{ stats?.overview.total_products }}</span>
            </div>
          </div>

          <div class="stat-card green">
            <div class="stat-icon"><TrendingUp :size="28" /></div>
            <div class="stat-info">
              <span class="stat-label">القيمة المالية</span>
              <span class="stat-value">{{ stats?.overview.total_value.toLocaleString() }} <small>IQD</small></span>
            </div>
          </div>

          <div class="stat-card orange">
            <div class="stat-icon"><AlertTriangle :size="28" /></div>
            <div class="stat-info">
              <span class="stat-label">أصناف نافذة</span>
              <span class="stat-value">{{ stats?.overview.out_of_stock }}</span>
            </div>
          </div>

          <div class="stat-card purple">
            <div class="stat-icon"><ShoppingBag :size="28" /></div>
            <div class="stat-info">
              <span class="stat-label">الكمية الكلية</span>
              <span class="stat-value">{{ stats?.overview.total_items }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2: Quick Actions -->
      <section class="content-section">
        <h2 class="section-title">
          <Settings :size="22" />
          <span>إجراءات سريعة</span>
        </h2>
        <div class="actions-grid">
          <router-link to="/add" class="action-btn blue">
            <ShoppingBag :size="22" />
            <div class="action-text">
              <span>إضافة منتج</span>
              <small>تسجيل صنف جديد</small>
            </div>
            <ChevronLeft :size="18" />
          </router-link>

          <router-link to="/inventory" class="action-btn green">
            <Package :size="22" />
            <div class="action-text">
              <span>عرض المخزون</span>
              <small>جميع الأصناف</small>
            </div>
            <ChevronLeft :size="18" />
          </router-link>

          <router-link to="/profile" class="action-btn purple">
            <User :size="22" />
            <div class="action-text">
              <span>الحساب الشخصي</span>
              <small>الملف والإعدادات</small>
            </div>
            <ChevronLeft :size="18" />
          </router-link>
        </div>
      </section>

      <!-- Section 3: Backup Management -->
      <section class="content-section">
        <h2 class="section-title">
          <Database :size="22" />
          <span>النسخ الاحتياطي</span>
        </h2>
        
        <div class="backup-controls">
          <button 
            @click="triggerManualBackup" 
            class="backup-btn"
            :disabled="manualBackupLoading"
          >
            <CloudDownload :size="22" />
            <span>{{ manualBackupLoading ? 'جاري الحفظ...' : 'إنشاء نسخة احتياطية الآن' }}</span>
          </button>
        </div>

        <div class="backups-container">
          <h3>السجل ({{ backups.length }} نسخة)</h3>
          
          <div v-if="backupsLoading" class="loading-state">جاري التحميل...</div>
          
          <div v-else-if="backups.length === 0" class="empty-state">
            <FileJson :size="48" :stroke-width="1" />
            <p>لا توجد نسخ احتياطية بعد</p>
          </div>

          <div v-else class="backups-list">
            <div 
              v-for="backup in backups.slice(0, 5)" 
              :key="backup._id" 
              class="backup-item"
              @click="downloadBackup(backup)"
            >
              <div class="backup-icon">
                <FileJson :size="20" />
              </div>
              <div class="backup-info">
                <span class="backup-name">{{ backup.filename }}</span>
                <span class="backup-meta">
                  <Calendar :size="12" />
                  {{ formatDate(backup.createdAt) }}
                </span>
              </div>
              <span class="backup-count">{{ backup.productCount }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 4: Data Analysis -->
      <section class="content-section">
        <h2 class="section-title">
          <Bell :size="22" />
          <span>التحليلات والتنبيهات</span>
        </h2>
        
        <div class="analysis-grid">
          <!-- Car Distribution -->
          <div class="analysis-card">
            <h3>توزيع المخزون حسب السيارة</h3>
            <div class="car-distribution">
              <div v-for="(data, name) in stats?.by_car" :key="name" class="dist-item">
                <span class="car-name">{{ name }}</span>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: (data.count / stats.overview.total_products * 100) + '%' }"></div>
                </div>
                <span class="car-count">{{ data.count }}</span>
              </div>
            </div>
          </div>

          <!-- Low Stock Alerts -->
          <div class="analysis-card">
            <h3>تنبيهات النواقص</h3>
            <div v-if="stats?.low_stock.length > 0" class="alerts-list">
              <div v-for="item in stats.low_stock" :key="item.product_number" class="alert-item">
                <div class="alert-icon">
                  <Bell :size="16" />
                </div>
                <div class="alert-info">
                  <span class="alert-name">{{ item.product_name }}</span>
                  <span class="alert-id">#{{ item.product_number }}</span>
                </div>
                <span class="alert-qty">{{ item.quantity }}</span>
              </div>
            </div>
            <div v-else class="no-alerts">
              <span class="success-icon">✅</span>
              <p>جميع الأصناف متوفرة</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.dashboard-unified { 
  padding-bottom: 100px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px 0;
  border-bottom: 1px solid var(--border);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon { 
  color: var(--system-blue);
  flex-shrink: 0;
}

.title-stack h1 { 
  font-size: 26px; 
  margin: 0; 
  font-weight: 800;
  background: linear-gradient(135deg, var(--system-blue), var(--system-green));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-stack p { 
  margin: 4px 0 0; 
  color: var(--text-secondary); 
  font-size: 13px; 
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--system-tertiary-bg);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: var(--system-blue);
}

/* Alert Banner */
.alert-banner {
  margin-bottom: 20px;
  padding: 14px 18px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
}

.alert-banner.success {
  background: rgba(48, 209, 88, 0.15);
  color: var(--system-green);
  border: 1px solid rgba(48, 209, 88, 0.3);
}

.alert-banner.error {
  background: rgba(255, 69, 58, 0.15);
  color: var(--system-red);
  border: 1px solid rgba(255, 69, 58, 0.3);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100px 20px;
  gap: 16px;
  color: var(--text-secondary);
}

.loader-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(10, 132, 255, 0.1);
  border-top-color: var(--system-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { 
  to { transform: rotate(360deg); } 
}

.unified-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

/* Sections */
.content-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 800;
  margin: 0;
  color: var(--text-primary);
  padding-bottom: 12px;
  border-bottom: 2px solid var(--border);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.stat-card {
  background: var(--system-secondary-bg);
  padding: 24px;
  border-radius: 20px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.blue .stat-icon { background: rgba(10, 132, 255, 0.1); color: var(--system-blue); }
.green .stat-icon { background: rgba(48, 209, 88, 0.1); color: var(--system-green); }
.orange .stat-icon { background: rgba(255, 159, 10, 0.1); color: var(--system-orange); }
.purple .stat-icon { background: rgba(191, 90, 242, 0.1); color: #bf5af2; }

.stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label { 
  font-size: 13px; 
  color: var(--text-secondary);
  font-weight: 600;
}

.stat-value { 
  font-size: 24px; 
  font-weight: 800;
}

.stat-value small { 
  font-size: 13px; 
  opacity: 0.7;
}

/* Actions Grid */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.action-btn {
  background: var(--system-secondary-bg);
  border: 1px solid var(--border);
  padding: 18px 20px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: var(--system-blue);
  transform: translateY(-2px);
}

.action-btn.blue { border-left: 4px solid var(--system-blue); }
.action-btn.green { border-left: 4px solid var(--system-green); }
.action-btn.purple { border-left: 4px solid #bf5af2; }

.action-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.action-text span {
  font-size: 15px;
  font-weight: 700;
}

.action-text small {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Backup Section */
.backup-controls {
  display: flex;
  gap: 12px;
}

.backup-btn {
  flex: 1;
  max-width: 400px;
  height: 56px;
  background: var(--system-blue);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.backup-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(10, 132, 255, 0.3);
}

.backup-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.backups-container {
  background: var(--system-secondary-bg);
  border: 1px solid var(--border);
  padding: 20px;
  border-radius: 20px;
}

.backups-container h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 16px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.backups-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.backup-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: var(--system-tertiary-bg);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.backup-item:hover {
  background: rgba(10, 132, 255, 0.1);
}

.backup-icon {
  width: 44px;
  height: 44px;
  background: rgba(48, 209, 88, 0.15);
  color: var(--system-green);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.backup-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.backup-name {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.backup-meta {
  font-size: 12px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.backup-count {
  background: var(--system-blue);
  color: white;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 12px;
}

/* Analysis Grid */
.analysis-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
}

.analysis-card {
  background: var(--system-secondary-bg);
  border: 1px solid var(--border);
  padding: 24px;
  border-radius: 20px;
}

.analysis-card h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 20px;
}

.car-distribution {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dist-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.car-name {
  font-size: 14px;
  font-weight: 600;
  width: 100px;
  flex-shrink: 0;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--system-tertiary-bg);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--system-blue), var(--system-green));
  border-radius: 4px;
}

.car-count {
  font-size: 13px;
  font-weight: 700;
  min-width: 40px;
  text-align: left;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--system-tertiary-bg);
  border-radius: 12px;
}

.alert-icon {
  width: 32px;
  height: 32px;
  background: rgba(255, 69, 58, 0.1);
  color: var(--system-red);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alert-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.alert-name {
  font-size: 14px;
  font-weight: 600;
}

.alert-id {
  font-size: 11px;
  color: var(--system-gray);
}

.alert-qty {
  background: var(--system-red);
  color: white;
  font-size: 12px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 10px;
}

.no-alerts {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  gap: 12px;
  color: var(--system-green);
}

.success-icon {
  font-size: 48px;
}

@media (max-width: 900px) {
  .analysis-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .main-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .stats-grid,
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .title-stack h1 {
    font-size: 22px;
  }
}
</style>
