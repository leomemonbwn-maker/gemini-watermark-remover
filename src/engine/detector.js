// Precise Watermark Location Detector for Google Gemini & Veo outputs.
// Confined strictly to the Bottom-Right corner (where Gemini places watermarks)
// using contrast-ratio scoring to prevent false positives on bright backgrounds.

import { calculateAlphaMap } from './alphaMap.js';

export function autoDetectWatermark(imageData, bg96Image, bg48Image) {
    const imgW = imageData.width;
    const imgH = imageData.height;

    // Standard Gemini default: 32px margin from bottom-right corner
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
        detected: false
    };

    if (!bg96Image || imgW < 128 || imgH < 128) {
        return fallback;
    }

    try {
        const candidateSizes = [64, 48, 96, 80, 56];
        const candidateMargins = [32, 24, 48, 64, 16, 128];

        let bestContrastScore = -1;
        let bestConfig = null;

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

                let starBrightSum = 0;
                let starWeightSum = 0;
                let bgBrightSum = 0;
                let bgWeightSum = 0;

                for (let row = 0; row < size; row += 2) {
                    for (let col = 0; col < size; col += 2) {
                        const alphaIdx = row * size + col;
                        const a = alphaMap[alphaIdx];
                        const imgIdx = ((y + row) * imgW + (x + col)) * 4;
                        const brightness = (imageData.data[imgIdx] + imageData.data[imgIdx + 1] + imageData.data[imgIdx + 2]) / 3.0;

                        if (a > 0.3) {
                            starBrightSum += brightness * a;
                            starWeightSum += a;
                        } else if (a < 0.05) {
                            bgBrightSum += brightness;
                            bgWeightSum += 1;
                        }
                    }
                }

                if (starWeightSum > 0 && bgWeightSum > 0) {
                    const avgStarBright = starBrightSum / starWeightSum;
                    const avgBgBright = bgBrightSum / bgWeightSum;
                    
                    // Contrast delta: how much brighter is the sparkle mask than its immediate background?
                    const contrastDelta = avgStarBright - avgBgBright;
                    const compositeScore = avgStarBright + Math.max(0, contrastDelta * 2);

                    if (compositeScore > bestContrastScore) {
                        bestContrastScore = compositeScore;
                        bestConfig = {
                            size,
                            x,
                            y,
                            width: size,
                            height: size,
                            corner: 'BR',
                            detected: true,
                            score: compositeScore
                        };
                    }
                }
            }
        }

        if (bestConfig) {
            return bestConfig;
        }
    } catch (err) {
        console.warn('Watermark auto-detection fallback:', err);
    }

    return fallback;
}
