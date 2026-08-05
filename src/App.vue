<script setup>
import { ref, onMounted } from 'vue';
import { brandConfig } from './config/brandConfig.js';
import SiteHeader from './components/SiteHeader.vue';
import SiteFooter from './components/SiteFooter.vue';
import NotificationBanner from './components/NotificationBanner.vue';
import BeforeAfter from './components/BeforeAfter.vue';
import ImageRemover from './components/ImageRemover.vue';
import VideoRemover from './components/VideoRemover.vue';
import ScrollytellingCanvas from './components/ScrollytellingCanvas.vue';
import SupportPopup from './components/SupportPopup.vue';

const tab = ref('image'); // 'image' | 'video'

const activeFaq = ref(0);
function toggleFaq(index) {
  activeFaq.value = activeFaq.value === index ? null : index;
}

const faqs = [
  {
    q: 'How does GemClean AI remove watermarks losslessly?',
    a: 'Google Gemini adds the sparkle watermark as a deterministic blend overlay. GemClean AI applies inverse matrix unblending in WebGL/Canvas to mathematically calculate and restore the exact original pixel color values without quality loss.'
  },
  {
    q: 'Does it support both Gemini images and Veo videos?',
    a: 'Yes! GemClean AI supports PNG, JPG, WebP images as well as Veo generated MP4, WebM, MOV videos with full audio preservation.'
  },
  {
    q: 'Are my photos or videos uploaded to any server?',
    a: 'Never. 100% of the computation happens locally inside your browser using client-side JavaScript & WebGL. Your files never touch any external server or cloud.'
  },
  {
    q: 'What is the difference between visible sparkle logo and SynthID?',
    a: 'This tool removes only the visible sparkle logo in the corner for clean presentation. It does not tamper with Google SynthID, which is an invisible perceptual safety watermark.'
  }
];

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
    observer.observe(el);
  });
});
</script>

<template>
  <!-- Cyber Obsidian Background Glow Blobs -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div class="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-emerald-500/20 dark:bg-emerald-500/25 rounded-full blur-3xl animate-blob"></div>
    <div class="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-cyan-500/20 dark:bg-cyan-500/25 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
    <div class="absolute -bottom-40 left-1/3 w-[30rem] h-[30rem] bg-purple-600/20 dark:bg-purple-600/25 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
  </div>

  <div class="relative z-10 flex flex-col min-h-screen">
    <SiteHeader />
    <NotificationBanner />

    <main class="flex-grow w-full max-w-7xl mx-auto px-4 py-6 md:py-10">
      
      <!-- ── SPLIT STUDIO HERO LAYOUT (Asymmetric Dual-Column) ── -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
        
        <!-- LEFT COLUMN: Studio Tool Console & Upload Area (7 cols) -->
        <div class="lg:col-span-7 space-y-6 text-left reveal-on-scroll">
          
          <!-- Live Studio Status Badge -->
          <div class="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass-pill border border-emerald-500/30 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm">
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>⚡ GemClean AI Studio 2.0</span>
            <span class="text-slate-400 dark:text-slate-500">•</span>
            <span class="text-emerald-500 font-extrabold">100% Free &amp; Private</span>
          </div>

          <!-- Studio Headline -->
          <h1 class="text-3xl sm:text-5xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Remove Gemini &amp; Veo
            <span class="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 drop-shadow-sm">
              Watermarks Losslessly
            </span>
          </h1>

          <p class="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium leading-relaxed max-w-xl">
            Clean visible ✦ sparkle watermark logos from Google Gemini photos &amp; Veo videos in seconds. Direct in-browser unblending with zero compression.
          </p>

          <!-- Studio Dock Mode Selector -->
          <div class="glass-panel p-1.5 rounded-2xl border border-white/60 dark:border-white/10 shadow-lg inline-flex gap-2">
            <button
              role="tab"
              :aria-selected="tab === 'image'"
              @click="tab = 'image'"
              :class="[
                'flex items-center gap-2.5 px-6 py-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-300 btn-micro-pop',
                tab === 'image'
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 scale-105'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
              ]"
            >
              <iconify-icon icon="ph:image-bold" width="18"></iconify-icon> Image Cleaner
            </button>
            <button
              role="tab"
              :aria-selected="tab === 'video'"
              @click="tab = 'video'"
              :class="[
                'flex items-center gap-2.5 px-6 py-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-300 btn-micro-pop',
                tab === 'video'
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25 scale-105'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
              ]"
            >
              <iconify-icon icon="ph:video-camera-bold" width="18"></iconify-icon> Veo Video Cleaner
              <span class="text-[9px] font-extrabold bg-white/20 text-white px-2 py-0.5 rounded-full animate-pulse">NEW</span>
            </button>
          </div>

          <!-- Studio Main Tool Workspace Canvas -->
          <div class="w-full">
            <ImageRemover v-show="tab === 'image'" />
            <VideoRemover v-show="tab === 'video'" />
          </div>
        </div>

        <!-- RIGHT COLUMN: Interactive Showcase & Studio Info (5 cols) -->
        <div class="lg:col-span-5 space-y-6 reveal-on-scroll reveal-delay-200">
          
          <!-- Live Interactive Showcase Card -->
          <div class="glass-card pro-gradient-border p-5 rounded-3xl shadow-2xl">
            <div class="flex items-center justify-between mb-3 px-1">
              <h2 class="text-xs font-extrabold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                <iconify-icon icon="ph:sparkle-fill" class="animate-sparkle"></iconify-icon>
                Live Result Showcase
              </h2>
              <span class="text-[11px] font-mono text-slate-400 dark:text-slate-500">Lossless 1:1</span>
            </div>
            
            <!-- Comparison Slider -->
            <BeforeAfter />
          </div>

          <!-- Studio Performance Stat Grid -->
          <div class="grid grid-cols-3 gap-3">
            <div class="glass-card p-4 rounded-2xl text-center border border-white/60 dark:border-white/10">
              <div class="text-lg sm:text-xl font-extrabold text-emerald-400 mb-0.5">0 ms</div>
              <div class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Server Upload</div>
            </div>
            <div class="glass-card p-4 rounded-2xl text-center border border-white/60 dark:border-white/10">
              <div class="text-lg sm:text-xl font-extrabold text-cyan-400 mb-0.5">100%</div>
              <div class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Pixel Lossless</div>
            </div>
            <div class="glass-card p-4 rounded-2xl text-center border border-white/60 dark:border-white/10">
              <div class="text-lg sm:text-xl font-extrabold text-purple-400 mb-0.5">0 Bytes</div>
              <div class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Data Logged</div>
            </div>
          </div>

          <!-- Studio Rule Callout -->
          <aside class="glass-card bg-emerald-950/20 border-emerald-500/30 rounded-3xl p-5 text-left shadow-lg">
            <h3 class="flex items-center gap-2 font-bold text-emerald-400 mb-2 text-xs uppercase tracking-wider">
              <iconify-icon icon="ph:check-circle-fill" class="text-base text-emerald-400"></iconify-icon>
              Pro Tip for Best Quality
            </h3>
            <p class="text-xs text-slate-300 font-medium leading-relaxed">
              Always use the official <strong>Download button</strong> inside Google Gemini to save your original file. Avoid right-click "Save Image As" or screen recording.
            </p>
          </aside>

        </div>

      </div>

      <!-- ── SCCROLLYTELLING CANVAS DISASSEMBLY SHOWCASE ── -->
      <section class="mt-20 pt-10 border-t border-white/10 text-center reveal-on-scroll">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill border border-cyan-500/30 text-xs font-bold text-cyan-400 mb-3 shadow-sm">
          <iconify-icon icon="ph:film-strip-bold" class="animate-spin"></iconify-icon>
          Interactive Canvas Disassembly
        </div>
        <h2 class="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          Explore the <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400">Scrollytelling Experience</span>
        </h2>
        <p class="text-sm text-slate-400 font-medium max-w-lg mx-auto mb-6">
          Scroll down to inspect the 60fps 3D canvas disassembly sequence of the AI watermark decomposition process.
        </p>

        <ScrollytellingCanvas />
      </section>

      <!-- ── 3-STEP PROCESS SECTION ── -->
      <section class="mt-16 pt-12 border-t border-white/10 text-center reveal-on-scroll">
        <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          How GemClean AI Works in <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">3 Simple Steps</span>
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-10 font-medium max-w-lg mx-auto">No account or API key required. Everything runs inside your browser.</p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div class="glass-card pro-gradient-border p-6 rounded-3xl relative hover:scale-[1.02] transition-transform">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500 text-white font-extrabold flex items-center justify-center mb-4 text-base shadow-lg shadow-emerald-500/30">
              1
            </div>
            <h3 class="font-bold text-slate-900 dark:text-white text-base mb-1.5">Upload or Paste</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Drag &amp; drop your Gemini photo/video or press <kbd class="px-1.5 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/30">Ctrl+V</kbd> to paste.
            </p>
          </div>

          <div class="glass-card pro-gradient-border p-6 rounded-3xl relative hover:scale-[1.02] transition-transform">
            <div class="w-10 h-10 rounded-2xl bg-cyan-500 text-white font-extrabold flex items-center justify-center mb-4 text-base shadow-lg shadow-cyan-500/30">
              2
            </div>
            <h3 class="font-bold text-slate-900 dark:text-white text-base mb-1.5">Inverse Pixel Engine</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Our WebGL algorithm unblends the watermark overlay matrix with 100% mathematical precision.
            </p>
          </div>

          <div class="glass-card pro-gradient-border p-6 rounded-3xl relative hover:scale-[1.02] transition-transform">
            <div class="w-10 h-10 rounded-2xl bg-purple-500 text-white font-extrabold flex items-center justify-center mb-4 text-base shadow-lg shadow-purple-500/30">
              3
            </div>
            <h3 class="font-bold text-slate-900 dark:text-white text-base mb-1.5">Instant Export</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Download your pristine clean PNG or MP4 instantly, or copy directly to your clipboard.
            </p>
          </div>
        </div>
      </section>

      <!-- ── FAQ SECTION ── -->
      <section class="mt-16 text-left reveal-on-scroll">
        <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2 text-center">
          Frequently Asked <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400">Questions</span>
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-10 text-center font-medium max-w-lg mx-auto">Everything you need to know about GemClean AI</p>

        <div class="max-w-3xl mx-auto space-y-4">
          <div
            v-for="(faq, idx) in faqs"
            :key="idx"
            class="glass-card rounded-2xl overflow-hidden transition-all duration-300 border border-white/60 dark:border-white/10"
          >
            <button
              @click="toggleFaq(idx)"
              class="w-full p-5 flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white hover:text-emerald-400 transition-colors text-left"
            >
              <span>{{ faq.q }}</span>
              <iconify-icon
                icon="ph:caret-down-bold"
                width="18"
                :class="['transition-transform duration-300 text-emerald-400', activeFaq === idx ? 'rotate-180' : '']"
              ></iconify-icon>
            </button>
            <div
              v-show="activeFaq === idx"
              class="px-5 pb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-gray-100 dark:border-gray-800/60 pt-3 animate-fade-in font-medium"
            >
              {{ faq.a }}
            </div>
          </div>
        </div>
      </section>

    </main>

    <SiteFooter />
    <SupportPopup />
  </div>
</template>
