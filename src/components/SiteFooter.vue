<script setup>
import { brandConfig } from '../config/brandConfig.js';
</script>

<template>
  <footer
    class="glass-panel border-t border-white/60 dark:border-white/10 backdrop-blur-xl bg-white/50 dark:bg-slate-900/50 mt-auto relative z-10 transition-colors duration-300"
  >
    <div class="max-w-7xl mx-auto px-4 py-8 text-center">
      <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">
        Powered by
        <span class="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{{ brandConfig.name }}</span>
      </p>
      <nav
        aria-label="Social media links"
        class="flex justify-center gap-6 mt-4 text-slate-400 dark:text-slate-500"
      >
        <a :href="brandConfig.socials.twitter" target="_blank" rel="noopener noreferrer"
          class="hover:text-indigo-500 hover:scale-110 transition-transform"
          aria-label="Follow on Twitter / X"
          ><iconify-icon icon="line-md:twitter-x" width="24"></iconify-icon
        ></a>
        <a :href="brandConfig.socials.instagram" target="_blank" rel="noopener noreferrer"
          class="hover-instagram hover:scale-110 transition-transform"
          aria-label="Follow on Instagram"
          ><iconify-icon icon="mdi:instagram" width="24"></iconify-icon
        ></a>
        <a :href="brandConfig.socials.github" target="_blank" rel="noopener noreferrer"
          class="hover:text-indigo-500 hover:scale-110 transition-transform"
          aria-label="View GitHub profile"
          ><iconify-icon icon="mdi:github" width="24"></iconify-icon
        ></a>
        <a :href="brandConfig.socials.telegram" target="_blank" rel="noopener noreferrer"
          class="hover:text-[#0088cc] hover:scale-110 transition-transform"
          aria-label="Join Telegram"
          ><iconify-icon icon="line-md:telegram" width="24"></iconify-icon
        ></a>
      </nav>

      <nav
        aria-label="Footer links"
        class="flex justify-center gap-6 mt-6 text-sm text-slate-500 dark:text-slate-400 font-semibold flex-wrap"
      >
        <a href="/privacy-policy.html" class="hover:text-indigo-500 dark:hover:text-white transition-colors">Privacy Policy</a>
        <a href="/terms.html" class="hover:text-indigo-500 dark:hover:text-white transition-colors">Terms of Service</a>
        <a href="/about.html" class="hover:text-indigo-500 dark:hover:text-white transition-colors">About</a>
        <a href="/contact.html" class="hover:text-indigo-500 dark:hover:text-white transition-colors">Contact</a>
      </nav>

      <p class="text-xs text-slate-400 dark:text-slate-500 mt-6 max-w-xl mx-auto leading-relaxed">
        {{ brandConfig.disclaimer }} <br />
        &copy; 2026 {{ brandConfig.name }}. All rights reserved.
      </p>
    </div>
  </footer>
</template>

