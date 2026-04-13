<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Search, Bell, User, Settings, LogOut, PlusSquare, Moon, Sun, Hash } from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';
import { useTheme } from '../composables/useTheme';
import HomeFilledIcon from './icons/HomeFilledIcon.vue';

const router = useRouter();
const route = useRoute();
const { user, logout, isAuthenticated } = useAuth();
const { theme, toggleTheme } = useTheme();

const navItems = computed(() => [
  { icon: HomeFilledIcon, label: '首页', path: '/' },
  { icon: Search, label: '发现', path: '/search' },
  { icon: Hash, label: '话题', path: '/topics' },
  { icon: Bell, label: '通知', path: '/notifications' },
  { icon: User, label: '个人主页', path: user.value ? `/profile/${user.value.username}` : '/login' },
  { icon: Settings, label: '设置', path: '/settings' },
]);

const handleLogout = () => {
  logout();
  router.push('/login');
};
</script>

<template>
  <div class="flex flex-col h-full py-4 px-2 lg:px-4">
    <div class="mb-8 px-2">
      <img
        src="/favicon.svg"
        alt="HNUST logo"
        class="w-10 h-10 object-contain"
      />
    </div>

    <nav class="flex-1 space-y-2">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-4 p-3 rounded-full transition-colors hover:bg-bg-secondary"
        :class="{ 'font-bold': route.path === item.path, 'font-normal': route.path !== item.path }"
      >
        <component :is="item.icon" :size="26" />
        <span class="hidden lg:block text-xl">{{ item.label }}</span>
      </router-link>

      <button
        @click="toggleTheme"
        class="w-full flex items-center gap-4 p-3 rounded-full transition-colors hover:bg-bg-secondary text-left"
      >
        <Moon v-if="theme === 'light'" :size="26" />
        <Sun v-else :size="26" />
        <span class="hidden lg:block text-xl">{{ theme === 'light' ? '深色模式' : '浅色模式' }}</span>
      </button>
    </nav>

    <div v-if="isAuthenticated" class="mt-auto space-y-4">
      <button 
        @click="router.push('/compose')"
        class="w-full bg-brand hover:bg-brand-hover text-bg-primary rounded-full p-3 lg:py-3 lg:px-6 flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg"
      >
        <PlusSquare :size="24" />
        <span class="hidden lg:block font-bold text-lg">发布</span>
      </button>

      <div class="flex items-center gap-3 p-3 rounded-full hover:bg-bg-secondary cursor-pointer group relative">
        <img :src="user?.avatar" :alt="user?.nickname" class="w-10 h-10 rounded-full object-cover" />
        <div class="hidden lg:block flex-1 min-w-0">
          <p class="font-bold truncate">{{ user?.nickname }}</p>
          <p class="text-text-secondary text-sm truncate">@{{ user?.username }}</p>
        </div>
        <button 
          @click.stop="handleLogout"
          class="hidden lg:block p-2 hover:bg-bg-secondary hover:text-text-primary rounded-full transition-colors"
          title="退出登录"
        >
          <LogOut :size="20" />
        </button>
      </div>
    </div>
    
    <div v-else class="mt-auto">
      <button 
        @click="router.push('/login')"
        class="w-full bg-brand hover:bg-brand-hover text-bg-primary rounded-full py-3 font-bold text-lg"
      >
        登录
      </button>
    </div>
  </div>
</template>
