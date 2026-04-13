<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from '../composables/useTheme';
import { useAuth } from '../composables/useAuth';
import { useToast } from '../composables/useToast';
import { Moon, Sun, LogOut, User, Shield, Bell, Globe, HelpCircle } from 'lucide-vue-next';

const router = useRouter();
const { theme, toggleTheme } = useTheme();
const { user, logout, isAuthenticated } = useAuth();
const { showToast } = useToast();

const openProfileSettings = () => {
  if (user.value) {
    router.push(`/profile/${user.value.username}`);
    return;
  }
  showToast('请先登录后再查看个人资料', 'error');
  router.push('/login');
};

const showPendingSetting = (message: string) => {
  showToast(message, 'error');
};

const settingsGroups = computed(() => [
  {
    title: '账号设置',
    items: [
      { icon: User, label: '个人资料', description: '查看个人主页与资料', onClick: openProfileSettings },
      { icon: Shield, label: '安全与隐私', description: '密码、账号权限', onClick: () => showPendingSetting('安全设置将在后端接入后开放') },
    ],
  },
  {
    title: '偏好设置',
    items: [
      {
        icon: theme.value === 'light' ? Moon : Sun,
        label: '显示模式',
        description: theme.value === 'light' ? '切换到深色模式' : '切换到浅色模式',
        onClick: toggleTheme,
      },
      { icon: Bell, label: '通知设置', description: '管理推送通知', onClick: () => router.push('/notifications') },
      { icon: Globe, label: '语言', description: '简体中文', onClick: () => showPendingSetting('当前仅支持简体中文') },
    ],
  },
  {
    title: '支持',
    items: [
      { icon: HelpCircle, label: '帮助中心', description: '常见问题与反馈', onClick: () => showPendingSetting('帮助中心功能开发中') },
    ],
  },
]);

const handleLogout = () => {
  logout();
  router.push('/login');
};
</script>

<template>
  <div class="min-h-screen">
    <div class="sticky top-0 bg-bg-primary/80 backdrop-blur-md z-10 px-4 py-3 border-b border-border">
      <h1 class="text-xl font-bold">设置</h1>
    </div>

    <div class="divide-y divide-border">
      <div v-for="group in settingsGroups" :key="group.title" class="py-4">
        <h2 class="px-4 text-lg font-bold mb-2">{{ group.title }}</h2>
        <div 
          v-for="item in group.items" 
          :key="item.label" 
          class="px-4 py-3 flex items-center gap-4 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
          @click="item.onClick?.()"
        >
          <div class="p-2 bg-bg-secondary rounded-full">
            <component :is="item.icon" :size="20" />
          </div>
          <div class="flex-1">
            <p class="font-medium">{{ item.label }}</p>
            <p class="text-text-secondary text-sm">{{ item.description }}</p>
          </div>
        </div>
      </div>

      <div v-if="isAuthenticated" class="p-4">
        <button 
          @click="handleLogout"
          class="w-full flex items-center justify-center gap-2 p-3 text-text-primary hover:bg-bg-secondary rounded-xl transition-colors font-bold"
        >
          <LogOut :size="20" />
          退出登录
        </button>
      </div>
    </div>
  </div>
</template>
