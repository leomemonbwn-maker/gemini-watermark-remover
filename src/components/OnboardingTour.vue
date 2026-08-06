<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useI18n } from '../config/i18n.js';

const { t } = useI18n();

const STORAGE_KEY = 'gemclean_tour_done';
const active = ref(false);
const currentStep = ref(0);

const steps = [
  {
    icon: 'ph:upload-simple-bold',
    color: 'neon-cyan',
    titleKey: 'onboardingStep1',
    desc: 'Drop your Gemini AI image into the upload area, or paste from clipboard with Ctrl+V.',
  },
  {
    icon: 'ph:crosshair-bold',
    color: 'neon-pink',
    titleKey: 'onboardingStep2',
    desc: 'GemClean detects the sparkle watermark position automatically using geometry math.',
  },
  {
    icon: 'ph:arrows-left-right-bold',
    color: 'neon-purple',
    titleKey: 'onboardingStep3',
    desc: 'Use the compare slider to see pixel-perfect before and after results.',
  },
  {
    icon: 'ph:download-simple-bold',
    color: 'neon-green',
    titleKey: 'onboardingStep4',
    desc: 'Download your lossless clean image in PNG, WebP, or JPEG format.',
  },
];

function nextStep() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  } else {
    finish();
  }
}

function finish() {
  active.value = false;
  localStorage.setItem(STORAGE_KEY, 'true');
}

function startTour() {
  currentStep.value = 0;
  active.value = true;
}

onMounted(() => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    // Show tour after a small delay on first visit
    setTimeout(() => {
      active.value = true;
    }, 2000);
  }
});

// Expose startTour for header "restart tour" button
defineExpose({ startTour });
</script>

<template>
  <!-- Tour Modal Overlay -->
  <teleport to="body">
    <div
      v-if="active"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      @click.self="finish"
    >
      <div class="cyber-card cyber-card-neon rounded-3xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <!-- Close -->
        <button
          @click="finish"
          class="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <iconify-icon icon="ph:x-bold" width="16"></iconify-icon>
        </button>

        <!-- Step indicator -->
        <div class="flex items-center justify-center gap-2 mb-6">
          <div
            v-for="(_, idx) in steps"
            :key="idx"
            :class="[
              'w-2 h-2 rounded-full transition-all duration-300',
              idx === currentStep
                ? 'w-6 bg-neon-pink shadow-neon-pink'
                : idx < currentStep
                  ? 'bg-neon-pink/50'
                  : 'bg-white/20'
            ]"
          ></div>
        </div>

        <!-- Welcome header (first step only) -->
        <div v-if="currentStep === 0" class="text-center mb-2">
          <h2 class="text-lg font-black text-white">{{ t('onboardingWelcome') }}</h2>
        </div>

        <!-- Step content -->
        <div class="text-center animate-fade-in" :key="currentStep">
          <!-- Icon -->
          <div :class="[
            'mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg',
            `bg-${steps[currentStep].color}/20 shadow-${steps[currentStep].color}/20`
          ]" :style="{
            background: `linear-gradient(135deg, var(--${steps[currentStep].color})20, var(--${steps[currentStep].color})10)`
          }">
            <iconify-icon
              :icon="steps[currentStep].icon"
              width="28"
              :class="`text-${steps[currentStep].color}`"
            ></iconify-icon>
          </div>

          <h3 class="font-bold text-white text-base mb-2">
            {{ t(steps[currentStep].titleKey) }}
          </h3>
          <p class="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
            {{ steps[currentStep].desc }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between mt-8">
          <button
            @click="finish"
            class="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
          >
            {{ t('onboardingSkip') }}
          </button>

          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-slate-500">
              {{ currentStep + 1 }}/{{ steps.length }}
            </span>
            <button
              @click="nextStep"
              class="btn-neon text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5"
            >
              <span>{{ currentStep === steps.length - 1 ? t('onboardingDone') : t('onboardingNext') }}</span>
              <iconify-icon
                :icon="currentStep === steps.length - 1 ? 'ph:check-bold' : 'ph:arrow-right-bold'"
                width="14"
              ></iconify-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>
