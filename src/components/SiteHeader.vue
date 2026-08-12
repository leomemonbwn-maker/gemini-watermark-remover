<script setup>
import { ref, onMounted } from 'vue';
import { brandConfig } from '../config/brandConfig.js';
import { useI18n } from '../config/i18n.js';

const { t, currentLang, setLang, availableLanguages } = useI18n();

const isDark = ref(false);
const isMenuOpen = ref(false);
const deferredPrompt = ref(null);
const showLangPicker = ref(false);
const showExtensionModal = ref(false);
const showApkModal = ref(false);

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt.value = e;
  });
});

async function installPwa() {
  if (!deferredPrompt.value) return;
  deferredPrompt.value.prompt();
  const { outcome } = await deferredPrompt.value.userChoice;
  if (outcome === 'accepted') {
    deferredPrompt.value = null;
  }
}

function toggleTheme() {
  const html = document.documentElement;
  if (html.classList.contains('dark')) {
    html.classList.remove('dark');
    localStorage.theme = 'light';
    isDark.value = false;
  } else {
    html.classList.add('dark');
    localStorage.theme = 'dark';
    isDark.value = true;
  }
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function closeMenu() {
  isMenuOpen.value = false;
}

function selectLang(lang) {
  setLang(lang);
  showLangPicker.value = false;
}
</script>

<template>
  <header
    class="sticky top-0 z-50 neu-header transition-all duration-200"
  >
    <div class="max-w-6xl mx-auto px-3.5 sm:px-6 h-13 sm:h-14 flex items-center justify-between">
      
      <!-- Brand Logo & Title -->
      <a href="/" class="flex items-center gap-2 overflow-hidden no-underline group select-none">
        <div class="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-neu-raised p-0.5 border border-white/5 shadow-sm group-hover:scale-105 transition-all duration-200">
          <img src="/assets/mascot-logo.png" :alt="brandConfig.name + ' Logo'" width="32" height="32" class="w-6 h-6 sm:w-7 sm:h-7 select-none filter drop-shadow-sm" />
        </div>
        <div class="flex flex-col">
          <p class="text-sm sm:text-base font-extrabold text-white whitespace-nowrap tracking-tight leading-tight m-0">
            GemClean <span class="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan">AI</span>
          </p>
        </div>
      </a>

      <!-- Desktop Nav & Theme Toggle -->
      <div class="hidden md:flex items-center gap-1.5">
        <!-- Chrome Extension Icon Button -->
        <button
          @click="showExtensionModal = true"
          class="neu-pill p-2 rounded-lg text-slate-300 hover:text-neon-cyan transition-all min-w-[34px] min-h-[34px] flex items-center justify-center relative group"
          title="Get Chrome Extension"
        >
          <iconify-icon icon="logos:chrome" width="18"></iconify-icon>
          <span class="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan"></span>
          </span>
        </button>

        <!-- Android APK Icon Button -->
        <button
          @click="showApkModal = true"
          class="neu-pill p-2 rounded-lg text-slate-300 hover:text-neon-green transition-all min-w-[34px] min-h-[34px] flex items-center justify-center relative group"
          title="Download Android App"
        >
          <iconify-icon icon="logos:android-icon" width="18"></iconify-icon>
          <span class="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
          </span>
        </button>

        <!-- Language Picker -->
        <div class="relative">
          <button
            @click="showLangPicker = !showLangPicker"
            class="neu-pill px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-neon-cyan transition-all font-bold text-xs flex items-center gap-1 min-h-[34px]"
          >
            <span>{{ availableLanguages.find(l => l.code === currentLang)?.flag }}</span>
            <iconify-icon icon="ph:caret-down" width="11" :class="showLangPicker ? 'rotate-180' : ''" class="transition-transform"></iconify-icon>
          </button>
          
          <div
            v-if="showLangPicker"
            class="absolute right-0 top-full mt-1 neu-card rounded-xl py-1 w-32 shadow-xl z-50 animate-fade-in"
          >
            <button
              v-for="lang in availableLanguages"
              :key="lang.code"
              @click="selectLang(lang.code)"
              :class="[
                'w-full px-2.5 py-1.5 text-left text-xs font-semibold flex items-center gap-2 transition-colors min-h-[34px]',
                currentLang === lang.code ? 'text-neon-pink bg-neon-pink/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
              ]"
            >
              <span>{{ lang.flag }}</span>
              <span>{{ lang.label }}</span>
              <iconify-icon v-if="currentLang === lang.code" icon="ph:check-bold" width="11" class="ml-auto text-neon-pink"></iconify-icon>
            </button>
          </div>
        </div>

        <!-- Install App PWA button -->
        <button
          v-if="deferredPrompt"
          @click="installPwa"
          class="neu-pill px-2.5 py-1.5 rounded-lg text-neon-cyan hover:bg-neon-cyan/10 transition-all font-bold text-xs flex items-center gap-1 min-h-[34px]"
        >
          <iconify-icon icon="ph:device-mobile-speaker-bold" width="14"></iconify-icon>
          <span>{{ t('installApp') }}</span>
        </button>

        <button
          @click="toggleTheme"
          class="neu-pill p-2 rounded-lg text-slate-300 hover:text-neon-pink transition-all focus:outline-none min-w-[34px] min-h-[34px] flex items-center justify-center"
          aria-label="Toggle Dark Mode"
        >
          <iconify-icon v-if="isDark" icon="ph:sun-bold" width="16"></iconify-icon>
          <iconify-icon v-else icon="ph:moon-bold" width="16"></iconify-icon>
        </button>

        <nav
          aria-label="Site navigation"
          class="border-l border-white/5 pl-2 flex items-center gap-1"
        >
          <a
            :href="brandConfig.githubRepo"
            target="_blank"
            rel="noopener noreferrer"
            class="neu-pill px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-neon-cyan transition-all flex items-center gap-1 font-semibold text-xs no-underline min-h-[34px]"
            aria-label="View source on GitHub"
          >
            <iconify-icon icon="mdi:github" width="15"></iconify-icon>
            <span>GitHub</span>
          </a>
          <a
            href="/about.html"
            class="neu-pill px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-neon-pink transition-all flex items-center gap-1 font-semibold text-xs no-underline min-h-[34px]"
          >
            <span>{{ t('about') }}</span>
          </a>
        </nav>
      </div>

      <!-- Mobile Right Controls -->
      <div class="flex md:hidden items-center gap-1.5">
        <!-- Add Chrome Extension Button (Mobile) -->
        <button
          @click="showExtensionModal = true"
          class="neu-pill px-2 py-1.5 rounded-lg text-slate-200 font-bold text-xs flex items-center gap-1 min-h-[36px]"
        >
          <iconify-icon icon="logos:chrome" width="15"></iconify-icon>
        </button>

        <!-- Android APK Button (Mobile) -->
        <button
          @click="showApkModal = true"
          class="neu-pill px-2 py-1.5 rounded-lg text-slate-200 font-bold text-xs flex items-center gap-1 min-h-[36px]"
        >
          <iconify-icon icon="logos:android-icon" width="15"></iconify-icon>
        </button>

        <!-- Mobile Language -->
        <button
          @click="showLangPicker = !showLangPicker"
          class="neu-pill p-2 rounded-lg text-slate-200 focus:outline-none min-w-[36px] min-h-[36px] flex items-center justify-center text-xs"
          aria-label="Switch language"
        >
          <span>{{ availableLanguages.find(l => l.code === currentLang)?.flag }}</span>
        </button>

        <button
          @click="toggleTheme"
          class="neu-pill p-2 rounded-lg text-slate-200 focus:outline-none min-w-[36px] min-h-[36px] flex items-center justify-center"
          aria-label="Toggle Dark Mode"
        >
          <iconify-icon v-if="isDark" icon="ph:sun-bold" width="16"></iconify-icon>
          <iconify-icon v-else icon="ph:moon-bold" width="16"></iconify-icon>
        </button>

        <button
          @click="toggleMenu"
          class="neu-pill p-2 rounded-lg text-slate-200 focus:outline-none active:scale-95 transition-transform min-w-[36px] min-h-[36px] flex items-center justify-center"
          aria-label="Toggle Menu"
        >
          <iconify-icon v-if="isMenuOpen" icon="ph:x-bold" width="18"></iconify-icon>
          <iconify-icon v-else icon="ph:list-bold" width="18"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- Mobile Lang Picker Dropdown -->
    <div
      v-if="showLangPicker"
      class="md:hidden px-3.5 pb-2 animate-fade-in"
    >
      <div class="neu-card rounded-xl p-1.5 flex gap-1.5">
        <button
          v-for="lang in availableLanguages"
          :key="lang.code"
          @click="selectLang(lang.code)"
          :class="[
            'flex-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-center transition-all min-h-[36px]',
            currentLang === lang.code ? 'bg-neon-pink/15 text-neon-pink' : 'text-slate-300 hover:bg-white/5'
          ]"
        >
          {{ lang.flag }} {{ lang.label }}
        </button>
      </div>
    </div>

    <!-- Mobile Menu Dropdown -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-2 scale-98"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-2 scale-98"
    >
      <div
        v-if="isMenuOpen"
        class="md:hidden mobile-glass-drawer border-b border-white/5 px-4 py-3 flex flex-col gap-2 shadow-xl absolute w-full left-0"
      >
        <button
          @click="showExtensionModal = true; closeMenu()"
          class="neu-pill flex items-center gap-2 p-2.5 rounded-lg text-slate-100 font-semibold text-xs text-left min-h-[40px]"
        >
          <iconify-icon icon="logos:chrome" width="16"></iconify-icon>
          <span>{{ t('addExtension') }}</span>
        </button>

        <button
          @click="toggleTheme"
          class="neu-pill flex items-center justify-between p-2.5 rounded-lg text-slate-100 font-semibold text-xs w-full text-left min-h-[40px]"
        >
          <span class="flex items-center gap-2">
            <iconify-icon v-if="isDark" icon="ph:sun-bold" width="16" class="text-neon-orange"></iconify-icon>
            <iconify-icon v-else icon="ph:moon-bold" width="16" class="text-neon-purple"></iconify-icon>
            <span>{{ t('appearance') }}</span>
          </span>
          <span class="text-[11px] font-bold text-slate-400">{{ isDark ? t('darkMode') : t('lightMode') }}</span>
        </button>

        <a
          :href="brandConfig.githubRepo"
          target="_blank"
          rel="noopener noreferrer"
          @click="closeMenu"
          class="neu-pill flex items-center gap-2 p-2.5 rounded-lg text-slate-100 font-semibold text-xs no-underline min-h-[40px]"
        >
          <iconify-icon icon="mdi:github" width="16" class="text-slate-300"></iconify-icon>
          <span>GitHub Repository</span>
        </a>

        <a
          href="/about.html"
          @click="closeMenu"
          class="neu-pill flex items-center gap-2 p-2.5 rounded-lg text-slate-100 font-semibold text-xs no-underline min-h-[40px]"
        >
          <iconify-icon icon="ph:info-bold" width="16" class="text-neon-cyan"></iconify-icon>
          <span>{{ t('about') }} GemClean AI</span>
        </a>
      </div>
    </transition>
  </header>

  <!-- ── Chrome Extension Download & Installation Modal ── -->
  <div
    v-if="showExtensionModal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    @click.self="showExtensionModal = false"
  >
    <div class="neu-card cyber-card-neon rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative">
      <!-- Close Button -->
      <button
        @click="showExtensionModal = false"
        class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
      >
        <iconify-icon icon="ph:x-bold" width="18"></iconify-icon>
      </button>

      <!-- Header -->
      <div class="text-center mb-5">
        <div class="w-12 h-12 mx-auto rounded-2xl bg-neu-raised flex items-center justify-center border border-white/10 shadow-inner mb-3">
          <iconify-icon icon="logos:chrome" width="28"></iconify-icon>
        </div>
        <h3 class="text-lg font-extrabold text-white">
          {{ t('extensionModalTitle') }}
        </h3>
        <p class="text-xs text-slate-400 mt-1 leading-relaxed">
          {{ t('extensionModalSubtitle') }}
        </p>
      </div>

      <!-- Direct Download Button -->
      <a
        href="/GemCleanAI-Extension.zip"
        download="GemCleanAI-Extension.zip"
        class="btn-neon w-full flex items-center justify-center gap-2 font-bold text-sm py-2.5 rounded-xl shadow-lg no-underline text-white mb-5"
      >
        <iconify-icon icon="ph:download-simple-bold" width="18"></iconify-icon>
        <span>{{ t('downloadExtensionZip') }}</span>
      </a>

      <!-- 3-Step Setup Instructions -->
      <div class="space-y-2.5 text-xs">
        <div class="neu-inset p-3 rounded-xl flex items-start gap-2.5">
          <span class="w-5 h-5 rounded-full bg-neon-pink/20 text-neon-pink flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">1</span>
          <div>
            <h4 class="font-bold text-white">{{ t('extensionStep1Title') }}</h4>
            <p class="text-[11px] text-slate-400 mt-0.5 leading-snug">{{ t('extensionStep1Desc') }}</p>
          </div>
        </div>

        <div class="neu-inset p-3 rounded-xl flex items-start gap-2.5">
          <span class="w-5 h-5 rounded-full bg-neon-cyan/20 text-neon-cyan flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">2</span>
          <div>
            <h4 class="font-bold text-white">{{ t('extensionStep2Title') }}</h4>
            <p class="text-[11px] text-slate-400 mt-0.5 leading-snug">{{ t('extensionStep2Desc') }}</p>
          </div>
        </div>

        <div class="neu-inset p-3 rounded-xl flex items-start gap-2.5">
          <span class="w-5 h-5 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">3</span>
          <div>
            <h4 class="font-bold text-white">{{ t('extensionStep3Title') }}</h4>
            <p class="text-[11px] text-slate-400 mt-0.5 leading-snug">{{ t('extensionStep3Desc') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Android APK Download Modal ── -->
  <div
    v-if="showApkModal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    @click.self="showApkModal = false"
  >
    <div class="neu-card cyber-card-neon rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative">
      <button
        @click="showApkModal = false"
        class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
      >
        <iconify-icon icon="ph:x-bold" width="18"></iconify-icon>
      </button>

      <div class="text-center mb-5">
        <div class="w-12 h-12 mx-auto rounded-2xl bg-neu-raised flex items-center justify-center border border-white/10 shadow-inner mb-3">
          <iconify-icon icon="logos:android-icon" width="28"></iconify-icon>
        </div>
        <h3 class="text-lg font-extrabold text-white">
          {{ t('apkModalTitle') }}
        </h3>
        <p class="text-xs text-slate-400 mt-1 leading-relaxed">
          {{ t('apkModalSubtitle') }}
        </p>
      </div>

      <a
        href="/GemCleanAI.apk"
        download="GemCleanAI.apk"
        class="btn-neon w-full flex items-center justify-center gap-2 font-bold text-sm py-2.5 rounded-xl shadow-lg no-underline text-white mb-5"
        style="background: linear-gradient(135deg, #10B981 0%, #3B82F6 100%);"
      >
        <iconify-icon icon="ph:download-simple-bold" width="18"></iconify-icon>
        <span>{{ t('downloadApk') }}</span>
      </a>

      <div class="space-y-2.5 text-xs">
        <div class="neu-inset p-3 rounded-xl flex items-start gap-2.5">
          <span class="w-5 h-5 rounded-full bg-neon-green/20 text-neon-green flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">1</span>
          <div>
            <h4 class="font-bold text-white">{{ t('apkStep1Title') }}</h4>
            <p class="text-[11px] text-slate-400 mt-0.5 leading-snug">{{ t('apkStep1Desc') }}</p>
          </div>
        </div>

        <div class="neu-inset p-3 rounded-xl flex items-start gap-2.5">
          <span class="w-5 h-5 rounded-full bg-neon-cyan/20 text-neon-cyan flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">2</span>
          <div>
            <h4 class="font-bold text-white">{{ t('apkStep2Title') }}</h4>
            <p class="text-[11px] text-slate-400 mt-0.5 leading-snug">{{ t('apkStep2Desc') }}</p>
          </div>
        </div>

        <div class="neu-inset p-3 rounded-xl flex items-start gap-2.5">
          <span class="w-5 h-5 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">3</span>
          <div>
            <h4 class="font-bold text-white">{{ t('apkStep3Title') }}</h4>
            <p class="text-[11px] text-slate-400 mt-0.5 leading-snug">{{ t('apkStep3Desc') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>