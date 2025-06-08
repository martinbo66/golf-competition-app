<template>
  <div id="app" class="app-container">
    <app-header></app-header>
    <div class="app-content">
      <app-sidebar></app-sidebar>
      <main class="main-content">
        <router-view></router-view>
      </main>
    </div>
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
</style>

