<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useToast } from '../composables/useToast';
import { postService } from '../api/services';
import { X, Image as ImageIcon, Smile, MapPin, Calendar } from 'lucide-vue-next';

const router = useRouter();
const { user, isAuthenticated } = useAuth();
const { showToast } = useToast();

const content = ref('');
const images = ref<string[]>([]);

if (!isAuthenticated.value) {
  router.push('/login');
}

const handlePublish = async () => {
  if (!content.value.trim() || !user.value) return;
  await postService.createPost(user.value, content.value, images.value.length > 0 ? images.value : undefined);
  router.push('/');
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
  content.value = `${content.value}${content.value ? ' ' : ''}😀`;
};

const handlePendingAction = (message: string) => {
  showToast(message, 'error');
};
</script>

<template>
  <div class="min-h-screen bg-bg-primary">
    <div class="flex items-center justify-between p-4 sticky top-0 bg-bg-primary/80 backdrop-blur-md z-10">
      <button @click="router.back()" class="p-2 hover:bg-bg-secondary rounded-full">
        <X :size="24" />
      </button>
      <button 
        @click="handlePublish"
        :disabled="!content.trim()"
        class="bg-brand hover:bg-brand-hover text-bg-primary px-6 py-1.5 rounded-full font-bold disabled:opacity-50 transition-all"
      >
        发布
      </button>
    </div>

    <div class="p-4 flex gap-4">
      <img :src="user?.avatar" :alt="user?.nickname" class="w-12 h-12 rounded-full object-cover" />
      <div class="flex-1">
        <textarea 
          v-model="content"
          placeholder="有什么新鲜事？" 
          class="w-full bg-transparent text-xl outline-none resize-none min-h-[200px]"
        ></textarea>

        <div v-if="images.length > 0" class="flex gap-2 mb-4 overflow-x-auto pb-2">
          <div v-for="(img, i) in images" :key="i" class="relative flex-shrink-0">
            <img :src="img" class="w-32 h-32 rounded-xl object-cover" />
            <button 
              @click="images.splice(i, 1)"
              class="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="fixed bottom-0 left-0 right-0 p-4 border-t border-border bg-bg-primary flex items-center text-brand">
      <label class="p-2 hover:bg-brand/10 rounded-full cursor-pointer transition-colors">
        <ImageIcon :size="24" />
        <input type="file" class="hidden" accept="image/*" @change="handleImageUpload" />
      </label>
      <button type="button" @click="handleInsertEmoji" class="p-2 hover:bg-brand/10 rounded-full transition-colors"><Smile :size="24" /></button>
      <button type="button" @click="handlePendingAction('位置功能将在后端接入后开放')" class="p-2 hover:bg-brand/10 rounded-full transition-colors"><MapPin :size="24" /></button>
      <button type="button" @click="handlePendingAction('定时发布功能开发中')" class="p-2 hover:bg-brand/10 rounded-full transition-colors"><Calendar :size="24" /></button>
    </div>
  </div>
</template>
