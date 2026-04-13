<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { postService, commentService } from '../api/services';
import { Post, Comment as CommentType } from '../types';
import PostCard from '../components/PostCard.vue';
import { ArrowLeft, Send } from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;
const post = ref<Post | null>(null);
const comments = ref<CommentType[]>([]);
const loading = ref(true);
const newComment = ref('');
const { user, isAuthenticated } = useAuth();

const loadData = async () => {
  loading.value = true;
  const p = await postService.getPostById(id);
  if (p) {
    post.value = p;
    comments.value = await commentService.getCommentsByPostId(id);
  }
  loading.value = false;
};

onMounted(loadData);

const handleAddComment = async () => {
  if (!newComment.value.trim() || !user.value || !post.value) return;
  await commentService.addComment(post.value.id, user.value, newComment.value);
  newComment.value = '';
  loadData();
};
</script>

<template>
  <div v-if="loading" class="flex justify-center p-10">
    <div class="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
  </div>
  <div v-else-if="!post" class="p-10 text-center">
    <h1 class="text-2xl font-bold">帖子不存在</h1>
    <button @click="router.push('/')" class="text-brand mt-4 hover:underline">回到首页</button>
  </div>
  <div v-else class="min-h-screen">
    <div class="sticky top-0 bg-bg-primary/80 backdrop-blur-md z-10 px-4 py-2 flex items-center gap-6">
      <button @click="router.back()" class="p-2 hover:bg-bg-secondary rounded-full">
        <ArrowLeft :size="20" />
      </button>
      <h1 class="text-xl font-bold">帖子</h1>
    </div>

    <PostCard :post="post" />

    <div v-if="isAuthenticated" class="p-4 border-b border-border flex gap-4">
      <img :src="user?.avatar" :alt="user?.nickname" class="w-10 h-10 rounded-full object-cover" />
      <div class="flex-1 flex gap-2">
        <input 
          v-model="newComment"
          @keydown.enter="handleAddComment"
          type="text" 
          placeholder="发布你的回复" 
          class="flex-1 bg-transparent text-lg outline-none"
        />
        <button 
          @click="handleAddComment"
          :disabled="!newComment.trim()"
          class="bg-brand text-bg-primary px-4 py-1 rounded-full font-bold disabled:opacity-50"
        >
          回复
        </button>
      </div>
    </div>
    <div v-else class="p-6 text-center border-b border-border">
      <p class="text-text-secondary mb-2">登录后即可参与讨论</p>
      <button @click="router.push('/login')" class="text-brand font-bold hover:underline">立即登录</button>
    </div>

    <div class="divide-y divide-border">
      <div v-for="comment in comments" :key="comment.id" class="p-4 flex gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        <img 
          :src="comment.author.avatar" 
          :alt="comment.author.nickname" 
          class="w-10 h-10 rounded-full object-cover cursor-pointer"
          @click="router.push(`/profile/${comment.author.username}`)"
        />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1">
            <span class="font-bold truncate hover:underline cursor-pointer" @click="router.push(`/profile/${comment.author.username}`)">
              {{ comment.author.nickname }}
            </span>
            <span class="text-text-secondary text-sm truncate">@{{ comment.author.username }}</span>
            <span class="text-text-secondary text-sm">·</span>
            <span class="text-text-secondary text-sm">
              {{ formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: zhCN }) }}
            </span>
          </div>
          <p class="mt-1 text-[15px]">{{ comment.content }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
