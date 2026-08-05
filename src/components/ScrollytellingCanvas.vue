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

    // Background fill matching obsidian dark background #090D16
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, width, height);

    // Subtle background ambient aura grid
    const auraGradient = ctx.createRadialGradient(cx, cy, 50, cx, cy, 350);
    auraGradient.addColorStop(0, `rgba(16, 185, 129, ${0.15 - progress * 0.05})`);
    auraGradient.addColorStop(0.5, `rgba(6, 182, 212, ${0.12 + progress * 0.08})`);
    auraGradient.addColorStop(1, 'rgba(9, 13, 22, 0)');
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
    // As progress goes from 0 to 1, the watermark detaches, explodes upward, and dissolves!
    const wmSize = 70;
    const baseWmX = cardX + cardSize - wmSize - 30;
    const baseWmY = cardY + cardSize - wmSize - 30;

    // Explosion Translation & Scale Dynamics
    const explodeY = progress * 240; // moves upwards
    const explodeX = Math.sin(progress * Math.PI * 2) * 60; // floats sideways
    const wmOpacity = Math.max(0, 1 - progress * 1.3); // fades out by 75% scroll
    const wmScale = 1 + progress * 1.8;

    if (wmOpacity > 0.01) {
      ctx.save();
      ctx.translate(baseWmX + wmSize / 2 + explodeX, baseWmY + wmSize / 2 - explodeY);
      ctx.scale(wmScale, wmScale);
      ctx.rotate(progress * Math.PI * 1.5); // rotates as it explodes

      // Glowing Aura behind Sparkle
      const sparkGlow = ctx.createRadialGradient(0, 0, 5, 0, 0, wmSize);
      sparkGlow.addColorStop(0, `rgba(236, 72, 153, ${wmOpacity * 0.8})`);
      sparkGlow.addColorStop(0.5, `rgba(168, 85, 247, ${wmOpacity * 0.5})`);
      sparkGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sparkGlow;
      ctx.beginPath();
      ctx.arc(0, 0, wmSize, 0, Math.PI * 2);
      ctx.fill();

      // Four-Point Sparkle Icon Path
      ctx.fillStyle = `rgba(255, 255, 255, ${wmOpacity})`;
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.quadraticCurveTo(0, 0, 25, 0);
      ctx.quadraticCurveTo(0, 0, 0, 25);
      ctx.quadraticCurveTo(0, 0, -25, 0);
      ctx.quadraticCurveTo(0, 0, 0, -25);
      ctx.fill();

      ctx.restore();
    }

    // ── LAYER 3: Exploded Fragment Particles Floating Away ──
    const particleCount = 18;
    for (let p = 0; p < particleCount; p++) {
      const angle = (p / particleCount) * Math.PI * 2 + progress * 3;
      const distance = progress * (120 + (p % 5) * 35);
      const pX = baseWmX + wmSize / 2 + Math.cos(angle) * distance;
      const pY = baseWmY + wmSize / 2 + Math.sin(angle) * distance - progress * 180;
      const pAlpha = Math.max(0, (1 - progress) * 0.9);
      const pRadius = (3 + (p % 4)) * (1 - progress * 0.5);

      if (pAlpha > 0.05) {
        ctx.fillStyle = p % 2 === 0 ? `rgba(6, 182, 212, ${pAlpha})` : `rgba(236, 72, 153, ${pAlpha})`;
        ctx.beginPath();
        ctx.arc(pX, pY, pRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── LAYER 4: Scanning Laser Line on Cleaning Stage (20% - 70%) ──
    if (progress > 0.15 && progress < 0.8) {
      const scanY = cardY + (progress - 0.15) * 1.5 * cardSize;
      if (scanY >= cardY && scanY <= cardY + cardSize) {
        ctx.save();
        const scanGrad = ctx.createLinearGradient(cardX, scanY, cardX + cardSize, scanY);
        scanGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
        scanGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.9)');
        scanGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.strokeStyle = scanGrad;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(cardX, scanY);
        ctx.lineTo(cardX + cardSize, scanY);
        ctx.stroke();
        ctx.restore();
      }
    }

    // ── LAYER 5: Clean Success Badge (Appears 80% - 100%) ──
    if (progress > 0.75) {
      const badgeAlpha = (progress - 0.75) * 4; // 0 to 1
      ctx.save();
      ctx.globalAlpha = Math.min(1, badgeAlpha);
      ctx.translate(baseWmX + wmSize / 2, baseWmY + wmSize / 2);

      // Emerald Checkmark Badge
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Checkmark Icon
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(-2, 6);
      ctx.lineTo(9, -6);
      ctx.stroke();
      ctx.restore();
    }

    frameCanvases.push(offCanvas);
  }
}

// Render selected frame on main canvas
function drawCurrentFrame() {
  const canvas = canvasRef.value;
  if (!canvas || !frameCanvases.length) return;
  const ctx = canvas.getContext('2d');
  const source = frameCanvases[currentFrameIndex.value];
  if (source) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  }
}

// Scroll handler syncing canvas frame to scroll position inside container
function onScroll() {
  const el = containerRef.value;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  
  // Total scroll distance of container
  const totalScrollable = rect.height - windowHeight;
  if (totalScrollable <= 0) return;

  // Relative scroll offset inside container
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
    <div class="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden z-10">
      
      <!-- Canvas Display -->
      <div class="relative w-full max-w-2xl aspect-square flex items-center justify-center p-4">
        <canvas
          ref="canvasRef"
          width="800"
          height="800"
          class="w-full h-full object-contain rounded-3xl shadow-2xl drop-shadow-[0_20px_50px_rgba(16,185,129,0.25)]"
        ></canvas>

        <!-- Progress Indicator Ring -->
        <div class="absolute bottom-6 right-8 glass-pill px-4 py-2 rounded-full border border-emerald-500/40 text-xs font-mono font-bold text-emerald-400 flex items-center gap-2 shadow-lg backdrop-blur-md">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>DISASSEMBLY FRAME {{ currentFrameIndex + 1 }}/{{ TOTAL_FRAMES }}</span>
          <span class="text-slate-500">•</span>
          <span>{{ Math.round(scrollProgress * 100) }}%</span>
        </div>
      </div>

      <!-- ── SCROLLYTELLING OVERLAY STORY CARDS ── -->
      <!-- Card 1: 0% - 25% Scroll -->
      <div
        :class="[
          'absolute left-6 md:left-16 top-1/3 max-w-sm glass-card pro-gradient-border p-6 rounded-3xl transition-all duration-700 pointer-events-none',
          scrollProgress >= 0.0 && scrollProgress < 0.25
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-8 scale-95'
        ]"
      >
        <span class="text-[10px] font-extrabold font-mono text-emerald-400 uppercase tracking-widest block mb-1">01 / STAGE ORIGIN</span>
        <h3 class="text-lg font-extrabold text-white mb-1.5">Original Gemini Watermark</h3>
        <p class="text-xs text-slate-300 font-medium leading-relaxed">
          Google embeds a ✦ sparkle logo in the corner as an alpha opacity blend layer during AI image generation.
        </p>
      </div>

      <!-- Card 2: 25% - 55% Scroll -->
      <div
        :class="[
          'absolute right-6 md:right-16 top-1/3 max-w-sm glass-card pro-gradient-border p-6 rounded-3xl transition-all duration-700 pointer-events-none',
          scrollProgress >= 0.25 && scrollProgress < 0.55
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-8 scale-95'
        ]"
      >
        <span class="text-[10px] font-extrabold font-mono text-cyan-400 uppercase tracking-widest block mb-1">02 / DISASSEMBLY MODE</span>
        <h3 class="text-lg font-extrabold text-white mb-1.5">Inverse Matrix Unblending</h3>
        <p class="text-xs text-slate-300 font-medium leading-relaxed">
          As you scroll, GemClean AI isolates the alpha channel overlay and detaches the watermark particles from the background image.
        </p>
      </div>

      <!-- Card 3: 55% - 85% Scroll -->
      <div
        :class="[
          'absolute left-6 md:left-16 bottom-1/4 max-w-sm glass-card pro-gradient-border p-6 rounded-3xl transition-all duration-700 pointer-events-none',
          scrollProgress >= 0.55 && scrollProgress < 0.85
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-8 scale-95'
        ]"
      >
        <span class="text-[10px] font-extrabold font-mono text-purple-400 uppercase tracking-widest block mb-1">03 / RECONSTRUCTION</span>
        <h3 class="text-lg font-extrabold text-white mb-1.5">Mathematical Pixel Restoration</h3>
        <p class="text-xs text-slate-300 font-medium leading-relaxed">
          The original RGB pixel matrix is calculated with 100% mathematical precision with zero compression artifacts.
        </p>
      </div>

      <!-- Card 4: 85% - 100% Scroll -->
      <div
        :class="[
          'absolute right-6 md:right-16 bottom-1/4 max-w-sm glass-card pro-gradient-border p-6 rounded-3xl transition-all duration-700 pointer-events-none',
          scrollProgress >= 0.85
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-8 scale-95'
        ]"
      >
        <span class="text-[10px] font-extrabold font-mono text-emerald-400 uppercase tracking-widest block mb-1">04 / PRISTINE OUTPUT</span>
        <h3 class="text-lg font-extrabold text-white mb-1.5">Lossless Export Ready</h3>
        <p class="text-xs text-slate-300 font-medium leading-relaxed">
          Your image is restored to pristine original condition. Download PNG/MP4 or copy straight to your clipboard!
        </p>
      </div>

    </div>
  </section>
</template>
