<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { detectTextWatermarks, regionsToMask } from '../engine/textDetector.js';
import { inpaintRegion } from '../engine/inpaintEngine.js';

const props = defineProps({
  imageData: { type: Object, required: true },  // { width, height, data }
  imageSrc: { type: String, required: true },    // object URL for display
});

const emit = defineEmits(['result', 'cancel']);

const canvasRef = ref(null);
const overlayRef = ref(null);
const containerRef = ref(null);
const viewportRef = ref(null);

// Tool state
const tool = ref('brush');           // 'brush' | 'eraser' | 'pan'
const brushSize = ref(25);
const method = ref('telea');         // 'telea' | 'patchmatch'
const isProcessing = ref(false);
const autoDetecting = ref(false);
const detectedRegions = ref([]);

// Zoom & Pan state
const zoom = ref(1);                 // 1 to 5 (100% to 500%)
const panX = ref(0);
const panY = ref(0);
const isPanning = ref(false);
const spacePressed = ref(false);
let startPanX = 0, startPanY = 0;

// Mask state
const maskCanvas = document.createElement('canvas');
let maskCtx = null;
let isDrawing = false;
let lastX = -1, lastY = -1;

// Undo & Redo stacks
const undoStack = ref([]);
const redoStack = ref([]);
const maxUndo = 25;

// Display scaling
const displayScale = ref(1);

const hasMask = computed(() => {
  if (!maskCtx) return false;
  const data = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) return true;
  }
  return false;
});

function initCanvas() {
  const { width, height } = props.imageData;
  maskCanvas.width = width;
  maskCanvas.height = height;
  maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
  maskCtx.clearRect(0, 0, width, height);
  undoStack.value = [];
  redoStack.value = [];
  renderOverlay();
}

function renderOverlay() {
  const overlay = overlayRef.value;
  if (!overlay) return;

  const ctx = overlay.getContext('2d');
  ctx.clearRect(0, 0, overlay.width, overlay.height);

  // Draw mask as semi-transparent red overlay
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = maskCanvas.width;
  tmpCanvas.height = maskCanvas.height;
  const tmpCtx = tmpCanvas.getContext('2d');
  tmpCtx.drawImage(maskCanvas, 0, 0);

  // Tint the mask neon pink
  const maskData = tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height);
  for (let i = 0; i < maskData.data.length; i += 4) {
    if (maskData.data[i + 3] > 0) {
      maskData.data[i] = 255;     // R
      maskData.data[i + 1] = 45;  // G
      maskData.data[i + 2] = 149; // B (neon pink)
      maskData.data[i + 3] = 135; // Semi-transparent
    }
  }
  tmpCtx.putImageData(maskData, 0, 0);

  ctx.drawImage(tmpCtx.canvas, 0, 0, overlay.width, overlay.height);

  // Draw detected region boxes
  const scale = overlay.width / maskCanvas.width;
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  for (const r of detectedRegions.value) {
    ctx.strokeRect(r.x * scale, r.y * scale, r.width * scale, r.height * scale);
  }
  ctx.setLineDash([]);
}

function getImageCoords(e) {
  const overlay = overlayRef.value;
  if (!overlay) return null;
  const rect = overlay.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  
  const scaleX = maskCanvas.width / rect.width;
  const scaleY = maskCanvas.height / rect.height;

  let clientX, clientY;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  return {
    x: Math.max(0, Math.min(maskCanvas.width, (clientX - rect.left) * scaleX)),
    y: Math.max(0, Math.min(maskCanvas.height, (clientY - rect.top) * scaleY)),
  };
}

function saveMaskState() {
  const state = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
  undoStack.value.push(new Uint8ClampedArray(state.data));
  if (undoStack.value.length > maxUndo) undoStack.value.shift();
  // Clear redo stack on new action
  redoStack.value = [];
}

function undo() {
  if (undoStack.value.length === 0) return;
  // Save current to redo stack
  const current = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
  redoStack.value.push(new Uint8ClampedArray(current.data));

  const prevState = undoStack.value.pop();
  const imgData = new ImageData(prevState, maskCanvas.width, maskCanvas.height);
  maskCtx.putImageData(imgData, 0, 0);
  renderOverlay();
}

function redo() {
  if (redoStack.value.length === 0) return;
  // Save current to undo stack
  const current = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
  undoStack.value.push(new Uint8ClampedArray(current.data));

  const nextState = redoStack.value.pop();
  const imgData = new ImageData(nextState, maskCanvas.width, maskCanvas.height);
  maskCtx.putImageData(imgData, 0, 0);
  renderOverlay();
}

function drawStroke(x, y) {
  if (!maskCtx) return;
  const size = brushSize.value;
  maskCtx.globalCompositeOperation = tool.value === 'eraser' ? 'destination-out' : 'source-over';
  maskCtx.fillStyle = 'white';
  maskCtx.beginPath();
  maskCtx.arc(x, y, size / 2, 0, Math.PI * 2);
  maskCtx.fill();

  // Interpolate for smooth strokes
  if (lastX >= 0 && lastY >= 0) {
    const dx = x - lastX;
    const dy = y - lastY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = Math.max(1, size / 4);
    if (dist > step) {
      const steps = Math.ceil(dist / step);
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const ix = lastX + dx * t;
        const iy = lastY + dy * t;
        maskCtx.beginPath();
        maskCtx.arc(ix, iy, size / 2, 0, Math.PI * 2);
        maskCtx.fill();
      }
    }
  }

  lastX = x;
  lastY = y;
  renderOverlay();
}

// ── Pointer & Drag Handlers ──────────────────────────────────────────────────

function onPointerDown(e) {
  if (e.button === 1 || tool.value === 'pan' || spacePressed.value) {
    // Pan mode start
    isPanning.value = true;
    startPanX = e.clientX - panX.value;
    startPanY = e.clientY - panY.value;
    e.preventDefault();
    return;
  }

  if (e.button !== 0 && !e.touches) return; // Left click or touch only
  e.preventDefault();
  saveMaskState();
  isDrawing = true;
  const coords = getImageCoords(e);
  if (coords) {
    lastX = coords.x;
    lastY = coords.y;
    drawStroke(coords.x, coords.y);
  }
}

function onPointerMove(e) {
  if (isPanning.value) {
    panX.value = e.clientX - startPanX;
    panY.value = e.clientY - startPanY;
    e.preventDefault();
    return;
  }

  if (!isDrawing) return;
  e.preventDefault();
  const coords = getImageCoords(e);
  if (coords) drawStroke(coords.x, coords.y);
}

function onPointerUp(e) {
  if (isPanning.value) {
    isPanning.value = false;
    return;
  }
  if (!isDrawing) return;
  isDrawing = false;
  lastX = -1;
  lastY = -1;
}

// ── Zoom Controls ────────────────────────────────────────────────────────────

function setZoom(level) {
  zoom.value = Math.max(1, Math.min(5, Math.round(level * 10) / 10));
  if (zoom.value === 1) {
    panX.value = 0;
    panY.value = 0;
  }
}

function zoomIn() {
  setZoom(zoom.value + 0.5);
}

function zoomOut() {
  setZoom(zoom.value - 0.5);
}

function resetZoom() {
  zoom.value = 1;
  panX.value = 0;
  panY.value = 0;
}

function onWheel(e) {
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) {
    // Pinch / Ctrl + Wheel zoom
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    setZoom(zoom.value + delta);
  } else {
    // 2-finger scroll or wheel pan
    panX.value -= e.deltaX * 0.8;
    panY.value -= e.deltaY * 0.8;
  }
}

function clearMask() {
  saveMaskState();
  maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
  detectedRegions.value = [];
  renderOverlay();
}

// ── Auto-detect text watermarks ─────────────────────────────────────────────

async function autoDetect() {
  autoDetecting.value = true;
  try {
    await new Promise(r => setTimeout(r, 50)); // let UI update

    const { width, height } = props.imageData;
    const detectData = new ImageData(
      new Uint8ClampedArray(props.imageData.data),
      width, height,
    );

    const regions = detectTextWatermarks(detectData);
    detectedRegions.value = regions;

    if (regions.length > 0) {
      saveMaskState();
      const regionMask = regionsToMask(width, height, regions, 6);
      maskCtx.globalCompositeOperation = 'source-over';
      maskCtx.fillStyle = 'white';
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (regionMask[y * width + x] > 127) {
            maskCtx.fillRect(x, y, 1, 1);
          }
        }
      }
      renderOverlay();
    }
  } catch (err) {
    console.error('Auto-detection failed:', err);
  } finally {
    autoDetecting.value = false;
  }
}

// ── Process (inpaint) ───────────────────────────────────────────────────────

async function processInpaint() {
  isProcessing.value = true;
  try {
    await new Promise(r => setTimeout(r, 50)); // let UI update

    const { width, height } = props.imageData;

    // Build mask Uint8Array from mask canvas
    const maskImgData = maskCtx.getImageData(0, 0, width, height);
    const maskArr = new Uint8Array(width * height);
    for (let i = 0; i < maskArr.length; i++) {
      maskArr[i] = maskImgData.data[i * 4 + 3] > 50 ? 255 : 0;
    }

    // Copy image data
    const resultData = new ImageData(
      new Uint8ClampedArray(props.imageData.data),
      width, height,
    );

    // Inpaint
    inpaintRegion(resultData, maskArr, { method: method.value });

    // Create blob
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    c.getContext('2d').putImageData(resultData, 0, 0);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));

    emit('result', {
      blob,
      url: URL.createObjectURL(blob),
      width,
      height,
      method: method.value,
    });
  } catch (err) {
    console.error('Inpainting failed:', err);
    alert('Inpainting failed: ' + err.message);
  } finally {
    isProcessing.value = false;
  }
}

function getMaskArray() {
  const { width, height } = props.imageData;
  const maskImgData = maskCtx.getImageData(0, 0, width, height);
  const maskArr = new Uint8Array(width * height);
  for (let i = 0; i < maskArr.length; i++) {
    maskArr[i] = maskImgData.data[i * 4 + 3] > 50 ? 255 : 0;
  }
  return maskArr;
}

defineExpose({ getMaskArray, processInpaint });

// ── Keyboard Shortcuts ───────────────────────────────────────────────────────

function handleKeyDown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

  if (e.code === 'Space' && !spacePressed.value) {
    spacePressed.value = true;
    e.preventDefault();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) {
      redo();
    } else {
      undo();
    }
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
    e.preventDefault();
    redo();
  } else if (e.key === 'b' || e.key === 'B') {
    tool.value = 'brush';
  } else if (e.key === 'e' || e.key === 'E') {
    tool.value = 'eraser';
  } else if (e.key === 'h' || e.key === 'H') {
    tool.value = 'pan';
  } else if (e.key === '[') {
    brushSize.value = Math.max(3, brushSize.value - 5);
  } else if (e.key === ']') {
    brushSize.value = Math.min(100, brushSize.value + 5);
  } else if (e.key === '0') {
    resetZoom();
  }
}

function handleKeyUp(e) {
  if (e.code === 'Space') {
    spacePressed.value = false;
    isPanning.value = false;
  }
}

// ── Lifecycle ───────────────────────────────────────────────────────────────

function updateDisplaySize() {
  const container = containerRef.value;
  const overlay = overlayRef.value;
  const bgCanvas = canvasRef.value;
  if (!container || !overlay || !bgCanvas) return;

  const maxW = Math.min(container.clientWidth || 600, 600);
  const { width, height } = props.imageData;
  const scale = Math.min(1, maxW / width);
  displayScale.value = scale;

  const dw = Math.round(width * scale);
  const dh = Math.round(height * scale);

  bgCanvas.width = dw;
  bgCanvas.height = dh;
  overlay.width = dw;
  overlay.height = dh;

  const img = new Image();
  img.onload = () => {
    bgCanvas.getContext('2d').drawImage(img, 0, 0, dw, dh);
    renderOverlay();
  };
  img.src = props.imageSrc;
}

onMounted(async () => {
  await nextTick();
  initCanvas();
  updateDisplaySize();
  window.addEventListener('resize', updateDisplaySize);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateDisplaySize);
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
});

watch(() => props.imageData, () => {
  initCanvas();
  updateDisplaySize();
});
</script>

<template>
  <div ref="containerRef" class="brush-mask-editor select-none">
    <!-- Main Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-2 mb-3 bg-white/2 p-2 rounded-xl border border-white/5">
      <!-- Tool Buttons (Brush / Eraser / Hand) -->
      <div class="flex items-center gap-1">
        <div class="p-0.5 rounded-lg neu-inset inline-flex gap-0.5">
          <button
            @click="tool = 'brush'"
            :class="[
              'flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-xs transition-all',
              tool === 'brush'
                ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30'
                : 'text-slate-400 hover:text-white',
            ]"
            title="Brush Tool (Shortcut: B)"
          >
            <iconify-icon icon="ph:paint-brush-bold" width="13"></iconify-icon>
            Brush
          </button>
          <button
            @click="tool = 'eraser'"
            :class="[
              'flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-xs transition-all',
              tool === 'eraser'
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                : 'text-slate-400 hover:text-white',
            ]"
            title="Eraser Tool (Shortcut: E)"
          >
            <iconify-icon icon="ph:eraser-bold" width="13"></iconify-icon>
            Eraser
          </button>
          <button
            @click="tool = 'pan'"
            :class="[
              'flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-xs transition-all',
              tool === 'pan'
                ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                : 'text-slate-400 hover:text-white',
            ]"
            title="Hand / Pan Tool (Shortcut: H or Hold Space)"
          >
            <iconify-icon icon="ph:hand-grab-bold" width="13"></iconify-icon>
            Pan
          </button>
        </div>

        <!-- Brush Size Slider -->
        <div class="flex items-center gap-1 ml-1.5 px-2 py-1 rounded-lg neu-inset">
          <span class="text-[10px] font-bold text-slate-500 uppercase">Size</span>
          <input
            type="range" min="3" max="100" step="1"
            v-model.number="brushSize"
            class="w-16 sm:w-20 cursor-pointer"
          />
          <span class="text-xs font-mono font-bold text-slate-300 w-7 text-right">{{ brushSize }}px</span>
        </div>
      </div>

      <!-- Zoom & History Actions -->
      <div class="flex items-center gap-1.5">
        <!-- Zoom Controls -->
        <div class="flex items-center gap-0.5 p-0.5 rounded-lg neu-inset">
          <button
            @click="zoomOut"
            :disabled="zoom <= 1"
            class="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Zoom Out (-)"
          >
            <iconify-icon icon="ph:minus-bold" width="12"></iconify-icon>
          </button>
          <button
            @click="resetZoom"
            class="px-1.5 py-0.5 text-[10px] font-mono font-bold text-neon-cyan hover:underline"
            title="Reset Zoom to 100% (0)"
          >
            {{ Math.round(zoom * 100) }}%
          </button>
          <button
            @click="zoomIn"
            :disabled="zoom >= 5"
            class="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Zoom In (+)"
          >
            <iconify-icon icon="ph:plus-bold" width="12"></iconify-icon>
          </button>
        </div>

        <!-- Undo / Redo / Clear -->
        <div class="flex items-center gap-1">
          <button
            @click="undo"
            :disabled="undoStack.length === 0"
            class="p-1.5 rounded-lg neu-pill text-slate-400 hover:text-neon-cyan disabled:opacity-30 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <iconify-icon icon="ph:arrow-counter-clockwise-bold" width="14"></iconify-icon>
          </button>
          <button
            @click="redo"
            :disabled="redoStack.length === 0"
            class="p-1.5 rounded-lg neu-pill text-slate-400 hover:text-neon-cyan disabled:opacity-30 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <iconify-icon icon="ph:arrow-clockwise-bold" width="14"></iconify-icon>
          </button>
          <button
            @click="clearMask"
            class="p-1.5 rounded-lg neu-pill text-slate-400 hover:text-red-400 transition-colors"
            title="Clear Entire Mask"
          >
            <iconify-icon icon="ph:trash-bold" width="14"></iconify-icon>
          </button>
        </div>

        <!-- Auto Detect Button -->
        <button
          @click="autoDetect"
          :disabled="autoDetecting"
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg neu-pill text-[11px] font-bold text-neon-purple hover:text-neon-pink transition-colors disabled:opacity-50"
          title="Auto-detect text watermarks using OCR heuristic"
        >
          <iconify-icon :icon="autoDetecting ? 'ph:spinner-gap-bold' : 'ph:magic-wand-bold'" width="13"
            :class="autoDetecting ? 'animate-spin' : ''"></iconify-icon>
          <span class="hidden sm:inline">{{ autoDetecting ? 'Scanning...' : 'Auto Detect' }}</span>
        </button>
      </div>
    </div>

    <!-- Canvas Viewport with Zoom / Pan Support -->
    <div
      ref="viewportRef"
      class="relative w-full h-[320px] sm:h-[420px] rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-inner flex items-center justify-center cursor-default touch-none"
      @wheel="onWheel"
    >
      <div
        class="relative transition-transform duration-75 origin-center inline-block shadow-2xl"
        :style="{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          cursor: tool === 'pan' || spacePressed ? 'grab' : (tool === 'eraser' ? 'cell' : 'crosshair'),
        }"
      >
        <canvas ref="canvasRef" class="block rounded shadow-lg"></canvas>
        <canvas
          ref="overlayRef"
          class="absolute inset-0 w-full h-full touch-none"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @pointerleave="onPointerUp"
          @touchstart.prevent="onPointerDown"
          @touchmove.prevent="onPointerMove"
          @touchend.prevent="onPointerUp"
        ></canvas>
      </div>

      <!-- Zoom indicator pill in viewport -->
      <div v-if="zoom > 1 || panX !== 0 || panY !== 0" class="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/80 text-[10px] font-mono text-neon-cyan border border-white/10 backdrop-blur-sm pointer-events-none">
        Zoom: {{ Math.round(zoom * 100) }}% · Pan: ({{ Math.round(panX) }}, {{ Math.round(panY) }})
      </div>
      <button
        v-if="zoom > 1 || panX !== 0 || panY !== 0"
        @click="resetZoom"
        class="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 hover:bg-neon-cyan hover:text-slate-900 text-[10px] font-bold text-slate-300 border border-white/10 transition-colors"
      >
        Reset View (0)
      </button>
    </div>

    <!-- Shortcut helper guide -->
    <p class="text-[10px] sm:text-[11px] text-slate-400 mt-2 text-center font-medium">
      <iconify-icon icon="ph:paint-brush-bold" class="text-neon-pink align-middle mr-1"></iconify-icon>
      Paint over any watermark/logo.
      <span class="text-slate-500 ml-1">Shortcuts: <kbd class="px-1 py-0.5 rounded bg-white/5 text-[9px] font-mono">B</kbd> Brush, <kbd class="px-1 py-0.5 rounded bg-white/5 text-[9px] font-mono">E</kbd> Eraser, <kbd class="px-1 py-0.5 rounded bg-white/5 text-[9px] font-mono">Space</kbd> Pan, <kbd class="px-1 py-0.5 rounded bg-white/5 text-[9px] font-mono">Ctrl+Z</kbd> Undo, <kbd class="px-1 py-0.5 rounded bg-white/5 text-[9px] font-mono">[ / ]</kbd> Size</span>
    </p>

    <!-- Method + Process -->
    <div class="flex flex-wrap items-center justify-between gap-3 mt-3">
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-bold text-slate-500 uppercase">Inpaint Method</span>
        <div class="p-0.5 rounded-lg neu-inset inline-flex gap-0.5">
          <button
            @click="method = 'telea'"
            :class="[
              'px-2.5 py-1 rounded-md font-bold text-[11px] transition-all',
              method === 'telea'
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                : 'text-slate-400 hover:text-white',
            ]"
          >
            ⚡ Fast (Telea)
          </button>
          <button
            @click="method = 'patchmatch'"
            :class="[
              'px-2.5 py-1 rounded-md font-bold text-[11px] transition-all',
              method === 'patchmatch'
                ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                : 'text-slate-400 hover:text-white',
            ]"
          >
            🎨 High-Texture (PatchMatch)
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="$emit('cancel')"
          class="btn-cyber-secondary btn-micro-pop text-xs py-2 px-3"
        >
          <iconify-icon icon="ph:x-bold" width="14" class="text-slate-400"></iconify-icon>
          Cancel
        </button>
        <button
          @click="processInpaint"
          :disabled="isProcessing || !hasMask"
          class="btn-neon-pink group py-2.5 px-5 rounded-lg font-bold text-white transition-all text-xs disabled:opacity-40"
        >
          <div class="flex items-center gap-1.5">
            <iconify-icon
              :icon="isProcessing ? 'ph:spinner-gap-bold' : 'ph:sparkle-bold'"
              width="16"
              :class="isProcessing ? 'animate-spin' : ''"
            ></iconify-icon>
            {{ isProcessing ? 'Inpainting...' : 'Remove Watermark' }}
          </div>
        </button>
      </div>
    </div>

    <!-- Detected regions info -->
    <div v-if="detectedRegions.length > 0" class="mt-2 text-[11px] text-neon-purple font-medium">
      <iconify-icon icon="ph:check-circle-bold" class="align-middle mr-1"></iconify-icon>
      {{ detectedRegions.length }} potential watermark region{{ detectedRegions.length > 1 ? 's' : '' }} detected.
      Adjust with brush if needed.
    </div>
  </div>
</template>

<style scoped>
.brush-mask-editor {
  max-width: 100%;
}

.btn-neon-pink {
  background: linear-gradient(135deg, #ff2d95, #e91e8c);
  box-shadow: 0 0 15px rgba(255, 45, 149, 0.3);
}
.btn-neon-pink:hover:not(:disabled) {
  box-shadow: 0 0 25px rgba(255, 45, 149, 0.5);
  transform: translateY(-1px);
}
.btn-neon-pink:disabled {
  cursor: not-allowed;
}
</style>
