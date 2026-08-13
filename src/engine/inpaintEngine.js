/**
 * Canvas-Based Inpainting Engine
 *
 * Two algorithms for filling masked (watermark) regions:
 *
 * 1. **Telea (Fast Marching)** — propagates boundary pixel values inward using
 *    distance-weighted averaging.  Fast, good for thin/small watermarks.
 *
 * 2. **PatchMatch Texture Synthesis** — finds best-matching texture patches from
 *    the surrounding area and composites them into the masked region.  Slower but
 *    handles larger areas and complex textures much better.
 *
 * Both operate entirely on raw RGBA ImageData — no WebGL, no WASM, no server.
 */

// ── Telea Fast-Marching Inpainting ──────────────────────────────────────────

/**
 * Inpaint masked pixels using boundary propagation (Telea 2004 inspired).
 *
 * @param {ImageData} imageData  — full image RGBA buffer (modified in place)
 * @param {Uint8Array} mask      — same WxH; 255 = inpaint, 0 = keep
 * @param {number} [radius=5]    — neighbourhood sampling radius
 */
export function inpaintTelea(imageData, mask, radius = 5) {
  const { width, height, data } = imageData;
  const total = width * height;

  // Build distance map: 0 = known, Infinity = unknown (masked)
  const dist = new Float32Array(total);
  const done = new Uint8Array(total); // 1 = finalised pixel
  for (let i = 0; i < total; i++) {
    if (mask[i] > 127) {
      dist[i] = Infinity;
    } else {
      dist[i] = 0;
      done[i] = 1;
    }
  }

  // Collect initial boundary: known pixels adjacent to masked pixels
  // We use a simple priority queue (sorted array for small sets, bucket queue for perf)
  const band = []; // { idx, dist }
  const OFFSETS = [-1, 1, -width, width];

  for (let i = 0; i < total; i++) {
    if (done[i] !== 1) continue;
    const x = i % width;
    const y = (i - x) / width;
    for (const off of OFFSETS) {
      const ni = i + off;
      if (ni < 0 || ni >= total) continue;
      // Boundary check for left/right
      if (off === -1 && x === 0) continue;
      if (off === 1 && x === width - 1) continue;
      if (done[ni] === 0 && mask[ni] > 127) {
        dist[ni] = 1;
        done[ni] = 2; // 2 = in band
        band.push(ni);
      }
    }
  }

  // Process band in distance order (simplified fast march)
  // For each band pixel, compute colour from known neighbours
  let safety = 0;
  const maxIter = total * 2;
  while (band.length > 0 && safety++ < maxIter) {
    // Pick closest (greedy — O(n) scan; fine for typical watermark sizes)
    let bestIdx = 0;
    let bestDist = dist[band[0]];
    for (let j = 1; j < band.length; j++) {
      if (dist[band[j]] < bestDist) {
        bestDist = dist[band[j]];
        bestIdx = j;
      }
    }
    const ci = band[bestIdx];
    band.splice(bestIdx, 1);

    if (done[ci] === 1) continue; // already finalised
    done[ci] = 1;

    const cx = ci % width;
    const cy = (ci - cx) / width;

    // Weighted average from known neighbours within radius
    let rSum = 0, gSum = 0, bSum = 0, wSum = 0;
    const r2 = radius * radius;

    const xMin = Math.max(0, cx - radius);
    const xMax = Math.min(width - 1, cx + radius);
    const yMin = Math.max(0, cy - radius);
    const yMax = Math.min(height - 1, cy + radius);

    for (let ny = yMin; ny <= yMax; ny++) {
      for (let nx = xMin; nx <= xMax; nx++) {
        const ni = ny * width + nx;
        if (done[ni] !== 1) continue; // only use finalised pixels
        if (ni === ci) continue;

        const dx = nx - cx;
        const dy = ny - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;

        // Weigh closer pixels more heavily
        const w = 1.0 / (Math.sqrt(d2) + 0.5);
        const pi = ni * 4;
        rSum += data[pi] * w;
        gSum += data[pi + 1] * w;
        bSum += data[pi + 2] * w;
        wSum += w;
      }
    }

    if (wSum > 0) {
      const pi = ci * 4;
      data[pi] = Math.round(rSum / wSum);
      data[pi + 1] = Math.round(gSum / wSum);
      data[pi + 2] = Math.round(bSum / wSum);
      data[pi + 3] = 255;
    }

    // Expand band to unfinalised masked neighbours
    for (const off of OFFSETS) {
      const ni = ci + off;
      if (ni < 0 || ni >= total) continue;
      if (off === -1 && cx === 0) continue;
      if (off === 1 && cx === width - 1) continue;
      if (done[ni] === 0 && mask[ni] > 127) {
        dist[ni] = bestDist + 1;
        done[ni] = 2;
        band.push(ni);
      }
    }
  }

  return imageData;
}

// ── PatchMatch Texture Synthesis Inpainting ─────────────────────────────────

/**
 * Inpaint masked region using patch-based texture synthesis.
 * Finds the best matching known patch for each masked pixel and blends.
 *
 * @param {ImageData} imageData  — full image RGBA buffer (modified in place)
 * @param {Uint8Array} mask      — same WxH; 255 = inpaint, 0 = keep
 * @param {number} [patchSize=7] — patch side length (odd)
 * @param {number} [iterations=3] — number of refinement passes
 */
export function inpaintPatchMatch(imageData, mask, patchSize = 7, iterations = 3) {
  const { width, height, data } = imageData;
  const total = width * height;
  const half = Math.floor(patchSize / 2);

  // Find bounding box of mask for efficiency
  let mxMin = width, myMin = height, mxMax = 0, myMax = 0;
  for (let i = 0; i < total; i++) {
    if (mask[i] > 127) {
      const x = i % width;
      const y = (i - x) / width;
      if (x < mxMin) mxMin = x;
      if (x > mxMax) mxMax = x;
      if (y < myMin) myMin = y;
      if (y > myMax) myMax = y;
    }
  }

  if (mxMax < mxMin) return imageData; // no masked pixels

  // Expand search region around mask
  const searchPad = Math.max(patchSize * 3, 30);
  const sxMin = Math.max(0, mxMin - searchPad);
  const syMin = Math.max(0, myMin - searchPad);
  const sxMax = Math.min(width - 1, mxMax + searchPad);
  const syMax = Math.min(height - 1, myMax + searchPad);

  // Collect source (known) patch centers
  const sourceCenters = [];
  for (let y = syMin + half; y <= syMax - half; y += 2) {
    for (let x = sxMin + half; x <= sxMax - half; x += 2) {
      // Check if patch is fully known
      let allKnown = true;
      for (let dy = -half; dy <= half && allKnown; dy++) {
        for (let dx = -half; dx <= half && allKnown; dx++) {
          const ni = (y + dy) * width + (x + dx);
          if (mask[ni] > 127) allKnown = false;
        }
      }
      if (allKnown) sourceCenters.push({ x, y });
    }
  }

  if (sourceCenters.length === 0) {
    // Fallback to Telea if no clean patches available
    return inpaintTelea(imageData, mask);
  }

  // Work buffer for blending
  const result = new Float32Array(total * 4);
  const weight = new Float32Array(total);

  // Initialise result with original known pixels
  for (let i = 0; i < total; i++) {
    if (mask[i] <= 127) {
      const pi = i * 4;
      result[pi] = data[pi];
      result[pi + 1] = data[pi + 1];
      result[pi + 2] = data[pi + 2];
      result[pi + 3] = data[pi + 3];
      weight[i] = 1;
    }
  }

  // For each masked pixel, find best matching source patch
  for (let iter = 0; iter < iterations; iter++) {
    for (let y = myMin; y <= myMax; y++) {
      for (let x = mxMin; x <= mxMax; x++) {
        const idx = y * width + x;
        if (mask[idx] <= 127) continue;

        let bestDist = Infinity;
        let bestSrc = null;

        // Randomised search: sample subset of source patches
        const sampleCount = Math.min(sourceCenters.length, 50);
        const step = Math.max(1, Math.floor(sourceCenters.length / sampleCount));

        for (let si = 0; si < sourceCenters.length; si += step) {
          const src = sourceCenters[si];
          let dist = 0;
          let count = 0;

          // Compare patch pixels that are known in both source and target neighbourhood
          for (let dy = -half; dy <= half; dy += 2) {
            for (let dx = -half; dx <= half; dx += 2) {
              const tx = x + dx;
              const ty = y + dy;
              if (tx < 0 || tx >= width || ty < 0 || ty >= height) continue;
              const ti = ty * width + tx;
              if (mask[ti] > 127 && iter === 0) continue; // skip unknown on first pass

              const sx = src.x + dx;
              const sy = src.y + dy;
              const si2 = sy * width + sx;

              const tpi = ti * 4;
              const spi = si2 * 4;

              // Use either original or previously synthesised value
              const tr = iter > 0 && mask[ti] > 127 ? result[tpi] : data[tpi];
              const tg = iter > 0 && mask[ti] > 127 ? result[tpi + 1] : data[tpi + 1];
              const tb = iter > 0 && mask[ti] > 127 ? result[tpi + 2] : data[tpi + 2];

              const dr = tr - data[spi];
              const dg = tg - data[spi + 1];
              const db = tb - data[spi + 2];
              dist += dr * dr + dg * dg + db * db;
              count++;
            }
          }

          if (count > 0) dist /= count;
          if (dist < bestDist) {
            bestDist = dist;
            bestSrc = src;
          }
        }

        if (bestSrc) {
          const pi = idx * 4;
          const spi = (bestSrc.y * width + bestSrc.x) * 4;
          // Blend with previous result
          const blendW = 1.0 / (1 + iter);
          result[pi] = result[pi] * (1 - blendW) + data[spi] * blendW;
          result[pi + 1] = result[pi + 1] * (1 - blendW) + data[spi + 1] * blendW;
          result[pi + 2] = result[pi + 2] * (1 - blendW) + data[spi + 2] * blendW;
          result[pi + 3] = 255;
          weight[idx] = 1;
        }
      }
    }
  }

  // Write result back
  for (let i = 0; i < total; i++) {
    if (mask[i] > 127 && weight[i] > 0) {
      const pi = i * 4;
      data[pi] = Math.round(Math.max(0, Math.min(255, result[pi])));
      data[pi + 1] = Math.round(Math.max(0, Math.min(255, result[pi + 1])));
      data[pi + 2] = Math.round(Math.max(0, Math.min(255, result[pi + 2])));
      data[pi + 3] = 255;
    }
  }

  // Final pass: smooth boundaries between inpainted and original pixels
  smoothBoundary(imageData, mask, 2);

  return imageData;
}

// ── Boundary Smoothing ──────────────────────────────────────────────────────

function smoothBoundary(imageData, mask, radius) {
  const { width, height, data } = imageData;
  const total = width * height;
  const copy = new Uint8ClampedArray(data);

  for (let i = 0; i < total; i++) {
    if (mask[i] <= 127) continue;

    const x = i % width;
    const y = (i - x) / width;

    // Check if this is a boundary pixel (masked pixel next to known pixel)
    let isBoundary = false;
    for (let dy = -1; dy <= 1 && !isBoundary; dy++) {
      for (let dx = -1; dx <= 1 && !isBoundary; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          if (mask[ny * width + nx] <= 127) isBoundary = true;
        }
      }
    }

    if (!isBoundary) continue;

    // Gaussian-weighted average
    let rSum = 0, gSum = 0, bSum = 0, wSum = 0;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const d2 = dx * dx + dy * dy;
        const w = Math.exp(-d2 / (2 * radius * radius));
        const pi = (ny * width + nx) * 4;
        rSum += copy[pi] * w;
        gSum += copy[pi + 1] * w;
        bSum += copy[pi + 2] * w;
        wSum += w;
      }
    }

    if (wSum > 0) {
      const pi = i * 4;
      data[pi] = Math.round(rSum / wSum);
      data[pi + 1] = Math.round(gSum / wSum);
      data[pi + 2] = Math.round(bSum / wSum);
    }
  }
}

// ── Main Inpainting API ─────────────────────────────────────────────────────

/**
 * Inpaint masked region using the specified method.
 *
 * @param {ImageData} imageData — RGBA pixel buffer (modified in place)
 * @param {Uint8Array} mask     — WxH mask; 255 = inpaint pixel, 0 = keep
 * @param {Object} [options]
 * @param {'telea'|'patchmatch'} [options.method='telea']
 * @param {number} [options.radius=5]     — Telea sampling radius
 * @param {number} [options.patchSize=7]  — PatchMatch patch size
 * @returns {ImageData}
 */
export function inpaintRegion(imageData, mask, options = {}) {
  const method = options.method || 'telea';

  if (method === 'patchmatch') {
    return inpaintPatchMatch(imageData, mask, options.patchSize || 7, options.iterations || 3);
  }
  return inpaintTelea(imageData, mask, options.radius || 5);
}
