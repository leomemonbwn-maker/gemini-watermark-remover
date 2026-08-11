<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import WatermarkTuner from './WatermarkTuner.vue';
import GeminiAnalyst from './GeminiAnalyst.vue';
import { cleanFrame } from '../engine/tuner.js';
import { pointTargetWatermark } from '../engine/detector.js';
import { addEntry } from '../config/historyStore.js';
import { useI18n } from '../config/i18n.js';

const { t } = useI18n();

// PSNR quality score calculation
function calculatePSNR(originalSrc, cleanedBlob) {
  return new Promise((resolve) => {
    const img1 = new Image();
    const img2 = new Image();
    let loaded = 0;
    const onLoad = () => {
      loaded++;
      if (loaded < 2) return;
      try {
        const c1 = document.createElement('canvas');
        const c2 = document.createElement('canvas');
        const w = Math.min(img1.width, 512);
        const h = Math.min(img1.height, 512);
        c1.width = c2.width = w;
        c1.height = c2.height = h;
        c1.getContext('2d').drawImage(img1, 0, 0, w, h);
        c2.getContext('2d').drawImage(img2, 0, 0, w, h);
        const d1 = c1.getContext('2d').getImageData(0, 0, w, h).data;
        const d2 = c2.getContext('2d').getImageData(0, 0, w, h).data;
        let mse = 0;
        const len = d1.length;
        for (let i = 0; i < len; i += 4) {
          for (let c = 0; c < 3; c++) {
            const diff = d1[i + c] - d2[i + c];
            mse += diff * diff;
          }
        }
        mse /= (w * h * 3);
        if (mse === 0) { resolve(99.9); return; }
        const psnr = 10 * Math.log10((255 * 255) / mse);
        resolve(Math.min(99.9, Math.max(0, psnr)));
      } catch {
        resolve(null);
      }
    };
    img1.onload = onLoad;
    img2.onload = onLoad;
    img1.src = originalSrc;
    img2.src = URL.createObjectURL(cleanedBlob);
  });
}

// Web Share API
async function shareImage(item) {
  if (!item.blob || !navigator.share) return;
  try {
    const file = new File([item.blob], `gemclean_${item.name}`, { type: 'image/png' });
    await navigator.share({
      title: 'GemClean AI - Cleaned Image',
      text: 'Watermark removed with GemClean AI! 🔮',
      files: [file],
    });
  } catch (e) {
    if (e.name !== 'AbortError') console.error('Share failed:', e);
  }
}

const canShare = typeof navigator !== 'undefined' && !!navigator.share;

let enginePromise = null;
function getEngine() {
  if (!enginePromise) {
    enginePromise = import('../engine/watermarkEngine.js').then(({ WatermarkEngine }) =>
      WatermarkEngine.create()
    );
  }
  return enginePromise;
}

const fileInput = ref(null);
const dragOver = ref(false);
const items = ref([]); // { file, name, displayName, status, originalSrc, url, blob, width, height, config, configs, viewMode, sliderPos, format }
const copiedIdx = ref(-1);

const doneItems = computed(() => items.value.filter((i) => i.status === 'done'));
const hasResults = computed(() => items.value.length > 0);

async function copyToClipboard(item, idx) {
  if (!item.blob) return;
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': item.blob })
    ]);
    copiedIdx.value = idx;
    setTimeout(() => { copiedIdx.value = -1; }, 2000);
  } catch (e) {
    console.error('Failed to copy to clipboard', e);
  }
}

function handlePaste(e) {
  const pasteItems = e.clipboardData?.items;
  if (!pasteItems) return;
  const files = [];
  for (const item of pasteItems) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) files.push(file);
    }
  }
  if (files.length) {
    handleFiles(files);
  }
}

onMounted(() => {
  window.addEventListener('paste', handlePaste);
});

onUnmounted(() => {
  window.removeEventListener('paste', handlePaste);
});

const advanced = ref(false);

const IMG_PRESETS = [
  {
    id: 'auto',
    label: '✨ 100% AI Auto-Scan',
    desc: 'Scans image margins to locate watermark position.',
    settings: { gain: 1, offsetX: 0, offsetY: 0, sizeScale: 1 },
  },
  {
    id: 'corner32',
    label: '📐 Standard Corner (32px)',
    desc: 'Default Gemini output — 32px margin from corner.',
    settings: { gain: 1, offsetX: 32, offsetY: 32, sizeScale: 1 },
  },
  {
    id: 'corner48',
    label: '📐 Classic Corner (48px)',
    desc: '48px padded corner watermark placement.',
    settings: { gain: 1, offsetX: 16, offsetY: 16, sizeScale: 1 },
  },
  {
    id: 'inset',
    label: '📐 Inset Margin (128px)',
    desc: 'Gemini web downloads with deep margin padding.',
    settings: { gain: 0.8, offsetX: -64, offsetY: -64, sizeScale: 1 },
  },
];

const presetId = ref('auto');
const currentPreset = computed(() => IMG_PRESETS.find((p) => p.id === presetId.value));
const tunerActive = ref(false);
const tunerFrame = ref(null);
const tunerBase = ref(null);
const tunerBgImg = ref(null);
const tunerName = ref('clean_image.png');
const tunerOrigSrc = ref('');
const tunerSettings = reactive({ gain: 1, offsetX: 0, offsetY: 0, sizeScale: 1 });

watch(presetId, () => {
  if (presetId.value !== 'auto') {
    Object.assign(tunerSettings, currentPreset.value.settings);
  }
});

function openPicker() {
  fileInput.value?.click();
}

function onDrop(e) {
  dragOver.value = false;
  handleFiles(e.dataTransfer.files);
}

function onChange(e) {
  handleFiles(e.target.files);
}

async function handleFiles(fileList) {
  const valid = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
  if (!valid.length) return;

  reset();

  let engine;
  try {
    engine = await getEngine();
  } catch {
    alert('Error: watermark assets could not be loaded.');
    return;
  }

  if (advanced.value) {
    await startTuner(valid[0], engine);
    return;
  }

  for (const file of valid) {
    const idx =
      items.value.push({
        file, name: file.name,
        displayName: file.name.replace(/\.[^/.]+$/, '').slice(0, 24),
        status: 'processing',
        originalSrc: '', url: '', blob: null,
        width: 0, height: 0, config: null, configs: [],
        viewMode: 'sideBySide', sliderPos: 50,
        format: 'png',
        showAnalyst: false,
        psnr: null,
      }) - 1;
    const item = items.value[idx];

    try {
      await new Promise(r => setTimeout(r, 150));
      const result = await engine.processMulti(file);

      item.status = 'done';
      item.originalSrc = result.originalSrc;
      item.url = URL.createObjectURL(result.blob);
      item.blob = result.blob;
      item.width = result.width;
      item.height = result.height;
      item.config = result.config;
      item.configs = result.configs || [result.config];

      // Auto-save to history
      addEntry({
        name: item.name,
        blobUrl: item.url,
        width: result.width,
        height: result.height,
        blob: result.blob,
      });

      calculatePSNR(result.originalSrc, result.blob).then(score => {
        if (score !== null) item.psnr = score;
      });
    } catch (err) {
      console.error(err);
      item.status = 'error';
    }
  }
}

async function handleImageClick(e, item) {
  if (!item || !item.file || item.status !== 'done') return;
  const imgEl = e.currentTarget;
  if (!imgEl) return;
  const rect = imgEl.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const normX = Math.min(Math.max(clickX / rect.width, 0), 1);
  const normY = Math.min(Math.max(clickY / rect.height, 0), 1);

  const targetX = Math.round(normX * item.width);
  const targetY = Math.round(normY * item.height);

  const newConfig = pointTargetWatermark(item.width, item.height, targetX, targetY);

  // Add the pin-point to existing auto-detected configs and re-process all
  const combinedConfigs = [...(item.configs || []).filter(c => !c.isCustomPoint), newConfig];

  item.status = 'processing';
  try {
    const engine = await getEngine();
    const result = await engine.processMulti(item.file, combinedConfigs);
    item.status = 'done';
    if (item.url) URL.revokeObjectURL(item.url);
    item.url = URL.createObjectURL(result.blob);
    item.blob = result.blob;
    item.config = result.config;
    item.configs = result.configs || [result.config];

    calculatePSNR(result.originalSrc, result.blob).then((score) => {
      if (score !== null) item.psnr = score;
    });
  } catch (err) {
    console.error('Failed to re-target watermark:', err);
    item.status = 'error';
  }
}

async function downloadFormatted(item) {
  if (!item.blob) return;
  
  let exportBlob = item.blob;
  let ext = item.format || 'png';
  let mimeType = 'image/png';
  if (ext === 'webp') mimeType = 'image/webp';
  if (ext === 'jpeg') mimeType = 'image/jpeg';

  if (ext !== 'png') {
    const img = new Image();
    img.src = item.url;
    await new Promise((r) => { img.onload = r; });
    const c = document.createElement('canvas');
    c.width = item.width; c.height = item.height;
    const ctx = c.getContext('2d');
    if (ext === 'jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, c.width, c.height);
    }
    ctx.drawImage(img, 0, 0);
    exportBlob = await new Promise((r) => c.toBlob(r, mimeType, 0.95));
  }

  const url = URL.createObjectURL(exportBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${item.name}.${ext}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadAll() {
  const done = doneItems.value;
  if (!done.length) return;
  const { default: JSZip } = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
  const zip = new JSZip();
  done.forEach((item) => zip.file(`${item.name}.png`, item.blob));
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cleaned_images_${Date.now()}.zip`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

let activeDraggingItem = null;

function onSliderPointerDown(e, item) {
  activeDraggingItem = item;
  updateSliderPos(e, item);
}

function updateSliderPos(e, item) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
  item.sliderPos = (x / rect.width) * 100;
}

function onSliderPointerMove(e) {
  if (!activeDraggingItem) return;
  const el = e.currentTarget;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
  activeDraggingItem.sliderPos = (x / rect.width) * 100;
}

function onSliderPointerUp() {
  activeDraggingItem = null;
}

function loadImageData(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const cx = c.getContext('2d', { willReadFrequently: true });
      cx.drawImage(img, 0, 0);
      resolve({ width: w, height: h, imageData: cx.getImageData(0, 0, w, h), src: url });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')); };
    img.src = url;
  });
}

async function startTuner(file, engine, initialConfig = null) {
  try {
    const f = await loadImageData(file);
    tunerOrigSrc.value = f.src;
    tunerFrame.value = { width: f.width, height: f.height, imageData: f.imageData };
    
    const base = initialConfig || engine.getWatermarkInfo(f.width, f.height);
    tunerBase.value = base;
    tunerBgImg.value = engine.bg96;
    tunerName.value = `clean_${file.name.replace(/\.[^/.]+$/, '')}.png`;
    
    tunerSettings.gain = 1;
    tunerSettings.offsetX = 0;
    tunerSettings.offsetY = 0;
    tunerSettings.sizeScale = 1;
    
    tunerActive.value = true;
  } catch (e) {
    console.error(e);
    alert('Could not read this image.');
  }
}

async function openTunerForItem(item) {
  if (!item || !item.file) return;
  const engine = await getEngine();
  await startTuner(item.file, engine, item.config);
}

function resetTunerSettings() {
  tunerSettings.gain = 1;
  tunerSettings.offsetX = 0;
  tunerSettings.offsetY = 0;
  tunerSettings.sizeScale = 1;
}

async function downloadTuner() {
  const { width, height, imageData } = tunerFrame.value;
  const copy = new ImageData(new Uint8ClampedArray(imageData.data), width, height);
  cleanFrame(tunerBgImg.value, copy, width, height, tunerBase.value, { ...tunerSettings });
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  c.getContext('2d').putImageData(copy, 0, 0);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = tunerName.value;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function reset() {
  items.value.forEach((i) => {
    if (i.url) URL.revokeObjectURL(i.url);
    if (i.originalSrc) URL.revokeObjectURL(i.originalSrc);
  });
  items.value = [];
  if (tunerOrigSrc.value) URL.revokeObjectURL(tunerOrigSrc.value);
  tunerOrigSrc.value = '';
  tunerActive.value = false;
  tunerFrame.value = null;
  if (fileInput.value) fileInput.value.value = '';
}
</script>

<template>
  <div class="relative z-10">
    <!-- Advanced Tuner Mode -->
    <div v-if="tunerActive" class="animate-fade-in">
      <div class="flex flex-col lg:flex-row gap-3.5 sm:gap-5">
        <div class="flex-1 min-w-0">
          <WatermarkTuner :settings="tunerSettings" :frame="tunerFrame" :bg-img="tunerBgImg" :base="tunerBase" />
          <p class="text-[11px] text-slate-400 mt-2 text-center font-medium">
            <iconify-icon icon="ph:hand-swipe-left-bold" class="text-neon-cyan align-middle mr-1"></iconify-icon>
            Touch & Drag on preview canvas to reposition watermark box.
          </p>
        </div>

        <!-- Desktop Action Sidebar -->
        <div class="hidden lg:block w-56 flex-shrink-0">
          <div class="neu-card rounded-xl p-3.5 space-y-2.5 sticky top-20">
            <h2 class="font-bold text-white text-xs uppercase tracking-wider text-slate-400">Settings</h2>
            <label class="block">
              <div class="text-[11px] font-bold text-slate-300 mb-1">Preset</div>
              <select
                v-model="presetId"
                class="w-full text-xs font-semibold neu-pill rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none cursor-pointer"
              >
                <option v-for="p in IMG_PRESETS" :key="p.id" :value="p.id">{{ p.label }}</option>
              </select>
              <p class="text-[10px] text-slate-500 mt-1">{{ currentPreset.desc }}</p>
            </label>
            <button @click="resetTunerSettings" class="w-full text-[11px] font-semibold text-slate-400 hover:text-neon-cyan transition-colors py-0.5">
              Reset sliders
            </button>
            <button @click="downloadTuner" class="btn-neon-cyan group w-full py-2.5 rounded-lg font-bold text-white transition-all text-xs">
              <div class="flex items-center justify-center gap-1.5">
                <iconify-icon icon="ph:download-simple-bold" width="16"></iconify-icon> Download PNG
              </div>
            </button>
            <button @click="reset" class="btn-cyber-secondary btn-micro-pop text-xs py-2">
              <iconify-icon icon="ph:arrow-counter-clockwise-bold" width="15" class="text-neon-cyan"></iconify-icon>
              <span>{{ t('processAnother') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Actions -->
      <div class="lg:hidden mt-3">
        <div class="neu-card rounded-xl p-3 space-y-2">
          <button @click="downloadTuner" class="btn-neon-cyan group w-full py-2.5 rounded-lg font-bold text-white text-xs">
            <div class="flex items-center justify-center gap-1.5">
              <iconify-icon icon="ph:download-simple-bold" width="16"></iconify-icon> Download PNG
            </div>
          </button>
          <button @click="reset" class="btn-cyber-secondary btn-micro-pop text-xs py-2">
            <iconify-icon icon="ph:arrow-counter-clockwise-bold" width="15" class="text-neon-cyan"></iconify-icon>
            <span>{{ t('processAnother') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Upload Dropzone (Sleek & Compact) -->
    <div
      v-else-if="!hasResults"
      class="group relative flex flex-col items-center justify-center w-full min-h-[11rem] sm:min-h-[13rem] py-5 sm:py-7 px-4 rounded-2xl neu-dropzone transition-all cursor-pointer select-none"
      :class="dragOver ? '!border-neon-pink scale-[1.01]' : ''"
      role="button"
      tabindex="0"
      aria-label="Upload area"
      @click="openPicker"
      @keydown.enter="openPicker"
      @dragover.prevent="dragOver = true"
      @dragenter.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
    >
      <div class="flex flex-col items-center justify-center relative text-center">
        <!-- Center Icon -->
        <div class="relative flex items-center justify-center mb-2.5">
          <div class="absolute inset-0 rounded-full bg-neon-pink/15 animate-ripple"></div>
          <div
            class="relative w-11 h-11 sm:w-13 sm:h-13 neu-pill rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
          >
            <iconify-icon
              icon="ph:upload-simple-bold"
              class="text-xl sm:text-2xl text-neon-cyan group-hover:text-neon-pink transition-colors"
            ></iconify-icon>
          </div>
        </div>
        
        <p class="mb-0.5 text-xs sm:text-sm font-bold text-slate-100 group-hover:text-neon-pink transition-colors tracking-tight px-2">
          Click to upload or drag images here
        </p>
        <p class="text-[11px] text-slate-500">PNG, JPG, WebP · Batch processing supported</p>
        
        <label class="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 cursor-pointer" @click.stop>
          <input type="checkbox" v-model="advanced" class="w-3.5 h-3.5 rounded" />
          <span>Advanced: reposition target box</span>
        </label>
      </div>
      
      <input
        ref="fileInput"
        type="file"
        accept="image/*,.gif"
        multiple
        class="hidden"
        aria-label="File input"
        @change="onChange"
      />
    </div>

    <!-- Results (Crisp & Well-Structured) -->
    <div v-else class="text-left animate-fade-in">
      <div class="flex flex-col lg:flex-row gap-3.5 sm:gap-5">
        <div class="flex-1 space-y-3 sm:space-y-4 min-w-0">
          <div
            v-for="(item, i) in items"
            :key="i"
            class="p-3 sm:p-3.5 neu-card rounded-xl space-y-2.5"
          >
            <!-- Card Header -->
            <div class="flex items-center justify-between border-b border-white/5 pb-2 flex-wrap gap-1.5">
              <div class="flex items-center gap-2 overflow-hidden">
                <h3 class="font-bold text-white text-xs truncate max-w-[180px] sm:max-w-xs">{{ item.displayName }}</h3>
                <span v-if="item.status === 'done' && item.configs && item.configs.length" class="text-[9px] font-mono font-bold text-neon-cyan bg-neon-cyan/10 px-1.5 py-0.2 rounded-full flex-shrink-0">
                  {{ item.configs.some(c => c.isCustomPoint) ? '📍 Pinned' : '✨ Auto' }}
                  · {{ item.configs.length }} found
                </span>
              </div>

              <!-- View Mode Toggle -->
              <div v-if="item.status === 'done'" class="flex items-center gap-1 p-0.5 rounded-lg neu-inset text-[10px] font-bold">
                <button
                  @click="item.viewMode = 'sideBySide'"
                  :class="['px-2 py-1 rounded transition-all', item.viewMode === 'sideBySide' ? 'bg-neu-raised text-neon-pink shadow-xs' : 'text-slate-400 hover:text-white']"
                >
                  Side-by-Side
                </button>
                <button
                  @click="item.viewMode = 'slider'"
                  :class="['px-2 py-1 rounded transition-all', item.viewMode === 'slider' ? 'bg-neu-raised text-neon-pink shadow-xs' : 'text-slate-400 hover:text-white']"
                >
                  Slider
                </button>
              </div>
            </div>

            <!-- VIEW MODE 1: Side-by-Side -->
            <div v-if="item.viewMode === 'sideBySide'" class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <!-- Original -->
              <div class="neu-card rounded-lg overflow-hidden relative">
                <div class="px-2.5 py-1 border-b border-white/5 flex justify-between items-center bg-white/2">
                  <span class="font-bold text-slate-300 text-[10px]">Original</span>
                  <span v-if="item.status === 'done'" class="text-[9px] font-mono text-slate-400">{{ item.width }}×{{ item.height }}</span>
                </div>

                <div class="p-1.5 checker flex items-center justify-center h-40 sm:h-48 relative overflow-hidden">
                  <div v-if="item.status === 'loading'" class="absolute inset-0 z-20 bg-black/40 flex flex-col items-center justify-center">
                    <div class="animate-spin rounded-full h-6 w-6 border-2 border-cyan-400 border-t-transparent mb-1"></div>
                    <span class="text-[10px] font-mono font-bold text-cyan-300">Scanning...</span>
                  </div>

                  <div class="relative inline-block max-h-full max-w-full">
                    <img
                      v-if="item.originalSrc"
                      :src="item.originalSrc"
                      class="max-h-36 sm:max-h-44 w-auto object-contain rounded select-none cursor-crosshair"
                      title="Click anywhere to re-target watermark"
                      @click="handleImageClick($event, item)"
                    />

                    <!-- Watermark Target Overlays (one per detection) -->
                    <template v-if="item.status === 'done' && item.configs && item.configs.length">
                      <div
                        v-for="(cfg, ci) in item.configs"
                        :key="ci"
                        class="absolute pointer-events-none transition-all duration-150"
                        :style="{
                          left: `${(cfg.x / item.width) * 100}%`,
                          top: `${(cfg.y / item.height) * 100}%`,
                          width: `${(cfg.size / item.width) * 100}%`,
                          height: `${(cfg.size / item.height) * 100}%`,
                        }"
                      >
                        <div :class="['absolute inset-0 border rounded animate-pulse', cfg.isCustomPoint ? 'border-neon-green' : 'border-neon-pink']"></div>
                        <span :class="['absolute -top-4 left-1/2 -translate-x-1/2 text-[7px] font-mono font-bold text-white px-1 rounded shadow', cfg.isCustomPoint ? 'bg-neon-green' : 'bg-neon-pink']">
                          {{ cfg.isCustomPoint ? '📍 PIN' : `#${ci + 1}` }}
                        </span>
                      </div>
                    </template>
                  </div>
                </div>
              </div>

              <!-- Cleaned -->
              <div class="neu-card rounded-lg overflow-hidden border-neon-cyan/20">
                <div class="px-2.5 py-1 border-b border-neon-cyan/10 bg-neon-cyan/5 flex justify-between items-center">
                  <span class="font-bold text-neon-cyan text-[10px]">Cleaned</span>
                  <span class="text-[9px] font-mono text-neon-cyan font-bold">100% Lossless</span>
                </div>
                <div class="p-1.5 checker flex justify-center h-40 sm:h-48">
                  <img v-if="item.status === 'done'" :src="item.url" class="max-h-full object-contain rounded mx-auto" />
                  <p v-else class="text-xs text-slate-400 self-center">Processing...</p>
                </div>
              </div>
            </div>

            <!-- VIEW MODE 2: Compare Slider -->
            <div
              v-else-if="item.status === 'done'"
              class="relative w-full h-48 sm:h-60 rounded-lg overflow-hidden checker border border-neon-cyan/15 cursor-ew-resize select-none touch-none"
              @pointerdown="onSliderPointerDown($event, item)"
              @pointermove="onSliderPointerMove"
              @pointerup="onSliderPointerUp"
              @pointerleave="onSliderPointerUp"
            >
              <img :src="item.url" class="absolute inset-0 w-full h-full object-contain mx-auto pointer-events-none" draggable="false" />
              <img :src="item.originalSrc" class="absolute inset-0 w-full h-full object-contain mx-auto pointer-events-none" draggable="false" :style="{ clipPath: `inset(0 ${100 - item.sliderPos}% 0 0)` }" />

              <span class="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-900/80 text-white">Before</span>
              <span class="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.2 rounded bg-neon-cyan/90 text-white">After</span>

              <div class="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none" :style="{ left: `${item.sliderPos}%` }">
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white text-neon-pink shadow-md flex items-center justify-center">
                  <iconify-icon icon="ph:arrows-left-right-bold" width="12"></iconify-icon>
                </div>
              </div>
            </div>

            <!-- Controls Row: Actions, Format, Download, Share -->
            <div v-if="item.status === 'done'" class="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/5 text-xs">
              <button
                @click="item.showAnalyst = !item.showAnalyst"
                class="btn-micro-pop neu-pill px-2.5 py-1.5 font-bold text-slate-200 hover:text-neon-purple rounded-lg transition-all flex items-center gap-1 min-h-[34px]"
              >
                <iconify-icon icon="ph:sparkle-bold" width="13" class="text-neon-purple"></iconify-icon>
                <span>Ask AI</span>
              </button>

              <div class="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                <select
                  v-model="item.format"
                  class="text-[11px] font-bold neu-pill rounded-lg px-2 py-1 text-slate-200 focus:outline-none cursor-pointer min-h-[34px]"
                >
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                  <option value="jpeg">JPG</option>
                </select>
              </div>

              <div class="flex-1"></div>

              <button
                @click="downloadFormatted(item)"
                class="btn-micro-pop flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-neon-cyan hover:bg-neon-cyan/90 rounded-lg transition-all min-h-[34px]"
              >
                <iconify-icon icon="ph:download-simple-bold" width="13"></iconify-icon>
                <span>Download</span>
              </button>

              <button
                @click="copyToClipboard(item, i)"
                class="btn-micro-pop neu-pill px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:text-neon-cyan rounded-lg transition-all flex items-center gap-1 min-h-[34px]"
                title="Copy to clipboard"
              >
                <iconify-icon :icon="copiedIdx === i ? 'ph:check-bold' : 'ph:copy-bold'" width="13" :class="copiedIdx === i ? 'text-neon-green' : ''"></iconify-icon>
                <span>{{ copiedIdx === i ? 'Copied' : 'Copy' }}</span>
              </button>

              <button
                v-if="canShare"
                @click="shareImage(item)"
                class="btn-micro-pop neu-pill p-1.5 text-slate-200 hover:text-neon-green rounded-lg transition-all flex items-center justify-center min-w-[34px] min-h-[34px]"
                title="Share"
              >
                <iconify-icon icon="ph:share-network-bold" width="14"></iconify-icon>
              </button>

              <a
                href="/donate/"
                target="_blank"
                class="btn-micro-pop neu-pill px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:text-neon-pink rounded-lg transition-all flex items-center gap-1 min-h-[34px] no-underline"
                title="Support this project"
              >
                <iconify-icon icon="ph:heart-bold" width="13" class="text-neon-pink"></iconify-icon>
                <span class="hidden sm:inline">Donate</span>
              </a>
            </div>

            <!-- Quality Score -->
            <div v-if="item.psnr" class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neon-green/5 text-[10px] font-bold text-neon-green">
              <iconify-icon icon="ph:chart-line-up-bold" width="12"></iconify-icon>
              <span>Quality Score: {{ item.psnr.toFixed(1) }} dB PSNR</span>
            </div>
            
            <GeminiAnalyst 
              v-if="item.showAnalyst && item.status === 'done'" 
              :image-src="item.originalSrc" 
              :image-format="item.format"
              @close="item.showAnalyst = false"
            />
          </div>
        </div>

        <!-- Desktop Action Sidebar -->
        <div class="hidden lg:block w-56 flex-shrink-0">
          <div class="neu-card rounded-xl p-3.5 sticky top-20 space-y-2.5">
            <h2 class="font-bold text-white text-xs uppercase tracking-wider text-slate-400">Actions</h2>
            <button
              v-if="doneItems.length === 1"
              @click="downloadFormatted(doneItems[0])"
              class="btn-neon-cyan group w-full py-2.5 rounded-lg font-bold text-white text-xs transition-all"
            >
              <div class="flex items-center justify-center gap-1.5">
                <iconify-icon icon="ph:download-simple-bold" width="16"></iconify-icon> Download
              </div>
            </button>
            <button
              v-if="doneItems.length > 1"
              @click="downloadAll"
              class="btn-neon group w-full py-2.5 rounded-lg font-bold text-white text-xs transition-all"
            >
              <div class="flex items-center justify-center gap-1.5">
                <iconify-icon icon="ph:file-zip-bold" width="16"></iconify-icon> Download All ZIP
              </div>
            </button>
            <button @click="reset" class="btn-cyber-secondary btn-micro-pop text-xs py-2">
              <iconify-icon icon="ph:arrow-counter-clockwise-bold" width="15" class="text-neon-cyan"></iconify-icon>
              <span>{{ t('processAnother') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Action Bar -->
      <div class="lg:hidden mt-3">
        <div class="neu-card rounded-xl p-3 space-y-2">
          <button
            v-if="doneItems.length === 1"
            @click="downloadFormatted(doneItems[0])"
            class="btn-neon-cyan group w-full py-2.5 rounded-lg font-bold text-white text-xs transition-all"
          >
            <div class="flex items-center justify-center gap-1.5">
              <iconify-icon icon="ph:download-simple-bold" width="16"></iconify-icon> Download
            </div>
          </button>
          <button
            v-if="doneItems.length > 1"
            @click="downloadAll"
            class="btn-neon group w-full py-2.5 rounded-lg font-bold text-white text-xs transition-all"
          >
            <div class="flex items-center justify-center gap-1.5">
              <iconify-icon icon="ph:file-zip-bold" width="16"></iconify-icon> Download All ZIP
            </div>
          </button>
          <button @click="reset" class="btn-cyber-secondary btn-micro-pop text-xs py-2">
            <iconify-icon icon="ph:arrow-counter-clockwise-bold" width="15" class="text-neon-cyan"></iconify-icon>
            <span>{{ t('processAnother') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
