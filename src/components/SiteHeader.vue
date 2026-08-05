<script setup>
import { ref, onMounted } from 'vue';
import { brandConfig } from '../config/brandConfig.js';

const isDark = ref(false);
const isMenuOpen = ref(false);

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark');
});

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
</script>

<template>
  <header
    class="sticky top-0 z-50 liquid-glass-header transition-all duration-300"
  >
    <div class="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
      
      <!-- Brand Logo & Title -->
      <a href="/" class="flex items-center gap-2 sm:gap-2.5 overflow-hidden no-underline group select-none">
        <div class="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500/20 via-blue-500/20 to-indigo-500/20 p-1 border border-white/60 dark:border-white/10 shadow-sm group-hover:scale-105 transition-transform duration-300">
          <img src="/assets/logo.svg" :alt="brandConfig.name + ' Logo'" width="32" height="32" class="w-6 h-6 sm:w-8 sm:h-8 select-none" />
        </div>
        <div class="flex flex-col">
          <p class="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 dark:text-white whitespace-nowrap tracking-tight leading-tight m-0">
            GemClean <span class="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-blue-400 to-teal-300">AI</span>
          </p>
        </div>
      </a>

      <!-- Desktop Nav & Theme Toggle -->
      <div class="hidden md:flex items-center gap-3">
        <button
          @click="toggleTheme"
          class="liquid-glass-pill p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-teal-500 dark:hover:text-teal-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          aria-label="Toggle Dark Mode"
        >
          <iconify-icon v-if="isDark" icon="ph:sun-bold" width="20"></iconify-icon>
          <iconify-icon v-else icon="ph:moon-bold" width="20"></iconify-icon>
        </button>

        <nav
          aria-label="Site navigation"
          class="border-l border-white/40 dark:border-white/10 pl-3 flex items-center gap-2"
        >
          <a
            :href="brandConfig.githubRepo"
            target="_blank"
            rel="noopener noreferrer"
            class="liquid-glass-pill px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-teal-500 dark:hover:text-teal-400 transition-all flex items-center gap-1.5 font-semibold text-xs md:text-sm no-underline"
            aria-label="View source on GitHub"
          >
            <iconify-icon icon="mdi:github" width="18"></iconify-icon>
            <span>GitHub</span>
          </a>
          <a
            href="/about.html"
            class="liquid-glass-pill px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-teal-500 dark:hover:text-teal-400 transition-all flex items-center gap-1.5 font-semibold text-xs md:text-sm no-underline"
          >
            <span>About</span>
          </a>
        </nav>
      </div>

      <!-- Mobile Right Controls (Theme + Hamburger) -->
      <div class="flex md:hidden items-center gap-1.5">
        <button
          @click="toggleTheme"
          class="liquid-glass-pill p-2 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
          aria-label="Toggle Dark Mode"
        >
          <iconify-icon v-if="isDark" icon="ph:sun-bold" width="18"></iconify-icon>
          <iconify-icon v-else icon="ph:moon-bold" width="18"></iconify-icon>
        </button>

        <button
          @click="toggleMenu"
          class="liquid-glass-pill p-2 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none active:scale-95 transition-transform"
          aria-label="Toggle Menu"
        >
          <iconify-icon v-if="isMenuOpen" icon="ph:x-bold" width="20"></iconify-icon>
          <iconify-icon v-else icon="ph:list-bold" width="20"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- Mobile Menu Dropdown with Smooth Liquid Glass -->
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
        class="md:hidden mobile-glass-drawer border-b border-white/40 dark:border-white/10 px-4 py-4 flex flex-col gap-2.5 shadow-2xl absolute w-full left-0"
      >
        <button
          @click="toggleTheme"
          class="liquid-glass-pill flex items-center justify-between p-3 rounded-xl text-slate-800 dark:text-slate-100 font-semibold text-sm w-full text-left"
        >
          <span class="flex items-center gap-2.5">
            <iconify-icon v-if="isDark" icon="ph:sun-bold" width="20" class="text-amber-400"></iconify-icon>
            <iconify-icon v-else icon="ph:moon-bold" width="20" class="text-indigo-400"></iconify-icon>
            <span>Appearance</span>
          </span>
          <span class="text-xs font-bold text-slate-400">{{ isDark ? 'Dark Mode' : 'Light Mode' }}</span>
        </button>

        <a
          :href="brandConfig.githubRepo"
          target="_blank"
          rel="noopener noreferrer"
          @click="closeMenu"
          class="liquid-glass-pill flex items-center gap-2.5 p-3 rounded-xl text-slate-800 dark:text-slate-100 font-semibold text-sm no-underline"
        >
          <iconify-icon icon="mdi:github" width="20" class="text-slate-600 dark:text-slate-300"></iconify-icon>
          <span>GitHub Repository</span>
        </a>

        <a
          href="/about.html"
          @click="closeMenu"
          class="liquid-glass-pill flex items-center gap-2.5 p-3 rounded-xl text-slate-800 dark:text-slate-100 font-semibold text-sm no-underline"
        >
          <iconify-icon icon="ph:info-bold" width="20" class="text-teal-500"></iconify-icon>
          <span>About GemClean AI</span>
        </a>
      </div>
    </transition>
  </header>
</template>