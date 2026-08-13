<script setup>
import { ref } from 'vue';
import PixelMagnifier from './PixelMagnifier.vue';

// Public assets — referenced as runtime strings so Vite leaves them in /public.
const beforeSrc = '/assets/before.png';
const afterSrc = '/assets/after.png';

const pos = ref(50); // percentage revealed of the "after" image
const dragging = ref(false);
const container = ref(null);
const available = ref(true); // hide the showcase if the images aren't present
const inspectMode = ref(false); // toggle between slider and 4x loupe

function setFromClientX(clientX) {
  const el = container.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
  pos.value = (x / rect.width) * 100;
}

function onPointerDown(e) {
  if (inspectMode.value) return;
  dragging.value = true;
  setFromClientX(e.clientX);
}
function onPointerMove(e) {
  if (inspectMode.value || !dragging.value) return;
  setFromClientX(e.clientX);
}
function onPointerUp() {
  dragging.value = false;
}
</script>

<template>
  <figure v-show="available" class="max-w-xl mx-auto my-2 sm:my-4 select-none">
    <div class="p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl neu-card shadow-neu-raised">
      <!-- Top Action Bar for Mode Switch -->
      <div class="flex items-center justify-between px-2 py-1.5 mb-1.5">
        <span class="text-[11px] font-bold text-slate-400 flex items-center gap-1">
          <iconify-icon icon="ph:sparkle-bold" class="text-neon-cyan"></iconify-icon>
          Lossless Proof
        </span>
        <button
          @click="inspectMode = !inspectMode"
          :class="[
            'flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all',
            inspectMode
              ? 'bg-neon-cyan text-slate-900 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
              : 'neu-pill text-slate-300 hover:text-neon-cyan',
          ]"
        >
          <iconify-icon :icon="inspectMode ? 'ph:arrows-left-right-bold' : 'ph:magnifying-glass-plus-bold'" width="13"></iconify-icon>
          {{ inspectMode ? 'Switch to Slider' : '🔍 400% Zoom Loupe' }}
        </button>
      </div>

      <!-- Inspect Loupe Mode -->
      <div v-if="inspectMode" class="relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden shadow-neu-inset border border-neon-cyan/20 flex items-center justify-center">
        <PixelMagnifier :image-src="afterSrc" :zoom="4" :lens-size="140" class="w-full h-full flex items-center justify-center">
          <img
            :src="afterSrc"
            alt="Gemini AI clean image inspection"
            class="w-full h-full object-cover"
            draggable="false"
          />
        </PixelMagnifier>
        <span class="absolute top-2.5 left-2.5 text-[10px] sm:text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-slate-900/90 text-neon-cyan border border-neon-cyan/30">
          Clean (Hover to Zoom)
        </span>
        <span class="absolute bottom-2.5 right-2.5 text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-black/80 text-slate-300 pointer-events-none">
          Double-click for 8×
        </span>
      </div>

      <!-- Before/After Slider Mode -->
      <div
        v-else
        ref="container"
        class="group relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden shadow-neu-inset border border-white/5 cursor-ew-resize touch-none"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointerleave="onPointerUp"
      >
        <!-- After (clean) image is the base layer -->
        <img
          :src="afterSrc"
          alt="Gemini AI image after the sparkle watermark was removed"
          class="absolute inset-0 w-full h-full object-cover"
          draggable="false"
          loading="lazy"
          @error="available = false"
        />
        <!-- Before (watermarked) image clipped to the left of the handle -->
        <img
          :src="beforeSrc"
          alt="Gemini AI image with the visible sparkle watermark"
          class="absolute inset-0 w-full h-full object-cover"
          draggable="false"
          loading="lazy"
          :style="{ clipPath: `inset(0 ${100 - pos}% 0 0)` }"
          @error="available = false"
        />

        <!-- Labels -->
        <span
          class="absolute top-2.5 left-2.5 text-[10px] sm:text-[11px] font-extrabold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-neu-surface/90 text-white shadow-neu-raised-sm border border-white/5"
          >Before</span
        >
        <span
          class="absolute top-2.5 right-2.5 text-[10px] sm:text-[11px] font-extrabold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-neon-cyan/85 text-white shadow-sm"
          >After</span
        >

        <!-- Divider + handle (neumorphic) -->
        <div
          class="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)] pointer-events-none"
          :style="{ left: `${pos}%` }"
        >
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 shadow-neu-raised flex items-center justify-center text-neon-pink border border-white/80"
          >
            <iconify-icon icon="ph:arrows-left-right-bold" width="16" class="sm:w-5 sm:h-5"></iconify-icon>
          </div>
        </div>
      </div>
    </div>
    <figcaption class="mt-2.5 text-[11px] sm:text-xs text-slate-400 font-medium text-center font-mono">
      {{ inspectMode ? 'Hover over bottom-right corner to inspect 400% zoom pixel fidelity.' : 'Drag slider — clean unblending with 100% pixel fidelity.' }}
    </figcaption>
  </figure>
</template>
