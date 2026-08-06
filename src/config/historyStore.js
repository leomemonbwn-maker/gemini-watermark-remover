import { ref, computed } from 'vue';

const STORAGE_KEY = 'gemclean_history';
const MAX_ENTRIES = 50;
const THUMB_MAX_SIZE = 120; // px for thumbnail

/**
 * Reactive localStorage-backed processing history store.
 * Stores compressed thumbnails + metadata for up to 50 processed images.
 */
const entries = ref(loadFromStorage());

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.value));
  } catch (e) {
    // localStorage full — remove oldest entries
    if (entries.value.length > 5) {
      entries.value = entries.value.slice(0, Math.floor(entries.value.length / 2));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.value));
      } catch { /* give up */ }
    }
  }
}

/**
 * Generate a small thumbnail from a blob URL.
 * Returns a base64 data URL (WebP or JPEG, < 50KB).
 */
async function generateThumbnail(blobUrl, width, height) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scale = Math.min(THUMB_MAX_SIZE / width, THUMB_MAX_SIZE / height, 1);
      const tw = Math.round(width * scale);
      const th = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, tw, th);
      // Try WebP first, fallback to JPEG
      let dataUrl = canvas.toDataURL('image/webp', 0.6);
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      }
      resolve(dataUrl);
    };
    img.onerror = () => resolve(null);
    img.src = blobUrl;
  });
}

/**
 * Add a processed image to history.
 * @param {Object} params
 * @param {string} params.name - Filename
 * @param {string} params.blobUrl - Object URL of the cleaned image
 * @param {number} params.width - Image width
 * @param {number} params.height - Image height
 * @param {Blob} params.blob - The cleaned image blob
 */
export async function addEntry({ name, blobUrl, width, height, blob }) {
  const thumbnail = await generateThumbnail(blobUrl, width, height);
  if (!thumbnail) return;

  const entry = {
    id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    name,
    width,
    height,
    thumbnail,
    timestamp: Date.now(),
    sizeBytes: blob?.size || 0,
  };

  // Add to front
  entries.value.unshift(entry);

  // Enforce max limit (LRU eviction)
  if (entries.value.length > MAX_ENTRIES) {
    entries.value = entries.value.slice(0, MAX_ENTRIES);
  }

  saveToStorage();
}

/**
 * Remove an entry by ID.
 */
export function removeEntry(id) {
  entries.value = entries.value.filter(e => e.id !== id);
  saveToStorage();
}

/**
 * Clear all history.
 */
export function clearAll() {
  entries.value = [];
  saveToStorage();
}

/**
 * Get all entries (reactive).
 */
export function useHistory() {
  return {
    entries: computed(() => entries.value),
    addEntry,
    removeEntry,
    clearAll,
    hasEntries: computed(() => entries.value.length > 0),
    entryCount: computed(() => entries.value.length),
  };
}
