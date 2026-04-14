import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const routes: RouteRecordRaw[] = [
  { path: '/login', component: () => import('../pages/Login.vue') },
  {
    path: '/',
    component: () => import('../components/Layout.vue'),
    children: [
      { path: '', component: () => import('../pages/Home.vue') },
      { path: 'search', component: () => import('../pages/Search.vue') },
      { path: 'topics', component: () => import('../pages/Search.vue') },
      { path: 'post/:id', component: () => import('../pages/PostDetail.vue') },
      { path: 'profile/:username', component: () => import('../pages/Profile.vue') },
      { path: 'settings', component: () => import('../pages/Settings.vue') },
      { path: 'settings/security', component: () => import('../pages/SecuritySettings.vue'), meta: { requiresAuth: true } },
      { path: 'settings/help', component: () => import('../pages/HelpCenter.vue') },
      { path: 'admin', component: () => import('../pages/AdminConsole.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
      { 
        path: 'notifications', 
        component: () => import('../pages/Notifications.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  { 
    path: '/compose', 
    component: () => import('../pages/Compose.vue'),
    meta: { requiresAuth: true }
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const { isAuthenticated, user } = useAuth();
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return '/login';
  }
  if (to.meta.requiresAdmin && user.value?.role !== 'ADMIN') {
    return '/';
  }
  return true;
});

export default router;
