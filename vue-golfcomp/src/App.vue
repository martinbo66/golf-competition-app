<template>
  <div id="app" class="app-container">
    <div v-if="uiStore.isLoading" class="global-loading-overlay" aria-live="polite">
      <div class="global-loading-spinner"></div>
      <p>Loading...</p>
    </div>
    <template v-if="bootstrapError">
      <div class="bootstrap-error">
        <h1>Unable to connect</h1>
        <p>The app could not reach the backend. Please ensure the server is running and try again.</p>
        <p class="bootstrap-error-detail">{{ bootstrapError.message }}</p>
      </div>
    </template>
    <template v-else>
      <app-header></app-header>
      <div class="app-content">
        <app-sidebar></app-sidebar>
        <main class="main-content">
          <section-banner></section-banner>
          <router-view></router-view>
          <app-footer></app-footer>
        </main>
      </div>
    </template>
    <notifications></notifications>
  </div>
</template>

<script>
import { useUiStore } from '@/stores/ui';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import SectionBanner from '@/components/layout/SectionBanner.vue';
import Notifications from '@/components/shared/Notifications.vue';
import NotificationService from '@/services/NotificationService';
import '@/assets/styles.css';

export default {
  name: 'App',
  components: {
    AppHeader,
    AppSidebar,
    AppFooter,
    SectionBanner,
    Notifications
  },
  setup() {
    return { uiStore: useUiStore() };
  },
  data() {
    return {
      bootstrapError: globalThis.window !== undefined ? globalThis.__bootstrapError : null
    };
  },
  mounted() {
    if (this.bootstrapError) {
      NotificationService.error('Backend unavailable. Please start the server and refresh.');
    }
  }
};
</script>

<style>
/* App-specific styles */
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.bootstrap-error {
  padding: 2rem;
  text-align: center;
  max-width: 32rem;
  margin: 4rem auto 0;
}

.bootstrap-error h1 {
  margin-bottom: 1rem;
  color: var(--text-color, #333);
}

.bootstrap-error p {
  margin-bottom: 0.5rem;
  color: var(--text-color, #333);
}

.bootstrap-error-detail {
  font-size: 0.875rem;
  color: var(--border-color, #666);
}

.global-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

body.dark-mode .global-loading-overlay {
  background: rgba(44, 62, 80, 0.9);
}

.global-loading-overlay p {
  margin: 1rem 0 0;
  color: var(--text-color, #333);
}

.global-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color, #e9ecef);
  border-top-color: var(--primary-color, #4CAF50);
  border-radius: 50%;
  animation: global-loading-spin 0.8s linear infinite;
}

@keyframes global-loading-spin {
  to { transform: rotate(360deg); }
}
</style>

