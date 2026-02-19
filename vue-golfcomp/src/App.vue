<template>
  <div id="app" class="app-container">
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
          <router-view></router-view>
        </main>
      </div>
    </template>
    <notifications></notifications>
  </div>
</template>

<script>
import AppHeader from '@/components/layout/AppHeader.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import Notifications from '@/components/shared/Notifications.vue';
import NotificationService from '@/services/NotificationService';
import '@/assets/styles.css';

export default {
  name: 'App',
  components: {
    AppHeader,
    AppSidebar,
    Notifications
  },
  data() {
    return {
      bootstrapError: typeof window !== 'undefined' ? window.__bootstrapError : null
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
/* Import Font */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

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
</style>

