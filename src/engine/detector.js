// Smart 4-corner watermark location detector for Google Gemini & Veo outputs.
// Scans all 4 corners (Bottom-Right, Bottom-Left, Top-Right, Top-Left) using cross-correlation
// against the sparkle template to automatically locate the watermark even on cropped or edited images.

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
        corner: 'BR',
        detected: false
    };

    if (!bg96Image || imgW < 128 || imgH < 128) {
        return fallback;
    }

    try {
        const candidateSizes = [64, 48, 96, 80];
        const candidateMargins = [24, 32, 48, 64, 96, 128];
        const corners = ['BR', 'BL', 'TR', 'TL'];

        let bestScore = -1;
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

            for (const corner of corners) {
                for (const margin of candidateMargins) {
                    let x = 0, y = 0;
                    if (corner === 'BR') {
                        x = imgW - margin - size;
                        y = imgH - margin - size;
                    } else if (corner === 'BL') {
                        x = margin;
                        y = imgH - margin - size;
                    } else if (corner === 'TR') {
                        x = imgW - margin - size;
                        y = margin;
                    } else if (corner === 'TL') {
                        x = margin;
                        y = margin;
                    }

                    if (x < 0 || y < 0 || x + size > imgW || y + size > imgH) continue;

                    let scoreSum = 0;
                    let alphaWeightSum = 0;

                    for (let row = 0; row < size; row += 2) {
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
                        // Give slight preference to BR corner if scores are close
                        const weightFactor = corner === 'BR' ? 1.05 : 1.0;
                        const finalScore = avgScore * weightFactor;

                        if (finalScore > bestScore) {
                            bestScore = finalScore;
                            bestConfig = {
                                size,
                                x,
                                y,
                                width: size,
                                height: size,
                                corner,
                                detected: true,
                                score: finalScore
                            };
                        }
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
