<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Ban, MessageCircle, RotateCcw, Search, Send, ShieldCheck, Undo2 } from 'lucide-vue-next';
import { chatService, userService } from '../api/services';
import { useAuth } from '../composables/useAuth';
import { useToast } from '../composables/useToast';
import type { Conversation, ConversationDetail, User } from '../types';

const route = useRoute();
const router = useRouter();
const { user } = useAuth();
const { showToast } = useToast();

const conversations = ref<Conversation[]>([]);
const selectedId = ref<string>('');
const detail = ref<ConversationDetail | null>(null);
const loadingList = ref(true);
const loadingDetail = ref(false);
const searchQuery = ref('');
const discoverQuery = ref('');
const discoverResults = ref<User[]>([]);
const composing = ref('');
const sending = ref(false);
const recallingId = ref<string | null>(null);
const togglingBlock = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);

const loadConversations = async () => {
  loadingList.value = true;
  try {
    conversations.value = await chatService.getConversations();
    if (!selectedId.value && conversations.value.length > 0) {
      selectedId.value = conversations.value[0].id;
    }
  } catch (error) {
    showToast(error instanceof Error ? error.message : '加载聊天列表失败，请稍后重试', 'error');
  } finally {
    loadingList.value = false;
  }
};

const loadDetail = async (conversationId: string) => {
  if (!conversationId) {
    detail.value = null;
    return;
  }
  loadingDetail.value = true;
  try {
    detail.value = await chatService.getConversation(conversationId);
    if (detail.value.unreadCount > 0) {
      await chatService.markConversationRead(conversationId);
      conversations.value = await chatService.getConversations();
      detail.value = await chatService.getConversation(conversationId);
    }
    await nextTick();
    messagesContainer.value?.scrollTo({ top: messagesContainer.value.scrollHeight, behavior: 'smooth' });
  } catch (error) {
    detail.value = null;
    showToast(error instanceof Error ? error.message : '加载会话失败，请稍后重试', 'error');
  } finally {
    loadingDetail.value = false;
  }
};

const pickConversation = async (conversationId: string) => {
  selectedId.value = conversationId;
  await router.replace({ path: '/chat', query: { conversation: conversationId } });
  await loadDetail(conversationId);
};

const filteredConversations = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();
  if (!keyword) {
    return conversations.value;
  }
  return conversations.value.filter((item) => (
    item.targetUser.nickname.toLowerCase().includes(keyword)
    || item.targetUser.username.toLowerCase().includes(keyword)
    || item.lastMessage.toLowerCase().includes(keyword)
  ));
});

watch(
  () => route.query.conversation,
  async (value) => {
    if (typeof value === 'string' && value && value !== selectedId.value) {
      selectedId.value = value;
      await loadDetail(value);
    }
  },
);

watch(
  discoverQuery,
  async (value) => {
    const keyword = value.trim();
    if (!keyword) {
      discoverResults.value = [];
      return;
    }
    try {
      const users = await userService.searchUsers(keyword);
      discoverResults.value = users.filter((item) => item.id !== user.value?.id);
    } catch {
      discoverResults.value = [];
    }
  },
);

onMounted(async () => {
  await loadConversations();
  const fromQuery = typeof route.query.conversation === 'string' ? route.query.conversation : '';
  if (fromQuery) {
    selectedId.value = fromQuery;
    await loadDetail(fromQuery);
  } else if (conversations.value[0]) {
    await pickConversation(conversations.value[0].id);
  }
});

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatMessageTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const startConversation = async (target: User) => {
  try {
    const conversation = await chatService.createConversation(target.id);
    discoverQuery.value = '';
    discoverResults.value = [];
    await loadConversations();
    await pickConversation(conversation.id);
  } catch (error) {
    showToast(error instanceof Error ? error.message : '创建会话失败，请稍后重试', 'error');
  }
};

const sendMessage = async () => {
  if (!detail.value || !detail.value.canSend || !composing.value.trim()) {
    return;
  }
  sending.value = true;
  try {
    await chatService.sendMessage(detail.value.id, composing.value.trim());
    composing.value = '';
    await loadConversations();
    await loadDetail(detail.value.id);
  } catch (error) {
    showToast(error instanceof Error ? error.message : '发送失败，请稍后重试', 'error');
  } finally {
    sending.value = false;
  }
};

const recallMessage = async (messageId: string) => {
  recallingId.value = messageId;
  try {
    await chatService.recallMessage(messageId);
    if (detail.value) {
      await loadConversations();
      await loadDetail(detail.value.id);
    }
  } catch (error) {
    showToast(error instanceof Error ? error.message : '撤回消息失败，请稍后重试', 'error');
  } finally {
    recallingId.value = null;
  }
};

const toggleBlock = async () => {
  if (!detail.value) {
    return;
  }
  togglingBlock.value = true;
  try {
    if (detail.value.blockedByCurrentUser) {
      await chatService.unblockUser(detail.value.targetUser.id);
      showToast('已解除拉黑', 'success');
    } else {
      await chatService.blockUser(detail.value.targetUser.id);
      showToast('已拉黑该用户', 'success');
    }
    await loadConversations();
    await loadDetail(detail.value.id);
  } catch (error) {
    showToast(error instanceof Error ? error.message : '操作失败，请稍后重试', 'error');
  } finally {
    togglingBlock.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-bg-secondary/40">
    <div class="sticky top-0 z-10 flex items-center gap-5 border-b border-border bg-bg-primary/90 px-4 py-3 backdrop-blur-md">
      <button type="button" class="rounded-full p-2 hover:bg-bg-secondary" @click="router.back()">
        <ArrowLeft :size="20" />
      </button>
      <div>
        <h1 class="text-xl font-bold">聊天</h1>
        <p class="text-sm text-text-secondary">查看最近对话、未读消息，并与好友或陌生人开始私聊。</p>
      </div>
    </div>

    <div class="grid min-h-[calc(100vh-64px)] grid-cols-1 xl:grid-cols-[340px,1fr]">
      <aside class="border-r border-border bg-bg-primary">
        <div class="border-b border-border px-4 py-4">
          <label class="relative block">
            <Search class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" :size="16" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索会话"
              class="w-full rounded-full border border-border bg-bg-primary py-3 pl-11 pr-4 outline-none transition focus:border-text-primary"
            />
          </label>

          <label class="relative mt-3 block">
            <Search class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" :size="16" />
            <input
              v-model="discoverQuery"
              type="text"
              placeholder="搜索用户并开始聊天"
              class="w-full rounded-full border border-border bg-bg-primary py-3 pl-11 pr-4 outline-none transition focus:border-text-primary"
            />
          </label>

          <div v-if="discoverResults.length > 0" class="mt-3 space-y-2">
            <button
              v-for="candidate in discoverResults"
              :key="candidate.id"
              type="button"
              class="flex w-full items-center gap-3 rounded-2xl border border-border px-3 py-3 text-left hover:bg-bg-secondary"
              @click="startConversation(candidate)"
            >
              <img :src="candidate.avatar" :alt="candidate.nickname" class="h-10 w-10 rounded-full object-cover" />
              <div class="min-w-0 flex-1">
                <p class="truncate font-bold">{{ candidate.nickname }}</p>
                <p class="truncate text-sm text-text-secondary">@{{ candidate.username }}</p>
              </div>
            </button>
          </div>
        </div>

        <div v-if="loadingList" class="flex justify-center py-12">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
        <div v-else-if="filteredConversations.length === 0" class="p-6 text-sm text-text-secondary">
          还没有会话。你可以先搜索一个用户开始聊天。
        </div>
        <div v-else class="overflow-y-auto">
          <button
            v-for="conversation in filteredConversations"
            :key="conversation.id"
            type="button"
            class="flex w-full items-center gap-3 border-b border-border/70 px-4 py-3 text-left transition hover:bg-bg-secondary"
            :class="selectedId === conversation.id ? 'bg-bg-secondary' : ''"
            @click="pickConversation(conversation.id)"
          >
            <img :src="conversation.targetUser.avatar" :alt="conversation.targetUser.nickname" class="h-12 w-12 rounded-full object-cover" />
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <p class="truncate font-bold">{{ conversation.targetUser.nickname }}</p>
                <span class="shrink-0 text-xs text-text-secondary">{{ formatTime(conversation.lastMessageAt) }}</span>
              </div>
              <div class="mt-1 flex items-center justify-between gap-2">
                <p class="truncate text-sm text-text-secondary">{{ conversation.lastMessage || '还没有聊天记录' }}</p>
                <span
                  v-if="conversation.unreadCount > 0"
                  class="inline-flex min-w-[22px] items-center justify-center rounded-full bg-text-primary px-2 py-1 text-[11px] font-bold text-bg-primary"
                >
                  {{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}
                </span>
              </div>
            </div>
          </button>
        </div>
      </aside>

      <section class="flex min-h-[calc(100vh-64px)] flex-col bg-bg-primary">
        <div v-if="!detail && !loadingDetail" class="flex flex-1 items-center justify-center p-10 text-center text-text-secondary">
          <div>
            <MessageCircle class="mx-auto mb-4" :size="40" />
            <p class="text-lg font-medium text-text-primary">选择一个会话开始聊天</p>
            <p class="mt-2 text-sm">陌生人之间最多只能发送一条开场消息，对方回复后才可以持续聊天。</p>
          </div>
        </div>

        <template v-else>
          <div v-if="detail" class="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
            <div class="flex min-w-0 items-center gap-3">
              <img :src="detail.targetUser.avatar" :alt="detail.targetUser.nickname" class="h-11 w-11 rounded-full object-cover" />
              <div class="min-w-0">
                <button type="button" class="truncate font-bold hover:underline" @click="router.push(`/profile/${detail.targetUser.username}`)">
                  {{ detail.targetUser.nickname }}
                </button>
                <p class="truncate text-sm text-text-secondary">@{{ detail.targetUser.username }}</p>
              </div>
            </div>

            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-bg-secondary disabled:opacity-60"
              :disabled="togglingBlock"
              @click="toggleBlock"
            >
              <Ban v-if="!detail.blockedByCurrentUser" :size="16" />
              <ShieldCheck v-else :size="16" />
              {{ detail.blockedByCurrentUser ? '解除拉黑' : '拉黑' }}
            </button>
          </div>

          <div ref="messagesContainer" class="flex-1 overflow-y-auto bg-bg-secondary/30 px-5 py-5">
            <div v-if="loadingDetail" class="flex justify-center py-12">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
            </div>
            <div v-else-if="detail" class="space-y-4">
              <article
                v-for="message in detail.messages"
                :key="message.id"
                class="flex"
                :class="message.senderId === user?.id ? 'justify-end' : 'justify-start'"
              >
                <div class="max-w-[78%]">
                  <div
                    class="rounded-[24px] px-4 py-3 shadow-sm"
                    :class="message.senderId === user?.id ? 'bg-text-primary text-bg-primary' : 'border border-border bg-bg-primary text-text-primary'"
                  >
                    <p class="whitespace-pre-wrap break-words text-[15px] leading-6">{{ message.content }}</p>
                  </div>
                  <div class="mt-2 flex items-center gap-3 px-1 text-xs text-text-secondary" :class="message.senderId === user?.id ? 'justify-end' : ''">
                    <span>{{ formatMessageTime(message.createdAt) }}</span>
                    <button
                      v-if="message.canRecall"
                      type="button"
                      class="inline-flex items-center gap-1 hover:text-text-primary"
                      :disabled="recallingId === message.id"
                      @click="recallMessage(message.id)"
                    >
                      <RotateCcw :size="12" />
                      {{ recallingId === message.id ? '撤回中' : '撤回' }}
                    </button>
                    <span v-else-if="message.recalled" class="inline-flex items-center gap-1">
                      <Undo2 :size="12" />
                      已撤回
                    </span>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div v-if="detail" class="border-t border-border bg-bg-primary px-5 py-4">
            <div
              v-if="!detail.canSend"
              class="mb-3 rounded-2xl border border-border bg-bg-secondary px-4 py-3 text-sm text-text-secondary"
            >
              {{ detail.restrictionReason }}
            </div>
            <div class="flex items-end gap-3">
              <textarea
                v-model="composing"
                rows="2"
                maxlength="2000"
                placeholder="输入消息..."
                class="min-h-[56px] flex-1 resize-none rounded-[28px] border border-border bg-bg-primary px-4 py-3 outline-none transition focus:border-text-primary disabled:bg-bg-secondary"
                :disabled="!detail.canSend || sending"
                @keydown.enter.exact.prevent="sendMessage"
              ></textarea>
              <button
                type="button"
                class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-text-primary text-bg-primary shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!detail.canSend || !composing.trim() || sending"
                @click="sendMessage"
              >
                <Send :size="18" />
              </button>
            </div>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>
