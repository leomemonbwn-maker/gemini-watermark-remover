<script setup>
import { brandConfig } from '../config/brandConfig.js';
</script>

<template>
  <footer
    class="liquid-glass border-t border-white/40 dark:border-white/10 mt-auto relative z-10 transition-colors duration-300"
  >
    <div class="max-w-7xl mx-auto px-4 py-6 sm:py-8 text-center">
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
        Powered by
        <span class="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-blue-400 to-teal-300">{{ brandConfig.name }}</span>
      </p>
      
      <!-- Social links -->
      <nav
        aria-label="Social media links"
        class="flex justify-center gap-3 sm:gap-5 mt-3 sm:mt-4 text-slate-400 dark:text-slate-500"
      >
        <a :href="brandConfig.socials.github" target="_blank" rel="noopener noreferrer"
          class="liquid-glass-pill p-2 rounded-full hover:text-teal-500 hover:scale-110 transition-all text-slate-600 dark:text-slate-400"
          aria-label="View GitHub profile"
          ><iconify-icon icon="mdi:github" width="18"></iconify-icon
        ></a>
        <a :href="brandConfig.socials.twitter" target="_blank" rel="noopener noreferrer"
          class="liquid-glass-pill p-2 rounded-full hover:text-blue-500 hover:scale-110 transition-all text-slate-600 dark:text-slate-400"
          aria-label="Follow on Twitter / X"
          ><iconify-icon icon="line-md:twitter-x" width="18"></iconify-icon
        ></a>
        <a :href="brandConfig.socials.linkedin" target="_blank" rel="noopener noreferrer"
          class="liquid-glass-pill p-2 rounded-full hover:text-[#0077b5] hover:scale-110 transition-all text-slate-600 dark:text-slate-400"
          aria-label="Connect on LinkedIn"
          ><iconify-icon icon="mdi:linkedin" width="18"></iconify-icon
        ></a>
        <a :href="brandConfig.socials.instagram" target="_blank" rel="noopener noreferrer"
          class="liquid-glass-pill p-2 rounded-full hover:text-pink-500 hover:scale-110 transition-all text-slate-600 dark:text-slate-400"
          aria-label="Follow on Instagram"
          ><iconify-icon icon="mdi:instagram" width="18"></iconify-icon
        ></a>
      </nav>

      <!-- Footer navigation -->
      <nav
        aria-label="Footer links"
        class="flex justify-center gap-3 sm:gap-6 mt-4 sm:mt-6 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold flex-wrap"
      >
        <a href="/privacy-policy.html" class="hover:text-teal-500 dark:hover:text-white transition-colors">Privacy Policy</a>
        <a href="/terms.html" class="hover:text-teal-500 dark:hover:text-white transition-colors">Terms of Service</a>
        <a href="/about.html" class="hover:text-teal-500 dark:hover:text-white transition-colors">About</a>
        <a href="/contact.html" class="hover:text-teal-500 dark:hover:text-white transition-colors">Contact</a>
      </nav>

      <p class="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-4 sm:mt-6 max-w-xl mx-auto leading-relaxed px-2">
        {{ brandConfig.disclaimer }} <br />
        &copy; 2026 {{ brandConfig.name }}. All rights reserved.
      </p>
    </div>
  </footer>
</template>
