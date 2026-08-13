<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  imageSrc: { type: String, required: true },
  zoom: { type: Number, default: 4 },
  lensSize: { type: Number, default: 130 },
  active: { type: Boolean, default: true },
});

const isHovering = ref(false);
const pointerX = ref(0);
const pointerY = ref(0);
const containerRect = ref({ left: 0, top: 0, width: 0, height: 0 });
const containerRef = ref(null);
const currentZoom = ref(props.zoom);

function updateRect() {
  if (containerRef.value) {
    containerRect.value = containerRef.value.getBoundingClientRect();
  }
}

function onPointerEnter(e) {
  if (!props.active) return;
  updateRect();
  isHovering.value = true;
  updatePosition(e);
}

function onPointerMove(e) {
  if (!props.active) return;
  if (!isHovering.value) isHovering.value = true;
  updatePosition(e);
}

function onPointerLeave() {
  isHovering.value = false;
}

function updatePosition(e) {
  const rect = containerRect.value;
  if (!rect || rect.width === 0) return;
  
  let clientX, clientY;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  
  pointerX.value = Math.max(0, Math.min(rect.width, clientX - rect.left));
  pointerY.value = Math.max(0, Math.min(rect.height, clientY - rect.top));
}

function toggleZoomLevel(e) {
  if (!props.active) return;
  currentZoom.value = currentZoom.value === 4 ? 8 : 4;
}

const lensStyle = computed(() => {
  const half = props.lensSize / 2;
  const w = containerRect.value.width || 1;
  const h = containerRect.value.height || 1;

  const bgW = w * currentZoom.value;
  const bgH = h * currentZoom.value;
  const bgPosX = -pointerX.value * currentZoom.value + half;
  const bgPosY = -pointerY.value * currentZoom.value + half;

  return {
    left: `${pointerX.value}px`,
    top: `${pointerY.value}px`,
    width: `${props.lensSize}px`,
    height: `${props.lensSize}px`,
    backgroundImage: `url("${props.imageSrc}")`,
    backgroundSize: `${bgW}px ${bgH}px`,
    backgroundPosition: `${bgPosX}px ${bgPosY}px`,
    backgroundRepeat: 'no-repeat',
  };
});

onMounted(() => {
  window.addEventListener('resize', updateRect);
  window.addEventListener('scroll', updateRect, true);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateRect);
  window.removeEventListener('scroll', updateRect, true);
});
</script>

<template>
  <div
    ref="containerRef"
    class="relative inline-block overflow-hidden select-none"
    @pointerenter="onPointerEnter"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
    @touchstart.passive="onPointerEnter"
    @touchmove.passive="onPointerMove"
    @touchend="onPointerLeave"
    @dblclick="toggleZoomLevel"
  >
    <slot></slot>

    <!-- Floating Magnifier Loupe -->
    <div
      v-if="active && isHovering"
      class="magnifier-lens pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-neon-cyan shadow-[0_0_20px_rgba(0,240,255,0.5),0_10px_30px_rgba(0,0,0,0.85)] z-30 overflow-hidden"
      :style="lensStyle"
    >
      <!-- Crosshair in center -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <div class="w-full h-[1px] bg-neon-cyan"></div>
        <div class="h-full w-[1px] bg-neon-cyan absolute"></div>
        <div class="w-3 h-3 rounded-full border border-neon-cyan absolute"></div>
      </div>

      <!-- Zoom Level Pill Badge -->
      <div class="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-black/90 text-neon-cyan text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full border border-neon-cyan/40 shadow">
        {{ currentZoom }}× LOSSLESS
      </div>
    </div>
  </div>
</template>

<style scoped>
.magnifier-lens {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}
</style>
