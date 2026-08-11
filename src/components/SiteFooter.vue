<script setup>
import { brandConfig } from '../config/brandConfig.js';
import { useI18n } from '../config/i18n.js';

const { t } = useI18n();
</script>

<template>
  <footer
    class="neu-card border-t border-white/3 mt-auto relative z-10 transition-colors duration-300 rounded-none"
  >
    <div class="relative max-w-7xl mx-auto px-4 py-6 sm:py-8 text-center">
      <p class="text-xs sm:text-sm text-slate-400 font-medium">
        {{ t('poweredBy') }}
        <span class="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan">{{ brandConfig.name }}</span>
      </p>
      
      <!-- Social links (neumorphic) -->
      <nav
        aria-label="Social media links"
        class="flex justify-center gap-3 sm:gap-4 mt-4 sm:mt-5"
      >
        <a :href="brandConfig.socials.github" target="_blank" rel="noopener noreferrer"
          class="neu-pill p-2.5 rounded-full hover:text-neon-cyan hover:shadow-neon-cyan transition-all text-slate-400 min-w-[42px] min-h-[42px] flex items-center justify-center"
          aria-label="View GitHub profile"
          ><iconify-icon icon="mdi:github" width="18"></iconify-icon
        ></a>
        <a :href="brandConfig.socials.twitter" target="_blank" rel="noopener noreferrer"
          class="neu-pill p-2.5 rounded-full hover:text-neon-pink hover:shadow-neon-pink transition-all text-slate-400 min-w-[42px] min-h-[42px] flex items-center justify-center"
          aria-label="Follow on Twitter / X"
          ><iconify-icon icon="line-md:twitter-x" width="18"></iconify-icon
        ></a>
        <a :href="brandConfig.socials.linkedin" target="_blank" rel="noopener noreferrer"
          class="neu-pill p-2.5 rounded-full hover:text-neon-blue hover:shadow-neon-cyan transition-all text-slate-400 min-w-[42px] min-h-[42px] flex items-center justify-center"
          aria-label="Connect on LinkedIn"
          ><iconify-icon icon="mdi:linkedin" width="18"></iconify-icon
        ></a>
        <a :href="brandConfig.socials.instagram" target="_blank" rel="noopener noreferrer"
          class="neu-pill p-2.5 rounded-full hover:text-neon-purple hover:shadow-neon-purple transition-all text-slate-400 min-w-[42px] min-h-[42px] flex items-center justify-center"
          aria-label="Follow on Instagram"
          ><iconify-icon icon="mdi:instagram" width="18"></iconify-icon
        ></a>
      </nav>

      <!-- Footer navigation -->
      <nav
        aria-label="Footer links"
        class="flex justify-center gap-4 sm:gap-6 mt-4 sm:mt-6 text-xs sm:text-sm text-slate-400 font-semibold flex-wrap"
      >
        <a href="/privacy-policy.html" class="hover:text-neon-cyan transition-colors py-1 min-h-[32px] flex items-center">{{ t('privacyPolicy') }}</a>
        <a href="/terms.html" class="hover:text-neon-cyan transition-colors py-1 min-h-[32px] flex items-center">{{ t('termsOfService') }}</a>
        <a href="/about.html" class="hover:text-neon-cyan transition-colors py-1 min-h-[32px] flex items-center">{{ t('about') }}</a>
        <a href="/contact.html" class="hover:text-neon-cyan transition-colors py-1 min-h-[32px] flex items-center">{{ t('contactUs') }}</a>
      </nav>

      <p class="text-[10px] sm:text-xs text-slate-500 mt-4 sm:mt-6 max-w-xl mx-auto leading-relaxed px-2 font-mono">
        {{ brandConfig.disclaimer }} <br />
        &copy; 2026 {{ brandConfig.name }}. {{ t('allRightsReserved') }}
      </p>
    </div>
  </footer>
</template>
