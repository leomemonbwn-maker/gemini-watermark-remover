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
</script>

<template>
  <header
    class="sticky top-0 z-50 bg-white/65 dark:bg-slate-900/65 backdrop-blur-xl border-b border-white/60 dark:border-white/10 shadow-sm transition-colors duration-300"
  >
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2.5 overflow-hidden no-underline group">
        <div class="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500/20 via-cyan-500/20 to-purple-500/20 p-1 border border-white/40 dark:border-white/10 shadow-sm group-hover:scale-105 transition-transform">
          <img src="/assets/logo.svg" :alt="brandConfig.name + ' Logo'" width="36" height="36" class="w-8 h-8 select-none" />
        </div>
        <p
          class="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white whitespace-nowrap tracking-tight m-0"
        >
          GemClean <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">AI</span>
        </p>
      </a>

      <div class="hidden md:flex items-center gap-4">
        <button
          @click="toggleTheme"
          class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-slate-600 dark:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          aria-label="Toggle Dark Mode"
        >
          <iconify-icon v-if="isDark" icon="ph:sun-bold" width="22"></iconify-icon>
          <iconify-icon v-else icon="ph:moon-bold" width="22"></iconify-icon>
        </button>

        <nav
          aria-label="Site navigation"
          class="flex-shrink-0 border-l border-gray-200 dark:border-gray-700 pl-4 flex items-center gap-4"
        >
          <a
            :href="brandConfig.githubRepo"
            target="_blank"
            rel="noopener noreferrer"
            class="text-slate-600 dark:text-slate-400 hover:text-brand-primary dark:hover:text-white transition-colors flex items-center gap-1 font-semibold text-sm md:text-base"
            aria-label="View source on GitHub"
          >
            <iconify-icon icon="mdi:github" width="24"></iconify-icon>
            <span>GitHub</span>
          </a>
          <a
            href="/about.html"
            class="text-slate-600 dark:text-slate-400 hover:text-brand-primary dark:hover:text-white transition-colors flex items-center gap-1 font-semibold text-sm md:text-base"
          >
            <span>About</span>
          </a>
        </nav>
      </div>

      <button
        @click="toggleMenu"
        class="md:hidden p-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
        aria-label="Toggle Menu"
      >
        <iconify-icon v-if="isMenuOpen" icon="ph:x-bold" width="24"></iconify-icon>
        <iconify-icon v-else icon="ph:list-bold" width="24"></iconify-icon>
      </button>
    </div>

    <div
      v-if="isMenuOpen"
      class="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-theme-dark/95 backdrop-blur-md px-4 py-4 flex flex-col gap-4 shadow-lg absolute w-full left-0"
    >
      <button
        @click="toggleTheme"
        class="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-slate-600 dark:text-slate-400 transition-all text-left w-full font-semibold"
      >
        <iconify-icon v-if="isDark" icon="ph:sun-bold" width="22"></iconify-icon>
        <iconify-icon v-else icon="ph:moon-bold" width="22"></iconify-icon>
        <span>{{ isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode' }}</span>
      </button>
      
      <a
        :href="brandConfig.githubRepo"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-3 p-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold"
      >
        <iconify-icon icon="mdi:github" width="24"></iconify-icon>
        <span>GitHub</span>
      </a>

      <a
        href="/about.html"
        class="flex items-center gap-3 p-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold"
      >
        <iconify-icon icon="ph:info-bold" width="24"></iconify-icon>
        <span>About GemClean AI</span>
      </a>
    </div>
  </header>
</template>