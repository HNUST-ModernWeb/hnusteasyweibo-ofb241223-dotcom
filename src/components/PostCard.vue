<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Repeat2 } from 'lucide-vue-next';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { postService } from '../api/services';
import { useAuth } from '../composables/useAuth';
import { useToast } from '../composables/useToast';
import type { Post } from '../types';

const props = defineProps<{ post: Post }>();
const emit = defineEmits(['update']);

const router = useRouter();
const { isAuthenticated, user } = useAuth();
const { showToast } = useToast();

const isLiked = ref(props.post.isLiked);
const likesCount = ref(props.post.likesCount);
const isBookmarked = ref(props.post.isBookmarked);

const formattedTime = computed(() => {
  return formatDistanceToNow(new Date(props.post.createdAt), { addSuffix: true, locale: zhCN });
});

const handleLike = async (e: Event) => {
  e.stopPropagation();
  if (!isAuthenticated.value) {
    router.push('/login');
    return;
  }
  await postService.likePost(props.post.id, user.value!.id);
  isLiked.value = !isLiked.value;
  likesCount.value += isLiked.value ? 1 : -1;
};

const handleBookmark = async (e: Event) => {
  e.stopPropagation();
  if (!isAuthenticated.value) {
    router.push('/login');
    return;
  }
  await postService.bookmarkPost(props.post.id);
  isBookmarked.value = !isBookmarked.value;
};

const handlePostClick = () => {
  router.push(`/post/${props.post.id}`);
};

const handleUserClick = (e: Event) => {
  e.stopPropagation();
  router.push(`/profile/${props.post.author.username}`);
};

const renderContent = (content: string) => {
  const parts = content.split(/(#[^\s#]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      return `<span class="text-brand hover:underline cursor-pointer" data-tag="${part}">${part}</span>`;
    }
    return part;
  }).join('');
};

const handleContentClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.dataset.tag) {
    e.stopPropagation();
    router.push(`/search?q=${encodeURIComponent(target.dataset.tag)}`);
  }
};

const handleMore = (e: Event) => {
  e.stopPropagation();
  showToast('更多操作功能开发中', 'error');
};

const handleRepost = (e: Event) => {
  e.stopPropagation();
  if (!isAuthenticated.value) {
    showToast('请先登录后再转发帖子', 'error');
    router.push('/login');
    return;
  }
  showToast('转发功能将在后端接入后开放', 'error');
};

const handleShare = async (e: Event) => {
  e.stopPropagation();
  try {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${props.post.id}`);
    showToast('帖子链接已复制', 'success');
  } catch {
    showToast('复制链接失败，请重试', 'error');
  }
};
</script>

<template>
  <div 
    @click="handlePostClick"
    class="p-4 border-b border-border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
  >
    <div class="flex gap-3">
      <!-- Avatar -->
      <img 
        :src="post.author.avatar" 
        :alt="post.author.nickname" 
        class="w-12 h-12 rounded-full object-cover flex-shrink-0 hover:opacity-90 transition-opacity"
        @click="handleUserClick"
      />

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1 min-w-0" @click="handleUserClick">
            <span class="font-bold truncate hover:underline">{{ post.author.nickname }}</span>
            <span class="text-text-secondary text-sm truncate">@{{ post.author.username }}</span>
            <span class="text-text-secondary text-sm">·</span>
            <span class="text-text-secondary text-sm whitespace-nowrap">{{ formattedTime }}</span>
          </div>
          <button type="button" @click="handleMore" class="text-text-secondary hover:text-brand hover:bg-brand/10 p-2 rounded-full transition-colors">
            <MoreHorizontal :size="18" />
          </button>
        </div>

        <div 
          class="mt-1 text-[15px] leading-normal whitespace-pre-wrap break-words"
          v-html="renderContent(post.content)"
          @click="handleContentClick"
        ></div>

        <!-- Images -->
        <div v-if="post.images && post.images.length > 0" 
             :class="['mt-3 rounded-2xl overflow-hidden border border-border grid gap-0.5', post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2']">
          <img 
            v-for="(img, idx) in post.images" 
            :key="idx" 
            :src="img" 
            alt="Post content" 
            class="w-full h-full object-cover aspect-video"
          />
        </div>

        <!-- Actions -->
        <div class="mt-3 flex items-center justify-between max-w-md text-text-secondary">
          <button 
            class="group flex items-center gap-2 hover:text-brand transition-colors"
            @click.stop="router.push(`/post/${post.id}#comments`)"
          >
            <div class="p-2 group-hover:bg-brand/10 rounded-full transition-colors">
              <MessageCircle :size="18" />
            </div>
            <span class="text-sm">{{ post.commentsCount }}</span>
          </button>

          <button type="button" @click="handleRepost" class="group flex items-center gap-2 hover:text-brand transition-colors">
            <div class="p-2 group-hover:bg-brand/10 rounded-full transition-colors">
              <Repeat2 :size="18" />
            </div>
            <span class="text-sm">0</span>
          </button>

          <button 
            class="group flex items-center gap-2 transition-colors"
            :class="isLiked ? 'text-brand' : 'hover:text-brand'"
            @click="handleLike"
          >
            <div class="p-2 group-hover:bg-brand/10 rounded-full transition-colors" :class="isLiked ? 'text-brand' : ''">
              <Heart :size="18" :fill="isLiked ? 'currentColor' : 'none'" />
            </div>
            <span class="text-sm">{{ likesCount }}</span>
          </button>

          <button 
            class="group flex items-center gap-2 transition-colors"
            :class="isBookmarked ? 'text-brand' : 'hover:text-brand'"
            @click="handleBookmark"
          >
            <div class="p-2 group-hover:bg-brand/10 rounded-full transition-colors" :class="isBookmarked ? 'text-brand' : ''">
              <Bookmark :size="18" :fill="isBookmarked ? 'currentColor' : 'none'" />
            </div>
          </button>

          <button type="button" @click="handleShare" class="group flex items-center gap-2 hover:text-brand transition-colors">
            <div class="p-2 group-hover:bg-brand/10 rounded-full transition-colors">
              <Share2 :size="18" />
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
