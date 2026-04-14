import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { initializeAuth } from './composables/useAuth';
import './index.css';

const bootstrap = async () => {
  await initializeAuth();

  const app = createApp(App);
  app.use(router);
  app.mount('#app');
};

bootstrap();
