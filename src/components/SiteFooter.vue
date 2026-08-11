<script setup>
import { brandConfig } from '../config/brandConfig.js';
import { useI18n } from '../config/i18n.js';

const { t } = useI18n();
</script>

<template>
  <footer
    class="neu-card border-t border-white/5 mt-auto relative z-10 transition-colors duration-200 rounded-none"
  >
    <div class="relative max-w-5xl mx-auto px-4 py-5 sm:py-6 text-center">
      <p class="text-xs text-slate-400 font-medium">
        {{ t('poweredBy') }}
        <span class="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan">{{ brandConfig.name }}</span>
      </p>
      
      <!-- Social links -->
      <nav
        aria-label="Social media links"
        class="flex justify-center gap-2 sm:gap-3 mt-3"
      >
        <a :href="brandConfig.socials.github" target="_blank" rel="noopener noreferrer"
          class="neu-pill p-2 rounded-full hover:text-neon-cyan transition-all text-slate-400 min-w-[34px] min-h-[34px] flex items-center justify-center"
          aria-label="View GitHub profile"
          ><iconify-icon icon="mdi:github" width="16"></iconify-icon
        ></a>
        <a :href="brandConfig.socials.twitter" target="_blank" rel="noopener noreferrer"
          class="neu-pill p-2 rounded-full hover:text-neon-pink transition-all text-slate-400 min-w-[34px] min-h-[34px] flex items-center justify-center"
          aria-label="Follow on Twitter / X"
          ><iconify-icon icon="line-md:twitter-x" width="16"></iconify-icon
        ></a>
        <a :href="brandConfig.socials.linkedin" target="_blank" rel="noopener noreferrer"
          class="neu-pill p-2 rounded-full hover:text-neon-blue transition-all text-slate-400 min-w-[34px] min-h-[34px] flex items-center justify-center"
          aria-label="Connect on LinkedIn"
          ><iconify-icon icon="mdi:linkedin" width="16"></iconify-icon
        ></a>
        <a :href="brandConfig.socials.instagram" target="_blank" rel="noopener noreferrer"
          class="neu-pill p-2 rounded-full hover:text-neon-purple transition-all text-slate-400 min-w-[34px] min-h-[34px] flex items-center justify-center"
          aria-label="Follow on Instagram"
          ><iconify-icon icon="mdi:instagram" width="16"></iconify-icon
        ></a>
      </nav>

      <!-- Footer navigation -->
      <nav
        aria-label="Footer links"
        class="flex justify-center gap-3 sm:gap-5 mt-3 sm:mt-4 text-xs text-slate-400 font-semibold flex-wrap"
      >
        <a href="/privacy-policy.html" class="hover:text-neon-cyan transition-colors py-0.5">{{ t('privacyPolicy') }}</a>
        <a href="/terms.html" class="hover:text-neon-cyan transition-colors py-0.5">{{ t('termsOfService') }}</a>
        <a href="/about.html" class="hover:text-neon-cyan transition-colors py-0.5">{{ t('about') }}</a>
        <a href="/contact.html" class="hover:text-neon-cyan transition-colors py-0.5">{{ t('contactUs') }}</a>
      </nav>

      <p class="text-[10px] sm:text-[11px] text-slate-500 mt-3 max-w-md mx-auto leading-relaxed px-2 font-mono">
        {{ brandConfig.disclaimer }} <br />
        &copy; 2026 {{ brandConfig.name }}. {{ t('allRightsReserved') }}
      </p>
    </div>
  </footer>
</template>
