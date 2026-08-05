<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const TOTAL_FRAMES = 60;
const containerRef = ref(null);
const canvasRef = ref(null);
const scrollProgress = ref(0);
const currentFrameIndex = ref(0);

// Offscreen canvases storing pre-rendered frame images for 60fps instant playback
let frameCanvases = [];
let animFrameId = null;

// Pre-render procedural 3D exploding disassembly sequence into offscreen canvases
function preRenderFrames() {
  const width = 800;
  const height = 800;
  frameCanvases = [];

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const ctx = offCanvas.getContext('2d');

    const progress = i / (TOTAL_FRAMES - 1); // 0.0 to 1.0
    const cx = width / 2;
    const cy = height / 2;

    // Background fill matching obsidian dark background #080C15
    ctx.fillStyle = '#080C15';
    ctx.fillRect(0, 0, width, height);

    // Subtle background ambient aura grid
    const auraGradient = ctx.createRadialGradient(cx, cy, 50, cx, cy, 350);
    auraGradient.addColorStop(0, `rgba(16, 185, 129, ${0.15 - progress * 0.05})`);
    auraGradient.addColorStop(0.5, `rgba(6, 182, 212, ${0.12 + progress * 0.08})`);
    auraGradient.addColorStop(1, 'rgba(8, 12, 21, 0)');
    ctx.fillStyle = auraGradient;
    ctx.fillRect(0, 0, width, height);

    // ── LAYER 1: Core AI Image Base Canvas Frame ──
    const cardSize = 420;
    const cardX = cx - cardSize / 2;
    const cardY = cy - cardSize / 2;

    ctx.save();
    // Rounded Card Frame
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardSize, cardSize, 28);
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(16, 185, 129, ${0.4 + progress * 0.4})`;
    ctx.stroke();

    // Simulated Image Content (Vibrant Aurora Landscape)
    const imgGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardSize, cardY + cardSize);
    imgGrad.addColorStop(0, '#1e1b4b');
    imgGrad.addColorStop(0.5, '#065f46');
    imgGrad.addColorStop(1, '#0e7490');
    ctx.fillStyle = imgGrad;
    ctx.fill();

    // Decorative Mountain & Moon Shapes on Card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(cardX + 120, cardY + 120, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.beginPath();
    ctx.moveTo(cardX + 40, cardY + 360);
    ctx.lineTo(cardX + 180, cardY + 180);
    ctx.lineTo(cardX + 320, cardY + 360);
    ctx.fill();
    ctx.restore();

    // ── LAYER 2: Exploding / Disassembling Watermark Sparkle Overlay ──
    const wmSize = 70;
    const baseWmX = cardX + cardSize - wmSize - 30;
    const baseWmY = cardY + cardSize - wmSize - 30;

    const explodeY = progress * 240; // moves upwards
    const explodeX = Math.sin(progress * Math.PI * 2) * 60; // floats sideways
    const wmOpacity = Math.max(0, 1 - progress * 1.3); // fades out by 75% scroll
    const wmScale = 1 + progress * 1.8;

    if (wmOpacity > 0.01) {
      ctx.save();
      ctx.translate(baseWmX + wmSize / 2 + explodeX, baseWmY + wmSize / 2 - explodeY);
      ctx.scale(wmScale, wmScale);
      ctx.rotate(progress * Math.PI * 1.5);

      const sparkGlow = ctx.createRadialGradient(0, 0, 5, 0, 0, wmSize);
      sparkGlow.addColorStop(0, `rgba(236, 72, 153, ${wmOpacity * 0.8})`);
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
      for (let p = 0; p < 8; p++) {
        const radius = p % 2 === 0 ? rOuter : rInner;
        const angle = (p * Math.PI) / 4;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // ── LAYER 3: Dissolving Pixel Particles ──
    if (progress > 0.15) {
      const particleCount = 28;
      for (let p = 0; p < particleCount; p++) {
        const seed = p * 137.5;
        const pRadius = 60 + ((seed * 11) % 180) * progress;
        const pAngle = (seed * Math.PI) / 180 + progress * 4;
        const px = baseWmX + wmSize / 2 + Math.cos(pAngle) * pRadius + explodeX * 0.5;
        const py = baseWmY + wmSize / 2 + Math.sin(pAngle) * pRadius - explodeY * 0.7;
        const pAlpha = Math.max(0, Math.sin(progress * Math.PI) * (1 - p / particleCount));
        const pSize = 3 + (p % 4);

        ctx.fillStyle = p % 3 === 0
          ? `rgba(16, 185, 129, ${pAlpha})`
          : p % 3 === 1
          ? `rgba(6, 182, 212, ${pAlpha})`
          : `rgba(236, 72, 153, ${pAlpha})`;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── LAYER 4: Scanning Laser Matrix Line ──
    const scanY = cardY + (cardSize * (progress * 1.5 - 0.25));
    if (scanY >= cardY && scanY <= cardY + cardSize) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardSize, cardSize, 28);
      ctx.clip();

      const laserGrad = ctx.createLinearGradient(cardX, scanY, cardX + cardSize, scanY);
      laserGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
      laserGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.9)');
      laserGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');

      ctx.fillStyle = laserGrad;
      ctx.fillRect(cardX, scanY - 2, cardSize, 4);

      const glowGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      glowGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
      glowGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.25)');
      glowGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(cardX, scanY - 30, cardSize, 60);
      ctx.restore();
    }

    frameCanvases.push(offCanvas);
  }
}

// Blit the currently computed frame to the on-screen canvas
function drawCurrentFrame() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const source = frameCanvases[currentFrameIndex.value];
  if (source) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  }
}

function onScroll() {
  const el = containerRef.value;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  
  const totalScrollable = rect.height - windowHeight;
  if (totalScrollable <= 0) return;

  const currentScroll = -rect.top;
  const rawProgress = Math.min(Math.max(currentScroll / totalScrollable, 0), 1);

  scrollProgress.value = rawProgress;
  const targetFrame = Math.min(
    Math.floor(rawProgress * TOTAL_FRAMES),
    TOTAL_FRAMES - 1
  );

  if (targetFrame !== currentFrameIndex.value) {
    currentFrameIndex.value = targetFrame;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(drawCurrentFrame);
  }
}

onMounted(() => {
  preRenderFrames();
  drawCurrentFrame();
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
  if (animFrameId) cancelAnimationFrame(animFrameId);
});
</script>

<template>
  <!-- 300vh Scroll Pin Track Container -->
  <section ref="containerRef" class="relative h-[300vh] w-full select-none">
    
    <!-- Sticky Viewport Canvas Frame -->
    <div class="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden z-10 px-2 sm:px-4">
      
      <!-- Canvas Display -->
      <div class="relative w-full max-w-2xl aspect-square flex items-center justify-center p-2 sm:p-4">
        <canvas
          ref="canvasRef"
          width="800"
          height="800"
          class="w-full h-full object-contain rounded-2xl sm:rounded-3xl shadow-2xl drop-shadow-[0_20px_50px_rgba(16,185,129,0.25)]"
        ></canvas>

        <!-- Progress Indicator Ring -->
        <div class="absolute bottom-3 right-3 sm:bottom-6 sm:right-8 liquid-glass-pill px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-emerald-500/40 text-[10px] sm:text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 sm:gap-2 shadow-lg backdrop-blur-md">
          <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>FRAME {{ currentFrameIndex + 1 }}/{{ TOTAL_FRAMES }}</span>
          <span class="text-slate-500">•</span>
          <span>{{ Math.round(scrollProgress * 100) }}%</span>
        </div>
      </div>

      <!-- ── SCROLLYTELLING OVERLAY STORY CARDS (Responsive Positioning) ── -->
      <!-- Card 1: 0% - 25% Scroll -->
      <div
        :class="[
          'absolute left-3 right-3 sm:left-6 sm:right-auto md:left-16 bottom-14 sm:bottom-20 md:top-1/3 md:bottom-auto max-w-sm mx-auto md:mx-0 liquid-glass-card pro-gradient-border p-4 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-700 pointer-events-none',
          scrollProgress >= 0.0 && scrollProgress < 0.25
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-6 scale-95'
        ]"
      >
        <span class="text-[9px] sm:text-[10px] font-extrabold font-mono text-emerald-400 uppercase tracking-widest block mb-0.5 sm:mb-1">01 / STAGE ORIGIN</span>
        <h3 class="text-sm sm:text-lg font-extrabold text-white mb-1">Original Gemini Watermark</h3>
        <p class="text-[11px] sm:text-xs text-slate-300 font-medium leading-relaxed m-0">
          Google embeds a ✦ sparkle logo in the corner as an alpha opacity blend layer during AI image generation.
        </p>
      </div>

      <!-- Card 2: 25% - 55% Scroll -->
      <div
        :class="[
          'absolute left-3 right-3 sm:right-6 sm:left-auto md:right-16 bottom-14 sm:bottom-20 md:top-1/3 md:bottom-auto max-w-sm mx-auto md:mx-0 liquid-glass-card pro-gradient-border p-4 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-700 pointer-events-none',
          scrollProgress >= 0.25 && scrollProgress < 0.55
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-6 scale-95'
        ]"
      >
        <span class="text-[9px] sm:text-[10px] font-extrabold font-mono text-cyan-400 uppercase tracking-widest block mb-0.5 sm:mb-1">02 / DISASSEMBLY MODE</span>
        <h3 class="text-sm sm:text-lg font-extrabold text-white mb-1">Inverse Matrix Unblending</h3>
        <p class="text-[11px] sm:text-xs text-slate-300 font-medium leading-relaxed m-0">
          As you scroll, GemClean AI isolates the alpha channel overlay and detaches the watermark particles from the background image.
        </p>
      </div>

      <!-- Card 3: 55% - 85% Scroll -->
      <div
        :class="[
          'absolute left-3 right-3 sm:left-6 sm:right-auto md:left-16 bottom-14 sm:bottom-20 md:bottom-1/4 max-w-sm mx-auto md:mx-0 liquid-glass-card pro-gradient-border p-4 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-700 pointer-events-none',
          scrollProgress >= 0.55 && scrollProgress < 0.85
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-6 scale-95'
        ]"
      >
        <span class="text-[9px] sm:text-[10px] font-extrabold font-mono text-purple-400 uppercase tracking-widest block mb-0.5 sm:mb-1">03 / RECONSTRUCTION</span>
        <h3 class="text-sm sm:text-lg font-extrabold text-white mb-1">Mathematical Pixel Restoration</h3>
        <p class="text-[11px] sm:text-xs text-slate-300 font-medium leading-relaxed m-0">
          The original RGB pixel matrix is calculated with 100% mathematical precision with zero compression artifacts.
        </p>
      </div>

      <!-- Card 4: 85% - 100% Scroll -->
      <div
        :class="[
          'absolute left-3 right-3 sm:right-6 sm:left-auto md:right-16 bottom-14 sm:bottom-20 md:bottom-1/4 max-w-sm mx-auto md:mx-0 liquid-glass-card pro-gradient-border p-4 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-700 pointer-events-none',
          scrollProgress >= 0.85
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-6 scale-95'
        ]"
      >
        <span class="text-[9px] sm:text-[10px] font-extrabold font-mono text-emerald-400 uppercase tracking-widest block mb-0.5 sm:mb-1">04 / PRISTINE OUTPUT</span>
        <h3 class="text-sm sm:text-lg font-extrabold text-white mb-1">Lossless Export Ready</h3>
        <p class="text-[11px] sm:text-xs text-slate-300 font-medium leading-relaxed m-0">
          Your image is restored to pristine original condition. Download PNG/MP4 or copy straight to your clipboard!
        </p>
      </div>

    </div>
  </section>
</template>
