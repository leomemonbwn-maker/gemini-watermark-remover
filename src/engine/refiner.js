/**
 * AI Refiner Engine
 * Performs smart local smoothing/inpainting to remove remaining "ghost" artifacts
 * from mathematical watermark removal.
 */

/**
 * Applies a local smoothing filter to the watermark region.
 * @param {ImageData} imageData The full image data to modify
 * @param {Object} config Watermark configuration (x, y, size)
 * @param {number} strength Smoothing strength (0-1)
 */
export function refineWatermarkArea(imageData, config, strength = 0.5) {
  const { x, y, size } = config;
  const { width, height, data } = imageData;

  // Padding to ensure we cover the edges of the artifacts
  const padding = 4;
  const startX = Math.max(0, x - padding);
  const startY = Math.max(0, y - padding);
  const endX = Math.min(width, x + size + padding);
  const endY = Math.min(height, y + size + padding);

  // We'll use a simple box blur for the alpha/ghosting smoothing
  // but we only apply it to pixels that likely have artifacts.
  const radius = Math.ceil(strength * 3);
  const originalData = new Uint8ClampedArray(data);

  for (let py = startY; py < endY; py++) {
    for (let px = startX; px < endX; px++) {
      let r = 0, g = 0, b = 0, count = 0;

      // Sample neighbors for smoothing
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = px + dx;
          const ny = py + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4;
            r += originalData[idx];
            g += originalData[idx + 1];
            b += originalData[idx + 2];
            count++;
          }
        }
      }

      const currentIdx = (py * width + px) * 4;
      const factor = 0.4 * strength; // Only partially blend to keep it looking natural

      data[currentIdx] = originalData[currentIdx] * (1 - factor) + (r / count) * factor;
      data[currentIdx + 1] = originalData[currentIdx + 1] * (1 - factor) + (g / count) * factor;
      data[currentIdx + 2] = originalData[currentIdx + 2] * (1 - factor) + (b / count) * factor;
    }
  }
}
