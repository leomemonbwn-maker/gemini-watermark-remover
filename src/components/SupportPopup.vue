<script setup>
import { ref, onMounted } from 'vue';
import { brandConfig } from '../config/brandConfig.js';

const STORAGE_KEY = 'supportPopupDismissed';
const visible = ref(false);
const leaving = ref(false);

onMounted(() => {
  // Show initially after 7 seconds
  setTimeout(() => { visible.value = true; }, 7000);
  
  // Show every 1 minute (60,000 ms)
  setInterval(() => {
    if (!visible.value) {
      leaving.value = false;
      visible.value = true;
    }
  }, 60000);
});

function dismiss() {
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
    class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden liquid-glass border border-teal-500/30 support-popup"
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
      <div class="flex items-center gap-3 mb-3">
        <div class="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500/30 to-blue-500/30 p-1 shrink-0 border border-white/20">
          <img src="/assets/logo.svg" alt="GemClean AI Logo" class="w-6 h-6 drop-shadow-md" />
        </div>
        <div>
          <p class="text-slate-900 dark:text-white font-extrabold text-sm leading-tight m-0">Keep GemClean AI Free!</p>
          <p class="text-teal-500 dark:text-teal-400 text-[11px] font-semibold m-0">Support the Developer</p>
        </div>
      </div>

      <p class="text-slate-600 dark:text-slate-300 text-xs mb-4 leading-relaxed font-medium">
        Running this tool ad-free and open-source takes time and effort. If GemClean AI saved your day, consider buying me a coffee to help maintain the project! 
      </p>

      <a
        href="upi://pay?pa=sekhmemon@ptyes&pn=GemClean%20AI&cu=INR"
        class="btn-micro-pop flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md shadow-teal-500/25 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 no-underline transition-all active:scale-95"
      >
        <iconify-icon icon="pepicons-pop:smartphone-cutout" width="18" aria-hidden="true"></iconify-icon>
        Donate via UPI
      </a>

      <button
        @click="dismiss"
        class="mt-3 w-full text-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[11px] font-semibold transition-colors"
        aria-label="Dismiss popup"
      >
        Maybe Later
      </button>
    </div>
  </div>
</template>
