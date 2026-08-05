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
  <figure v-show="available" class="max-w-xl mx-auto my-8 select-none">
    <div class="glass-panel p-2.5 rounded-3xl border border-white/60 dark:border-white/10 shadow-2xl">
      <div
        ref="container"
        class="group relative w-full aspect-square rounded-2xl overflow-hidden shadow-inner border border-white/40 dark:border-white/10 cursor-ew-resize touch-none"
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
          class="absolute top-3 left-3 text-[11px] font-extrabold px-3 py-1 rounded-full bg-slate-900/70 text-white backdrop-blur-md border border-white/20 shadow-md"
          >Before</span
        >
        <span
          class="absolute top-3 right-3 text-[11px] font-extrabold px-3 py-1 rounded-full bg-indigo-600/80 text-white backdrop-blur-md border border-white/20 shadow-md"
          >After</span
        >

        <!-- Divider + handle -->
        <div
          class="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] pointer-events-none"
          :style="{ left: `${pos}%` }"
        >
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-xl flex items-center justify-center text-indigo-600 border border-white/80"
          >
            <iconify-icon icon="ph:arrows-left-right-bold" width="18"></iconify-icon>
          </div>
        </div>
      </div>
    </div>
    <figcaption class="mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
      Drag the slider — watermark removed losslessly, pixel-perfect.
    </figcaption>
  </figure>
</template>
