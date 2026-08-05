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
  // Use requestIdleCallback to defer non-critical reveal observer setup
  const initObserver = () => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (let i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            entries[i].target.classList.add('reveal-visible');
            observer.unobserve(entries[i].target); // Stop observing once revealed
          }
        }
      },
      { threshold: 0.05, rootMargin: '50px' }
    );

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
      observer.observe(el);
    });
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(initObserver);
  } else {
    setTimeout(initObserver, 100);
  }
});
</script>

<template>
  <!-- Sapphire Ocean Ambient Glow Blobs -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div class="absolute -top-32 -left-32 sm:-top-40 sm:-left-40 w-72 h-72 sm:w-[32rem] sm:h-[32rem] bg-teal-500/15 dark:bg-teal-500/18 rounded-full blur-3xl animate-blob"></div>
    <div class="absolute top-1/3 -right-32 sm:-right-40 w-72 h-72 sm:w-[32rem] sm:h-[32rem] bg-blue-500/15 dark:bg-blue-500/18 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
    <div class="absolute -bottom-32 left-1/4 sm:-bottom-40 w-72 h-72 sm:w-[32rem] sm:h-[32rem] bg-indigo-600/15 dark:bg-indigo-600/18 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
  </div>

  <div class="relative z-10 flex flex-col min-h-screen">
    <SiteHeader />
    <NotificationBanner />

    <main class="flex-grow w-full max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
      
      <!-- ══ CINEMATIC HERO (Center-Aligned) ══ -->
      <div class="text-center mb-10 sm:mb-14 reveal-on-scroll">
        
        <!-- Live Status Badge -->
        <div class="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full liquid-glass-pill text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm border border-teal-500/30 mb-5 sm:mb-6">
          <span class="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-teal-500"></span>
          </span>
          <span class="tracking-tight">⚡ GemClean AI 2.0</span>
          <span class="text-slate-400 dark:text-slate-500">•</span>
          <span class="text-teal-600 dark:text-teal-400 font-extrabold">100% Free &amp; Private</span>
        </div>

        <!-- Cinematic Headline -->
        <h1 class="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] max-w-3xl mx-auto">
          Remove Gemini &amp; Veo
          <span class="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-blue-400 to-indigo-400">
            Watermarks Losslessly
          </span>
        </h1>

        <p class="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium leading-relaxed max-w-xl mx-auto mt-4 sm:mt-5">
          Clean visible ✦ sparkle watermark logos from Google Gemini photos &amp; Veo videos in seconds. Direct in-browser unblending with zero compression.
        </p>
      </div>

      <!-- ══ TOOL STUDIO (Centered Full-Width) ══ -->
      <div class="max-w-3xl mx-auto space-y-5 sm:space-y-6 reveal-on-scroll reveal-delay-100">
        
        <!-- Mode Selector Tabs -->
        <div class="flex justify-center">
          <div class="p-1 rounded-2xl liquid-glass inline-flex gap-1.5 shadow-lg">
            <button
              role="tab"
              :aria-selected="tab === 'image'"
              @click="tab = 'image'"
              :class="[
                'flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-300 btn-micro-pop',
                tab === 'image'
                  ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-md shadow-teal-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
              ]"
            >
              <iconify-icon icon="ph:image-bold" width="16" class="sm:w-5 sm:h-5"></iconify-icon>
              <span>Image Cleaner</span>
            </button>
            <button
              role="tab"
              :aria-selected="tab === 'video'"
              @click="tab = 'video'"
              :class="[
                'flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-300 btn-micro-pop',
                tab === 'video'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
              ]"
            >
              <iconify-icon icon="ph:video-camera-bold" width="16" class="sm:w-5 sm:h-5"></iconify-icon>
              <span>Veo Video</span>
              <span class="text-[8px] sm:text-[9px] font-extrabold bg-white/25 text-white px-1.5 py-0.5 rounded-full animate-pulse">NEW</span>
            </button>
          </div>
        </div>

        <!-- Tool Workspace -->
        <div class="w-full">
          <ImageRemover v-show="tab === 'image'" />
          <VideoRemover v-show="tab === 'video'" />
        </div>
      </div>

      <!-- ══ STATS ROW ══ -->
      <div class="max-w-3xl mx-auto grid grid-cols-3 gap-2.5 sm:gap-4 mt-6 sm:mt-8 reveal-on-scroll reveal-delay-200">
        <div class="liquid-glass-card p-3 sm:p-4 rounded-2xl text-center">
          <div class="text-base sm:text-xl font-extrabold text-teal-500 dark:text-teal-400 mb-0.5">0 ms</div>
          <div class="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Upload Latency</div>
        </div>
        <div class="liquid-glass-card p-3 sm:p-4 rounded-2xl text-center">
          <div class="text-base sm:text-xl font-extrabold text-blue-500 dark:text-blue-400 mb-0.5">100%</div>
          <div class="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Pixel Lossless</div>
        </div>
        <div class="liquid-glass-card p-3 sm:p-4 rounded-2xl text-center">
          <div class="text-base sm:text-xl font-extrabold text-indigo-500 dark:text-indigo-400 mb-0.5">0 Bytes</div>
          <div class="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Data Logged</div>
        </div>
      </div>

      <!-- ══ BEFORE/AFTER SHOWCASE (Full Width) ══ -->
      <div class="max-w-3xl mx-auto mt-8 sm:mt-10 reveal-on-scroll reveal-delay-200">
        <div class="liquid-glass-card pro-gradient-border p-3.5 sm:p-5 rounded-3xl shadow-xl">
          <div class="flex items-center justify-between mb-2.5 px-1">
            <h2 class="text-xs font-extrabold uppercase tracking-wider text-teal-500 dark:text-teal-400 flex items-center gap-1.5">
              <iconify-icon icon="ph:sparkle-fill" class="animate-sparkle"></iconify-icon>
              Live Result Showcase
            </h2>
            <span class="text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400">Lossless 1:1</span>
          </div>
          <BeforeAfter />
        </div>

        <!-- Pro Tip -->
        <aside class="liquid-glass-card bg-teal-500/5 dark:bg-teal-950/20 border-teal-500/30 rounded-2xl p-4 sm:p-5 text-left shadow-md mt-4">
          <h3 class="flex items-center gap-2 font-bold text-teal-600 dark:text-teal-400 mb-1.5 text-xs uppercase tracking-wider">
            <iconify-icon icon="ph:check-circle-fill" class="text-base text-teal-500"></iconify-icon>
            Pro Tip for Best Quality
          </h3>
          <p class="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed m-0">
            Always use the official <strong>Download button</strong> inside Google Gemini to save your original file. Avoid right-click "Save Image As" or screen recording.
          </p>
        </aside>
      </div>

      <!-- ══ ALGORITHM VISUALIZER ══ -->
      <section class="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-white/40 dark:border-white/10 text-center reveal-on-scroll">
        <div class="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full liquid-glass-pill text-xs font-bold text-blue-600 dark:text-blue-400 mb-2.5 shadow-sm border border-blue-500/30">
          <iconify-icon icon="ph:cpu-bold" class="text-sm"></iconify-icon>
          Live Algorithm Visualizer
        </div>
        <h2 class="text-xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Deconstructing the <span class="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-blue-400 to-indigo-400">Watermark in Real-Time</span>
        </h2>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto mb-4 px-2">
          Interactive simulation of GemClean's inverse alpha-channel decomposition and lossless pixel restoration engine.
        </p>
        <ScrollytellingCanvas />
      </section>

      <!-- ══ 3-STEP PROCESS ══ -->
      <section class="mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-white/40 dark:border-white/10 text-center reveal-on-scroll">
        <h2 class="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          How GemClean AI Works in <span class="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400">3 Simple Steps</span>
        </h2>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 sm:mb-10 font-medium max-w-lg mx-auto px-2">No account or API key required. Everything runs directly inside your browser.</p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-left">
          <div class="liquid-glass-card pro-gradient-border p-5 sm:p-6 rounded-3xl relative hover:scale-[1.01] transition-transform">
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-teal-500 text-white font-extrabold flex items-center justify-center mb-3 sm:mb-4 text-sm sm:text-base shadow-lg shadow-teal-500/30">
              1
            </div>
            <h3 class="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-1">Upload or Paste</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium m-0">
              Drag &amp; drop your Gemini photo/video or press <kbd class="px-1.5 py-0.5 text-[10px] font-mono bg-teal-500/10 text-teal-500 dark:text-teal-400 rounded border border-teal-500/30">Ctrl+V</kbd> to paste.
            </p>
          </div>

          <div class="liquid-glass-card pro-gradient-border p-5 sm:p-6 rounded-3xl relative hover:scale-[1.01] transition-transform">
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-500 text-white font-extrabold flex items-center justify-center mb-3 sm:mb-4 text-sm sm:text-base shadow-lg shadow-blue-500/30">
              2
            </div>
            <h3 class="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-1">Inverse Pixel Engine</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium m-0">
              Our WebGL algorithm unblends the watermark overlay matrix with 100% mathematical precision.
            </p>
          </div>

          <div class="liquid-glass-card pro-gradient-border p-5 sm:p-6 rounded-3xl relative hover:scale-[1.01] transition-transform">
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-500 text-white font-extrabold flex items-center justify-center mb-3 sm:mb-4 text-sm sm:text-base shadow-lg shadow-indigo-500/30">
              3
            </div>
            <h3 class="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-1">Instant Export</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium m-0">
              Download your pristine clean PNG or MP4 instantly, or copy directly to your clipboard.
            </p>
          </div>
        </div>
      </section>

      <!-- ══ FAQ ══ -->
      <section class="mt-12 sm:mt-16 text-left reveal-on-scroll">
        <h2 class="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2 text-center">
          Frequently Asked <span class="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-blue-400 to-indigo-400">Questions</span>
        </h2>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 sm:mb-10 text-center font-medium max-w-lg mx-auto px-2">Everything you need to know about GemClean AI</p>

        <div class="max-w-3xl mx-auto space-y-3 sm:space-y-4">
          <div
            v-for="(faq, idx) in faqs"
            :key="idx"
            class="liquid-glass-card rounded-2xl overflow-hidden transition-all duration-300"
          >
            <button
              @click="toggleFaq(idx)"
              class="w-full p-4 sm:p-5 flex items-center justify-between font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-teal-500 dark:hover:text-teal-400 transition-colors text-left"
            >
              <span class="pr-2">{{ faq.q }}</span>
              <iconify-icon
                icon="ph:caret-down-bold"
                width="16"
                :class="['transition-transform duration-300 text-teal-500 flex-shrink-0', activeFaq === idx ? 'rotate-180' : '']"
              ></iconify-icon>
            </button>
            <div
              v-show="activeFaq === idx"
              class="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-black/5 dark:border-white/5 pt-3 animate-fade-in font-medium"
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