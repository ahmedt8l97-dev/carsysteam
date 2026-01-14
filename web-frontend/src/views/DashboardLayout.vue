<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { 
  Home, 
  Box, 
  Plus, 
  CloudDownload,
  LogOut,
  User
} from 'lucide-vue-next'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push('/auth')
}
</script>

<template>
  <div class="dashboard-layout">
    <!-- Desktop Sidebar -->
    <aside class="sidebar desktop-only">
      <div class="sidebar-header">
        <span class="logo-icon">🚗</span>
        <span class="logo-text">xCar</span>
      </div>
      
      <div class="user-pill">
        <div class="avatar-circle">{{ auth.user?.name?.[0] || '?' }}</div>
        <div class="user-meta">
          <div class="name">{{ auth.user?.name }}</div>
          <div class="role">{{ auth.user?.role === 'admin' ? 'مدير' : 'موظف' }}</div>
        </div>
      </div>

      <nav class="side-nav">
        <router-link to="/dashboard" class="nav-link">
          <Home :size="20" />
          <span>الرئيسية</span>
        </router-link>
        <router-link to="/inventory" class="nav-link">
          <Box :size="20" />
          <span>المخزون</span>
        </router-link>
        <router-link to="/add" class="nav-link">
          <Plus :size="20" />
          <span>إضافة قطعة</span>
        </router-link>
        <router-link to="/profile" class="nav-link">
          <User :size="20" />
          <span>الحساب والإعدادات</span>
        </router-link>
        <button @click="logout" class="nav-link logout-btn">
          <LogOut :size="20" />
          <span>خروج</span>
        </button>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <router-view></router-view>
      <div class="mobile-spacer mobile-only"></div>
    </main>

    <!-- Mobile Tab Bar (iOS Style) -->
    <nav class="mobile-tab-bar mobile-only">
      <router-link to="/dashboard" class="tab-item">
        <Home :size="24" />
        <span>الرئيسية</span>
      </router-link>
      <router-link to="/inventory" class="tab-item">
        <Box :size="24" />
        <span>المخزون</span>
      </router-link>
      <router-link to="/add" class="tab-item">
        <Plus :size="24" />
        <span>إضافة</span>
      </router-link>
      <router-link to="/profile" class="tab-item">
        <User :size="24" />
        <span>حسابي</span>
      </router-link>
    </nav>
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: var(--system-secondary-bg);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 24px 12px;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar-header {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 32px;
  text-align: center;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.logo-icon {
  font-size: 28px;
  line-height: 1;
}

.logo-text {
  background: linear-gradient(135deg, var(--system-blue), var(--system-green));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 900;
  letter-spacing: -0.5px;
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: var(--system-tertiary-bg);
  border-radius: 14px;
  margin-bottom: 24px;
}

.avatar-circle {
  width: 36px;
  height: 36px;
  background: var(--system-blue);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.user-meta .name { font-weight: 600; font-size: 14px; }
.user-meta .role { font-size: 11px; color: var(--text-secondary); }

.side-nav { display: grid; gap: 4px; }
.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  color: var(--text-secondary);
  transition: 0.2s;
  background: transparent;
  border: none;
  font-size: 15px;
  width: 100%;
  cursor: pointer;
}

.nav-link:hover, .nav-link.router-link-active {
  background: var(--system-tertiary-bg);
  color: var(--system-blue);
}

.logout-btn { margin-top: auto; color: var(--system-red); }

.main-content {
  flex: 1;
  background: var(--system-bg);
  padding: 24px;
}

/* Mobile Tab Bar */
.mobile-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(28, 28, 30, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  justify-content: space-around;
  padding-bottom: env(safe-area-inset-bottom);
  border-top: 0.5px solid var(--border);
  z-index: 1000;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--system-gray);
  font-size: 10px;
  gap: 3px;
  flex: 1;
  transition: color 0.2s;
}

.tab-item.router-link-active {
  color: var(--system-blue);
}

.tab-item.logout { color: var(--system-red); }

.mobile-spacer { height: 84px; }

.desktop-only { display: flex; }
.mobile-only { display: none; }

@media (max-width: 768px) {
  .desktop-only { display: none; }
  .mobile-only { display: flex; }
  .main-content { padding: 16px; }
}
</style>
