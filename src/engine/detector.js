// Smart watermark location detector for Google Gemini & Veo outputs.
// Scans the bottom-right area of an image using cross-correlation against the
// sparkle template to automatically locate the watermark even if margins or sizes vary.

import { calculateAlphaMap } from './alphaMap.js';

export function autoDetectWatermark(imageData, bg96Image, bg48Image) {
    const imgW = imageData.width;
    const imgH = imageData.height;

    // Default fallback: 32px margin from bottom-right corner
    const shortSide = Math.min(imgW, imgH);
    const isLarge = shortSide > 512;
    const defaultSize = isLarge ? 64 : 48;
    const defaultMargin = 32;

    const fallback = {
        size: defaultSize,
        x: Math.max(0, imgW - defaultMargin - defaultSize),
        y: Math.max(0, imgH - defaultMargin - defaultSize),
        width: defaultSize,
        height: defaultSize,
        detected: false
    };

    if (!bg96Image || imgW < 128 || imgH < 128) {
        return fallback;
    }

    try {
        // Candidate sizes to test
        const candidateSizes = [64, 48, 96, 80];
        // Candidate margins (distance from right/bottom edge to watermark edge)
        const candidateMargins = [24, 32, 48, 64, 96, 128];

        let bestScore = -1;
        let bestConfig = null;

        // Prepare temporary canvas for rasterizing template at candidate sizes
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        for (const size of candidateSizes) {
            if (size > imgW || size > imgH) continue;

            canvas.width = size;
            canvas.height = size;
            ctx.clearRect(0, 0, size, size);
            ctx.drawImage(size <= 48 && bg48Image ? bg48Image : bg96Image, 0, 0, size, size);

            const tmplData = ctx.getImageData(0, 0, size, size);
            const alphaMap = calculateAlphaMap(tmplData);

            for (const margin of candidateMargins) {
                const x = imgW - margin - size;
                const y = imgH - margin - size;

                if (x < 0 || y < 0) continue;

                // Compute alignment score: mean brightness under template alpha mask
                let scoreSum = 0;
                let alphaWeightSum = 0;

                for (let row = 0; row < size; row += 2) { // Step by 2 for speed
                    for (let col = 0; col < size; col += 2) {
                        const alphaIdx = row * size + col;
                        const a = alphaMap[alphaIdx];
                        if (a < 0.1) continue;

                        const imgIdx = ((y + row) * imgW + (x + col)) * 4;
                        const r = imageData.data[imgIdx];
                        const g = imageData.data[imgIdx + 1];
                        const b = imageData.data[imgIdx + 2];
                        const brightness = (r + g + b) / 3.0;

                        scoreSum += brightness * a;
                        alphaWeightSum += a;
                    }
                }

                if (alphaWeightSum > 0) {
                    const avgScore = scoreSum / alphaWeightSum;
                    if (avgScore > bestScore) {
                        bestScore = avgScore;
                        bestConfig = {
                            size,
                            x,
                            y,
                            width: size,
                            height: size,
                            detected: true,
                            score: avgScore
                        };
                    }
                }
            }
        }

        if (bestConfig && bestScore > 40) {
            return bestConfig;
        }
    } catch (err) {
        console.warn('Auto watermark detection fallback triggered:', err);
    }

    return fallback;
}
