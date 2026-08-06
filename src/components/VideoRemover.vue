<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import WatermarkTuner from './WatermarkTuner.vue';

let enginePromise = null;
function getEngine() {
  if (!enginePromise) {
    enginePromise = import('../engine/videoEngine.js').then(({ VideoWatermarkEngine }) =>
      VideoWatermarkEngine.create()
    );
  }
  return enginePromise;
}

const fileInput = ref(null);
const dragOver = ref(false);
const supported = ref(true);
const status = ref('idle'); // idle | loading | preview | processing | done | error
const progress = ref(0);
const errorMsg = ref('');

const originalUrl = ref('');
const resultUrl = ref('');
const downloadName = ref('clean_video.mp4');

// Advanced "tune-it-yourself" mode (off = one-click auto removal)
const advanced = ref(false);

// Watermark position presets for Veo videos
const VIDEO_PRESETS = [
  {
    id: 'veo',
    label: 'Veo videos (default)',
    desc: 'Current Veo downloads — watermark slightly inset from the bottom-right corner.',
    settings: { gain: 0.6, offsetX: -24, offsetY: -24, sizeScale: 1 },
  },
  {
    id: 'corner',
    label: 'Classic corner',
    desc: 'Watermark right in the bottom-right corner.',
    settings: { gain: 0.6, offsetX: 0, offsetY: 0, sizeScale: 1 },
  },
];
const presetId = ref('veo');
const currentPreset = computed(() => VIDEO_PRESETS.find((p) => p.id === presetId.value));
const settings = reactive({ ...VIDEO_PRESETS[0].settings });

// Switching preset re-seeds the sliders with that preset's settings.
watch(presetId, () => {
  Object.assign(settings, currentPreset.value.settings);
});

// Preview state
const frame = ref(null); // { width, height, imageData }
const base = ref(null);
const bgImg = ref(null);
let engine = null;
let currentFile = null;

onMounted(async () => {
  const { VideoWatermarkEngine } = await import('../engine/videoEngine.js');
  supported.value = VideoWatermarkEngine.isSupported();
});

function openPicker() { fileInput.value?.click(); }
function onDrop(e) { dragOver.value = false; handleFiles(e.dataTransfer.files); }
function onChange(e) { handleFiles(e.target.files); }

async function handleFiles(fileList) {
  const file = Array.from(fileList).find((f) => f.type.startsWith('video/'));
  if (!file) return;
  reset();
  currentFile = file;
  status.value = 'loading';

  try {
    engine = await getEngine();
    if (!advanced.value) {
      await runExport(); // one-click with proven defaults
      return;
    }
    const f = await grabPreviewFrame(file);
    frame.value = f;
    base.value = engine.getVeoWatermark(f.width, f.height);
    bgImg.value = engine.sparkleImage;
    status.value = 'preview';
  } catch (e) {
    console.error(e);
    fail(e?.message || 'Could not read this video.');
  }
}

function grabPreviewFrame(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'auto';
    v.muted = true;
    v.playsInline = true;
    v.src = url;

    const cleanup = () => URL.revokeObjectURL(url);
    v.onerror = () => { cleanup(); reject(new Error('Could not read this video file.')); };
    v.onloadedmetadata = () => {
      const seekTo = Math.min(Math.max((v.duration || 1) * 0.3, 0.1), (v.duration || 1) - 0.05 || 0.1);
      const onSeeked = () => {
        try {
          const w = v.videoWidth, h = v.videoHeight;
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          const cx = c.getContext('2d', { willReadFrequently: true });
          cx.drawImage(v, 0, 0, w, h);
          const imageData = cx.getImageData(0, 0, w, h);
          cleanup();
          resolve({ width: w, height: h, imageData });
        } catch (err) { cleanup(); reject(err); }
      };
      v.onseeked = onSeeked;
      try { v.currentTime = seekTo; } catch { onSeeked(); }
    };
  });
}

function resetSettings() {
  Object.assign(settings, currentPreset.value.settings);
}

async function runExport() {
  if (!currentFile) return;
  status.value = 'processing';
  progress.value = 0;

  try {
    if (!engine) engine = await getEngine();
    const result = await engine.process(currentFile, {
      ...settings,
      onProgress: (p) => { progress.value = p.progress ?? p; },
    });

    originalUrl.value = result.originalUrl || URL.createObjectURL(currentFile);
    resultUrl.value = result.url || URL.createObjectURL(result.blob);
    downloadName.value = `clean_${currentFile.name.replace(/\.[^/.]+$/, '')}.mp4`;
    status.value = 'done';

    // Browser notification when video completes
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('GemClean AI', {
        body: 'Your video processing is complete! 🎬',
        icon: '/assets/logo.svg',
      });
    }
  } catch (err) {
    console.error(err);
    fail(err?.message || 'Failed to process video.');
  }
}

function backToPreview() {
  status.value = 'preview';
}

function download() {
  if (!resultUrl.value) return;
  const a = document.createElement('a');
  a.href = resultUrl.value;
  a.download = downloadName.value;
  a.click();
}

function fail(msg) {
  errorMsg.value = msg;
  status.value = 'error';
}

function reset() {
  if (originalUrl.value) URL.revokeObjectURL(originalUrl.value);
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value);
  originalUrl.value = '';
  resultUrl.value = '';
  errorMsg.value = '';
  progress.value = 0;
  status.value = 'idle';
  currentFile = null;
  frame.value = null;
  if (fileInput.value) fileInput.value.value = '';
}
</script>

<template>
  <div
    class="max-w-5xl mx-auto cyber-glass rounded-3xl p-4 sm:p-6 shadow-2xl relative z-10 transition-all duration-300"
  >
    <!-- Unsupported -->
    <div
      v-if="!supported"
      class="flex flex-col items-center justify-center w-full h-56 rounded-2xl bg-red-500/10 border border-red-500/30 text-center px-6"
    >
      <iconify-icon icon="ph:warning-circle-bold" width="36" class="text-red-500 mb-2"></iconify-icon>
      <p class="font-bold text-red-400">Your browser can't process video locally.</p>
      <p class="text-xs sm:text-sm text-red-500/80 mt-1">Please try the latest Chrome, Edge, or Safari on desktop/mobile.</p>
    </div>

    <!-- Upload -->
    <div
      v-else-if="status === 'idle'"
      class="group relative flex flex-col items-center justify-center w-full min-h-[14rem] sm:min-h-[16rem] py-6 sm:py-10 px-4 rounded-3xl glass-dropzone transition-all cursor-pointer select-none"
      :class="dragOver ? '!border-neon-purple !bg-neon-purple/10 shadow-neon-purple scale-[1.01]' : ''"
      role="button" tabindex="0" aria-label="Upload a video"
      @click="openPicker" @keydown.enter="openPicker"
      @dragover.prevent="dragOver = true" @dragenter.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false" @drop.prevent="onDrop"
    >
      <div class="flex flex-col items-center justify-center relative text-center">
        <div class="relative flex items-center justify-center mb-2.5 sm:mb-3">
          <div class="absolute inset-0 rounded-full bg-neon-purple/25 animate-ripple"></div>
          <div class="absolute -inset-1 rounded-full bg-neon-cyan/20 animate-pulse-glow"></div>
          <div
            class="relative w-12 h-12 sm:w-16 sm:h-16 cyber-pill rounded-full shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
          >
            <iconify-icon
              icon="ph:video-camera-bold"
              class="text-2xl sm:text-3xl text-neon-purple group-hover:text-neon-pink transition-colors"
              aria-hidden="true"
            ></iconify-icon>
          </div>
        </div>
        
        <p class="mb-1 text-sm sm:text-base font-extrabold text-slate-100 group-hover:text-neon-purple transition-colors tracking-tight px-2">
          Click to upload or drag a Gemini Veo video
        </p>
        <p class="text-xs sm:text-sm text-slate-500">MP4, WebM, MOV · Audio is preserved</p>
        
        <div class="mt-3 sm:mt-4 flex flex-col items-center gap-1.5" @click.stop>
          <label class="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Watermark position:</span>
            <select
              v-model="presetId"
              class="text-xs font-semibold cyber-pill rounded-lg px-2 py-1 text-slate-200 focus:outline-none cursor-pointer"
            >
              <option v-for="p in VIDEO_PRESETS" :key="p.id" :value="p.id">{{ p.label }}</option>
            </select>
          </label>
          <p class="text-[10px] sm:text-[11px] text-slate-500 max-w-xs leading-normal">{{ currentPreset.desc }}</p>
        </div>

        <label class="mt-2.5 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 cursor-pointer" @click.stop>
          <input type="checkbox" v-model="advanced" class="w-3.5 h-3.5 rounded" />
          <span>Advanced: tune it yourself</span>
        </label>
      </div>
      <input ref="fileInput" type="file" accept="video/*" class="hidden" aria-label="Video file input" @change="onChange" />
    </div>

    <!-- Loading the preview frame -->
    <div v-else-if="status === 'loading'" class="flex flex-col items-center justify-center w-full h-56">
      <div class="w-12 h-12 rounded-full border-3 border-neon-cyan/20 border-t-neon-cyan border-r-neon-pink animate-spin mb-3"></div>
      <p class="font-bold text-neon-cyan text-sm">Loading preview…</p>
    </div>

    <!-- Preview + manual controls -->
    <div v-else-if="status === 'preview'" class="animate-fade-in">
      <div class="flex flex-col lg:flex-row gap-6">
        <div class="flex-1 min-w-0">
          <WatermarkTuner :settings="settings" :frame="frame" :bg-img="bgImg" :base="base" />
          <p class="text-xs text-slate-400 mt-3 leading-relaxed">
            Adjust the sliders until the watermark disappears in the zoomed corner. The
            <span class="text-neon-cyan font-semibold">blue box</span> shows what gets cleaned.
          </p>
        </div>

        <div class="w-full lg:w-60 flex-shrink-0">
          <div class="cyber-card rounded-2xl p-4 sm:p-5 space-y-3 sticky top-24">
            <h2 class="font-bold text-white text-sm sm:text-base">Export</h2>
            <label class="block">
              <div class="text-xs font-bold text-slate-300 mb-1">Position preset</div>
              <select
                v-model="presetId"
                class="w-full text-xs font-semibold cyber-pill rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none cursor-pointer"
              >
                <option v-for="p in VIDEO_PRESETS" :key="p.id" :value="p.id">{{ p.label }}</option>
              </select>
              <p class="text-[10px] sm:text-[11px] text-slate-500 mt-1">{{ currentPreset.desc }}</p>
            </label>
            <button @click="resetSettings" class="w-full text-xs font-semibold text-slate-400 hover:text-neon-cyan transition-colors">
              Reset sliders to preset
            </button>
            <button @click="runExport" class="btn-neon group w-full py-3 rounded-xl font-bold text-white shadow-lg shadow-neon-pink/25 transition-all">
              <div class="flex items-center justify-center gap-2 text-xs sm:text-sm">
                <iconify-icon icon="ph:sparkle-fill" width="18"></iconify-icon> Remove &amp; Export
              </div>
            </button>
            <button @click="reset" class="btn-micro-pop w-full py-2.5 cyber-pill text-slate-300 hover:text-neon-cyan rounded-xl font-bold text-xs sm:text-sm transition-all">
              Choose another video
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Processing -->
    <div v-else-if="status === 'processing'" class="flex flex-col items-center justify-center w-full h-56 px-4 sm:px-8">
      <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-3 border-neon-pink/20 border-t-neon-pink border-r-neon-cyan animate-spin mb-4"></div>
      <p class="font-bold text-neon-pink mb-3 text-sm sm:text-base">Cleaning &amp; re-encoding…</p>
      <div class="w-full max-w-md h-2.5 rounded-full bg-white/10 overflow-hidden">
        <div class="h-full bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan transition-all duration-200" :style="{ width: `${Math.round(progress * 100)}%` }"></div>
      </div>
      <p class="text-xs text-slate-500 mt-2 font-medium font-mono">{{ Math.round(progress * 100) }}% — please keep this tab open.</p>
    </div>

    <!-- Error -->
    <div v-else-if="status === 'error'" class="flex flex-col items-center justify-center w-full min-h-56 py-8 sm:py-10 text-center px-4 sm:px-6">
      <iconify-icon icon="ph:warning-circle-bold" width="36" class="text-red-500 mb-2"></iconify-icon>
      <p class="font-bold text-red-400 text-sm sm:text-base">{{ errorMsg }}</p>
      <button @click="reset" class="btn-micro-pop mt-4 px-5 py-2.5 cyber-pill text-slate-300 hover:text-neon-cyan rounded-xl font-bold text-xs sm:text-sm transition-all">
        Try Another Video
      </button>
    </div>

    <!-- Done -->
    <div v-else class="text-left mt-2 animate-fade-in">
      <div class="flex flex-col lg:flex-row gap-6">
        <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
          <div class="cyber-card rounded-xl overflow-hidden">
            <div class="px-3 py-2 border-b border-white/5 font-bold text-xs text-slate-200 bg-white/5">Original</div>
            <div class="p-2 sm:p-3 checker flex justify-center">
              <video :src="originalUrl" controls playsinline class="max-h-60 sm:max-h-72 w-full object-contain rounded"></video>
            </div>
          </div>
          <div class="cyber-card rounded-xl overflow-hidden border-neon-cyan/30 ring-1 ring-neon-cyan/20">
            <div class="bg-neon-cyan/10 px-3 py-2 border-b border-neon-cyan/20 flex items-center gap-1.5">
              <iconify-icon icon="ph:check-circle-fill" width="16" class="text-neon-cyan"></iconify-icon>
              <span class="font-bold text-neon-cyan text-xs">Cleaned</span>
            </div>
            <div class="p-2 sm:p-3 checker flex justify-center">
              <video :src="resultUrl" controls playsinline class="max-h-60 sm:max-h-72 w-full object-contain rounded"></video>
            </div>
          </div>
        </div>

        <div class="w-full lg:w-60 flex-shrink-0">
          <div class="cyber-card rounded-2xl p-4 sm:p-5 sticky top-24 space-y-2.5">
            <h2 class="font-bold text-white text-sm sm:text-base">Actions</h2>
            <button @click="download" class="btn-neon-cyan group w-full py-3 rounded-xl font-bold text-white shadow-lg shadow-neon-cyan/25 transition-all duration-300">
              <div class="flex items-center justify-center gap-2 text-xs sm:text-sm">
                <iconify-icon icon="ph:download-simple-bold" width="18"></iconify-icon> Download MP4
              </div>
            </button>
            <button v-if="advanced" @click="backToPreview" class="btn-micro-pop w-full py-2.5 cyber-pill text-slate-300 hover:text-neon-purple rounded-xl font-bold text-xs sm:text-sm transition-all">
              Adjust &amp; re-run
            </button>
            <button @click="reset" class="btn-micro-pop w-full py-2.5 cyber-pill text-slate-300 hover:text-neon-cyan rounded-xl font-bold text-xs sm:text-sm transition-all">
              Process Another
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
