<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { 
  User, 
  Mail, 
  Shield, 
  LogOut,
  Edit3,
  Key,
  CheckCircle,
  Database,
  CloudDownload,
  ChevronLeft,
  FileJson,
  Calendar,
  AlertCircle,
  Settings,
  Bell,
  Lock
} from 'lucide-vue-next'

import { convex } from '../lib/convex'
import { api } from '../../../convex/_generated/api'

const auth = useAuthStore()
const router = useRouter()

const message = ref({ text: '', type: '' })
const showEditDialog = ref(false)
const showPasswordDialog = ref(false)
const showBackupDialog = ref(false)

const editForm = ref({
  name: '',
  username: ''
})

const passwordForm = ref({
  current: '',
  new: '',
  confirm: ''
})

const backups = ref([])
const backupsLoading = ref(false)
const manualBackupLoading = ref(false)
const saveLoading = ref(false)

const userRole = computed(() => {
  return auth.user?.role === 'admin' ? 'مدير النظام' : 'موظف مبيعات'
})

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

function openEditDialog() {
  editForm.value = {
    name: auth.user?.name || '',
    username: auth.user?.username || ''
  }
  showEditDialog.value = true
}

async function saveProfile() {
  saveLoading.value = true
  message.value = { text: '', type: '' }
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    auth.setUser({
      ...auth.user,
      name: editForm.value.name,
      username: editForm.value.username
    })
    
    message.value = { text: 'تم حفظ التعديلات بنجاح ✅', type: 'success' }
    showEditDialog.value = false
  } catch (e) {
    message.value = { text: 'فشل حفظ التعديلات', type: 'error' }
  } finally {
    saveLoading.value = false
  }
}

async function changePassword() {
  if (passwordForm.value.new !== passwordForm.value.confirm) {
    message.value = { text: 'كلمات المرور غير متطابقة', type: 'error' }
    return
  }
  
  saveLoading.value = true
  message.value = { text: '', type: '' }
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    message.value = { text: 'تم تغيير كلمة المرور بنجاح ✅', type: 'success' }
    showPasswordDialog.value = false
    passwordForm.value = { current: '', new: '', confirm: '' }
  } catch (e) {
    message.value = { text: 'فشل تغيير كلمة المرور', type: 'error' }
  } finally {
    saveLoading.value = false
  }
}

function openBackupDialog() {
  showBackupDialog.value = true
  loadBackups()
}

function handleLogout() {
  if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
    auth.logout()
    router.push('/auth')
  }
}

onMounted(() => {
  loadBackups()
})
</script>

<template>
  <div class="profile-android">
    <!-- Header Card -->
    <div class="profile-header-card">
      <div class="avatar-circle">
        {{ auth.user?.name?.[0] || '?' }}
      </div>
      <div class="user-details">
        <h2>{{ auth.user?.name }}</h2>
        <p>{{ auth.user?.username }}</p>
        <span class="role-chip">{{ userRole }}</span>
      </div>
    </div>

    <!-- Alert Messages -->
    <div v-if="message.text" :class="['alert-banner', message.type]">
      <CheckCircle v-if="message.type === 'success'" :size="18" />
      <AlertCircle v-else :size="18" />
      <span>{{ message.text }}</span>
    </div>

    <!-- Settings Sections -->
    <div class="settings-container">
      <!-- Account Section -->
      <div class="settings-section">
        <h3 class="section-title">الحساب</h3>
        <div class="settings-list">
          <button @click="openEditDialog" class="setting-item">
            <div class="setting-icon blue">
              <Edit3 :size="20" />
            </div>
            <div class="setting-content">
              <span class="setting-label">تعديل المعلومات الشخصية</span>
              <span class="setting-desc">الاسم واسم المستخدم</span>
            </div>
            <ChevronLeft :size="20" class="chevron" />
          </button>

          <button @click="showPasswordDialog = true" class="setting-item">
            <div class="setting-icon orange">
              <Key :size="20" />
            </div>
            <div class="setting-content">
              <span class="setting-label">تغيير كلمة المرور</span>
              <span class="setting-desc">تحديث كلمة المرور الخاصة بك</span>
            </div>
            <ChevronLeft :size="20" class="chevron" />
          </button>

          <div class="setting-item disabled">
            <div class="setting-icon purple">
              <Shield :size="20" />
            </div>
            <div class="setting-content">
              <span class="setting-label">الصلاحيات</span>
              <span class="setting-desc">{{ userRole }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Backup Section -->
      <div class="settings-section">
        <h3 class="section-title">النسخ الاحتياطي</h3>
        <div class="settings-list">
          <button @click="triggerManualBackup" class="setting-item" :disabled="manualBackupLoading">
            <div class="setting-icon green">
              <CloudDownload :size="20" />
            </div>
            <div class="setting-content">
              <span class="setting-label">{{ manualBackupLoading ? 'جاري الحفظ...' : 'إنشاء نسخة احتياطية' }}</span>
              <span class="setting-desc">حفظ البيانات وإرسالها للتليجرام</span>
            </div>
            <ChevronLeft :size="20" class="chevron" />
          </button>

          <button @click="openBackupDialog" class="setting-item">
            <div class="setting-icon teal">
              <Database :size="20" />
            </div>
            <div class="setting-content">
              <span class="setting-label">سجل النسخ الاحتياطي</span>
              <span class="setting-desc">{{ backups.length }} نسخة محفوظة</span>
            </div>
            <ChevronLeft :size="20" class="chevron" />
          </button>
        </div>
      </div>

      <!-- System Section -->
      <div class="settings-section">
        <h3 class="section-title">النظام</h3>
        <div class="settings-list">
          <div class="setting-item disabled">
            <div class="setting-icon gray">
              <Bell :size="20" />
            </div>
            <div class="setting-content">
              <span class="setting-label">الإشعارات</span>
              <span class="setting-desc">إدارة التنبيهات</span>
            </div>
          </div>

          <button @click="handleLogout" class="setting-item danger">
            <div class="setting-icon red">
              <LogOut :size="20" />
            </div>
            <div class="setting-content">
              <span class="setting-label">تسجيل الخروج</span>
              <span class="setting-desc">الخروج من الحساب</span>
            </div>
            <ChevronLeft :size="20" class="chevron" />
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Profile Dialog -->
    <div v-if="showEditDialog" class="dialog-overlay" @click="showEditDialog = false">
      <div class="dialog-content" @click.stop>
        <h3>تعديل المعلومات</h3>
        <div class="dialog-form">
          <div class="form-group">
            <label>الاسم الكامل</label>
            <input v-model="editForm.name" class="form-control" />
          </div>
          <div class="form-group">
            <label>اسم المستخدم</label>
            <input v-model="editForm.username" class="form-control" />
          </div>
        </div>
        <div class="dialog-actions">
          <button @click="saveProfile" class="btn-primary" :disabled="saveLoading">
            {{ saveLoading ? 'جاري الحفظ...' : 'حفظ' }}
          </button>
          <button @click="showEditDialog = false" class="btn-secondary">إلغاء</button>
        </div>
      </div>
    </div>

    <!-- Password Dialog -->
    <div v-if="showPasswordDialog" class="dialog-overlay" @click="showPasswordDialog = false">
      <div class="dialog-content" @click.stop>
        <h3>تغيير كلمة المرور</h3>
        <div class="dialog-form">
          <div class="form-group">
            <label>كلمة المرور الحالية</label>
            <input v-model="passwordForm.current" type="password" class="form-control" />
          </div>
          <div class="form-group">
            <label>كلمة المرور الجديدة</label>
            <input v-model="passwordForm.new" type="password" class="form-control" />
          </div>
          <div class="form-group">
            <label>تأكيد كلمة المرور</label>
            <input v-model="passwordForm.confirm" type="password" class="form-control" />
          </div>
        </div>
        <div class="dialog-actions">
          <button @click="changePassword" class="btn-primary" :disabled="saveLoading">
            {{ saveLoading ? 'جاري التغيير...' : 'تغيير' }}
          </button>
          <button @click="showPasswordDialog = false; passwordForm = { current: '', new: '', confirm: '' }" class="btn-secondary">إلغاء</button>
        </div>
      </div>
    </div>

    <!-- Backup History Dialog -->
    <div v-if="showBackupDialog" class="dialog-overlay" @click="showBackupDialog = false">
      <div class="dialog-content large" @click.stop>
        <h3>سجل النسخ الاحتياطي</h3>
        
        <div v-if="backupsLoading" class="loading-state">جاري التحميل...</div>
        
        <div v-else-if="backups.length === 0" class="empty-state">
          <FileJson :size="48" :stroke-width="1" />
          <p>لا توجد نسخ احتياطية</p>
        </div>

        <div v-else class="backup-list">
          <div 
            v-for="backup in backups" 
            :key="backup._id" 
            class="backup-item"
            @click="downloadBackup(backup)"
          >
            <div class="backup-icon">
              <FileJson :size="22" />
            </div>
            <div class="backup-info">
              <span class="backup-name">{{ backup.filename }}</span>
              <span class="backup-meta">
                <Calendar :size="12" />
                {{ formatDate(backup.createdAt) }} • {{ backup.productCount }} قطعة
              </span>
            </div>
            <ChevronLeft :size="18" />
          </div>
        </div>

        <div class="dialog-actions">
          <button @click="showBackupDialog = false" class="btn-secondary full">إغلاق</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-android {
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 100px;
}

/* Header Card */
.profile-header-card {
  background: linear-gradient(135deg, var(--system-blue), var(--system-green));
  padding: 32px 24px;
  border-radius: 0 0 24px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.avatar-circle {
  width: 72px;
  height: 72px;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 800;
  color: white;
  border: 3px solid rgba(255,255,255,0.3);
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  color: white;
}

.user-details h2 {
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 4px;
}

.user-details p {
  font-size: 14px;
  margin: 0 0 10px;
  opacity: 0.9;
}

.role-chip {
  display: inline-block;
  background: rgba(255,255,255,0.25);
  backdrop-filter: blur(10px);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}

/* Alert Banner */
.alert-banner {
  margin: 16px 16px 0;
  padding: 14px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
}

.alert-banner.success {
  background: rgba(48, 209, 88, 0.15);
  color: var(--system-green);
}

.alert-banner.error {
  background: rgba(255, 69, 58, 0.15);
  color: var(--system-red);
}

/* Settings Container */
.settings-container {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 4px;
  margin: 0;
}

.settings-list {
  background: var(--system-secondary-bg);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border);
  width: 100%;
  cursor: pointer;
  transition: background 0.2s;
  text-align: right;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:not(.disabled):active {
  background: var(--system-tertiary-bg);
}

.setting-item.disabled {
  cursor: default;
  opacity: 0.6;
}

.setting-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.setting-icon.blue { background: rgba(10, 132, 255, 0.15); color: var(--system-blue); }
.setting-icon.orange { background: rgba(255, 159, 10, 0.15); color: var(--system-orange); }
.setting-icon.purple { background: rgba(191, 90, 242, 0.15); color: #bf5af2; }
.setting-icon.green { background: rgba(48, 209, 88, 0.15); color: var(--system-green); }
.setting-icon.teal { background: rgba(100, 210, 255, 0.15); color: #64d2ff; }
.setting-icon.gray { background: rgba(142, 142, 147, 0.15); color: var(--system-gray); }
.setting-icon.red { background: rgba(255, 69, 58, 0.15); color: var(--system-red); }

.setting-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.setting-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.setting-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.chevron {
  color: var(--system-gray);
  flex-shrink: 0;
}

/* Dialogs */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.dialog-content {
  background: var(--system-secondary-bg);
  border-radius: 20px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  border: 1px solid var(--border);
  animation: slideUp 0.3s ease;
}

.dialog-content.large {
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.dialog-content h3 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 20px;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-control {
  background: var(--system-tertiary-bg);
  border: 1px solid var(--border);
  padding: 12px 14px;
  border-radius: 12px;
  color: white;
  font-size: 15px;
  outline: none;
}

.form-control:focus {
  border-color: var(--system-blue);
}

.dialog-actions {
  display: flex;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  height: 48px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.btn-primary {
  background: var(--system-blue);
  color: white;
}

.btn-secondary {
  background: var(--system-tertiary-bg);
  color: var(--text-primary);
}

.btn-secondary.full {
  flex: none;
  width: 100%;
}

/* Backup List */
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

.backup-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  max-height: 400px;
  overflow-y: auto;
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

.backup-item:active {
  transform: scale(0.98);
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
</style>
