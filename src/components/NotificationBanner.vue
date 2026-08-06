<script setup>
import { ref } from 'vue';
const visible = ref(true);
</script>

<template>
  <div
    v-if="visible"
    class="relative z-40 bg-neon-pink/5 backdrop-blur-md border-b border-neon-pink/15 text-slate-200 transition-all duration-300"
    role="status"
  >
    <div class="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2.5">
      <div class="flex items-center gap-2 text-xs sm:text-sm font-medium leading-normal">
        <iconify-icon icon="ph:sparkle-fill" width="16" class="flex-shrink-0 text-neon-pink" aria-hidden="true"></iconify-icon>
        <p class="m-0 line-clamp-2 sm:line-clamp-none">
          <strong class="font-bold text-neon-pink">New:</strong> Supports new &amp; classic Gemini watermark presets — selectable in dropdown.
        </p>
      </div>
      <button
        @click="visible = false"
        class="flex-shrink-0 p-1.5 rounded-lg hover:bg-neon-pink/15 text-slate-300 transition-colors active:scale-95"
        aria-label="Dismiss notification"
      >
        <iconify-icon icon="ph:x-bold" width="14"></iconify-icon>
      </button>
    </div>
  </div>
</template>
