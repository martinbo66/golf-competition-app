import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { persistencePlugin } from './stores/persistence';
import { initializeApp } from './services/bootstrap';

const app = createApp(App);
const pinia = createPinia();
pinia.use(persistencePlugin);

app.use(pinia);
app.use(router);

initializeApp()
  .then(() => app.mount('#app'))
  .catch((error) => {
    console.error('Failed to initialize app:', error);
    window.__bootstrapError = error;
    app.mount('#app');
  });

