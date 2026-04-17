<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  Ban,
  Download,
  MoreHorizontal,
  Paperclip,
  Send,
  SmilePlus,
  Undo2,
  Video,
  X,
} from 'lucide-vue-next';
import { chatService, uploadService } from '../api/services';
import { useAuth } from '../composables/useAuth';
import { useToast } from '../composables/useToast';
import type { ConversationDetail } from '../types';

const route = useRoute();
const router = useRouter();
const { user } = useAuth();
const { showToast } = useToast();

const conversationId = ref(String(route.params.id || ''));
const detail = ref<ConversationDetail | null>(null);
const loading = ref(true);
const sending = ref(false);
const uploadingAttachment = ref(false);
const recallingId = ref<string | null>(null);
const togglingBlock = ref(false);
const emojiOpen = ref(false);
const composing = ref('');
const messagesContainer = ref<HTMLElement | null>(null);
const attachmentInput = ref<HTMLInputElement | null>(null);

const emojiPalette = ['😀', '😂', '🥳', '👍', '👏', '🔥', '✨', '🎉', '❤️', '🙏', '🤝', '📚', '💻', '😄'];
const quickEmojis = ['🌞 早上好', '😗 比心', '🙂 困', '😁 此牙', '👍 赞'];
const attachmentAccept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt';

const scrollToBottom = async (behavior: ScrollBehavior = 'smooth') => {
  await nextTick();
  messagesContainer.value?.scrollTo({ top: messagesContainer.value.scrollHeight, behavior });
};

const loadDetail = async () => {
  if (!conversationId.value) {
    detail.value = null;
    return;
  }

  loading.value = true;
  try {
    detail.value = await chatService.getConversation(conversationId.value);
    if (detail.value.unreadCount > 0) {
      await chatService.markConversationRead(conversationId.value);
      detail.value = await chatService.getConversation(conversationId.value);
    }
    await scrollToBottom('auto');
  } catch (error) {
    detail.value = null;
    showToast(error instanceof Error ? error.message : '加载会话失败，请稍后重试', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(loadDetail);

watch(
  () => route.params.id,
  async (value) => {
    conversationId.value = String(value || '');
    await loadDetail();
  },
);

const handleSend = async () => {
  if (!detail.value || !detail.value.canSend || !composing.value.trim()) {
    return;
  }

  sending.value = true;
  try {
    await chatService.sendMessage(detail.value.id, composing.value.trim());
    composing.value = '';
    emojiOpen.value = false;
    await loadDetail();
  } catch (error) {
    showToast(error instanceof Error ? error.message : '发送失败，请稍后重试', 'error');
  } finally {
    sending.value = false;
  }
};

const handleAttachmentClick = () => {
  attachmentInput.value?.click();
};

const handleAttachmentSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';

  if (!file || !detail.value || !detail.value.canSend) {
    return;
  }

  uploadingAttachment.value = true;
  try {
    const uploaded = await uploadService.uploadChatAttachment(file);
    await chatService.sendAttachment(detail.value.id, uploaded);
    await loadDetail();
  } catch (error) {
    showToast(error instanceof Error ? error.message : '发送附件失败，请稍后重试', 'error');
  } finally {
    uploadingAttachment.value = false;
  }
};

const recallMessage = async (messageId: string) => {
  recallingId.value = messageId;
  try {
    await chatService.recallMessage(messageId);
    await loadDetail();
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
    await loadDetail();
  } catch (error) {
    showToast(error instanceof Error ? error.message : '操作失败，请稍后重试', 'error');
  } finally {
    togglingBlock.value = false;
  }
};

const insertEmoji = (emoji: string) => {
  composing.value += emoji;
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

const appendQuickEmoji = (value: string) => {
  const emoji = value.split(' ')[0];
  composing.value += emoji;
};
</script>

<template>
  <div class="min-h-screen bg-bg-primary">
    <div class="sticky top-0 z-10 border-b border-border bg-bg-primary/95 px-4 py-3 backdrop-blur-md">
      <div class="flex items-center justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          <button type="button" class="rounded-full p-2 hover:bg-bg-secondary" @click="router.push('/chat')">
            <ArrowLeft :size="22" />
          </button>

          <template v-if="detail">
            <img :src="detail.targetUser.avatar" :alt="detail.targetUser.nickname" class="h-11 w-11 rounded-full object-cover" />
            <div class="min-w-0">
              <button type="button" class="truncate text-left font-bold hover:underline" @click="router.push(`/profile/${detail.targetUser.username}`)">
                {{ detail.targetUser.nickname }}
              </button>
              <p class="truncate text-sm text-text-secondary">@{{ detail.targetUser.username }}</p>
            </div>
          </template>
          <template v-else>
            <h1 class="text-xl font-bold">聊天</h1>
          </template>
        </div>

        <div class="flex items-center gap-2">
          <button type="button" class="rounded-full p-2 hover:bg-bg-secondary">
            <Video :size="20" />
          </button>
          <button type="button" class="rounded-full p-2 hover:bg-bg-secondary" :disabled="togglingBlock" @click="toggleBlock">
            <Ban :size="20" />
          </button>
          <button type="button" class="rounded-full p-2 hover:bg-bg-secondary">
            <MoreHorizontal :size="20" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex min-h-[calc(100vh-72px)] justify-center py-16">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
    </div>

    <template v-else-if="detail">
      <div ref="messagesContainer" class="h-[calc(100vh-250px)] overflow-y-auto bg-bg-secondary/30 px-4 py-5">
        <div class="mx-auto max-w-4xl space-y-6">
          <p v-if="!detail.canSend" class="text-center text-sm text-text-secondary">
            {{ detail.restrictionReason }}
          </p>

          <article
            v-for="message in detail.messages"
            :key="message.id"
            class="space-y-2"
          >
            <div class="flex items-end gap-3" :class="message.senderId === user?.id ? 'justify-end' : 'justify-start'">
              <img :src="message.sender.avatar" :alt="message.sender.nickname" class="h-10 w-10 rounded-full object-cover" />
              <div class="max-w-[72%]">
                <div
                  class="rounded-[24px] px-4 py-3 shadow-sm"
                  :class="message.senderId === user?.id ? 'bg-text-primary text-bg-primary' : 'border border-border bg-bg-primary text-text-primary'"
                >
                  <template v-if="message.recalled">
                    <p class="text-[15px] leading-7">{{ message.content }}</p>
                  </template>
                  <template v-else-if="message.messageType === 'IMAGE' && message.fileUrl">
                    <a :href="message.fileUrl" target="_blank" rel="noreferrer" class="block">
                      <img :src="message.fileUrl" :alt="message.fileName || '聊天图片'" class="max-h-72 rounded-2xl object-cover" />
                    </a>
                    <p v-if="message.content" class="mt-3 whitespace-pre-wrap break-words text-[15px] leading-7">{{ message.content }}</p>
                  </template>
                  <template v-else-if="message.messageType === 'FILE' && message.fileUrl">
                    <a :href="message.fileUrl" target="_blank" rel="noreferrer" class="flex items-center gap-3 rounded-2xl border border-current/15 px-3 py-3">
                      <Paperclip :size="18" />
                      <div class="min-w-0">
                        <p class="truncate font-bold">{{ message.fileName || '附件' }}</p>
                        <p class="truncate text-xs opacity-80">{{ message.mimeType || '文件消息' }}</p>
                      </div>
                      <Download :size="16" class="shrink-0" />
                    </a>
                    <p v-if="message.content" class="mt-3 whitespace-pre-wrap break-words text-[15px] leading-7">{{ message.content }}</p>
                  </template>
                  <template v-else>
                    <p class="whitespace-pre-wrap break-words text-[15px] leading-7">{{ message.content }}</p>
                  </template>
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
                    <Undo2 :size="12" />
                    {{ recallingId === message.id ? '撤回中' : '撤回' }}
                  </button>
                  <span v-else-if="message.recalled" class="inline-flex items-center gap-1">
                    <Undo2 :size="12" />
                    已撤回
                  </span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div class="border-t border-border bg-bg-primary px-4 py-3">
        <div class="mx-auto max-w-4xl">
          <div class="mb-3 flex flex-wrap gap-2">
            <button
              v-for="item in quickEmojis"
              :key="item"
              type="button"
              class="rounded-full border border-border bg-bg-primary px-4 py-2 text-sm text-text-secondary hover:bg-bg-secondary"
              @click="appendQuickEmoji(item)"
            >
              {{ item }}
            </button>
          </div>

          <div class="rounded-[28px] border border-border bg-bg-primary px-4 py-3 shadow-sm">
            <div v-if="!detail.canSend" class="mb-3 rounded-2xl border border-border bg-bg-secondary px-4 py-3 text-sm text-text-secondary">
              {{ detail.restrictionReason }}
            </div>

            <textarea
              v-model="composing"
              rows="2"
              maxlength="2000"
              placeholder="发送消息"
              class="min-h-[64px] w-full resize-none bg-transparent text-[15px] outline-none disabled:bg-bg-secondary"
              :disabled="!detail.canSend || sending || uploadingAttachment"
              @keydown.enter.exact.prevent="handleSend"
            />

            <div class="mt-3 flex items-center justify-between gap-3">
              <div class="relative flex items-center gap-2">
                <button
                  type="button"
                  class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-bg-secondary disabled:opacity-60"
                  :disabled="!detail.canSend || uploadingAttachment"
                  @click="handleAttachmentClick"
                >
                  <Paperclip :size="18" />
                </button>
                <input ref="attachmentInput" type="file" class="hidden" :accept="attachmentAccept" @change="handleAttachmentSelected" />

                <button
                  type="button"
                  class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-bg-secondary disabled:opacity-60"
                  :disabled="!detail.canSend"
                  @click="emojiOpen = !emojiOpen"
                >
                  <SmilePlus :size="18" />
                </button>

                <div
                  v-if="emojiOpen"
                  class="absolute bottom-14 left-0 z-20 w-72 rounded-3xl border border-border bg-bg-primary p-4 shadow-lg"
                >
                  <div class="mb-3 flex items-center justify-between">
                    <p class="text-sm font-bold">选择表情</p>
                    <button type="button" class="rounded-full p-1 hover:bg-bg-secondary" @click="emojiOpen = false">
                      <X :size="14" />
                    </button>
                  </div>
                  <div class="grid grid-cols-6 gap-2">
                    <button
                      v-for="emoji in emojiPalette"
                      :key="emoji"
                      type="button"
                      class="rounded-2xl border border-border px-2 py-2 text-xl hover:bg-bg-secondary"
                      @click="insertEmoji(emoji)"
                    >
                      {{ emoji }}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-text-primary text-bg-primary shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!detail.canSend || !composing.trim() || sending || uploadingAttachment"
                @click="handleSend"
              >
                <Send :size="18" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
