<script setup lang="ts">
import { useToast } from './composables/useToast';
import { CheckCircle2, AlertCircle, X } from 'lucide-vue-next';

const { toasts, dismissToast } = useToast();
</script>

<template>
  <router-view />
  
  <!-- Toast Container -->
  <div class="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-xs px-4 pointer-events-none">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'flex items-center justify-between gap-3 p-4 rounded-xl shadow-lg border transition-all duration-300 pointer-events-auto',
          toast.type === 'success' ? 'bg-white border-black text-black' : 'bg-black border-black text-white'
        ]"
      >
        <div class="flex items-center gap-2">
          <CheckCircle2 v-if="toast.type === 'success'" :size="18" />
          <AlertCircle v-else :size="18" />
          <span class="text-sm font-medium">{{ toast.message }}</span>
        </div>
        <button @click="dismissToast(toast.id)">
          <X :size="16" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
