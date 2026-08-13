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

  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const maxRadius = (size / 2) + 4;
  const padding = 8;

  const startX = Math.max(0, Math.floor(x - padding));
  const startY = Math.max(0, Math.floor(y - padding));
  const endX = Math.min(width, Math.ceil(x + size + padding));
  const endY = Math.min(height, Math.ceil(y + size + padding));

  const originalData = new Uint8ClampedArray(data);
  const blurRadius = 2; // Keep it small for texture preservation

  for (let py = startY; py < endY; py++) {
    for (let px = startX; px < endX; px++) {
      const dx_center = px - centerX;
      const dy_center = py - centerY;
      const dist = Math.sqrt(dx_center * dx_center + dy_center * dy_center);

      if (dist > maxRadius) continue;

      // Cubic feathering for seamless transition
      const t = dist / maxRadius;
      const feather = Math.pow(1 - t * t, 2);

      let rSum = 0, gSum = 0, bSum = 0, weightSum = 0;
      const currentIdx = (py * width + px) * 4;
      const r0 = originalData[currentIdx];
      const g0 = originalData[currentIdx + 1];
      const b0 = originalData[currentIdx + 2];

      // Smart Neighborhood Sampling (Bilateral-inspired)
      for (let dy = -blurRadius; dy <= blurRadius; dy++) {
        for (let dx = -blurRadius; dx <= blurRadius; dx++) {
          const nx = px + dx;
          const ny = py + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = (ny * width + nx) * 4;
            const rN = originalData[nIdx];
            const gN = originalData[nIdx + 1];
            const bN = originalData[nIdx + 2];

            // Color similarity weight (preserves edges/texture)
            const dR = r0 - rN;
            const dG = g0 - gN;
            const dB = b0 - bN;
            const colorDist = (dR * dR + dG * dG + dB * dB);

            const similarity = Math.exp(-colorDist / 400);

            rSum += rN * similarity;
            gSum += gN * similarity;
            bSum += bN * similarity;
            weightSum += similarity;
          }
        }
      }

      const blendFactor = 0.7 * strength * feather;

      if (weightSum > 0) {
        data[currentIdx] = r0 * (1 - blendFactor) + (rSum / weightSum) * blendFactor;
        data[currentIdx + 1] = g0 * (1 - blendFactor) + (gSum / weightSum) * blendFactor;
        data[currentIdx + 2] = b0 * (1 - blendFactor) + (bSum / weightSum) * blendFactor;
      }
    }
  }
}
