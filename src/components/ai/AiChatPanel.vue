<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  ChevronDown,
  Copy,
  History,
  LoaderCircle,
  MessageSquarePlus,
  RefreshCcw,
  SendHorizontal,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-vue-next';
import { useAuth } from '../../composables/useAuth';
import { AI_MODELS, useAiChat } from '../../composables/useAiChat';
import { useToast } from '../../composables/useToast';

const router = useRouter();
const { isAuthenticated } = useAuth();
const { showToast } = useToast();
const messagesContainer = ref<HTMLElement | null>(null);

const {
  isOpen,
  historyOpen,
  conversations,
  currentConversationId,
  messages,
  draft,
  selectedModel,
  loadingConversations,
  loadingMessages,
  sending,
  lastError,
  latestAssistantId,
  hasMessages,
  openPanel,
  closePanel,
  toggleHistory,
  selectConversation,
  startNewConversation,
  sendMessage,
  retryLatestAssistant,
  clearLastError,
} = useAiChat();

const hasConversations = computed(() => conversations.value.length > 0);
const showEmptyState = computed(() => !hasMessages.value && !loadingMessages.value);
const selectedModelLabel = computed(() => AI_MODELS.find((option) => option.id === selectedModel.value)?.label ?? 'Gemini 2.5 Flash Lite');
const selectedModelShortLabel = computed(() => AI_MODELS.find((option) => option.id === selectedModel.value)?.shortLabel ?? '2.5 Flash Lite');

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

watch(
  () => [isOpen.value, messages.value.length, sending.value],
  () => {
    if (isOpen.value) {
      void scrollToBottom();
    }
  },
  { deep: true },
);

const handleOpen = async () => {
  if (!isAuthenticated.value) {
    showToast('请先登录后再使用 Gemini 对话', 'error');
    router.push('/login');
    return;
  }
  await openPanel();
};

const handleSend = async () => {
  try {
    await sendMessage(undefined, selectedModel.value);
  } catch (error) {
    showToast(error instanceof Error ? error.message : '发送失败，请稍后重试', 'error');
  }
};

const handleCopy = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content);
    showToast('消息已复制', 'success');
  } catch {
    showToast('复制失败，请稍后重试', 'error');
  }
};

const handleFeedback = (type: 'up' | 'down') => {
  showToast(type === 'up' ? '已记录你的反馈' : '已记录改进建议', 'success');
};

const formatConversationTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};
</script>

<template>
  <button
    v-if="isAuthenticated && !isOpen"
    class="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)] transition-transform hover:scale-[1.02] hover:shadow-[0_16px_48px_rgba(0,0,0,0.18)] active:scale-95"
    aria-label="打开 Gemini 对话"
    @click="handleOpen"
  >
    <img src="/gemini-logo.svg" alt="Gemini" class="h-7 w-7 rounded-full" />
  </button>

  <div
    v-else-if="isAuthenticated"
    class="fixed inset-0 z-40"
    @click="closePanel"
  >
    <div class="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
    <div
      class="absolute bottom-4 right-4 left-4 sm:left-auto h-[min(640px,calc(100vh-1.5rem))] sm:h-[640px] w-auto sm:w-[430px] rounded-[32px] border border-black/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
      @click.stop
    >
      <div class="relative flex h-full flex-col overflow-hidden rounded-[32px]">
      <aside
        v-if="historyOpen"
        class="absolute inset-y-0 left-0 z-10 w-[270px] border-r border-black/10 bg-white/98 p-4 backdrop-blur"
      >
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-black">历史会话</h3>
          <button
            class="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-black transition hover:bg-black hover:text-white"
            @click="startNewConversation"
          >
            新建
          </button>
        </div>
        <div v-if="loadingConversations" class="flex items-center gap-2 px-2 py-3 text-sm text-black/60">
          <LoaderCircle class="animate-spin" :size="16" />
          正在加载历史…
        </div>
        <div v-else-if="!hasConversations" class="rounded-2xl border border-dashed border-black/15 px-4 py-5 text-sm text-black/55">
          还没有历史会话，发第一条消息后会自动保存。
        </div>
        <div v-else class="space-y-2 overflow-y-auto pr-1">
          <button
            v-for="conversation in conversations"
            :key="conversation.id"
            class="w-full rounded-2xl border px-3 py-3 text-left transition"
            :class="conversation.id === currentConversationId ? 'border-black bg-black text-white' : 'border-black/10 bg-white text-black hover:border-black/20 hover:bg-black/[0.03]'"
            @click="selectConversation(conversation.id)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold">{{ conversation.title }}</p>
                <p class="mt-1 line-clamp-2 text-xs" :class="conversation.id === currentConversationId ? 'text-white/75' : 'text-black/55'">
                  {{ conversation.preview || '空白会话' }}
                </p>
              </div>
              <span class="shrink-0 text-[11px]" :class="conversation.id === currentConversationId ? 'text-white/75' : 'text-black/45'">
                {{ formatConversationTime(conversation.updatedAt) }}
              </span>
            </div>
          </button>
        </div>
      </aside>

      <header class="flex items-center justify-between px-5 py-4">
        <div class="flex items-center gap-3">
          <img src="/gemini-logo.svg" alt="Gemini" class="h-9 w-9 rounded-full" />
          <div>
            <p class="text-sm font-semibold text-black">Gemini</p>
            <p class="text-xs text-black/45">Easy WeiBo AI</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button class="rounded-full p-2 text-black/70 transition hover:bg-black/[0.04] hover:text-black" aria-label="会话历史" @click="toggleHistory">
            <History :size="18" />
          </button>
          <button class="rounded-full p-2 text-black/70 transition hover:bg-black/[0.04] hover:text-black" aria-label="新建对话" @click="startNewConversation">
            <MessageSquarePlus :size="18" />
          </button>
          <button class="rounded-full p-2 text-black/70 transition hover:bg-black/[0.04] hover:text-black" aria-label="收起对话面板" @click="closePanel">
            <ChevronDown :size="18" />
          </button>
        </div>
      </header>

      <div
        ref="messagesContainer"
        class="relative flex-1 overflow-y-auto px-5"
      >
        <div v-if="loadingMessages" class="flex h-full items-center justify-center text-sm text-black/55">
          <div class="flex items-center gap-2">
            <LoaderCircle class="animate-spin" :size="16" />
            正在加载会话…
          </div>
        </div>

        <div v-if="showEmptyState" class="flex h-full flex-col justify-center pb-10">
          <div class="mb-6">
            <p class="text-[30px] font-semibold tracking-tight text-black">How can I help you today?</p>
          </div>
        </div>

        <div v-else class="space-y-6 pb-8">
          <div
            v-for="message in messages"
            :key="message.id"
            class="space-y-3"
          >
            <div class="flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
              <div
                class="max-w-[85%] rounded-[24px] px-4 py-3 text-[15px] leading-7 shadow-sm"
                :class="message.role === 'user'
                  ? 'bg-black/10 text-black'
                  : message.failed
                    ? 'border border-red-200 bg-red-50 text-red-700'
                    : 'bg-transparent text-black'"
              >
                <p class="whitespace-pre-wrap break-words">{{ message.content }}</p>
              </div>
            </div>

            <div
              v-if="message.role === 'assistant' && !message.pending"
              class="flex items-center gap-2 pl-1 text-black/55"
            >
              <button
                v-if="message.id === latestAssistantId"
                class="rounded-full p-2 transition hover:bg-black/[0.04] hover:text-black"
                title="重新生成"
                @click="retryLatestAssistant"
              >
                <RefreshCcw :size="17" />
              </button>
              <button
                class="rounded-full p-2 transition hover:bg-black/[0.04] hover:text-black"
                title="复制"
                @click="handleCopy(message.content)"
              >
                <Copy :size="17" />
              </button>
              <button
                class="rounded-full p-2 transition hover:bg-black/[0.04] hover:text-black"
                title="有帮助"
                @click="handleFeedback('up')"
              >
                <ThumbsUp :size="17" />
              </button>
              <button
                class="rounded-full p-2 transition hover:bg-black/[0.04] hover:text-black"
                title="需要改进"
                @click="handleFeedback('down')"
              >
                <ThumbsDown :size="17" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-black/8 px-5 py-4">
        <div v-if="lastError" class="mb-3 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <span>{{ lastError }}</span>
          <button class="font-medium text-red-700/80 transition hover:text-red-700" @click="clearLastError">
            关闭
          </button>
        </div>

        <div class="rounded-[28px] border border-black/12 bg-white px-4 py-3.5 shadow-sm">
          <textarea
            v-model="draft"
            rows="2"
            class="w-full resize-none border-0 bg-transparent text-[16px] leading-7 text-black outline-none placeholder:text-black/35"
            placeholder="Ask anything"
            @keydown.enter.exact.prevent="handleSend"
          />

          <div class="mt-3 flex items-center justify-between">
            <label class="relative inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-medium text-black/70 transition hover:bg-black/[0.05]">
              <Sparkles :size="14" />
              <span>{{ selectedModelShortLabel }}</span>
              <ChevronDown :size="14" />
              <select
                v-model="selectedModel"
                class="absolute inset-0 cursor-pointer opacity-0"
                aria-label="选择 Gemini 模型"
              >
                <option v-for="option in AI_MODELS" :key="option.id" :value="option.id">
                  {{ option.label }}
                </option>
              </select>
            </label>

            <button
              class="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white transition disabled:cursor-not-allowed disabled:bg-black/25"
              :disabled="sending || !draft.trim()"
              :aria-label="`使用 ${selectedModelLabel} 发送消息`"
              @click="handleSend"
            >
              <LoaderCircle v-if="sending" class="animate-spin" :size="18" />
              <SendHorizontal v-else :size="18" />
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>
