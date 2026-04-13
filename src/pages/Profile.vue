<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { userService, postService } from '../api/services';
import { User, Post } from '../types';
import PostCard from '../components/PostCard.vue';
import { ArrowLeft, Calendar, MapPin, Link as LinkIcon } from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';
import { useToast } from '../composables/useToast';

const route = useRoute();
const router = useRouter();
const username = route.params.username as string;
const profileUser = ref<User | null>(null);
const posts = ref<Post[]>([]);
const loading = ref(true);
const { user: currentUser, isAuthenticated } = useAuth();
const { showToast } = useToast();
const activeTab = ref<'帖子' | '回复' | '媒体' | '喜欢'>('帖子');

const loadProfile = async () => {
  loading.value = true;
  const u = await userService.getUserByUsername(username);
  if (u) {
    profileUser.value = u;
    posts.value = await postService.getPostsByAuthor(u.id);
  }
  loading.value = false;
};

onMounted(loadProfile);

const filteredPosts = computed(() => {
  switch (activeTab.value) {
    case '媒体':
      return posts.value.filter((post) => post.images && post.images.length > 0);
    case '喜欢':
      return posts.value.filter((post) => post.isLiked);
    case '回复':
      return [];
    default:
      return posts.value;
  }
});

const emptyStateText = computed(() => {
  switch (activeTab.value) {
    case '媒体':
      return '这个用户还没有发布带图片的内容。';
    case '喜欢':
      return '这个用户还没有点赞任何帖子。';
    case '回复':
      return '回复列表将在评论接口接入后展示。';
    default:
      return '这个用户还没有发布任何帖子。';
  }
});

const handleFollow = async () => {
  if (!isAuthenticated.value) {
    router.push('/login');
    return;
  }
  if (profileUser.value) {
    await userService.followUser(currentUser.value!.id, profileUser.value.id);
    loadProfile();
  }
};

const handleEditProfile = () => {
  showToast('编辑资料功能将在后端接入后开放', 'error');
};
</script>

<template>
  <div v-if="loading" class="flex justify-center p-10">
    <div class="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
  </div>
  <div v-else-if="!profileUser" class="p-10 text-center">
    <h1 class="text-2xl font-bold">用户不存在</h1>
    <button @click="router.push('/')" class="text-brand mt-4 hover:underline">回到首页</button>
  </div>
  <div v-else class="min-h-screen">
    <div class="sticky top-0 bg-bg-primary/80 backdrop-blur-md z-10 px-4 py-2 flex items-center gap-6">
      <button @click="router.back()" class="p-2 hover:bg-bg-secondary rounded-full">
        <ArrowLeft :size="20" />
      </button>
      <div>
        <h1 class="text-xl font-bold">{{ profileUser.nickname }}</h1>
        <p class="text-text-secondary text-sm">{{ posts.length }} 帖子</p>
      </div>
    </div>

    <div class="relative">
      <div class="relative h-48 sm:h-60 overflow-hidden border-b border-border bg-bg-secondary">
        <div
          class="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_top_left,rgba(0,0,0,0.06),transparent_42%),linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] [background-size:auto,24px_24px,24px_24px]"
        />
      </div>
      <div class="absolute left-4 -bottom-10 sm:-bottom-12 border-4 border-bg-primary rounded-full overflow-hidden w-24 h-24 sm:w-28 sm:h-28 bg-bg-secondary shadow-sm">
        <img :src="profileUser.avatar" :alt="profileUser.nickname" class="w-full h-full object-cover" />
      </div>
    </div>

    <div class="flex justify-end items-start px-4 pt-3 pb-1 min-h-[52px] sm:min-h-[62px]">
        <button v-if="currentUser?.id === profileUser.id" @click="handleEditProfile" class="border border-border rounded-full px-4 py-2 font-bold hover:bg-bg-secondary transition-colors">
          编辑个人资料
        </button>
        <button 
          v-else
          @click="handleFollow"
          :class="profileUser.isFollowing 
            ? 'border border-border rounded-full px-4 py-2 font-bold hover:bg-bg-secondary hover:text-text-primary hover:border-text-secondary transition-all group' 
            : 'bg-text-primary text-bg-primary rounded-full px-4 py-2 font-bold hover:opacity-90 transition-opacity'"
        >
          <span class="group-hover:hidden">{{ profileUser.isFollowing ? '正在关注' : '关注' }}</span>
          <span class="hidden group-hover:inline">取消关注</span>
        </button>
    </div>

    <div class="px-4 pb-2 space-y-1.5">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold leading-tight">{{ profileUser.nickname }}</h2>
        <p class="text-text-secondary">@{{ profileUser.username }}</p>
      </div>
      <p v-if="profileUser.bio" class="text-[15px]">{{ profileUser.bio }}</p>
      <div class="flex flex-wrap gap-x-4 gap-y-2 text-text-secondary text-sm">
        <div class="flex items-center gap-1"><MapPin :size="16" /> 湖南省 湘潭市</div>
        <div class="flex items-center gap-1"><LinkIcon :size="16" /> <span class="text-brand hover:underline cursor-pointer">hnust.edu.cn</span></div>
        <div class="flex items-center gap-1"><Calendar :size="16" /> 2026年4月加入</div>
      </div>
      <div class="flex gap-4 pt-2">
        <div class="hover:underline cursor-pointer"><span class="font-bold">{{ profileUser.followingCount }}</span> <span class="text-text-secondary">正在关注</span></div>
        <div class="hover:underline cursor-pointer"><span class="font-bold">{{ profileUser.followersCount }}</span> <span class="text-text-secondary">关注者</span></div>
      </div>
    </div>

    <div class="mt-4 border-b border-border flex">
      <button
        v-for="tab in ['帖子', '回复', '媒体', '喜欢']"
        :key="tab"
        type="button"
        @click="activeTab = tab as typeof activeTab.value"
        class="flex-1 py-4 font-bold text-text-secondary hover:bg-bg-secondary transition-colors"
        :class="{ 'text-text-primary border-b-2 border-brand': activeTab === tab }"
      >
        {{ tab }}
      </button>
    </div>

    <div class="divide-y divide-border">
      <PostCard v-for="post in filteredPosts" :key="post.id" :post="post" />
      <div v-if="!filteredPosts.length" class="p-8 text-center text-text-secondary">
        {{ emptyStateText }}
      </div>
    </div>
  </div>
</template>
