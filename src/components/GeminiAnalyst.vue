<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  imageSrc: { type: String, required: true },
  imageFormat: { type: String, default: 'image/jpeg' }
});

const emit = defineEmits(['close']);
const prompt = ref('');
const responseText = ref('');
const loading = ref(false);
const errorMsg = ref('');

// Convert image URL/blob to base64
const imageBase64 = ref(null);

async function convertImageToBase64(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Failed to convert image", e);
    return null;
  }
}

watch(() => props.imageSrc, async (newSrc) => {
  if (newSrc) {
    imageBase64.value = await convertImageToBase64(newSrc);
    responseText.value = '';
    errorMsg.value = '';
  }
}, { immediate: true });

async function askGemini() {
  if (!prompt.value.trim() || !imageBase64.value) return;
  
  loading.value = true;
  errorMsg.value = '';
  responseText.value = '';
  
  try {
    const res = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: imageBase64.value,
        prompt: prompt.value
      })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to analyze image');
    }
    
    responseText.value = data.text;
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="liquid-glass-card rounded-2xl p-4 sm:p-6 mt-4 border border-purple-500/20 relative animate-fade-in shadow-xl shadow-purple-500/5">
    <button @click="emit('close')" class="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors z-10">
      <iconify-icon icon="ph:x-bold" width="18"></iconify-icon>
    </button>
    
    <div class="flex items-center gap-2 mb-4">
      <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
        <iconify-icon icon="ph:sparkle-fill" class="text-white text-sm"></iconify-icon>
      </div>
      <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm">Gemini AI Image Analyst</h3>
    </div>
    
    <div class="flex flex-col sm:flex-row gap-4 items-start">
      <div class="w-full sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center">
        <img :src="imageSrc" class="max-w-full max-h-full object-cover" v-if="imageSrc" />
      </div>
      
      <div class="flex-1 space-y-3 w-full">
        <textarea
          v-model="prompt"
          placeholder="Ask anything about this image... (e.g. 'Is this AI generated?', 'What is in this image?')"
          class="w-full h-24 liquid-glass-pill rounded-xl p-3 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none border border-black/5 dark:border-white/5"
          @keydown.enter.prevent="askGemini"
        ></textarea>
        
        <div class="flex justify-between items-center">
          <p class="text-[10px] font-bold text-slate-400">Press Enter to ask</p>
          <button 
            @click="askGemini" 
            :disabled="loading || !prompt.trim() || !imageBase64"
            class="btn-micro-pop bg-gradient-to-r from-blue-500 to-purple-500 hover:to-purple-400 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
          >
            <iconify-icon v-if="loading" icon="ph:spinner-gap-bold" class="animate-spin text-base"></iconify-icon>
            <iconify-icon v-else icon="ph:paper-plane-right-fill" class="text-base"></iconify-icon>
            <span>{{ loading ? 'Analyzing...' : 'Ask AI' }}</span>
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="errorMsg" class="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold flex items-center gap-2">
      <iconify-icon icon="ph:warning-circle-bold" class="text-lg"></iconify-icon>
      {{ errorMsg }}
    </div>
    
    <div v-if="responseText" class="mt-4 p-4 bg-white/40 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 shadow-inner">
      <div class="flex gap-2 mb-2">
        <iconify-icon icon="ph:magic-wand-fill" class="text-purple-500 text-lg flex-shrink-0"></iconify-icon>
        <h4 class="font-bold text-slate-800 dark:text-slate-100 text-xs">AI Response</h4>
      </div>
      <p class="whitespace-pre-wrap leading-relaxed">{{ responseText }}</p>
    </div>
  </div>
</template>
