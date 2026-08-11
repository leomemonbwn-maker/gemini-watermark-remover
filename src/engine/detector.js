// Full-Image Multi-Scale Sliding Window Watermark Detector.
// Scans the ENTIRE image at multiple template scales to find all Gemini sparkle
// watermarks — not just corners.  Returns an array of non-overlapping detections
// sorted by confidence score.

import { calculateAlphaMap } from './alphaMap.js';

// ── Non-Maximum Suppression ──────────────────────────────────────────────────
// Keeps only the strongest non-overlapping detections (IoU > threshold → drop).

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

function nms(detections, iouThreshold = 0.3, maxDetections = 8) {
    // Sort descending by score
    const sorted = detections.slice().sort((a, b) => b.score - a.score);
    const kept = [];
    const suppressed = new Set();

    for (let i = 0; i < sorted.length; i++) {
        if (suppressed.has(i)) continue;
        kept.push(sorted[i]);
        if (kept.length >= maxDetections) break;
        for (let j = i + 1; j < sorted.length; j++) {
            if (suppressed.has(j)) continue;
            if (computeIoU(sorted[i], sorted[j]) > iouThreshold) {
                suppressed.add(j);
            }
        }
    }
    return kept;
}

// ── Multi-Scale Sliding Window Scanner ───────────────────────────────────────
// Returns WatermarkDetection[] — every distinct watermark found in the image.

export function autoDetectWatermarks(imageData, bg96Image, bg48Image) {
    const imgW = imageData.width;
    const imgH = imageData.height;

    const shortSide = Math.min(imgW, imgH);
    const isLarge = shortSide > 512;
    const defaultSize = isLarge ? 64 : 48;
    const defaultMargin = isLarge ? 32 : 24;

    const fallback = {
        size: defaultSize,
        x: Math.max(0, imgW - defaultMargin - defaultSize),
        y: Math.max(0, imgH - defaultMargin - defaultSize),
        width: defaultSize,
        height: defaultSize,
        corner: 'BR',
        detected: false,
        score: 0,
    };

    if (!bg96Image || imgW < 128 || imgH < 128) {
        return [fallback];
    }

    try {
        const candidateSizes = [48, 56, 64, 80, 96];
        const rawCandidates = [];

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Pre-compute the pixel array for fast access
        const pixels = imageData.data;

        for (const size of candidateSizes) {
            if (size > imgW || size > imgH) continue;

            // Render the sparkle template at this scale
            canvas.width = size;
            canvas.height = size;
            ctx.clearRect(0, 0, size, size);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(size <= 48 && bg48Image ? bg48Image : bg96Image, 0, 0, size, size);

            const tmplData = ctx.getImageData(0, 0, size, size);
            const alphaMap = calculateAlphaMap(tmplData);

            // Pre-classify template pixels into star / background index lists
            const starPixels = [];  // { idx, alpha }
            const bgPixels = [];    // { idx }
            for (let row = 0; row < size; row += 2) {
                for (let col = 0; col < size; col += 2) {
                    const alphaIdx = row * size + col;
                    const a = alphaMap[alphaIdx];
                    if (a > 0.3) {
                        starPixels.push({ row, col, alpha: a });
                    } else if (a < 0.05) {
                        bgPixels.push({ row, col });
                    }
                }
            }

            // Need enough template structure to be meaningful
            if (starPixels.length < 8 || bgPixels.length < 8) continue;

            // Sliding window stride — balance speed vs coverage
            // Use a coarser stride to reduce false positives and speed up scanning.
            const stride = Math.max(8, Math.floor(size / 2));

            // ── Phase 1: Fast corner scan (original margins, all 4 corners) ──
            // We scan corners with pixel-level precision first because they are
            // by far the most common placement.  Use a LOWER threshold here
            // since corner placement is strong prior evidence.
            const CORNER_THRESHOLD = 4.0;
            const cornerMargins = [16, 24, 32, 48, 64, 96, 128];
            for (const margin of cornerMargins) {
                const corners = [
                    { name: 'BR', x: imgW - margin - size, y: imgH - margin - size },
                    { name: 'BL', x: margin, y: imgH - margin - size },
                    { name: 'TR', x: imgW - margin - size, y: margin },
                    { name: 'TL', x: margin, y: margin },
                ];

                for (const c of corners) {
                    const { x, y, name } = c;
                    if (x < 0 || y < 0 || x + size > imgW || y + size > imgH) continue;

                    const result = scoreRegion(pixels, imgW, x, y, starPixels, bgPixels, CORNER_THRESHOLD);
                    if (result) {
                        rawCandidates.push({
                            size, x, y,
                            width: size, height: size,
                            corner: name,
                            detected: true,
                            score: result.score,
                        });
                    }
                }
            }

            // ── Phase 2: Full-image sliding window ──
            // Covers arbitrary placements the corner scan misses.
            // Use a STRICT threshold here to prevent false positives from
            // skin tones, textures, and other natural image patterns.
            const SLIDING_THRESHOLD = 18.0;
            const maxPositions = 100000; // hard cap on total windows per scale
            let dynamicStride = stride;
            const hSteps = Math.ceil((imgW - size) / dynamicStride);
            const vSteps = Math.ceil((imgH - size) / dynamicStride);
            if (hSteps * vSteps > maxPositions) {
                dynamicStride = Math.ceil(Math.sqrt((imgW - size) * (imgH - size) / maxPositions));
            }

            for (let wy = 0; wy + size <= imgH; wy += dynamicStride) {
                for (let wx = 0; wx + size <= imgW; wx += dynamicStride) {
                    const result = scoreRegion(pixels, imgW, wx, wy, starPixels, bgPixels, SLIDING_THRESHOLD);
                    if (result) {
                        rawCandidates.push({
                            size, x: wx, y: wy,
                            width: size, height: size,
                            corner: classifyCorner(wx, wy, size, imgW, imgH),
                            detected: true,
                            score: result.score,
                        });
                    }
                }
            }
        }

        if (rawCandidates.length > 0) {
            // Filter out low-confidence candidates before NMS
            const MIN_COMPOSITE_SCORE = 30;
            const confident = rawCandidates.filter(c => c.score >= MIN_COMPOSITE_SCORE);
            if (confident.length > 0) {
                const detections = nms(confident, 0.3, 8);
                return detections.length > 0 ? detections : [fallback];
            }
        }
    } catch (err) {
        console.warn('Watermark auto-detection fallback:', err);
    }

    return [fallback];
}

// ── Score a candidate region ─────────────────────────────────────────────────
// Returns { score } if the region looks like a watermark, or null otherwise.

function scoreRegion(pixels, imgW, x, y, starPixels, bgPixels, contrastThreshold) {
    let starBrightSum = 0;
    let starWeightSum = 0;

    for (let i = 0; i < starPixels.length; i++) {
        const sp = starPixels[i];
        const imgIdx = ((y + sp.row) * imgW + (x + sp.col)) * 4;
        const brightness = (pixels[imgIdx] + pixels[imgIdx + 1] + pixels[imgIdx + 2]) / 3.0;
        starBrightSum += brightness * sp.alpha;
        starWeightSum += sp.alpha;
    }

    let bgBrightSum = 0;
    for (let i = 0; i < bgPixels.length; i++) {
        const bp = bgPixels[i];
        const imgIdx = ((y + bp.row) * imgW + (x + bp.col)) * 4;
        bgBrightSum += (pixels[imgIdx] + pixels[imgIdx + 1] + pixels[imgIdx + 2]) / 3.0;
    }

    const avgStarBright = starBrightSum / starWeightSum;
    const avgBgBright = bgBrightSum / bgPixels.length;
    const contrastDelta = avgStarBright - avgBgBright;

    // Watermark star pixels must be brighter than surrounding background.
    // The threshold is passed in by the caller:
    //   - Corner scan uses a lower value (~4) since corner placement is strong evidence
    //   - Sliding window uses a higher value (~18) to prevent false positives
    if (contrastDelta > contrastThreshold) {
        const compositeScore = (contrastDelta * 5.0) + (avgStarBright * 0.2);
        return { score: compositeScore };
    }

    return null;
}

// ── Classify which corner/region a detection sits in ─────────────────────────

function classifyCorner(x, y, size, imgW, imgH) {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const inLeft = cx < imgW * 0.35;
    const inRight = cx > imgW * 0.65;
    const inTop = cy < imgH * 0.35;
    const inBottom = cy > imgH * 0.65;

    if (inBottom && inRight) return 'BR';
    if (inBottom && inLeft) return 'BL';
    if (inTop && inRight) return 'TR';
    if (inTop && inLeft) return 'TL';
    if (inBottom) return 'B';
    if (inTop) return 'T';
    if (inLeft) return 'L';
    if (inRight) return 'R';
    return 'Center';
}

// ── Backward-compatible single-detection wrapper ─────────────────────────────

export function autoDetectWatermark(imageData, bg96Image, bg48Image) {
    return autoDetectWatermarks(imageData, bg96Image, bg48Image)[0];
}

// ── Point-target: centers watermark box at exact tapped pixel ────────────────

export function pointTargetWatermark(imgW, imgH, centerX, centerY, customSize = null) {
    const shortSide = Math.min(imgW, imgH);
    const size = customSize || (shortSide > 512 ? 64 : 48);
    const x = Math.max(0, Math.min(Math.round(centerX - size / 2), imgW - size));
    const y = Math.max(0, Math.min(Math.round(centerY - size / 2), imgH - size));

    return {
        size,
        x,
        y,
        width: size,
        height: size,
        corner: 'Pin Point',
        detected: true,
        isCustomPoint: true,
        tappedX: Math.round(centerX),
        tappedY: Math.round(centerY),
        score: Infinity,
    };
}
