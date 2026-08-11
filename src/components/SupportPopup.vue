<script setup>
import { ref } from 'vue';
import { brandConfig } from '../config/brandConfig.js';
import { useI18n } from '../config/i18n.js';

const { t } = useI18n();

const visible = ref(false);

function toggle() {
  visible.value = !visible.value;
}

function dismiss() {
  visible.value = false;
}

// Expose toggle so parent can call it
defineExpose({ toggle, dismiss });
</script>

<template>
  <!-- Teleport to body to avoid parent transform breaking fixed positioning -->
  <Teleport to="body">
    <!-- Floating Donate Toggle Button -->
    <button
      @click="toggle"
      class="fixed bottom-3.5 right-3.5 z-[60] group flex items-center gap-2 rounded-full shadow-lg transition-all duration-300 overflow-hidden"
      :class="visible
        ? 'bg-slate-700/90 hover:bg-slate-600/90 px-3.5 py-2.5'
        : 'bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan hover:scale-105 hover:shadow-neon-pink/30 hover:shadow-xl px-4 py-3 animate-pulse-slow'"
      aria-label="Toggle donation popup"
      :title="visible ? 'Close' : 'Support this project ❤️'"
    >
      <iconify-icon
        :icon="visible ? 'ph:x-bold' : 'ph:heart-bold'"
        width="18"
        :class="visible ? 'text-slate-300' : 'text-white'"
        aria-hidden="true"
      ></iconify-icon>
      <span v-if="!visible" class="text-white text-xs font-bold hidden sm:inline">Donate</span>
    </button>

    <!-- Floating Donation Popup -->
    <div
      v-if="visible"
      role="dialog"
      aria-modal="true"
      aria-label="Support GemClean AI"
      class="fixed bottom-16 right-3.5 sm:right-6 z-[55] w-[calc(100vw-2rem)] sm:w-80 max-w-sm rounded-2xl shadow-2xl overflow-hidden neu-card border border-white/10 animate-slide-up"
    >
      <div class="p-4 sm:p-5">
        <!-- Header -->
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

        <!-- UPI Pay Button -->
        <a
          href="upi://pay?pa=sekhmemon@ptyes&pn=GemClean%20AI&cu=INR"
          class="btn-neon flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-xs sm:text-sm text-white no-underline transition-all active:scale-95"
        >
          <iconify-icon icon="pepicons-pop:smartphone-cutout" width="18" aria-hidden="true"></iconify-icon>
          {{ t('donateUpi') }}
        </a>

        <!-- Donate Page Link -->
        <a
          href="/donate/"
          class="mt-2 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-bold text-xs text-neon-cyan no-underline border border-neon-cyan/20 hover:bg-neon-cyan/10 transition-all"
        >
          <iconify-icon icon="ph:qr-code-bold" width="15" aria-hidden="true"></iconify-icon>
          More options · QR Code
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
  </Teleport>
</template>

<style scoped>
@keyframes pulse-slow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(236, 72, 153, 0); }
}
.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}
@keyframes slide-up {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-slide-up {
  animation: slide-up 0.3s ease-out both;
}
</style>
