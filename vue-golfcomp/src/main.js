import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { initializeApp } from './services/bootstrap';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

initializeApp()
  .then(() => app.mount('#app'))
  .catch((error) => {
    console.error('Failed to initialize app:', error);
    globalThis.__bootstrapError = error;
    app.mount('#app');
  });
