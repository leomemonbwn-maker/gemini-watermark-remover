<script setup>
import { ref, onMounted } from 'vue';
import { brandConfig } from '../config/brandConfig.js';

const STORAGE_KEY = 'supportPopupDismissed';
const visible = ref(false);
const leaving = ref(false);

onMounted(() => {
  if (!sessionStorage.getItem(STORAGE_KEY)) {
    setTimeout(() => { visible.value = true; }, 7000);
  }
});

function dismiss() {
  sessionStorage.setItem(STORAGE_KEY, '1');
  leaving.value = true;
  setTimeout(() => { visible.value = false; }, 400);
}
</script>

<template>
  <div
    v-if="visible"
    role="dialog"
    aria-modal="true"
    aria-label="Support GemClean AI"
    class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-72 z-50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden liquid-glass border border-teal-500/30 support-popup"
    :class="{ 'hidden-popup': leaving }"
  >
    <button
      @click="dismiss"
      aria-label="Dismiss support popup"
      class="absolute top-3 right-3 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none rounded-full p-1 hover:bg-white/10"
    >
      <iconify-icon icon="ph:x-bold" width="14" aria-hidden="true"></iconify-icon>
    </button>

    <div class="p-4 sm:p-5">
      <div class="flex items-center gap-3 mb-2.5">
        <span class="text-2xl sm:text-3xl" aria-hidden="true">✨</span>
        <div>
          <p class="text-slate-900 dark:text-white font-extrabold text-xs sm:text-sm leading-tight m-0">Love {{ brandConfig.name }}?</p>
          <p class="text-teal-500 dark:text-teal-400 text-[11px] font-semibold m-0">100% Free &amp; Private</p>
        </div>
      </div>

      <p class="text-slate-600 dark:text-slate-300 text-xs mb-3.5 leading-relaxed">
        {{ brandConfig.name }} processes images and videos entirely in your browser with zero server upload. Star us on GitHub!
      </p>

      <a
        :href="brandConfig.githubRepo"
        target="_blank"
        rel="noopener noreferrer"
        class="btn-micro-pop flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md shadow-teal-500/25 bg-gradient-to-r from-teal-500 to-blue-500 no-underline"
      >
        <iconify-icon icon="mdi:github" width="18" aria-hidden="true"></iconify-icon>
        Star on GitHub
      </a>

      <button
        @click="dismiss"
        class="mt-2.5 w-full text-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[11px] font-semibold transition-colors"
        aria-label="Dismiss popup"
      >
        Dismiss
      </button>
    </div>
  </div>
</template>
