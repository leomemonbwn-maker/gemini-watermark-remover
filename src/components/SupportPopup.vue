<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { brandConfig } from '../config/brandConfig.js';
import { useI18n } from '../config/i18n.js';

const { t } = useI18n();

const visible = ref(false);
const btnRef = ref(null);

function toggle() {
  visible.value = !visible.value;
}

function dismiss() {
  visible.value = false;
}

function handleOpenDonate() {
  visible.value = true;
}

onMounted(() => {
  window.addEventListener('open-donate', handleOpenDonate);
});

onUnmounted(() => {
  window.removeEventListener('open-donate', handleOpenDonate);
});

defineExpose({ toggle, dismiss });
</script>

<template>
  <!-- Teleport to body to avoid parent transform breaking fixed positioning -->
  <Teleport to="body">
    <!-- Backdrop overlay for mobile & desktop to easily close popup on tap outside -->
    <div
      v-if="visible"
      class="donate-backdrop"
      @click="dismiss"
    ></div>

    <!-- Floating Donate Toggle Button -->
    <button
      ref="btnRef"
      @click.stop="toggle"
      @touchend.stop.prevent="toggle"
      class="donate-toggle-btn"
      :class="visible ? 'donate-toggle-active' : 'donate-toggle-default'"
      aria-label="Toggle donation popup"
      :title="visible ? 'Close' : 'Support this project ❤️'"
    >
      <iconify-icon
        :icon="visible ? 'ph:x-bold' : 'ph:heart-bold'"
        width="20"
        :class="visible ? 'text-slate-300' : 'text-white'"
        aria-hidden="true"
      ></iconify-icon>
      <span class="text-xs font-bold select-none">{{ visible ? 'Close' : 'Donate' }}</span>
    </button>

    <!-- Floating Donation Popup — anchored above the toggle button -->
    <div
      v-if="visible"
      role="dialog"
      aria-modal="true"
      aria-label="Support GemClean AI"
      class="donate-popup neu-card animate-slide-up"
    >
      <div class="p-4 sm:p-5">
        <!-- Header -->
        <div class="flex items-center gap-3 mb-3">
          <div class="relative w-11 h-11 flex items-center justify-center rounded-xl bg-neu-raised p-1 shrink-0 shadow-neu-raised-sm border border-white/5">
            <img src="/assets/mascot-logo.png" alt="GemClean AI Logo" class="w-6 h-6 drop-shadow-md" />
          </div>
          <div>
            <p class="text-white font-extrabold text-sm leading-tight m-0">{{ t('keepFree') }}</p>
            <p class="text-neon-pink text-[11px] font-semibold m-0">{{ t('supportDev') }}</p>
          </div>
        </div>

        <p class="text-slate-300 text-xs mb-4 leading-relaxed font-medium">
          {{ t('supportMsg') }}
        </p>

        <!-- Payee Info Box -->
        <div class="bg-white/5 border border-white/10 rounded-xl p-2.5 mb-3 text-xs flex justify-between items-center">
          <div>
            <span class="text-slate-400">Payee: </span>
            <span class="font-bold text-white">Leo Memon</span>
          </div>
          <div>
            <span class="text-slate-400">UPI: </span>
            <span class="font-mono font-bold text-neon-cyan">sekhmemon@ptyes</span>
          </div>
        </div>

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
/* ── Toggle Button ────────────────────────────────── */
.donate-toggle-btn {
  position: fixed;
  bottom: 14px;
  right: 14px;
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 9999px;
  box-shadow: 0 10px 25px -3px rgba(0,0,0,0.3);
  transition: all 0.3s ease;
  overflow: hidden;
  min-height: 48px;
  min-width: 48px;
  padding: 12px 16px;
  cursor: pointer;
  -ms-touch-action: manipulation;
  touch-action: manipulation;
}
.donate-toggle-btn:active {
  transform: scale(0.95);
}
.donate-toggle-default {
  background: linear-gradient(to right, #ec4899, #a855f7, #06b6d4);
  color: white;
}
.donate-toggle-default:hover {
  transform: scale(1.05);
}
.donate-toggle-active {
  background: #1e293b;
  color: #94a3b8;
  border: 1px solid rgba(255,255,255,0.1);
}
.donate-toggle-active:hover {
  background: #334155;
}

/* ── Backdrop ─────────────────────────────────────── */
.donate-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(2px);
  z-index: 54;
  animation: fade-in 0.2s ease-out both;
}

/* ── Popup Dialog ─────────────────────────────────── */
.donate-popup {
  position: fixed;
  /* Position above the toggle button on all devices */
  bottom: 72px;
  right: 14px;
  width: calc(100vw - 28px);
  max-width: 320px;
  z-index: 58;
  border-radius: 16px;
  box-shadow: 0 20px 50px -10px rgba(0,0,0,0.5);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.15);
}

/* On larger screens, anchor to right side */
@media (min-width: 640px) {
  .donate-popup {
    right: 24px;
    width: 320px;
  }
}

/* ── Animations ───────────────────────────────────── */
@keyframes pulse-slow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(236, 72, 153, 0); }
}
.donate-toggle-default {
  animation: pulse-slow 3s ease-in-out infinite;
}
@keyframes slide-up {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-slide-up {
  animation: slide-up 0.3s ease-out both;
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
