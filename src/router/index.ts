import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuth } from '../composables/useAuth';

import Layout from '../components/Layout.vue';
import Home from '../pages/Home.vue';
import Login from '../pages/Login.vue';
import Profile from '../pages/Profile.vue';
import PostDetail from '../pages/PostDetail.vue';
import Notifications from '../pages/Notifications.vue';
import Search from '../pages/Search.vue';
import Compose from '../pages/Compose.vue';
import Settings from '../pages/Settings.vue';

const routes: RouteRecordRaw[] = [
  { path: '/login', component: Login },
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', component: Home },
      { path: 'search', component: Search },
      { path: 'topics', component: Search },
      { path: 'post/:id', component: PostDetail },
      { path: 'profile/:username', component: Profile },
      { path: 'settings', component: Settings },
      { 
        path: 'notifications', 
        component: Notifications,
        meta: { requiresAuth: true }
      }
    ]
  },
  { 
    path: '/compose', 
    component: Compose,
    meta: { requiresAuth: true }
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const { isAuthenticated } = useAuth();
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return '/login';
  }
  return true;
});

export default router;
