<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import { cleanFrame } from '../engine/tuner.js';
import { refineWatermarkArea } from '../engine/refiner.js';

const props = defineProps({
  settings: { type: Object, required: true }, // reactive { gain, offsetX, offsetY, sizeScale }
  frame: { type: Object, required: true },    // { width, height, imageData }
  bgImg: { type: Object, required: true },    // HTMLImageElement (sparkle)
  base: { type: Object, required: true },     // { size, x, y, width, height }
});

const mainCanvas = ref(null);
const zoomCanvas = ref(null);
let offscreen = null;
let isDragging = false;

function updatePositionFromPointer(e) {
  const canvas = mainCanvas.value;
  if (!canvas || !props.frame || !props.base) return;
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  const pointerX = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
  const pointerY = Math.min(Math.max(e.clientY - rect.top, 0), rect.height);
  
  // Exact 1:1 image pixel coordinate from screen touch/click
  const imgX = (pointerX / rect.width) * props.frame.width;
  const imgY = (pointerY / rect.height) * props.frame.height;
  
  // Center watermark box at pointer location
  const currentSize = Math.round(props.base.size * (props.settings.sizeScale || 1));
  props.settings.offsetX = Math.round(imgX - props.base.x - currentSize / 2);
  props.settings.offsetY = Math.round(imgY - props.base.y - currentSize / 2);
}

function onPointerDown(e) {
  isDragging = true;
  canvasRef.value?.setPointerCapture(e.pointerId);
  updatePositionFromPointer(e);
}

function onPointerMove(e) {
  if (!isDragging) return;
  updatePositionFromPointer(e);
}

function onPointerUp(e) {
  if (!isDragging) return;
  isDragging = false;
  try {
    canvasRef.value?.releasePointerCapture(e.pointerId);
  } catch {}
}

const canvasRef = mainCanvas;

function render() {
  const { width, height, imageData } = props.frame || {};
  if (!width || !height || !imageData || !mainCanvas.value) return;

  if (!offscreen) {
    offscreen = document.createElement('canvas');
  }
  offscreen.width = width;
  offscreen.height = height;

  const copy = new ImageData(new Uint8ClampedArray(imageData.data), width, height);
  const { wm, roi } = cleanFrame(props.bgImg, copy, width, height, props.base, { ...props.settings });

  if (props.settings.aiRefine && wm) {
    refineWatermarkArea(copy, wm, 0.6);
  }

  offscreen.getContext('2d').putImageData(copy, 0, 0);

  // Main canvas — fit, with glowing target guide.
  const main = mainCanvas.value;
  const maxW = 360;
  const scale = Math.min(1, maxW / width);
  main.width = Math.round(width * scale);
  main.height = Math.round(height * scale);
  const mctx = main.getContext('2d');
  mctx.drawImage(offscreen, 0, 0, main.width, main.height);
  
  // Target reticle box
  const bx = wm.x * scale;
  const by = wm.y * scale;
  const bw = wm.width * scale;
  const bh = wm.height * scale;

  mctx.strokeStyle = '#FF2D95';
  mctx.lineWidth = 2;
  mctx.strokeRect(bx, by, bw, bh);

  // Target reticle center crosshair
  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  mctx.strokeStyle = '#ffffff';
  mctx.lineWidth = 1.5;
  mctx.beginPath();
  mctx.moveTo(cx - 8, cy); mctx.lineTo(cx + 8, cy);
  mctx.moveTo(cx, cy - 8); mctx.lineTo(cx, cy + 8);
  mctx.stroke();

  // Zoom canvas — magnified corner.
  const zoom = zoomCanvas.value;
  if (zoom) {
    const zctx = zoom.getContext('2d');
    zctx.imageSmoothingEnabled = false;
    zctx.clearRect(0, 0, zoom.width, zoom.height);
    zctx.drawImage(offscreen, roi.x, roi.y, roi.width, roi.height, 0, 0, zoom.width, zoom.height);
    const sx = zoom.width / roi.width;
    const sy = zoom.height / roi.height;
    zctx.strokeStyle = '#FF2D95';
    zctx.lineWidth = 2;
    zctx.strokeRect((wm.x - roi.x) * sx, (wm.y - roi.y) * sy, wm.width * sx, wm.height * sy);
  }
}

watch(() => ({ ...props.settings }), () => render());
watch(() => props.frame, async () => { await nextTick(); render(); });
onMounted(async () => { await nextTick(); render(); });
defineExpose({ render });
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center sm:items-start justify-center">
      <div class="flex flex-col items-center w-full sm:w-auto">
        <span class="text-xs font-bold text-neon-cyan mb-1.5 flex items-center gap-1">
          <iconify-icon icon="ph:hand-swipe-left-bold"></iconify-icon>
          Touch & Drag to move target box
        </span>
        <canvas
          ref="mainCanvas"
          class="rounded-xl border border-neon-pink/40 max-w-full bg-white/5 cursor-crosshair touch-none shadow-lg shadow-neon-pink/10"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        ></canvas>
      </div>
      <div class="flex flex-col items-center">
        <span class="text-xs font-bold text-slate-400 mb-1.5">Zoomed Preview</span>
        <canvas ref="zoomCanvas" width="180" height="180" class="rounded-xl border border-white/10 bg-white/5" style="image-rendering: pixelated"></canvas>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-4">
      <label class="block">
        <div class="flex justify-between text-xs font-bold text-slate-300 mb-1">
          <span>Strength</span><span>{{ settings.gain.toFixed(2) }}×</span>
        </div>
        <input type="range" min="0.1" max="3" step="0.05" v-model.number="settings.gain" class="w-full cursor-pointer" />
      </label>
      <label class="block">
        <div class="flex justify-between text-xs font-bold text-slate-300 mb-1">
          <span>Size</span><span>{{ settings.sizeScale.toFixed(2) }}×</span>
        </div>
        <input type="range" min="0.5" max="2" step="0.05" v-model.number="settings.sizeScale" class="w-full cursor-pointer" />
      </label>
      <label class="block">
        <div class="flex justify-between text-xs font-bold text-slate-300 mb-1">
          <span>Position X</span><span>{{ settings.offsetX }}px</span>
        </div>
        <input type="range" min="-300" max="300" step="1" v-model.number="settings.offsetX" class="w-full cursor-pointer" />
      </label>
      <label class="block">
        <div class="flex justify-between text-xs font-bold text-slate-300 mb-1">
          <span>Position Y</span><span>{{ settings.offsetY }}px</span>
        </div>
        <input type="range" min="-300" max="300" step="1" v-model.number="settings.offsetY" class="w-full cursor-pointer" />
      </label>
    </div>

    <div class="mt-4 p-3 rounded-xl bg-neon-cyan/5 border border-neon-cyan/10 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <iconify-icon icon="ph:magic-wand-fill" class="text-neon-cyan text-lg"></iconify-icon>
        <div class="flex flex-col">
          <span class="text-xs font-bold text-slate-100">AI Refine (Preview)</span>
          <span class="text-[10px] text-slate-500">Enable to see the ghost-free result in real-time</span>
        </div>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" v-model="settings.aiRefine" class="sr-only peer" />
        <div class="w-11 h-6 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-cyan"></div>
      </label>
    </div>
  </div>
</template>
