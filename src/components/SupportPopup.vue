<script setup>
import { ref, onMounted } from 'vue';
import { brandConfig } from '../config/brandConfig.js';
import { useI18n } from '../config/i18n.js';

const { t } = useI18n();

const visible = ref(false);
const leaving = ref(false);

onMounted(() => {
  setTimeout(() => { visible.value = true; }, 7000);
  
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
    class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 rounded-2xl sm:rounded-3xl shadow-neu-raised-lg overflow-hidden neu-card"
    :class="{ 'opacity-0 translate-y-4 pointer-events-none': leaving }"
    :style="{ transition: 'opacity 0.4s, transform 0.4s' }"
  >
    <button
      @click="dismiss"
      aria-label="Dismiss support popup"
      class="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors focus:outline-none rounded-full p-2 hover:bg-white/5 min-w-[36px] min-h-[36px] flex items-center justify-center"
    >
      <iconify-icon icon="ph:x-bold" width="14" aria-hidden="true"></iconify-icon>
    </button>

    <div class="p-4 sm:p-5">
      <div class="flex items-center gap-3 mb-3">
        <div class="relative w-11 h-11 flex items-center justify-center rounded-xl bg-neu-raised p-1 shrink-0 shadow-neu-raised-sm border border-white/5">
          <img src="/assets/logo.svg" alt="GemClean AI Logo" class="w-6 h-6 drop-shadow-md" />
        </div>
        <div>
          <p class="text-white font-extrabold text-sm leading-tight m-0">{{ t('keepFree') }}</p>
          <p class="text-neon-pink text-[11px] font-semibold m-0">{{ t('supportDev') }}</p>
        </div>
      </div>

      <p class="text-slate-300 text-xs mb-4 leading-relaxed font-medium">
        {{ t('supportMsg') }}
      </p>

      <a
        href="upi://pay?pa=sekhmemon@ptyes&pn=GemClean%20AI&cu=INR"
        class="btn-neon flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-xs sm:text-sm text-white no-underline transition-all active:scale-95"
      >
        <iconify-icon icon="pepicons-pop:smartphone-cutout" width="18" aria-hidden="true"></iconify-icon>
        {{ t('donateUpi') }}
      </a>

      <button
        @click="dismiss"
        class="mt-3 w-full text-center text-slate-400 hover:text-neon-cyan text-[11px] font-semibold transition-colors py-1.5 min-h-[36px]"
        aria-label="Dismiss popup"
      >
        {{ t('maybeLater') }}
      </button>
    </div>
  </div>
</template>
