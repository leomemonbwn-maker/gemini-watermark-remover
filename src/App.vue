<script setup>
import { ref, onMounted } from 'vue';
import { brandConfig } from './config/brandConfig.js';
import SiteHeader from './components/SiteHeader.vue';
import SiteFooter from './components/SiteFooter.vue';
import NotificationBanner from './components/NotificationBanner.vue';
import BeforeAfter from './components/BeforeAfter.vue';
import ImageRemover from './components/ImageRemover.vue';
import VideoRemover from './components/VideoRemover.vue';
import SupportPopup from './components/SupportPopup.vue';

const tab = ref('image');

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

// Algorithm pipeline steps (real technical steps)
const pipelineSteps = [
  { icon: 'ph:upload-simple-bold', label: 'Decode Input', desc: 'Parse image/video file into raw RGBA pixel buffer via Canvas 2D API', color: 'teal' },
  { icon: 'ph:grid-four-bold', label: 'Locate Watermark', desc: 'Compute watermark box using resolution-adaptive geometry (48px or 96px)', color: 'blue' },
  { icon: 'ph:wave-sine-bold', label: 'Build Alpha Map', desc: 'Generate sparkle template opacity mask from reference bg_96.png asset', color: 'indigo' },
  { icon: 'ph:math-operations-bold', label: 'Reverse Blend', desc: 'Apply inverse alpha: Original = (Watermarked − α×Logo) ÷ (1−α) per channel', color: 'blue' },
  { icon: 'ph:check-circle-bold', label: 'Export Clean', desc: 'Re-encode pristine pixels to lossless PNG or H.264 MP4 with audio passthrough', color: 'teal' },
];

onMounted(() => {
  const initObserver = () => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (let i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            entries[i].target.classList.add('reveal-visible');
            observer.unobserve(entries[i].target);
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
  <!-- Sapphire Ocean Ambient Blobs -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div class="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-teal-500/12 rounded-full blur-3xl animate-blob"></div>
    <div class="absolute top-1/2 -right-40 w-[28rem] h-[28rem] bg-blue-500/12 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
    <div class="absolute -bottom-40 left-1/3 w-[26rem] h-[26rem] bg-indigo-600/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
  </div>

  <div class="relative z-10 flex flex-col min-h-screen">
    <SiteHeader />
    <NotificationBanner />

    <main class="flex-grow w-full">

      <!-- ═══════════════════════════════════════════════ -->
      <!-- SECTION 1: FULL-BLEED HERO -->
      <!-- ═══════════════════════════════════════════════ -->
      <section class="relative overflow-hidden py-14 sm:py-20 lg:py-28">
        <!-- Decorative grid lines -->
        <div class="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]" style="background-image: linear-gradient(rgba(100,100,100,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,100,0.5) 1px, transparent 1px); background-size: 60px 60px;"></div>
        
        <div class="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <!-- Floating badge -->
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-pill text-xs font-bold shadow-sm border border-teal-500/30 mb-6 sm:mb-8 reveal-on-scroll">
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
            </span>
            <span class="text-slate-700 dark:text-slate-200 tracking-tight">GemClean AI 2.0</span>
            <span class="w-px h-3 bg-slate-300 dark:bg-slate-600"></span>
            <span class="text-teal-600 dark:text-teal-400">Free & Private</span>
          </div>

          <!-- Giant headline -->
          <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] reveal-on-scroll">
            <span class="text-slate-900 dark:text-white">Remove AI</span><br/>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-blue-400 to-indigo-500">Watermarks Instantly</span>
          </h1>

          <p class="mt-5 sm:mt-6 text-slate-500 dark:text-slate-400 text-sm sm:text-lg font-medium max-w-2xl mx-auto leading-relaxed reveal-on-scroll">
            Pixel-perfect removal of Gemini sparkle logos & Veo video watermarks. 
            Zero uploads. Zero compression. 100% browser-side.
          </p>

          <!-- CTA Stats row -->
          <div class="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm font-bold reveal-on-scroll">
            <div class="flex items-center gap-2 text-teal-600 dark:text-teal-400">
              <iconify-icon icon="ph:shield-check-fill" width="20"></iconify-icon>
              <span>No Server Upload</span>
            </div>
            <div class="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <iconify-icon icon="ph:image-fill" width="20"></iconify-icon>
              <span>PNG • JPG • WebP</span>
            </div>
            <div class="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <iconify-icon icon="ph:video-fill" width="20"></iconify-icon>
              <span>MP4 • WebM • MOV</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════ -->
      <!-- SECTION 2: TOOL WORKSPACE (Glass floating card) -->
      <!-- ═══════════════════════════════════════════════ -->
      <section class="relative -mt-4 sm:-mt-6 pb-12 sm:pb-16">
        <div class="max-w-4xl mx-auto px-3 sm:px-6">
          <div class="liquid-glass-card pro-gradient-border rounded-3xl p-4 sm:p-6 shadow-2xl reveal-on-scroll">
            
            <!-- Tab bar inside card -->
            <div class="flex justify-center mb-4 sm:mb-5">
              <div class="p-1 rounded-2xl bg-slate-100/80 dark:bg-white/5 inline-flex gap-1">
                <button
                  @click="tab = 'image'"
                  :class="[
                    'flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200',
                    tab === 'image'
                      ? 'bg-white dark:bg-white/10 text-teal-600 dark:text-teal-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white',
                  ]"
                >
                  <iconify-icon icon="ph:image-bold" width="16"></iconify-icon>
                  Images
                </button>
                <button
                  @click="tab = 'video'"
                  :class="[
                    'flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200',
                    tab === 'video'
                      ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white',
                  ]"
                >
                  <iconify-icon icon="ph:video-camera-bold" width="16"></iconify-icon>
                  Videos
                  <span class="text-[8px] font-extrabold bg-blue-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>
                </button>
              </div>
            </div>

            <!-- Tool workspace -->
            <ImageRemover v-show="tab === 'image'" />
            <VideoRemover v-show="tab === 'video'" />
          </div>

          <!-- Inline tip -->
          <p class="text-center text-xs text-slate-400 dark:text-slate-500 mt-3 font-medium">
            <iconify-icon icon="ph:info" width="13" class="align-middle mr-1"></iconify-icon>
            Tip: Use the official Download button in Gemini for best results. Avoid screenshots.
          </p>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════ -->
      <!-- SECTION 3: BEFORE / AFTER SHOWCASE (Full bleed) -->
      <!-- ═══════════════════════════════════════════════ -->
      <section class="py-14 sm:py-20 bg-gradient-to-b from-transparent via-teal-500/[0.03] to-transparent reveal-on-scroll">
        <div class="max-w-5xl mx-auto px-4 sm:px-6">
          <div class="text-center mb-8 sm:mb-10">
            <span class="inline-block text-xs font-bold uppercase tracking-widest text-teal-500 dark:text-teal-400 mb-2">Real Output</span>
            <h2 class="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              See the <span class="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">Difference</span>
            </h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">Drag the slider to compare the watermarked original with the losslessly cleaned output.</p>
          </div>

          <div class="max-w-3xl mx-auto">
            <div class="liquid-glass-card rounded-3xl p-2 sm:p-3 shadow-xl">
              <BeforeAfter />
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════ -->
      <!-- SECTION 4: REAL ALGORITHM PIPELINE -->
      <!-- ═══════════════════════════════════════════════ -->
      <section class="py-14 sm:py-20 reveal-on-scroll">
        <div class="max-w-5xl mx-auto px-4 sm:px-6">
          <div class="text-center mb-10 sm:mb-14">
            <span class="inline-block text-xs font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-2">Under the Hood</span>
            <h2 class="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              The <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Removal Pipeline</span>
            </h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg mx-auto">Every watermark removal follows this exact 5-step mathematical pipeline — entirely in your browser.</p>
          </div>

          <!-- Pipeline flowchart -->
          <div class="relative max-w-3xl mx-auto">
            <!-- Vertical connector line -->
            <div class="absolute left-6 sm:left-8 top-6 bottom-6 w-px bg-gradient-to-b from-teal-500/40 via-blue-500/40 to-indigo-500/40 hidden sm:block"></div>

            <div class="space-y-4 sm:space-y-5">
              <div
                v-for="(step, idx) in pipelineSteps"
                :key="idx"
                class="relative flex items-start gap-4 sm:gap-5 group reveal-on-scroll"
                :style="{ transitionDelay: (idx * 80) + 'ms' }"
              >
                <!-- Step number circle -->
                <div :class="[
                  'relative z-10 flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110',
                  step.color === 'teal' ? 'bg-gradient-to-br from-teal-500 to-teal-600 shadow-teal-500/30' : '',
                  step.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30' : '',
                  step.color === 'indigo' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/30' : '',
                ]">
                  <iconify-icon :icon="step.icon" width="24" class="text-white sm:w-7 sm:h-7"></iconify-icon>
                </div>

                <!-- Step content card -->
                <div class="flex-1 liquid-glass-card rounded-2xl p-4 sm:p-5 group-hover:border-teal-500/30 dark:group-hover:border-blue-500/30 transition-colors">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Step {{ idx + 1 }}</span>
                  </div>
                  <h3 class="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{{ step.label }}</h3>
                  <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed font-mono">{{ step.desc }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Formula callout -->
          <div class="max-w-3xl mx-auto mt-8 sm:mt-10 reveal-on-scroll">
            <div class="liquid-glass-card rounded-2xl p-5 sm:p-6 text-center border-blue-500/20">
              <p class="text-xs font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-3">Core Formula</p>
              <p class="text-lg sm:text-2xl font-mono font-bold text-slate-800 dark:text-white tracking-tight">
                P<sub class="text-teal-500">original</sub> = ( P<sub class="text-slate-400">watermarked</sub> − α · L ) ÷ ( 1 − α )
              </p>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-3 max-w-md mx-auto">
                Where <code class="text-teal-500 font-bold">α</code> is the sparkle template opacity and <code class="text-blue-500 font-bold">L</code> is the logo pixel value (255). Applied per-channel (R, G, B) independently.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════ -->
      <!-- SECTION 5: STATS BENTO GRID -->
      <!-- ═══════════════════════════════════════════════ -->
      <section class="py-14 sm:py-20 bg-gradient-to-b from-transparent via-blue-500/[0.03] to-transparent reveal-on-scroll">
        <div class="max-w-4xl mx-auto px-4 sm:px-6">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div class="liquid-glass-card rounded-2xl p-5 sm:p-6 text-center">
              <div class="text-2xl sm:text-3xl font-black text-teal-500 dark:text-teal-400">0ms</div>
              <div class="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Upload Latency</div>
            </div>
            <div class="liquid-glass-card rounded-2xl p-5 sm:p-6 text-center">
              <div class="text-2xl sm:text-3xl font-black text-blue-500 dark:text-blue-400">100%</div>
              <div class="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Lossless</div>
            </div>
            <div class="liquid-glass-card rounded-2xl p-5 sm:p-6 text-center">
              <div class="text-2xl sm:text-3xl font-black text-indigo-500 dark:text-indigo-400">0</div>
              <div class="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Bytes Logged</div>
            </div>
            <div class="liquid-glass-card rounded-2xl p-5 sm:p-6 text-center">
              <div class="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">∞</div>
              <div class="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Files / Day</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════ -->
      <!-- SECTION 6: FAQ -->
      <!-- ═══════════════════════════════════════════════ -->
      <section class="py-14 sm:py-20 reveal-on-scroll">
        <div class="max-w-3xl mx-auto px-4 sm:px-6">
          <div class="text-center mb-8 sm:mb-10">
            <span class="inline-block text-xs font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-2">Support</span>
            <h2 class="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Frequently Asked <span class="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-500">Questions</span>
            </h2>
          </div>

          <div class="space-y-3">
            <div
              v-for="(faq, idx) in faqs"
              :key="idx"
              class="liquid-glass-card rounded-2xl overflow-hidden transition-all duration-300"
            >
              <button
                @click="toggleFaq(idx)"
                class="w-full p-4 sm:p-5 flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white hover:text-teal-500 dark:hover:text-teal-400 transition-colors text-left"
              >
                <span class="pr-3">{{ faq.q }}</span>
                <iconify-icon
                  icon="ph:caret-down-bold"
                  width="16"
                  :class="['transition-transform duration-300 text-teal-500 flex-shrink-0', activeFaq === idx ? 'rotate-180' : '']"
                ></iconify-icon>
              </button>
              <div
                v-show="activeFaq === idx"
                class="px-4 pb-4 sm:px-5 sm:pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-black/5 dark:border-white/5 pt-3 animate-fade-in font-medium"
              >
                {{ faq.a }}
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>

    <SiteFooter />
    <SupportPopup />
  </div>
</template>