<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, MessageCircle, Search, UserPlus } from 'lucide-vue-next';
import { chatService, userService } from '../api/services';
import { useAuth } from '../composables/useAuth';
import { useToast } from '../composables/useToast';
import type { RelationshipTab, User } from '../types';

const route = useRoute();
const router = useRouter();
const { user } = useAuth();
const { showToast } = useToast();

const tabs: Array<{ key: RelationshipTab; label: string }> = [
  { key: 'following', label: '关注' },
  { key: 'followers', label: '粉丝' },
  { key: 'mutual', label: '互关' },
];

const activeTab = ref<RelationshipTab>('following');
const members = ref<User[]>([]);
const loading = ref(true);
const query = ref('');
const busyUserId = ref<string | null>(null);

const normalizeTab = (value: unknown): RelationshipTab => (
  value === 'followers' || value === 'mutual' ? value : 'following'
);

const loadMembers = async () => {
  if (!user.value) {
    return;
  }
  loading.value = true;
  try {
    members.value = await userService.getRelationshipList(user.value.id, activeTab.value);
  } catch (error) {
    showToast(error instanceof Error ? error.message : '加载关注列表失败，请稍后重试', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  activeTab.value = normalizeTab(route.query.tab);
  await loadMembers();
});

watch(
  () => route.query.tab,
  async (value) => {
    const next = normalizeTab(value);
    if (next === activeTab.value) {
      return;
    }
    activeTab.value = next;
    await loadMembers();
  },
);

const filteredMembers = computed(() => {
  const keyword = query.value.trim().toLowerCase();
  if (!keyword) {
    return members.value;
  }
  return members.value.filter((member) => (
    member.nickname.toLowerCase().includes(keyword) || member.username.toLowerCase().includes(keyword)
  ));
});

const setTab = async (tab: RelationshipTab) => {
  activeTab.value = tab;
  await router.replace({ path: '/connections', query: tab === 'following' ? {} : { tab } });
  await loadMembers();
};

const handleFollow = async (target: User) => {
  busyUserId.value = target.id;
  try {
    await userService.followUser(target.id);
    await loadMembers();
  } catch (error) {
    showToast(error instanceof Error ? error.message : '操作失败，请稍后重试', 'error');
  } finally {
    busyUserId.value = null;
  }
};

const startChat = async (target: User) => {
  try {
    const conversation = await chatService.createConversation(target.id);
    await router.push(`/chat?conversation=${conversation.id}`);
  } catch (error) {
    showToast(error instanceof Error ? error.message : '创建会话失败，请稍后重试', 'error');
  }
};
</script>

<template>
  <div class="min-h-screen">
    <div class="sticky top-0 z-10 flex items-center gap-5 border-b border-border bg-bg-primary/90 px-4 py-3 backdrop-blur-md">
      <button type="button" class="rounded-full p-2 hover:bg-bg-secondary" @click="router.back()">
        <ArrowLeft :size="20" />
      </button>
      <div>
        <h1 class="text-xl font-bold">关注列表</h1>
        <p class="text-sm text-text-secondary">查看你关注的人、关注你的人以及互相关注的连接。</p>
      </div>
    </div>

    <div class="space-y-4 px-4 py-5">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="rounded-full border px-4 py-2 text-sm font-medium transition-colors"
          :class="activeTab === tab.key ? 'border-text-primary bg-text-primary text-bg-primary' : 'border-border hover:bg-bg-secondary'"
          @click="setTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <label class="relative block">
        <Search class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" :size="16" />
        <input
          v-model="query"
          type="text"
          placeholder="搜索昵称或用户名"
          class="w-full rounded-full border border-border bg-bg-primary py-3 pl-11 pr-4 outline-none transition focus:border-text-primary"
        />
      </label>

      <div v-if="loading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>

      <div v-else-if="filteredMembers.length === 0" class="rounded-[28px] border border-dashed border-border p-8 text-center text-text-secondary">
        当前没有符合条件的用户。
      </div>

      <div v-else class="space-y-3">
        <article
          v-for="member in filteredMembers"
          :key="member.id"
          class="rounded-[28px] border border-border bg-bg-primary p-4 shadow-sm"
        >
          <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div class="flex min-w-0 items-center gap-4">
              <img :src="member.avatar" :alt="member.nickname" class="h-14 w-14 rounded-full object-cover" />
              <div class="min-w-0">
                <button type="button" class="truncate text-left text-lg font-bold hover:underline" @click="router.push(`/profile/${member.username}`)">
                  {{ member.nickname }}
                </button>
                <p class="truncate text-sm text-text-secondary">@{{ member.username }}</p>
                <p class="mt-1 text-sm text-text-secondary">{{ member.bio || '这个用户还没有填写简介。' }}</p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-bg-secondary"
                @click="startChat(member)"
              >
                <MessageCircle :size="16" />
                聊天
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full bg-text-primary px-4 py-2 text-sm font-bold text-bg-primary hover:opacity-90 disabled:opacity-60"
                :disabled="busyUserId === member.id"
                @click="handleFollow(member)"
              >
                <UserPlus :size="16" />
                {{ member.isFollowing ? '取消关注' : activeTab === 'followers' ? '回关' : '关注' }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>
