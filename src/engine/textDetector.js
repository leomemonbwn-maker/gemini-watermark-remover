/**
 * Text Watermark Auto-Detector
 *
 * Scans an image for text-like watermark regions using edge detection and
 * contrast analysis.  Does NOT require any external OCR library — uses pure
 * Canvas pixel analysis to find high-contrast text overlays.
 *
 * Pipeline:
 *   1. Convert to greyscale
 *   2. Sobel edge detection
 *   3. Threshold + morphological close (connect nearby edges)
 *   4. Connected component labelling
 *   5. Filter components by aspect ratio, density, and size
 *   6. Return bounding boxes of likely text watermarks
 */

// ── Greyscale conversion ────────────────────────────────────────────────────

function toGreyscale(imageData) {
  const { width, height, data } = imageData;
  const grey = new Float32Array(width * height);
  for (let i = 0; i < grey.length; i++) {
    const pi = i * 4;
    grey[i] = 0.299 * data[pi] + 0.587 * data[pi + 1] + 0.114 * data[pi + 2];
  }
  return grey;
}

// ── Sobel edge detection ────────────────────────────────────────────────────

function sobelEdges(grey, width, height) {
  const edges = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      // Horizontal kernel
      const gx =
        -grey[(y - 1) * width + (x - 1)] + grey[(y - 1) * width + (x + 1)] +
        -2 * grey[y * width + (x - 1)] + 2 * grey[y * width + (x + 1)] +
        -grey[(y + 1) * width + (x - 1)] + grey[(y + 1) * width + (x + 1)];
      // Vertical kernel
      const gy =
        -grey[(y - 1) * width + (x - 1)] - 2 * grey[(y - 1) * width + x] - grey[(y - 1) * width + (x + 1)] +
        grey[(y + 1) * width + (x - 1)] + 2 * grey[(y + 1) * width + x] + grey[(y + 1) * width + (x + 1)];
      edges[i] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return edges;
}

// ── Threshold + morphological close ─────────────────────────────────────────

function thresholdAndClose(edges, width, height, threshold = 40) {
  const binary = new Uint8Array(width * height);

  // Threshold
  for (let i = 0; i < binary.length; i++) {
    binary[i] = edges[i] > threshold ? 1 : 0;
  }

  // Dilate (3x3)
  const dilated = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let any = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          any |= binary[(y + dy) * width + (x + dx)];
        }
      }
      dilated[y * width + x] = any;
    }
  }

  // Dilate again to connect nearby characters
  const dilated2 = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let any = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          if (nx >= 0 && nx < width) {
            any |= dilated[(y + dy) * width + nx];
          }
        }
      }
      dilated2[y * width + x] = any;
    }
  }

  return dilated2;
}

// ── Connected component labelling ───────────────────────────────────────────

function labelComponents(binary, width, height) {
  const labels = new Int32Array(width * height);
  let nextLabel = 1;
  const bboxes = new Map(); // label → { xMin, yMin, xMax, yMax, area }

  function flood(startIdx, label) {
    const stack = [startIdx];
    const bbox = {
      xMin: width, yMin: height, xMax: 0, yMax: 0, area: 0,
    };
    bboxes.set(label, bbox);

    while (stack.length > 0) {
      const idx = stack.pop();
      if (labels[idx] !== 0 || binary[idx] === 0) continue;
      labels[idx] = label;

      const x = idx % width;
      const y = (idx - x) / width;
      if (x < bbox.xMin) bbox.xMin = x;
      if (x > bbox.xMax) bbox.xMax = x;
      if (y < bbox.yMin) bbox.yMin = y;
      if (y > bbox.yMax) bbox.yMax = y;
      bbox.area++;

      // 4-connected neighbours
      if (x > 0) stack.push(idx - 1);
      if (x < width - 1) stack.push(idx + 1);
      if (y > 0) stack.push(idx - width);
      if (y < height - 1) stack.push(idx + width);
    }
  }

  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === 1 && labels[i] === 0) {
      flood(i, nextLabel);
      nextLabel++;
    }
  }

  return { labels, bboxes };
}

// ── Filter text-like components ─────────────────────────────────────────────

function filterTextRegions(bboxes, width, height) {
  const results = [];
  const minArea = Math.max(50, width * height * 0.0005); // at least 0.05% of image
  const maxArea = width * height * 0.25; // at most 25% of image
  const imgArea = width * height;

  for (const [label, bbox] of bboxes) {
    const bw = bbox.xMax - bbox.xMin + 1;
    const bh = bbox.yMax - bbox.yMin + 1;
    const boxArea = bw * bh;
    const density = bbox.area / boxArea;
    const aspectRatio = bw / Math.max(bh, 1);

    // Text watermarks are typically:
    // - Wider than tall (aspect ratio > 1.5) OR reasonably square
    // - Have moderate density (not too sparse, not fully solid)
    // - Have reasonable size
    if (
      bbox.area >= minArea &&
      bbox.area <= maxArea &&
      boxArea >= minArea &&
      density > 0.05 && density < 0.85 &&
      bw >= 15 && bh >= 8 &&
      aspectRatio > 0.3 && aspectRatio < 30
    ) {
      results.push({
        x: bbox.xMin,
        y: bbox.yMin,
        width: bw,
        height: bh,
        area: bbox.area,
        density,
        aspectRatio,
        score: density * (bbox.area / imgArea) * 1000,
        label,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Non-maximum suppression
  return nmsBoxes(results, 0.5);
}

// ── NMS for detected boxes ──────────────────────────────────────────────────

function nmsBoxes(boxes, iouThreshold = 0.5) {
  const kept = [];
  const used = new Set();

  for (let i = 0; i < boxes.length; i++) {
    if (used.has(i)) continue;
    kept.push(boxes[i]);
    for (let j = i + 1; j < boxes.length; j++) {
      if (used.has(j)) continue;
      if (computeIoU(boxes[i], boxes[j]) > iouThreshold) {
        used.add(j);
      }
    }
  }
  return kept;
}

function computeIoU(a, b) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  if (inter === 0) return 0;
  const areaA = a.width * a.height;
  const areaB = b.width * b.height;
  return inter / (areaA + areaB - inter);
}

// ── Brightness Contrast Detection (for semi-transparent overlays) ───────────

function detectBrightnessAnomalies(imageData, blockSize = 32) {
  const { width, height, data } = imageData;
  const results = [];

  // Slide a window and look for blocks where brightness is suspiciously uniform
  // or significantly different from neighbouring blocks (common in watermarks)
  for (let by = 0; by < height - blockSize; by += Math.floor(blockSize / 2)) {
    for (let bx = 0; bx < width - blockSize; bx += Math.floor(blockSize / 2)) {
      let sum = 0, sqSum = 0, count = 0;
      let neighbourSum = 0, neighbourCount = 0;

      // Block stats
      for (let dy = 0; dy < blockSize; dy++) {
        for (let dx = 0; dx < blockSize; dx++) {
          const pi = ((by + dy) * width + (bx + dx)) * 4;
          const lum = 0.299 * data[pi] + 0.587 * data[pi + 1] + 0.114 * data[pi + 2];
          sum += lum;
          sqSum += lum * lum;
          count++;
        }
      }

      const mean = sum / count;
      const variance = sqSum / count - mean * mean;

      // Neighbour block stats (surrounding ring)
      const pad = blockSize;
      const nx0 = Math.max(0, bx - pad);
      const ny0 = Math.max(0, by - pad);
      const nx1 = Math.min(width, bx + blockSize + pad);
      const ny1 = Math.min(height, by + blockSize + pad);

      for (let ny = ny0; ny < ny1; ny++) {
        for (let nx = nx0; nx < nx1; nx++) {
          if (nx >= bx && nx < bx + blockSize && ny >= by && ny < by + blockSize) continue;
          const pi = (ny * width + nx) * 4;
          neighbourSum += 0.299 * data[pi] + 0.587 * data[pi + 1] + 0.114 * data[pi + 2];
          neighbourCount++;
        }
      }

      if (neighbourCount === 0) continue;
      const neighbourMean = neighbourSum / neighbourCount;
      const brightnessDelta = Math.abs(mean - neighbourMean);

      // Watermarks tend to have:
      // - Low variance (uniform text/logo overlay)
      // - Noticeable brightness delta from surroundings
      if (variance < 800 && brightnessDelta > 15 && brightnessDelta < 120) {
        results.push({
          x: bx, y: by,
          width: blockSize, height: blockSize,
          score: brightnessDelta,
          type: 'brightness',
        });
      }
    }
  }

  return nmsBoxes(results, 0.4);
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Auto-detect potential text/logo watermark regions in an image.
 * Returns an array of bounding boxes with confidence scores.
 *
 * @param {ImageData} imageData — raw RGBA pixels
 * @param {Object} [options]
 * @param {number} [options.edgeThreshold=40]  — Sobel edge threshold
 * @param {number} [options.maxDetections=5]   — max number of results
 * @returns {{ x, y, width, height, score, type }[]}
 */
export function detectTextWatermarks(imageData, options = {}) {
  const { width, height } = imageData;
  const threshold = options.edgeThreshold || 40;
  const maxDet = options.maxDetections || 5;

  // Step 1: Edge-based text detection
  const grey = toGreyscale(imageData);
  const edges = sobelEdges(grey, width, height);
  const binary = thresholdAndClose(edges, width, height, threshold);
  const { bboxes } = labelComponents(binary, width, height);
  const edgeResults = filterTextRegions(bboxes, width, height).map(r => ({
    ...r, type: 'text-edge',
  }));

  // Step 2: Brightness anomaly detection
  const brightnessResults = detectBrightnessAnomalies(imageData);

  // Merge and deduplicate
  const allResults = [...edgeResults, ...brightnessResults];
  allResults.sort((a, b) => b.score - a.score);
  const final = nmsBoxes(allResults, 0.4);

  return final.slice(0, maxDet);
}

/**
 * Generate a mask (Uint8Array) from detected regions.
 * Useful for piping into the inpainting engine.
 *
 * @param {number} width
 * @param {number} height
 * @param {{ x, y, width, height }[]} regions
 * @param {number} [padding=4] — extra pixels around each region
 * @returns {Uint8Array}
 */
export function regionsToMask(width, height, regions, padding = 4) {
  const mask = new Uint8Array(width * height);
  for (const r of regions) {
    const x0 = Math.max(0, r.x - padding);
    const y0 = Math.max(0, r.y - padding);
    const x1 = Math.min(width, r.x + r.width + padding);
    const y1 = Math.min(height, r.y + r.height + padding);
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        mask[y * width + x] = 255;
      }
    }
  }
  return mask;
}
