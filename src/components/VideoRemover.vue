<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import WatermarkTuner from './WatermarkTuner.vue';
import { useI18n } from '../config/i18n.js';

const { t } = useI18n();

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
const advanced = ref(false);
const fileName = ref('');
const displayDimensions = ref('');

// Watermark position presets for Veo videos
const VIDEO_PRESETS = [
  {
    id: 'veo',
    label: 'Veo videos (default)',
    desc: 'Watermark slightly inset from bottom-right corner.',
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
const settings = reactive({ ...VIDEO_PRESETS[0].settings, aiRefine: false });

watch(presetId, () => {
  Object.assign(settings, currentPreset.value.settings);
});

// Preview state
const frame = ref(null);
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
  fileName.value = file.name;
  status.value = 'loading';

  try {
    engine = await getEngine();
    const f = await grabPreviewFrame(file);
    frame.value = f;
    displayDimensions.value = `${f.width}×${f.height}`;
    base.value = engine.getVeoWatermark(f.width, f.height);
    bgImg.value = engine.sparkleImage;

    if (advanced.value) {
      status.value = 'preview';
    } else {
      // Auto-process like images
      runExport();
    }
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
    v.setAttribute('webkit-playsinline', 'true');
    v.src = url;

    const cleanup = () => URL.revokeObjectURL(url);
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Video preview timeout. Please try again.'));
    }, 10000);

    v.onerror = () => { clearTimeout(timeout); cleanup(); reject(new Error('Could not read this video file.')); };
    v.onloadedmetadata = () => {
      const seekTo = Math.min(Math.max((v.duration || 1) * 0.3, 0.1), (v.duration || 1) - 0.05 || 0.1);
      const onSeeked = () => {
        try {
          clearTimeout(timeout);
          const w = v.videoWidth, h = v.videoHeight;
          if (w === 0 || h === 0) {
             throw new Error('Invalid video dimensions');
          }
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          const cx = c.getContext('2d', { willReadFrequently: true });
          cx.drawImage(v, 0, 0, w, h);
          const imageData = cx.getImageData(0, 0, w, h);
          cleanup();
          resolve({ width: w, height: h, imageData });
        } catch (err) { clearTimeout(timeout); cleanup(); reject(err); }
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

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('GemClean AI', {
        body: 'Your video processing is complete! 🎬',
        icon: '/assets/mascot-logo.png',
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

function openDonate() {
  window.dispatchEvent(new CustomEvent('open-donate'));
}

async function shareVideo() {
  if (!resultUrl.value || !navigator.share) return;
  try {
    const res = await fetch(resultUrl.value);
    const blob = await res.blob();
    const file = new File([blob], downloadName.value, { type: 'video/mp4' });
    await navigator.share({
      title: 'GemClean AI - Cleaned Video',
      text: 'Watermark removed from video! 🎬',
      files: [file],
    });
  } catch (e) {
    if (e.name !== 'AbortError') console.error('Share failed:', e);
  }
}

const canShare = typeof navigator !== 'undefined' && !!navigator.share;

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
  <div class="relative z-10">
    <!-- Unsupported -->
    <div
      v-if="!supported"
      class="flex flex-col items-center justify-center w-full h-48 rounded-xl bg-red-500/5 border border-red-500/20 text-center px-4"
    >
      <iconify-icon icon="ph:warning-circle-bold" width="32" class="text-red-500 mb-1.5"></iconify-icon>
      <p class="font-bold text-red-400 text-sm">Browser doesn't support local video processing.</p>
      <p class="text-xs text-red-500/80 mt-0.5">Please try the latest Chrome, Edge, or Safari.</p>
    </div>

    <!-- Upload (Compact) -->
    <div
      v-else-if="status === 'idle'"
      class="group relative flex flex-col items-center justify-center w-full min-h-[11rem] sm:min-h-[13rem] py-5 sm:py-7 px-4 rounded-2xl neu-dropzone transition-all cursor-pointer select-none"
      :class="dragOver ? '!border-neon-purple scale-[1.01]' : ''"
      role="button" tabindex="0" aria-label="Upload a video"
      @click="openPicker" @keydown.enter="openPicker"
      @dragover.prevent="dragOver = true" @dragenter.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false" @drop.prevent="onDrop"
    >
      <div class="flex flex-col items-center justify-center relative text-center">
        <div class="relative flex items-center justify-center mb-2.5">
          <div class="absolute inset-0 rounded-full bg-neon-purple/15 animate-ripple"></div>
          <div
            class="relative w-11 h-11 sm:w-13 sm:h-13 neu-pill rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
          >
            <iconify-icon
              icon="ph:video-camera-bold"
              class="text-xl sm:text-2xl text-neon-purple group-hover:text-neon-pink transition-colors"
              aria-hidden="true"
            ></iconify-icon>
          </div>
        </div>
        
        <p class="mb-0.5 text-xs sm:text-sm font-bold text-slate-100 group-hover:text-neon-purple transition-colors tracking-tight px-2">
          Click to upload or drag a Gemini Veo video
        </p>
        <p class="text-[11px] text-slate-500">MP4, WebM, MOV · Lossless audio preservation</p>
        
        <label class="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 cursor-pointer" @click.stop>
          <input type="checkbox" v-model="advanced" class="w-3.5 h-3.5 rounded" />
          <span>Advanced: reposition target box</span>
        </label>
      </div>
      <input ref="fileInput" type="file" accept="video/*" class="hidden" aria-label="Video file input" @change="onChange" />
    </div>

    <!-- Loading Preview Frame -->
    <div v-else-if="status === 'loading'" class="flex flex-col items-center justify-center w-full h-44">
      <div class="w-10 h-10 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin mb-2.5"></div>
      <p class="font-bold text-neon-cyan text-xs">Loading video frame…</p>
    </div>

    <!-- Preview & Controls -->
    <div v-else-if="status === 'preview'" class="animate-fade-in">
      <div class="flex flex-col lg:flex-row gap-3.5 sm:gap-5">
        <div class="flex-1 min-w-0">
          <WatermarkTuner :settings="settings" :frame="frame" :bg-img="bgImg" :base="base" />
        </div>

        <div class="hidden lg:block w-56 flex-shrink-0">
          <div class="neu-card rounded-xl p-3.5 space-y-2.5 sticky top-20">
            <h2 class="font-bold text-white text-xs uppercase tracking-wider text-slate-400">Export</h2>
            <label class="block">
              <div class="text-[11px] font-bold text-slate-300 mb-1">Preset</div>
              <select
                v-model="presetId"
                class="w-full text-xs font-semibold neu-pill rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none cursor-pointer"
              >
                <option v-for="p in VIDEO_PRESETS" :key="p.id" :value="p.id">{{ p.label }}</option>
              </select>
            </label>
            <button @click="resetSettings" class="w-full text-[11px] font-semibold text-slate-400 hover:text-neon-cyan transition-colors py-0.5">
              Reset sliders
            </button>

            <label class="flex items-center gap-2 px-1 py-1 cursor-pointer group">
              <input type="checkbox" v-model="settings.aiRefine" class="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-neon-cyan focus:ring-neon-cyan" />
              <div class="flex flex-col">
                <span class="text-[11px] font-bold text-slate-200 group-hover:text-neon-cyan transition-colors">AI Refine (Perfect)</span>
                <span class="text-[9px] text-slate-500 leading-tight">Removes ghosting artifacts frame-by-frame</span>
              </div>
            </label>

            <button @click="runExport" class="btn-neon group w-full py-2.5 rounded-lg font-bold text-white text-xs transition-all">
              <div class="flex items-center justify-center gap-1.5">
                <iconify-icon icon="ph:sparkle-fill" width="16"></iconify-icon> Export Clean
              </div>
            </button>
            <button @click="reset" class="btn-cyber-secondary btn-micro-pop text-xs py-2">
              <iconify-icon icon="ph:arrow-counter-clockwise-bold" width="15" class="text-neon-cyan"></iconify-icon>
              <span>{{ t('processAnother') }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="lg:hidden mt-3">
        <div class="neu-card rounded-xl p-3 space-y-2">
          <button @click="runExport" class="btn-neon group w-full py-2.5 rounded-lg font-bold text-white text-xs">
            <div class="flex items-center justify-center gap-1.5">
              <iconify-icon icon="ph:sparkle-fill" width="16"></iconify-icon> Export Clean
            </div>
          </button>
          <button @click="reset" class="btn-cyber-secondary btn-micro-pop text-xs py-2">
            <iconify-icon icon="ph:arrow-counter-clockwise-bold" width="15" class="text-neon-cyan"></iconify-icon>
            <span>{{ t('processAnother') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Processing -->
    <div v-else-if="status === 'processing'" class="flex flex-col items-center justify-center w-full h-44 px-4 sm:px-6">
      <div class="w-10 h-10 rounded-full border-2 border-neon-pink/20 border-t-neon-pink border-r-neon-cyan animate-spin mb-3"></div>
      <p class="font-bold text-neon-pink mb-2 text-xs sm:text-sm">Cleaning &amp; re-encoding…</p>
      <div class="w-full max-w-sm h-2 rounded-full neu-inset overflow-hidden">
        <div class="h-full bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan transition-all duration-200 rounded-full" :style="{ width: `${Math.round(progress * 100)}%` }"></div>
      </div>
      <p class="text-[10px] text-slate-500 mt-1.5 font-medium font-mono">{{ Math.round(progress * 100) }}% complete</p>
    </div>

    <!-- Error -->
    <div v-else-if="status === 'error'" class="flex flex-col items-center justify-center w-full min-h-44 py-6 text-center px-4">
      <iconify-icon icon="ph:warning-circle-bold" width="30" class="text-red-500 mb-1.5"></iconify-icon>
      <p class="font-bold text-red-400 text-xs sm:text-sm">{{ errorMsg }}</p>
      <button @click="reset" class="btn-cyber-secondary btn-micro-pop !w-auto mt-3 text-xs py-1.5 px-3">
        <iconify-icon icon="ph:arrow-counter-clockwise-bold" width="14" class="text-neon-cyan"></iconify-icon>
        <span>{{ t('processAnother') }}</span>
      </button>
    </div>

    <!-- Done (Result Card) -->
    <div v-else class="text-left animate-fade-in">
      <div class="flex flex-col lg:flex-row gap-3.5 sm:gap-5">
        <div class="flex-1 space-y-3 sm:space-y-4 min-w-0">
          <div class="p-3 sm:p-3.5 neu-card rounded-xl space-y-2.5">
            <!-- Card Header -->
            <div class="flex items-center justify-between border-b border-white/5 pb-2 flex-wrap gap-1.5">
              <div class="flex items-center gap-2 overflow-hidden">
                <h3 class="font-bold text-white text-xs truncate max-w-[180px] sm:max-w-xs">{{ fileName }}</h3>
                <span class="text-[9px] font-mono font-bold text-neon-cyan bg-neon-cyan/10 px-1.5 py-0.2 rounded-full flex-shrink-0">
                  {{ settings.aiRefine ? '✨ AI Refined' : '✨ Auto' }}
                </span>
              </div>
            </div>

            <!-- Video Side-by-Side -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <!-- Original -->
              <div class="neu-card rounded-lg overflow-hidden relative">
                <div class="px-2.5 py-1 border-b border-white/5 flex justify-between items-center bg-white/2">
                  <span class="font-bold text-slate-300 text-[10px]">Original</span>
                  <span class="text-[9px] font-mono text-slate-400">{{ displayDimensions }}</span>
                </div>
                <div class="p-1.5 checker flex items-center justify-center">
                  <video :src="originalUrl" controls playsinline class="max-h-48 sm:max-h-56 w-full object-contain rounded"></video>
                </div>
              </div>

              <!-- Cleaned -->
              <div class="neu-card rounded-lg overflow-hidden border-neon-cyan/20">
                <div class="px-2.5 py-1 border-b border-neon-cyan/10 bg-neon-cyan/5 flex justify-between items-center">
                  <span class="font-bold text-neon-cyan text-[10px]">Cleaned</span>
                  <span class="text-[9px] font-mono text-neon-cyan font-bold">100% Lossless</span>
                </div>
                <div class="p-1.5 checker flex justify-center">
                  <video :src="resultUrl" controls playsinline class="max-h-48 sm:max-h-56 w-full object-contain rounded"></video>
                </div>
              </div>
            </div>

            <!-- Controls Row -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/5 text-xs">
              <button
                @click="backToPreview(); settings.aiRefine = !settings.aiRefine;"
                class="btn-micro-pop neu-pill px-2.5 py-1.5 font-bold text-slate-200 hover:text-neon-cyan rounded-lg transition-all flex items-center gap-1 min-h-[34px]"
              >
                <iconify-icon icon="ph:magic-wand-bold" class="text-neon-cyan" width="13"></iconify-icon>
                <span>{{ settings.aiRefine ? 'Disable Refine' : 'AI Refine' }}</span>
              </button>

              <div class="flex-1"></div>

              <button
                @click="download"
                class="btn-micro-pop flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-neon-cyan hover:bg-neon-cyan/90 rounded-lg transition-all min-h-[34px]"
              >
                <iconify-icon icon="ph:download-simple-bold" width="13"></iconify-icon>
                <span>Download</span>
              </button>

              <button
                v-if="canShare"
                @click="shareVideo"
                class="btn-micro-pop neu-pill p-1.5 text-slate-200 hover:text-neon-green rounded-lg transition-all flex items-center justify-center min-w-[34px] min-h-[34px]"
                title="Share"
              >
                <iconify-icon icon="ph:share-network-bold" width="14"></iconify-icon>
              </button>

              <button
                @click="openDonate"
                class="btn-micro-pop neu-pill px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:text-neon-pink rounded-lg transition-all flex items-center gap-1 min-h-[34px]"
                title="Support this project"
              >
                <iconify-icon icon="ph:heart-bold" width="13" class="text-neon-pink"></iconify-icon>
                <span>Donate</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Desktop Action Sidebar -->
        <div class="hidden lg:block w-56 flex-shrink-0">
          <div class="neu-card rounded-xl p-3.5 sticky top-20 space-y-2.5">
            <h2 class="font-bold text-white text-xs uppercase tracking-wider text-slate-400">Actions</h2>
            <button @click="download" class="btn-neon-cyan group w-full py-2.5 rounded-lg font-bold text-white text-xs transition-all">
              <div class="flex items-center justify-center gap-1.5">
                <iconify-icon icon="ph:download-simple-bold" width="16"></iconify-icon> Download MP4
              </div>
            </button>
            <button @click="backToPreview" class="btn-cyber-secondary btn-micro-pop text-xs py-2">
              <iconify-icon icon="ph:sliders-horizontal-bold" width="14" class="text-neon-purple"></iconify-icon>
              <span>Adjust &amp; re-run</span>
            </button>
            <button @click="reset" class="btn-cyber-secondary btn-micro-pop text-xs py-2">
              <iconify-icon icon="ph:arrow-counter-clockwise-bold" width="15" class="text-neon-cyan"></iconify-icon>
              <span>{{ t('processAnother') }}</span>
            </button>
          </div>
        </div>
      </div>

              <div class="flex items-center justify-center gap-1.5">
                <iconify-icon icon="ph:download-simple-bold" width="16"></iconify-icon> Download MP4
              </div>
            </button>
            <button @click="backToPreview" class="btn-cyber-secondary btn-micro-pop text-xs py-2">
              <iconify-icon icon="ph:sliders-horizontal-bold" width="14" class="text-neon-purple"></iconify-icon>
              <span>Adjust &amp; re-run</span>
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
          <button @click="download" class="btn-neon-cyan group w-full py-2.5 rounded-lg font-bold text-white text-xs transition-all">
            <div class="flex items-center justify-center gap-1.5">
              <iconify-icon icon="ph:download-simple-bold" width="16"></iconify-icon> Download MP4
            </div>
          </button>
          <button @click="backToPreview" class="btn-cyber-secondary btn-micro-pop text-xs py-2">
            <iconify-icon icon="ph:sliders-horizontal-bold" width="14" class="text-neon-purple"></iconify-icon>
            <span>Adjust &amp; re-run</span>
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
