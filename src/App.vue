<template>
  <div id="app" class="app-container">
    <app-header></app-header>
    <div class="app-content">
      <app-sidebar></app-sidebar>
      <main class="main-content">
        <router-view></router-view>
      </main>
    </div>
    <footer class="app-footer">
      <div class="footer-content">
        <span class="app-version">Golf Competition App v1.1.0</span>
        <span class="update-date">Updated: June 7, 2025</span>
      </div>
    </footer>
    <notifications></notifications>
  </div>
</template>

<script>
import AppHeader from '@/components/layout/AppHeader.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import Notifications from '@/components/shared/Notifications.vue';
import '@/assets/styles.css';

export default {
  name: 'App',
  components: {
    AppHeader,
    AppSidebar,
    Notifications
  }
};
</script>

<style>
/* Import Font */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

/* App-specific styles */
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Footer styles */
.app-footer {
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: 12px 24px;
  margin-top: auto;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.app-version {
  font-weight: 500;
  color: var(--color-primary);
}

.update-date {
  font-style: italic;
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
</style>

