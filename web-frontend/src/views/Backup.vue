<script setup>
import { ref, onMounted } from 'vue'
import { 
  CloudDownload, 
  History, 
  CheckCircle2, 
  AlertCircle,
  FileJson,
  Calendar,
  Database
} from 'lucide-vue-next'

const backups = ref([])
const loading = ref(false)
const manualLoading = ref(false)
const message = ref({ text: '', type: '' })

async function loadBackups() {
  loading.value = true
  try {
    const res = await fetch('/api/backups/list')
    if (res.ok) {
      backups.value = await res.json()
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function triggerManualBackup() {
  manualLoading.value = true
  message.value = { text: '', type: '' }
  try {
    const res = await fetch('/api/backup/manual', { method: 'POST' })
    const data = await res.json()
    
    if (res.ok) {
      message.value = { text: 'تم إنشاء النسخة الاحتياطية وإرسالها للتليجرام بنجاح', type: 'success' }
      await loadBackups()
    } else {
      throw new Error(data.detail || 'فشل الحفظ')
    }
  } catch (e) {
    message.value = { text: 'خطأ: ' + e.message, type: 'error' }
  } finally {
    manualLoading.value = false
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('ar-IQ')
}

onMounted(loadBackups)
</script>

<template>
  <div class="backup-page">
    <header class="ios-header">
      <h1>النسخ الاحتياطي</h1>
    </header>

    <!-- Main Action Card -->
    <div class="backup-main card">
      <div class="backup-icon">
        <Database :size="48" color="var(--system-blue)" />
      </div>
      <h2>حماية بياناتك</h2>
      <p>قم بإنشاء نسخة احتياطية كاملة للمخزون. سيتم حفظ النسخة في السيرفر وإرسال ملف JSON إلى قناة التليجرام الخاصة بك.</p>
      
      <div v-if="message.text" :class="['message-pill', message.type]">
        <CheckCircle2 v-if="message.type === 'success'" :size="18" />
        <AlertCircle v-else :size="18" />
        <span>{{ message.text }}</span>
      </div>

      <button @click="triggerManualBackup" class="btn-primary backup-btn" :disabled="manualLoading">
        <CloudDownload v-if="!manualLoading" :size="20" />
        <span v-if="manualLoading" class="spinner"></span>
        <span>{{ manualLoading ? 'جاري الحفظ...' : 'إنشاء نسخة فورية الآن' }}</span>
      </button>
    </div>

    <!-- History List -->
    <div class="history-section">
      <div class="section-title">
        <History :size="18" />
        <h3>السجلات الأخيرة</h3>
      </div>

      <div v-if="loading" class="loader">جاري التحميل...</div>
      
      <div v-else-if="backups.length === 0" class="empty-backups">
        لا توجد نسخ سابقة متاحة حالياً.
      </div>

      <div v-else class="backup-list">
        <div v-for="b in backups" :key="b.filename" class="backup-item card">
          <div class="item-icon">
            <FileJson :size="24" />
          </div>
          <div class="item-details">
            <span class="filename">{{ b.filename }}</span>
            <div class="item-meta">
              <span class="date"><Calendar :size="12" /> {{ formatDate(b.created_at) }}</span>
              <span class="size">{{ (b.size_bytes / 1024).toFixed(1) }} KB</span>
            </div>
          </div>
          <div class="item-status">
            <span class="status-dot"></span>
            محفوظة
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backup-page {
  max-width: 600px;
  margin: 0 auto;
}

.backup-main {
  text-align: center;
  padding: 40px 24px;
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.backup-main h2 { margin: 0; font-size: 22px; }
.backup-main p { color: var(--text-secondary); font-size: 15px; max-width: 400px; }

.backup-btn {
  width: 100%;
  max-width: 300px;
  height: 54px;
  margin-top: 12px;
}

.message-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  width: 100%;
}
.message-pill.success { background: rgba(48, 209, 88, 0.1); color: var(--system-green); }
.message-pill.error { background: rgba(255, 69, 58, 0.1); color: var(--system-red); }

/* History */
.history-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  padding: 0 8px;
}
.section-title h3 { font-size: 16px; margin: 0; }

.backup-list {
  display: grid;
  gap: 12px;
}

.backup-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.item-icon {
  width: 44px;
  height: 44px;
  background: var(--system-tertiary-bg);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--system-gray);
}

.item-details { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.item-details .filename { font-size: 14px; font-weight: 600; font-family: monospace; color: var(--text-primary); }

.item-meta { display: flex; gap: 16px; }
.item-meta span { font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; }

.item-status {
  font-size: 11px;
  color: var(--system-green);
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(48, 209, 88, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
}
.status-dot { width: 6px; height: 6px; background: currentColor; border-radius: 50%; }

.empty-backups { text-align: center; color: var(--text-secondary); padding: 40px; font-size: 14px; }

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
