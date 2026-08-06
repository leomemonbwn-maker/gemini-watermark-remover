<script setup>
import { ref } from 'vue';

// Public assets — referenced as runtime strings so Vite leaves them in /public.
const beforeSrc = '/assets/before.png';
const afterSrc = '/assets/after.png';

const pos = ref(50); // percentage revealed of the "after" image
const dragging = ref(false);
const container = ref(null);
const available = ref(true); // hide the showcase if the images aren't present

function setFromClientX(clientX) {
  const el = container.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
  pos.value = (x / rect.width) * 100;
}

function onPointerDown(e) {
  dragging.value = true;
  setFromClientX(e.clientX);
}
function onPointerMove(e) {
  if (!dragging.value) return;
  setFromClientX(e.clientX);
}
function onPointerUp() {
  dragging.value = false;
}
</script>

<template>
  <figure v-show="available" class="max-w-xl mx-auto my-2 sm:my-4 select-none">
    <div class="p-1 sm:p-2 rounded-2xl sm:rounded-3xl cyber-glass shadow-xl">
      <div
        ref="container"
        class="group relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden shadow-inner border border-white/10 cursor-ew-resize touch-none"
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
          class="absolute top-2.5 left-2.5 text-[10px] sm:text-[11px] font-extrabold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-slate-900/80 text-white backdrop-blur-md border border-white/20 shadow-md"
          >Before</span
        >
        <span
          class="absolute top-2.5 right-2.5 text-[10px] sm:text-[11px] font-extrabold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-neon-cyan/85 text-white backdrop-blur-md border border-white/20 shadow-md shadow-neon-cyan/20"
          >After</span
        >

        <!-- Divider + handle -->
        <div
          class="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] pointer-events-none"
          :style="{ left: `${pos}%` }"
        >
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-md shadow-2xl flex items-center justify-center text-neon-pink border border-white/80"
          >
            <iconify-icon icon="ph:arrows-left-right-bold" width="16" class="sm:w-5 sm:h-5"></iconify-icon>
          </div>
        </div>
      </div>
    </div>
    <figcaption class="mt-2.5 text-[11px] sm:text-xs text-slate-400 font-medium text-center font-mono">
      Drag slider — clean unblending with 100% pixel fidelity.
    </figcaption>
  </figure>
</template>
