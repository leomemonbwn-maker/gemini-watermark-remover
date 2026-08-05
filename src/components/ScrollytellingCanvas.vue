<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const TOTAL_FRAMES = 60;
const canvasRef = ref(null);
const progress = ref(0); // 0 to 1
const isPlaying = ref(true);

const stages = [
  {
    id: 1,
    range: [0, 0.25],
    targetProgress: 0.1,
    tag: '01 / STAGE ORIGIN',
    title: 'Original Gemini Watermark',
    desc: 'Google embeds a ✦ sparkle logo in the corner as an alpha opacity blend layer during AI image generation.',
    icon: 'ph:sparkle-bold',
    color: 'teal'
  },
  {
    id: 2,
    range: [0.25, 0.55],
    targetProgress: 0.4,
    tag: '02 / DISASSEMBLY MODE',
    title: 'Inverse Matrix Unblending',
    desc: 'GemClean AI isolates the alpha channel overlay and detaches the watermark particles from the background image.',
    icon: 'ph:intersect-bold',
    color: 'cyan'
  },
  {
    id: 3,
    range: [0.55, 0.85],
    targetProgress: 0.7,
    tag: '03 / RECONSTRUCTION',
    title: 'Mathematical Pixel Restoration',
    desc: 'The original RGB pixel matrix is calculated with 100% mathematical precision with zero compression artifacts.',
    icon: 'ph:cpu-bold',
    color: 'purple'
  },
  {
    id: 4,
    range: [0.85, 1.0],
    targetProgress: 1.0,
    tag: '04 / PRISTINE OUTPUT',
    title: 'Lossless Export Ready',
    desc: 'Your image is restored to pristine original condition. Download clean PNG/MP4 or copy straight to clipboard.',
    icon: 'ph:check-circle-bold',
    color: 'teal'
  }
];

const currentStageIndex = computed(() => {
  const p = progress.value;
  if (p < 0.25) return 0;
  if (p < 0.55) return 1;
  if (p < 0.85) return 2;
  return 3;
});

const currentStage = computed(() => stages[currentStageIndex.value]);

let animLoopId = null;
let lastTimestamp = 0;
let targetAnimProgress = null;

function renderFrame(ctx, width, height, p) {
  const cx = width / 2;
  const cy = height / 2;

  // Background fill matching obsidian dark background #080C15
  ctx.fillStyle = '#080C15';
  ctx.fillRect(0, 0, width, height);

  // Ambient aura
  const auraGradient = ctx.createRadialGradient(cx, cy, 30, cx, cy, width * 0.48);
  auraGradient.addColorStop(0, `rgba(16, 185, 129, ${0.18 - p * 0.06})`);
  auraGradient.addColorStop(0.5, `rgba(6, 182, 212, ${0.15 + p * 0.08})`);
  auraGradient.addColorStop(1, 'rgba(8, 12, 21, 0)');
  ctx.fillStyle = auraGradient;
  ctx.fillRect(0, 0, width, height);

  // ── LAYER 1: Core AI Image Base Card ──
  const cardSize = width * 0.62;
  const cardX = cx - cardSize / 2;
  const cardY = cy - cardSize / 2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardSize, cardSize, 18);
  ctx.fillStyle = '#111827';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = `rgba(16, 185, 129, ${0.4 + p * 0.4})`;
  ctx.stroke();

  // Vibrant gradient landscape
  const imgGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardSize, cardY + cardSize);
  imgGrad.addColorStop(0, '#1e1b4b');
  imgGrad.addColorStop(0.5, '#065f46');
  imgGrad.addColorStop(1, '#0e7490');
  ctx.fillStyle = imgGrad;
  ctx.fill();

  // Decorative Moon
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.arc(cardX + cardSize * 0.28, cardY + cardSize * 0.28, cardSize * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // Mountains
  ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
  ctx.beginPath();
  ctx.moveTo(cardX + cardSize * 0.1, cardY + cardSize * 0.85);
  ctx.lineTo(cardX + cardSize * 0.45, cardY + cardSize * 0.42);
  ctx.lineTo(cardX + cardSize * 0.8, cardY + cardSize * 0.85);
  ctx.fill();
  ctx.restore();

  // ── LAYER 2: Exploding / Disassembling Watermark Sparkle Overlay ──
  const wmSize = cardSize * 0.22;
  const baseWmX = cardX + cardSize - wmSize - cardSize * 0.08;
  const baseWmY = cardY + cardSize - wmSize - cardSize * 0.08;

  const explodeY = p * (cardSize * 0.65);
  const explodeX = Math.sin(p * Math.PI * 2) * (cardSize * 0.18);
  const wmOpacity = Math.max(0, 1 - p * 1.35);
  const wmScale = 1 + p * 1.5;

  if (wmOpacity > 0.01) {
    ctx.save();
    ctx.translate(baseWmX + wmSize / 2 + explodeX, baseWmY + wmSize / 2 - explodeY);
    ctx.scale(wmScale, wmScale);
    ctx.rotate(p * Math.PI * 1.5);

    const sparkGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, wmSize);
    sparkGlow.addColorStop(0, `rgba(236, 72, 153, ${wmOpacity * 0.85})`);
    sparkGlow.addColorStop(0.5, `rgba(168, 85, 247, ${wmOpacity * 0.5})`);
    sparkGlow.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = sparkGlow;
    ctx.beginPath();
    ctx.arc(0, 0, wmSize, 0, Math.PI * 2);
    ctx.fill();

    // Four-point AI Sparkle Star
    ctx.fillStyle = `rgba(255, 255, 255, ${wmOpacity * 0.95})`;
    ctx.beginPath();
    const rOuter = wmSize * 0.45;
    const rInner = wmSize * 0.12;
    for (let i = 0; i < 8; i++) {
      const radius = i % 2 === 0 ? rOuter : rInner;
      const angle = (i * Math.PI) / 4;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ── LAYER 3: Dissolving Pixel Particles ──
  if (p > 0.12) {
    const particleCount = 24;
    for (let i = 0; i < particleCount; i++) {
      const seed = i * 137.5;
      const pRadius = 25 + ((seed * 11) % 130) * p;
      const pAngle = (seed * Math.PI) / 180 + p * 4.5;
      const px = baseWmX + wmSize / 2 + Math.cos(pAngle) * pRadius + explodeX * 0.5;
      const py = baseWmY + wmSize / 2 + Math.sin(pAngle) * pRadius - explodeY * 0.7;
      const pAlpha = Math.max(0, Math.sin(p * Math.PI) * (1 - i / particleCount));
      const pSize = 2 + (i % 3);

      ctx.fillStyle = i % 3 === 0
        ? `rgba(16, 185, 129, ${pAlpha})`
        : i % 3 === 1
        ? `rgba(6, 182, 212, ${pAlpha})`
        : `rgba(236, 72, 153, ${pAlpha})`;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── LAYER 4: Scanning Laser Matrix Line ──
  const scanY = cardY + (cardSize * (p * 1.4 - 0.2));
  if (scanY >= cardY && scanY <= cardY + cardSize) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardSize, cardSize, 18);
    ctx.clip();

    const laserGrad = ctx.createLinearGradient(cardX, scanY, cardX + cardSize, scanY);
    laserGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
    laserGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.95)');
    laserGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = laserGrad;
    ctx.fillRect(cardX, scanY - 1.5, cardSize, 3);
    ctx.restore();
  }
}

function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  renderFrame(ctx, canvas.width, canvas.height, progress.value);
}

// Track visibility — don't burn GPU when component is scrolled out of view
let isVisible = false;

function startLoop() {
  if (animLoopId) return; // already running
  lastTimestamp = 0;
  animLoopId = requestAnimationFrame(tick);
}

function stopLoop() {
  if (animLoopId) {
    cancelAnimationFrame(animLoopId);
    animLoopId = null;
  }
}

function tick(timestamp) {
  animLoopId = null; // clear so startLoop() can re-enter

  if (!isVisible) return; // off-screen: stop loop completely

  if (!lastTimestamp) lastTimestamp = timestamp;
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  let needsNextFrame = false;

  if (targetAnimProgress !== null) {
    const diff = targetAnimProgress - progress.value;
    if (Math.abs(diff) < 0.005) {
      progress.value = targetAnimProgress;
      targetAnimProgress = null;
      draw();
      // Animation complete — only continue if playing
      needsNextFrame = isPlaying.value;
    } else {
      progress.value += diff * 0.12;
      draw();
      needsNextFrame = true;
    }
  } else if (isPlaying.value) {
    progress.value += delta * 0.2;
    if (progress.value > 1) progress.value = 0;
    draw();
    needsNextFrame = true;
  }

  // Only request next frame if we actually need to animate
  if (needsNextFrame) {
    animLoopId = requestAnimationFrame(tick);
  }
}

function togglePlay() {
  isPlaying.value = !isPlaying.value;
  targetAnimProgress = null;
  if (isPlaying.value && isVisible) startLoop();
}

function setStage(stage) {
  isPlaying.value = false;
  targetAnimProgress = stage.targetProgress;
  if (isVisible) startLoop();
}

function onSliderInput(e) {
  isPlaying.value = false;
  targetAnimProgress = null;
  progress.value = parseFloat(e.target.value) / 100;
  draw();
}

const containerRef = ref(null);
let visibilityObserver = null;

onMounted(() => {
  const isMobile = window.innerWidth < 768;
  const canvas = canvasRef.value;
  if (canvas) {
    // Smaller canvas on mobile = less pixels to fill per frame
    canvas.width = isMobile ? 400 : 560;
    canvas.height = isMobile ? 400 : 560;
  }
  draw();

  // Only run animation loop when component is in viewport
  visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible && (isPlaying.value || targetAnimProgress !== null)) {
        startLoop();
      } else {
        stopLoop();
      }
    },
    { threshold: 0.05 }
  );

  if (containerRef.value) {
    visibilityObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  stopLoop();
  if (visibilityObserver) visibilityObserver.disconnect();
});
</script>

<template>
  <div ref="containerRef" class="w-full max-w-6xl mx-auto my-4 sm:my-8 text-left">
    
    <!-- Outer Glass Visualizer Container -->
    <div class="liquid-glass-card pro-gradient-border p-4 sm:p-6 lg:p-8 rounded-3xl shadow-2xl overflow-hidden">
      
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        
        <!-- LEFT COLUMN: Canvas Visualizer Deck (7 cols) -->
        <div class="lg:col-span-7 flex flex-col items-center">
          
          <!-- Obsidian Canvas Frame Box -->
          <div class="relative w-full aspect-square max-w-[440px] bg-[#080C15] rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-teal-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col justify-between overflow-hidden">
            
            <!-- Top Status Bar -->
            <div class="flex items-center justify-between z-10 text-[10px] sm:text-xs font-mono font-bold">
              <div class="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/50 border border-teal-500/30 text-teal-400">
                <span class="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                <span>60 FPS DISASSEMBLY</span>
              </div>
              <div class="px-2.5 py-1 rounded-full bg-black/50 border border-blue-500/30 text-blue-400">
                FRAME {{ Math.min(Math.floor(progress * TOTAL_FRAMES) + 1, TOTAL_FRAMES) }}/{{ TOTAL_FRAMES }}
              </div>
            </div>

            <!-- Canvas Center -->
            <div class="relative w-full flex-1 flex items-center justify-center py-2">
              <canvas
                ref="canvasRef"
                class="w-full h-full object-contain rounded-xl"
              ></canvas>
            </div>

            <!-- Bottom Progress Pill inside frame -->
            <div class="flex items-center justify-between z-10 text-[10px] sm:text-xs font-mono text-slate-400 px-1">
              <span class="text-teal-400 font-bold">STAGE {{ currentStageIndex + 1 }}/4</span>
              <span class="font-extrabold text-white">{{ Math.round(progress * 100) }}% RESTORED</span>
            </div>

          </div>

          <!-- Interactive Control Strip -->
          <div class="w-full max-w-[440px] mt-4 flex items-center gap-3 bg-white/40 dark:bg-black/30 backdrop-blur-md p-2 sm:p-3 rounded-2xl border border-gray-200 dark:border-white/10 shadow-md">
            
            <!-- Play/Pause Toggle Button -->
            <button
              @click="togglePlay"
              class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/25 active:scale-95 transition-transform shrink-0"
              :aria-label="isPlaying ? 'Pause Simulation' : 'Play Simulation'"
            >
              <iconify-icon :icon="isPlaying ? 'ph:pause-fill' : 'ph:play-fill'" class="text-lg"></iconify-icon>
            </button>

            <!-- Scrubber Slider -->
            <div class="flex-1 flex flex-col justify-center px-1">
              <div class="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                <span>Original</span>
                <span class="text-teal-500 dark:text-teal-400">Drag to Unblend</span>
                <span>Lossless</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                :value="progress * 100"
                @input="onSliderInput"
                class="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-teal-500 focus:outline-none"
              />
            </div>

          </div>

        </div>

        <!-- RIGHT COLUMN: Interactive Stage Breakdown Cards (5 cols) -->
        <div class="lg:col-span-5 flex flex-col gap-2.5 sm:gap-3">
          
          <div class="mb-1">
            <span class="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-teal-500 dark:text-teal-400">Interactive Breakdown</span>
            <h3 class="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">Deconstruction Steps</h3>
          </div>

          <!-- Step Items (Clickable to jump) -->
          <div
            v-for="(stg, idx) in stages"
            :key="stg.id"
            @click="setStage(stg)"
            :class="[
              'cursor-pointer p-3 sm:p-4 rounded-2xl border transition-all duration-300 relative text-left',
              currentStageIndex === idx
                ? 'bg-teal-500/10 dark:bg-teal-500/15 border-teal-500/50 shadow-md shadow-teal-500/10 translate-x-1'
                : 'bg-white/50 dark:bg-white/5 border-gray-200/60 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20 hover:bg-white/70 dark:hover:bg-white/10 opacity-75 hover:opacity-100'
            ]"
          >
            <div class="flex items-start gap-3">
              <div
                :class="[
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm transition-colors',
                  currentStageIndex === idx
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-500/30'
                    : 'bg-gray-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400'
                ]"
              >
                <iconify-icon :icon="stg.icon"></iconify-icon>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-0.5">
                  <span
                    :class="[
                      'text-[9px] font-extrabold font-mono uppercase tracking-widest',
                      currentStageIndex === idx ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'
                    ]"
                  >
                    {{ stg.tag }}
                  </span>
                  <span
                    v-if="currentStageIndex === idx"
                    class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-600 dark:text-teal-400 animate-pulse"
                  >
                    ACTIVE
                  </span>
                </div>

                <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  {{ stg.title }}
                </h4>
                <p class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mt-0.5 line-clamp-2">
                  {{ stg.desc }}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>

  </div>
</template>
