<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Image as ImageIcon, Smile, MapPin, Calendar } from 'lucide-vue-next';
import { postService } from '../api/services';
import PostCard from '../components/PostCard.vue';
import { useAuth } from '../composables/useAuth';
import { useToast } from '../composables/useToast';
import type { Post } from '../types';

const posts = ref<Post[]>([]);
const loading = ref(true);
const newPostContent = ref('');
const images = ref<string[]>([]);

const { user, isAuthenticated } = useAuth();
const { showToast } = useToast();

const loadPosts = async () => {
  loading.value = true;
  posts.value = await postService.getPosts();
  loading.value = false;
};

onMounted(() => {
  loadPosts();
});

const handleCreatePost = async () => {
  if (!newPostContent.value.trim() || !user.value) return;
  
  try {
    await postService.createPost(
      user.value, 
      newPostContent.value, 
      images.value.length > 0 ? images.value : undefined
    );
    newPostContent.value = '';
    images.value = [];
    showToast('发布成功！', 'success');
    loadPosts();
  } catch (e) {
    showToast('发布失败，请重试', 'error');
  }
};

const handleImageUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      images.value.push(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};

const handleInsertEmoji = () => {
  newPostContent.value = `${newPostContent.value}${newPostContent.value ? ' ' : ''}😀`;
};

const handlePendingAction = (message: string) => {
  showToast(message, 'error');
};
</script>

<template>
  <div class="divide-y divide-border">
    <!-- Header -->
    <div class="sticky top-0 bg-bg-primary/80 backdrop-blur-md z-10 px-4 py-3">
      <h1 class="text-xl font-bold">首页</h1>
    </div>

    <!-- Compose Area -->
    <div v-if="isAuthenticated" class="p-4 flex gap-4">
      <img :src="user?.avatar" :alt="user?.nickname" class="w-12 h-12 rounded-full object-cover" />
      <div class="flex-1">
        <textarea 
          v-model="newPostContent"
          placeholder="有什么新鲜事？" 
          class="w-full bg-transparent text-xl outline-none resize-none min-h-[100px]"
        ></textarea>
        
        <!-- Image Previews -->
        <div v-if="images.length > 0" class="flex gap-2 mb-4 overflow-x-auto pb-2">
          <div v-for="(img, i) in images" :key="i" class="relative flex-shrink-0">
            <img :src="img" class="w-24 h-24 rounded-xl object-cover" />
            <button 
              @click="images.splice(i, 1)"
              class="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
            >
              ×
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-border">
          <div class="flex items-center text-brand">
            <label class="p-2 hover:bg-brand/10 rounded-full cursor-pointer transition-colors">
              <ImageIcon :size="20" />
              <input type="file" class="hidden" accept="image/*" @change="handleImageUpload" />
            </label>
            <button type="button" @click="handleInsertEmoji" class="p-2 hover:bg-brand/10 rounded-full transition-colors"><Smile :size="20" /></button>
            <button type="button" @click="handlePendingAction('位置功能将在后端接入后开放')" class="p-2 hover:bg-brand/10 rounded-full transition-colors"><MapPin :size="20" /></button>
            <button type="button" @click="handlePendingAction('定时发布功能开发中')" class="p-2 hover:bg-brand/10 rounded-full transition-colors"><Calendar :size="20" /></button>
          </div>
          <button 
            @click="handleCreatePost"
            :disabled="!newPostContent.trim()"
            class="bg-brand hover:bg-brand-hover text-bg-primary px-6 py-2 rounded-full font-bold disabled:opacity-50 transition-all active:scale-95"
          >
            发布
          </button>
        </div>
      </div>
    </div>

    <!-- Feed -->
    <div class="min-h-screen">
      <div v-if="loading" class="flex justify-center p-10">
        <div class="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
      <template v-else-if="posts.length > 0">
        <PostCard 
          v-for="post in posts" 
          :key="post.id" 
          :post="post" 
          @update="loadPosts" 
        />
      </template>
      <div v-else class="p-10 text-center text-text-secondary">
        <p class="text-xl font-bold text-text-primary mb-2">欢迎来到 HNUST Easy WeiBo</p>
        <p>目前还没有帖子，快来发布第一条吧！</p>
      </div>
    </div>
  </div>
</template>
