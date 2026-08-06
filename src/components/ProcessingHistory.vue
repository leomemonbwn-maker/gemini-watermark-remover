<script setup>
import { useHistory } from '../config/historyStore.js';
import { useI18n } from '../config/i18n.js';

const { entries, removeEntry, clearAll, hasEntries } = useHistory();
const { t } = useI18n();

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
</script>

<template>
  <section class="py-14 sm:py-20 reveal-on-scroll">
    <div class="max-w-4xl mx-auto px-4 sm:px-6">
      <div class="text-center mb-8 sm:mb-10">
        <span class="inline-block text-xs font-bold uppercase tracking-widest text-neon-green mb-2 font-mono">Local Storage</span>
        <h2 class="text-2xl sm:text-4xl font-black text-white tracking-tight">
          {{ t('historyTitle') }}
        </h2>
      </div>

      <!-- Empty state -->
      <div v-if="!hasEntries" class="cyber-card rounded-2xl p-8 sm:p-12 text-center">
        <iconify-icon icon="ph:clock-counter-clockwise" width="48" class="text-slate-600 mb-3"></iconify-icon>
        <p class="text-sm text-slate-400 font-medium">{{ t('historyEmpty') }}</p>
      </div>

      <!-- History grid -->
      <div v-else>
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-mono font-bold text-slate-500">{{ entries.length }} {{ entries.length === 1 ? 'item' : 'items' }}</span>
          <button
            @click="clearAll"
            class="text-xs font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
          >
            <iconify-icon icon="ph:trash-bold" width="14"></iconify-icon>
            {{ t('historyClearAll') }}
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <div
            v-for="entry in entries"
            :key="entry.id"
            class="cyber-card rounded-xl overflow-hidden group relative"
          >
            <!-- Thumbnail -->
            <div class="aspect-square bg-cyber-void flex items-center justify-center overflow-hidden">
              <img
                :src="entry.thumbnail"
                :alt="entry.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>

            <!-- Info overlay on hover -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2.5">
              <p class="text-[10px] font-bold text-white truncate mb-0.5">{{ entry.name }}</p>
              <p class="text-[9px] font-mono text-slate-400">
                {{ entry.width }}×{{ entry.height }}
                <span v-if="entry.sizeBytes" class="ml-1">· {{ formatSize(entry.sizeBytes) }}</span>
              </p>
              <p class="text-[9px] font-mono text-slate-500">{{ formatDate(entry.timestamp) }}</p>

              <!-- Delete button -->
              <button
                @click.stop="removeEntry(entry.id)"
                class="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                :title="t('historyDelete')"
              >
                <iconify-icon icon="ph:x-bold" width="10"></iconify-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
