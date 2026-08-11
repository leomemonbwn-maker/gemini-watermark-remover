<script setup>
import { ref, onMounted } from 'vue';
import { brandConfig } from '../config/brandConfig.js';
import { useI18n } from '../config/i18n.js';

const { t, currentLang, setLang, availableLanguages } = useI18n();

const isDark = ref(false);
const isMenuOpen = ref(false);
const deferredPrompt = ref(null);
const showLangPicker = ref(false);

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
    class="sticky top-0 z-50 neu-header transition-all duration-300"
  >
    <div class="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
      
      <!-- Brand Logo & Title -->
      <a href="/" class="flex items-center gap-2.5 overflow-hidden no-underline group select-none">
        <div class="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-2xl bg-neu-raised p-1 border border-white/5 shadow-neu-raised-sm group-hover:scale-105 transition-all duration-300">
          <img src="/assets/logo.svg" :alt="brandConfig.name + ' Logo'" width="36" height="36" class="w-7 h-7 sm:w-8 sm:h-8 select-none filter drop-shadow-md" />
        </div>
        <div class="flex flex-col">
          <p class="text-base sm:text-lg md:text-xl font-extrabold text-white whitespace-nowrap tracking-tight leading-tight m-0">
            GemClean <span class="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan">AI</span>
          </p>
        </div>
      </a>

      <!-- Desktop Nav & Theme Toggle -->
      <div class="hidden md:flex items-center gap-2">
        <!-- Language Picker -->
        <div class="relative">
          <button
            @click="showLangPicker = !showLangPicker"
            class="neu-pill px-3 py-2 rounded-xl text-slate-300 hover:text-neon-cyan transition-all font-bold text-xs flex items-center gap-1.5 min-h-[40px]"
          >
            <span>{{ availableLanguages.find(l => l.code === currentLang)?.flag }}</span>
            <iconify-icon icon="ph:caret-down" width="12" :class="showLangPicker ? 'rotate-180' : ''" class="transition-transform"></iconify-icon>
          </button>
          
          <div
            v-if="showLangPicker"
            class="absolute right-0 top-full mt-1 neu-card rounded-xl py-1 w-36 shadow-neu-raised-lg z-50 animate-fade-in"
          >
            <button
              v-for="lang in availableLanguages"
              :key="lang.code"
              @click="selectLang(lang.code)"
              :class="[
                'w-full px-3 py-2.5 text-left text-xs font-semibold flex items-center gap-2 transition-colors min-h-[40px]',
                currentLang === lang.code ? 'text-neon-pink bg-neon-pink/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
              ]"
            >
              <span>{{ lang.flag }}</span>
              <span>{{ lang.label }}</span>
              <iconify-icon v-if="currentLang === lang.code" icon="ph:check-bold" width="12" class="ml-auto text-neon-pink"></iconify-icon>
            </button>
          </div>
        </div>

        <!-- Install App PWA button -->
        <button
          v-if="deferredPrompt"
          @click="installPwa"
          class="neu-pill px-3 py-2 rounded-xl text-neon-cyan hover:bg-neon-cyan/10 transition-all font-bold text-xs flex items-center gap-1.5 min-h-[40px]"
        >
          <iconify-icon icon="ph:device-mobile-speaker-bold" width="16"></iconify-icon>
          <span>{{ t('installApp') }}</span>
        </button>

        <button
          @click="toggleTheme"
          class="neu-pill p-2.5 rounded-xl text-slate-300 hover:text-neon-pink transition-all focus:outline-none min-w-[40px] min-h-[40px] flex items-center justify-center"
          aria-label="Toggle Dark Mode"
        >
          <iconify-icon v-if="isDark" icon="ph:sun-bold" width="20"></iconify-icon>
          <iconify-icon v-else icon="ph:moon-bold" width="20"></iconify-icon>
        </button>

        <nav
          aria-label="Site navigation"
          class="border-l border-white/5 pl-2 flex items-center gap-1.5"
        >
          <a
            :href="brandConfig.githubRepo"
            target="_blank"
            rel="noopener noreferrer"
            class="neu-pill px-3 py-2 rounded-xl text-slate-300 hover:text-neon-cyan transition-all flex items-center gap-1.5 font-semibold text-xs no-underline min-h-[40px]"
            aria-label="View source on GitHub"
          >
            <iconify-icon icon="mdi:github" width="18"></iconify-icon>
            <span>GitHub</span>
          </a>
          <a
            href="/about.html"
            class="neu-pill px-3 py-2 rounded-xl text-slate-300 hover:text-neon-pink transition-all flex items-center gap-1.5 font-semibold text-xs no-underline min-h-[40px]"
          >
            <span>{{ t('about') }}</span>
          </a>
        </nav>
      </div>

      <!-- Mobile Right Controls -->
      <div class="flex md:hidden items-center gap-2">
        <!-- Mobile Language -->
        <button
          @click="showLangPicker = !showLangPicker"
          class="neu-pill p-2.5 rounded-xl text-slate-200 focus:outline-none min-w-[42px] min-h-[42px] flex items-center justify-center"
          aria-label="Switch language"
        >
          <span class="text-sm">{{ availableLanguages.find(l => l.code === currentLang)?.flag }}</span>
        </button>

        <button
          @click="toggleTheme"
          class="neu-pill p-2.5 rounded-xl text-slate-200 focus:outline-none min-w-[42px] min-h-[42px] flex items-center justify-center"
          aria-label="Toggle Dark Mode"
        >
          <iconify-icon v-if="isDark" icon="ph:sun-bold" width="18"></iconify-icon>
          <iconify-icon v-else icon="ph:moon-bold" width="18"></iconify-icon>
        </button>

        <button
          @click="toggleMenu"
          class="neu-pill p-2.5 rounded-xl text-slate-200 focus:outline-none active:scale-95 transition-transform min-w-[42px] min-h-[42px] flex items-center justify-center"
          aria-label="Toggle Menu"
        >
          <iconify-icon v-if="isMenuOpen" icon="ph:x-bold" width="20"></iconify-icon>
          <iconify-icon v-else icon="ph:list-bold" width="20"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- Mobile Lang Picker Dropdown -->
    <div
      v-if="showLangPicker"
      class="md:hidden px-3 pb-2 animate-fade-in"
    >
      <div class="neu-card rounded-xl p-2 flex gap-2">
        <button
          v-for="lang in availableLanguages"
          :key="lang.code"
          @click="selectLang(lang.code)"
          :class="[
            'flex-1 px-3 py-2.5 rounded-lg text-xs font-bold text-center transition-all min-h-[42px]',
            currentLang === lang.code ? 'bg-neon-pink/15 text-neon-pink shadow-neu-raised-sm' : 'text-slate-300 hover:bg-white/5'
          ]"
        >
          {{ lang.flag }} {{ lang.label }}
        </button>
      </div>
    </div>

    <!-- Mobile Menu Dropdown (Neumorphic) -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-3 scale-98"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-2 scale-98"
    >
      <div
        v-if="isMenuOpen"
        class="md:hidden mobile-glass-drawer border-b border-white/5 px-4 py-4 flex flex-col gap-2.5 shadow-neu-raised absolute w-full left-0"
      >
        <button
          @click="toggleTheme"
          class="neu-pill flex items-center justify-between p-3.5 rounded-xl text-slate-100 font-semibold text-sm w-full text-left min-h-[48px]"
        >
          <span class="flex items-center gap-2.5">
            <iconify-icon v-if="isDark" icon="ph:sun-bold" width="20" class="text-neon-orange"></iconify-icon>
            <iconify-icon v-else icon="ph:moon-bold" width="20" class="text-neon-purple"></iconify-icon>
            <span>{{ t('appearance') }}</span>
          </span>
          <span class="text-xs font-bold text-slate-400">{{ isDark ? t('darkMode') : t('lightMode') }}</span>
        </button>

        <a
          :href="brandConfig.githubRepo"
          target="_blank"
          rel="noopener noreferrer"
          @click="closeMenu"
          class="neu-pill flex items-center gap-2.5 p-3.5 rounded-xl text-slate-100 font-semibold text-sm no-underline min-h-[48px]"
        >
          <iconify-icon icon="mdi:github" width="20" class="text-slate-300"></iconify-icon>
          <span>GitHub Repository</span>
        </a>

        <a
          href="/about.html"
          @click="closeMenu"
          class="neu-pill flex items-center gap-2.5 p-3.5 rounded-xl text-slate-100 font-semibold text-sm no-underline min-h-[48px]"
        >
          <iconify-icon icon="ph:info-bold" width="20" class="text-neon-cyan"></iconify-icon>
          <span>{{ t('about') }} GemClean AI</span>
        </a>
      </div>
    </transition>
  </header>
</template>