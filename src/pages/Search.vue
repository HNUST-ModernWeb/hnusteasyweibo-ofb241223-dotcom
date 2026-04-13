<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { postService } from '../api/services';
import { Post } from '../types';
import PostCard from '../components/PostCard.vue';
import { Search as SearchIcon, X } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const posts = ref<Post[]>([]);
const loading = ref(false);
const inputValue = ref((route.query.q as string) || '');

const handleSearch = async (query: string) => {
  if (!query) {
    posts.value = [];
    return;
  }
  loading.value = true;
  posts.value = await postService.searchPosts(query);
  loading.value = false;
};

watch(() => route.query.q, (newQuery) => {
  inputValue.value = (newQuery as string) || '';
  handleSearch(inputValue.value);
}, { immediate: true });

const onSearchSubmit = () => {
  const query = inputValue.value.trim();
  if (!query) {
    router.replace({ path: '/search' });
    return;
  }
  router.push(`/search?q=${encodeURIComponent(query)}`);
};

const clearSearch = () => {
  inputValue.value = '';
  router.replace({ path: '/search' });
};
</script>

<template>
  <div class="min-h-screen">
    <div class="sticky top-0 bg-bg-primary/80 backdrop-blur-md z-10 p-4 border-b border-border">
      <form @submit.prevent="onSearchSubmit" class="relative group">
        <SearchIcon class="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-brand transition-colors" :size="18" />
        <input 
          v-model="inputValue"
          type="text" 
          placeholder="搜索帖子或用户" 
          class="w-full bg-bg-secondary rounded-full py-2 pl-12 pr-10 outline-none border border-transparent focus:border-brand focus:bg-bg-primary transition-all"
        />
        <button 
          v-if="inputValue"
          type="button"
          @click="clearSearch"
          class="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
        >
          <X :size="18" />
        </button>
      </form>
    </div>

    <div class="divide-y divide-border">
      <div v-if="!route.query.q" class="p-10 text-center text-text-secondary">
        <p class="text-xl font-bold text-text-primary mb-2">发现新内容</p>
        <p>输入关键词或话题标签开始搜索</p>
      </div>
      <div v-else-if="loading" class="flex justify-center p-10">
        <div class="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
      <template v-else-if="posts.length > 0">
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
      </template>
      <div v-else class="p-10 text-center text-text-secondary">
        <p class="text-xl font-bold text-text-primary mb-2">未找到相关结果</p>
        <p>尝试搜索其他关键词或话题</p>
      </div>
    </div>
  </div>
</template>
