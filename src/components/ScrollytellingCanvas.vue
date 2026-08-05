<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const TOTAL_FRAMES = 60;
const containerRef = ref(null);
const canvasRef = ref(null);
const scrollProgress = ref(0);
const currentFrameIndex = ref(0);

let animFrameId = null;
let ticking = false;

// Direct procedural rendering onto the canvas context with zero memory footprint
function renderFrame(ctx, width, height, progress) {
  const cx = width / 2;
  const cy = height / 2;

  // Background fill matching obsidian dark background #080C15
  ctx.fillStyle = '#080C15';
  ctx.fillRect(0, 0, width, height);

  // Background ambient aura
  const auraGradient = ctx.createRadialGradient(cx, cy, 30, cx, cy, width * 0.45);
  auraGradient.addColorStop(0, `rgba(16, 185, 129, ${0.15 - progress * 0.05})`);
  auraGradient.addColorStop(0.5, `rgba(6, 182, 212, ${0.12 + progress * 0.08})`);
  auraGradient.addColorStop(1, 'rgba(8, 12, 21, 0)');
  ctx.fillStyle = auraGradient;
  ctx.fillRect(0, 0, width, height);

  // ── LAYER 1: Core AI Image Base Card ──
  const cardSize = width * 0.52;
  const cardX = cx - cardSize / 2;
  const cardY = cy - cardSize / 2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardSize, cardSize, 20);
  ctx.fillStyle = '#111827';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = `rgba(16, 185, 129, ${0.4 + progress * 0.4})`;
  ctx.stroke();

  // Vibrant simulated gradient landscape
  const imgGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardSize, cardY + cardSize);
  imgGrad.addColorStop(0, '#1e1b4b');
  imgGrad.addColorStop(0.5, '#065f46');
  imgGrad.addColorStop(1, '#0e7490');
  ctx.fillStyle = imgGrad;
  ctx.fill();

  // Mountain & Moon Decorative Elements
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.arc(cardX + cardSize * 0.28, cardY + cardSize * 0.28, cardSize * 0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
  ctx.beginPath();
  ctx.moveTo(cardX + cardSize * 0.1, cardY + cardSize * 0.85);
  ctx.lineTo(cardX + cardSize * 0.45, cardY + cardSize * 0.42);
  ctx.lineTo(cardX + cardSize * 0.8, cardY + cardSize * 0.85);
  ctx.fill();
  ctx.restore();

  // ── LAYER 2: Exploding / Disassembling Watermark Sparkle Overlay ──
  const wmSize = cardSize * 0.18;
  const baseWmX = cardX + cardSize - wmSize - cardSize * 0.08;
  const baseWmY = cardY + cardSize - wmSize - cardSize * 0.08;

  const explodeY = progress * (cardSize * 0.6);
  const explodeX = Math.sin(progress * Math.PI * 2) * (cardSize * 0.15);
  const wmOpacity = Math.max(0, 1 - progress * 1.3);
  const wmScale = 1 + progress * 1.6;

  if (wmOpacity > 0.01) {
    ctx.save();
    ctx.translate(baseWmX + wmSize / 2 + explodeX, baseWmY + wmSize / 2 - explodeY);
    ctx.scale(wmScale, wmScale);
    ctx.rotate(progress * Math.PI * 1.5);

    const sparkGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, wmSize);
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
    const particleCount = 20;
    for (let p = 0; p < particleCount; p++) {
      const seed = p * 137.5;
      const pRadius = 30 + ((seed * 11) % 120) * progress;
      const pAngle = (seed * Math.PI) / 180 + progress * 4;
      const px = baseWmX + wmSize / 2 + Math.cos(pAngle) * pRadius + explodeX * 0.5;
      const py = baseWmY + wmSize / 2 + Math.sin(pAngle) * pRadius - explodeY * 0.7;
      const pAlpha = Math.max(0, Math.sin(progress * Math.PI) * (1 - p / particleCount));
      const pSize = 2.5 + (p % 3);

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
    ctx.roundRect(cardX, cardY, cardSize, cardSize, 20);
    ctx.clip();

    const laserGrad = ctx.createLinearGradient(cardX, scanY, cardX + cardSize, scanY);
    laserGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
    laserGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.9)');
    laserGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = laserGrad;
    ctx.fillRect(cardX, scanY - 1.5, cardSize, 3);
    ctx.restore();
  }
}

function updateFrame() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  renderFrame(ctx, canvas.width, canvas.height, scrollProgress.value);
  ticking = false;
}

function onScroll() {
  if (ticking) return;
  const el = containerRef.value;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const totalScrollable = rect.height - windowHeight;
  if (totalScrollable <= 0) return;

  const currentScroll = -rect.top;
  const rawProgress = Math.min(Math.max(currentScroll / totalScrollable, 0), 1);
  scrollProgress.value = rawProgress;
  currentFrameIndex.value = Math.min(Math.floor(rawProgress * TOTAL_FRAMES), TOTAL_FRAMES - 1);

  ticking = true;
  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(updateFrame);
}

onMounted(() => {
  const isMobile = window.innerWidth < 768;
  const canvas = canvasRef.value;
  if (canvas) {
    // Dynamic lightweight canvas dimensions for mobile vs desktop
    canvas.width = isMobile ? 500 : 700;
    canvas.height = isMobile ? 500 : 700;
  }
  updateFrame();
  window.addEventListener('scroll', onScroll, { passive: true });
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
          width="600"
          height="600"
          class="w-full h-full object-contain rounded-2xl sm:rounded-3xl shadow-2xl drop-shadow-[0_20px_50px_rgba(16,185,129,0.2)]"
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
          'absolute left-3 right-3 sm:left-6 sm:right-auto md:left-16 bottom-14 sm:bottom-20 md:top-1/3 md:bottom-auto max-w-sm mx-auto md:mx-0 liquid-glass-card pro-gradient-border p-4 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-500 pointer-events-none',
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
          'absolute left-3 right-3 sm:right-6 sm:left-auto md:right-16 bottom-14 sm:bottom-20 md:top-1/3 md:bottom-auto max-w-sm mx-auto md:mx-0 liquid-glass-card pro-gradient-border p-4 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-500 pointer-events-none',
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
          'absolute left-3 right-3 sm:left-6 sm:right-auto md:left-16 bottom-14 sm:bottom-20 md:bottom-1/4 max-w-sm mx-auto md:mx-0 liquid-glass-card pro-gradient-border p-4 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-500 pointer-events-none',
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
          'absolute left-3 right-3 sm:right-6 sm:left-auto md:right-16 bottom-14 sm:bottom-20 md:bottom-1/4 max-w-sm mx-auto md:mx-0 liquid-glass-card pro-gradient-border p-4 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-500 pointer-events-none',
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
