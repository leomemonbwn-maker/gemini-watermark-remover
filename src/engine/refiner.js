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

  // Center of the watermark
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  // Radius of the effect (slightly larger than half-size to cover glow)
  const maxRadius = (size / 2) + 6;

  // Bounding box for the loop
  const padding = 10;
  const startX = Math.max(0, Math.floor(x - padding));
  const startY = Math.max(0, Math.floor(y - padding));
  const endX = Math.min(width, Math.ceil(x + size + padding));
  const endY = Math.min(height, Math.ceil(y + size + padding));

  const blurRadius = Math.ceil(strength * 3);
  const originalData = new Uint8ClampedArray(data);

  for (let py = startY; py < endY; py++) {
    for (let px = startX; px < endX; px++) {
      // Calculate distance from center
      const dx_center = px - centerX;
      const dy_center = py - centerY;
      const dist = Math.sqrt(dx_center * dx_center + dy_center * dy_center);

      // If outside the circular effect area, skip this pixel
      if (dist > maxRadius) continue;

      // Smooth feathering: 1.0 at center, drops to 0 at maxRadius
      // We use a cubic falloff for a more natural look
      const t = dist / maxRadius;
      const feather = Math.pow(1 - t * t, 2);

      let r = 0, g = 0, b = 0, count = 0;

      // Sample neighbors for smart smoothing
      for (let dy = -blurRadius; dy <= blurRadius; dy++) {
        for (let dx = -blurRadius; dx <= blurRadius; dx++) {
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
      // Strength factor combined with feathering
      const blendFactor = 0.6 * strength * feather;

      data[currentIdx] = originalData[currentIdx] * (1 - blendFactor) + (r / count) * blendFactor;
      data[currentIdx + 1] = originalData[currentIdx + 1] * (1 - blendFactor) + (g / count) * blendFactor;
      data[currentIdx + 2] = originalData[currentIdx + 2] * (1 - blendFactor) + (b / count) * blendFactor;
    }
  }
}
