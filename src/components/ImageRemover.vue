<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import WatermarkTuner from './WatermarkTuner.vue';
import { cleanFrame } from '../engine/tuner.js';

// Engine is lazy-loaded only when the user uploads an image.
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
const items = ref([]); // { name, displayName, status, originalSrc, url, blob, width, height }
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
    setTimeout(() => { copiedIdx.value = -1; }, 2500);
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

// Advanced "tune-it-yourself" mode (off = default lossless auto removal)
const advanced = ref(false);
// Watermark position presets
const IMG_PRESETS = [
  {
    id: 'new',
    label: 'New Gemini images',
    desc: 'Recent downloads — watermark sits about 128px inside the bottom-right corner.',
    settings: { gain: 0.6, offsetX: -128, offsetY: -128, sizeScale: 1 },
  },
  {
    id: 'classic',
    label: 'Classic corner',
    desc: 'Older images — watermark right in the bottom-right corner.',
    settings: { gain: 1, offsetX: 0, offsetY: 0, sizeScale: 1 },
  },
];
const presetId = ref('new');
const currentPreset = computed(() => IMG_PRESETS.find((p) => p.id === presetId.value));
const tunerActive = ref(false);
const tunerFrame = ref(null); // { width, height, imageData }
const tunerBase = ref(null);
const tunerBgImg = ref(null);
const tunerName = ref('clean_image.png');
const tunerOrigSrc = ref('');
const tunerSettings = reactive({ ...IMG_PRESETS[0].settings });

// Switching preset re-seeds the tuner sliders with that preset's settings.
watch(presetId, () => {
  Object.assign(tunerSettings, currentPreset.value.settings);
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

  reset(); // clear any previous run

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
        name: `clean_${file.name.replace(/\.[^/.]+$/, '')}.png`,
        displayName: file.name,
        status: 'loading',
        originalSrc: '',
        url: '',
        blob: null,
        width: 0,
        height: 0,
      }) - 1;
    const item = items.value[idx];

    try {
      const { width, height, imageData, src } = await loadImageData(file);
      const copy = new ImageData(new Uint8ClampedArray(imageData.data), width, height);
      cleanFrame(engine.bg96, copy, width, height, engine.getWatermarkInfo(width, height), currentPreset.value.settings);

      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      c.getContext('2d').putImageData(copy, 0, 0);
      const blob = await new Promise((r) => c.toBlob(r, 'image/png'));

      item.status = 'done';
      item.originalSrc = src;
      item.url = URL.createObjectURL(blob);
      item.blob = blob;
      item.width = width;
      item.height = height;
    } catch (err) {
      console.error(err);
      item.status = 'error';
    }
  }
}

function downloadOne(item) {
  const a = document.createElement('a');
  a.href = item.url;
  a.download = item.name;
  a.click();
}

async function downloadAll() {
  const done = doneItems.value;
  if (!done.length) return;
  const { default: JSZip } = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
  const zip = new JSZip();
  done.forEach((item) => zip.file(item.name, item.blob));
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cleaned_images_${Date.now()}.zip`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Advanced tuner ──────────────────────────────────────────────
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

async function startTuner(file, engine) {
  try {
    const f = await loadImageData(file);
    tunerOrigSrc.value = f.src;
    tunerFrame.value = { width: f.width, height: f.height, imageData: f.imageData };
    tunerBase.value = engine.getWatermarkInfo(f.width, f.height);
    tunerBgImg.value = engine.bg96;
    tunerName.value = `clean_${file.name.replace(/\.[^/.]+$/, '')}.png`;
    Object.assign(tunerSettings, currentPreset.value.settings);
    tunerActive.value = true;
  } catch (e) {
    console.error(e);
    alert('Could not read this image.');
  }
}

function resetTunerSettings() {
  Object.assign(tunerSettings, currentPreset.value.settings);
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
  <div
    class="max-w-5xl mx-auto liquid-glass rounded-3xl p-4 sm:p-6 shadow-2xl relative z-10 transition-all duration-300"
  >
    <!-- Advanced tuner -->
    <div v-if="tunerActive" class="animate-fade-in">
      <div class="flex flex-col lg:flex-row gap-6">
        <div class="flex-1 min-w-0">
          <WatermarkTuner :settings="tunerSettings" :frame="tunerFrame" :bg-img="tunerBgImg" :base="tunerBase" />
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
            Drag the sliders until the watermark disappears in the zoomed corner. The
            <span class="text-emerald-500 font-semibold">blue box</span> shows what gets cleaned.
          </p>
        </div>
        <div class="w-full lg:w-60 flex-shrink-0">
          <div class="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-3 sticky top-24">
            <h2 class="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Export</h2>
            <label class="block">
              <div class="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Position preset</div>
              <select
                v-model="presetId"
                class="w-full text-xs font-semibold liquid-glass-pill rounded-xl px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
              >
                <option v-for="p in IMG_PRESETS" :key="p.id" :value="p.id">{{ p.label }}</option>
              </select>
              <p class="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-1">{{ currentPreset.desc }}</p>
            </label>
            <button @click="resetTunerSettings" class="w-full text-xs font-semibold text-slate-500 hover:text-emerald-500 transition-colors">
              Reset sliders to preset
            </button>
            <button @click="downloadTuner" class="btn-micro-pop group w-full py-3 relative overflow-hidden rounded-xl font-bold text-white shadow-lg shadow-emerald-500/25 transition-all">
              <div class="absolute inset-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-400"></div>
              <div class="relative flex items-center justify-center gap-2 text-xs sm:text-sm">
                <iconify-icon icon="ph:download-simple-bold" width="18"></iconify-icon> Download PNG
              </div>
            </button>
            <button @click="reset" class="btn-micro-pop w-full py-2.5 liquid-glass-pill text-slate-600 dark:text-slate-300 hover:text-emerald-500 rounded-xl font-bold text-xs sm:text-sm transition-all">
              Choose another image
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload area -->
    <div
      v-else-if="!hasResults"
      class="group relative flex flex-col items-center justify-center w-full min-h-[14rem] sm:min-h-[16rem] py-6 sm:py-10 px-4 rounded-3xl glass-dropzone transition-all cursor-pointer select-none"
      :class="
        dragOver
          ? '!border-emerald-500 !bg-emerald-500/10 shadow-2xl scale-[1.01]'
          : ''
      "
      role="button"
      tabindex="0"
      aria-label="Upload area — click to select images or drag and drop"
      @click="openPicker"
      @keydown.enter="openPicker"
      @dragover.prevent="dragOver = true"
      @dragenter.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
    >
      <div class="flex flex-col items-center justify-center relative text-center">
        <div class="relative flex items-center justify-center mb-2.5 sm:mb-3">
          <div class="absolute inset-0 rounded-full bg-emerald-500/25 animate-ripple"></div>
          <div class="absolute -inset-1 rounded-full bg-cyan-500/20 animate-pulse-glow"></div>
          <div
            class="relative w-12 h-12 sm:w-16 sm:h-16 liquid-glass-pill rounded-full shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
          >
            <iconify-icon
              icon="ph:upload-simple-bold"
              class="text-2xl sm:text-3xl text-emerald-500 dark:text-emerald-400 group-hover:text-cyan-400 transition-colors"
              aria-hidden="true"
            ></iconify-icon>
          </div>
        </div>
        
        <p
          class="mb-1 text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-emerald-500 transition-colors tracking-tight px-2"
        >
          Click to upload, drag images, or <kbd class="px-1.5 py-0.5 text-[10px] sm:text-xs font-mono font-bold liquid-glass-pill rounded text-emerald-600 dark:text-emerald-400">Ctrl + V</kbd> to paste
        </p>
        <p class="text-xs sm:text-sm text-slate-400 dark:text-slate-500">PNG, JPG, WebP · Multiple files supported</p>
        
        <!-- Preset Dropdown -->
        <div class="mt-3 sm:mt-4 flex flex-col items-center gap-1.5" @click.stop>
          <label class="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Watermark position:</span>
            <select
              v-model="presetId"
              class="text-xs font-semibold liquid-glass-pill rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
            >
              <option v-for="p in IMG_PRESETS" :key="p.id" :value="p.id">{{ p.label }}</option>
            </select>
          </label>
          <p class="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 max-w-xs leading-normal">{{ currentPreset.desc }}</p>
        </div>

        <label class="mt-2.5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer" @click.stop>
          <input type="checkbox" v-model="advanced" class="accent-emerald-500 w-3.5 h-3.5 rounded" />
          <span>Advanced: tune it yourself</span>
        </label>
      </div>
      
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        aria-label="File input"
        @change="onChange"
      />
    </div>

    <!-- Results -->
    <div v-else class="text-left mt-2 animate-fade-in">
      <div class="flex flex-col lg:flex-row gap-6">
        <div class="flex-1 space-y-4 sm:space-y-6 min-w-0">
          <div
            v-for="(item, i) in items"
            :key="i"
            class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 liquid-glass-card rounded-2xl"
          >
            <!-- Original -->
            <div
              class="liquid-glass-card rounded-xl overflow-hidden"
            >
              <div
                class="px-3 py-2 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/5 dark:bg-white/5"
              >
                <h3 class="font-bold text-slate-700 dark:text-slate-200 text-xs">Original</h3>
                <div v-if="item.status === 'done'" class="text-[10px] font-mono text-slate-400">
                  {{ item.width }} × {{ item.height }} px
                </div>
              </div>
              <div class="p-2 sm:p-3 checker flex justify-center h-48 sm:h-64">
                <img v-if="item.originalSrc" :src="item.originalSrc" class="max-h-full object-contain rounded shadow-sm mx-auto" />
                <div v-else class="flex items-center justify-center">
                  <div class="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
                </div>
              </div>
            </div>

            <!-- Cleaned -->
            <div
              class="liquid-glass-card rounded-xl overflow-hidden"
              :class="item.status === 'done' ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-cyan-500/30'"
            >
              <div
                class="px-3 py-2 border-b flex items-center gap-1.5"
                :class="item.status === 'done' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-cyan-500/10 border-cyan-500/20'"
              >
                <template v-if="item.status === 'done'">
                  <iconify-icon icon="ph:check-circle-fill" width="16" class="text-emerald-500"></iconify-icon>
                  <span class="font-bold text-emerald-600 dark:text-emerald-400 text-xs">Cleaned</span>
                </template>
                <span v-else class="font-bold text-cyan-500 text-xs">Removing watermark…</span>
              </div>
              <div class="p-2 sm:p-3 checker flex justify-center h-48 sm:h-64">
                <img v-if="item.status === 'done'" :src="item.url" class="max-h-full object-contain rounded shadow-sm mx-auto" />
                <p v-else-if="item.status === 'error'" class="text-xs sm:text-sm font-semibold text-red-500 self-center">Failed to process</p>
                <p v-else class="text-xs sm:text-sm font-semibold text-cyan-500 self-center">Removing watermark...</p>
              </div>
              <div v-if="item.status === 'done'" class="p-2.5 sm:p-3 border-t border-emerald-500/15 flex gap-2">
                <button
                  @click="downloadOne(item)"
                  class="btn-micro-pop flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/20"
                >
                  <iconify-icon icon="ph:download-simple-bold" width="14"></iconify-icon> Download
                </button>
                <button
                  @click="copyToClipboard(item, i)"
                  class="btn-micro-pop liquid-glass-pill px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-500 rounded-xl transition-all flex items-center gap-1"
                  :title="'Copy to clipboard'"
                >
                  <iconify-icon :icon="copiedIdx === i ? 'ph:check-bold' : 'ph:copy-bold'" width="14" :class="copiedIdx === i ? 'text-emerald-500' : ''"></iconify-icon>
                  <span>{{ copiedIdx === i ? 'Copied' : 'Copy' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions sidebar -->
        <div class="w-full lg:w-60 flex-shrink-0">
          <div
            class="liquid-glass-card rounded-2xl p-4 sm:p-5 sticky top-24 space-y-2.5"
          >
            <h2 class="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Actions</h2>
            <button
              v-if="doneItems.length === 1"
              @click="downloadOne(doneItems[0])"
              class="btn-micro-pop group w-full py-3 relative overflow-hidden rounded-xl font-bold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-400"></div>
              <div class="relative flex items-center justify-center gap-2 text-xs sm:text-sm">
                <iconify-icon icon="ph:download-simple-bold" width="18"></iconify-icon> Download
              </div>
            </button>
            <button
              v-if="doneItems.length > 1"
              @click="downloadAll"
              class="btn-micro-pop group w-full py-3 relative overflow-hidden rounded-xl font-bold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-emerald-600 via-cyan-600 to-teal-600"></div>
              <div class="relative flex items-center justify-center gap-2 text-xs sm:text-sm">
                <iconify-icon icon="ph:file-zip-bold" width="18"></iconify-icon> Download All ZIP
              </div>
            </button>
            <button
              @click="reset"
              class="btn-micro-pop w-full py-2.5 liquid-glass-pill text-slate-700 dark:text-slate-300 hover:text-emerald-500 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300"
            >
              Process Another
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
