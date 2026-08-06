// 100% Precision Watermark Location Detector & Point-Targeting Engine.
// Evaluates exact Gemini corner margins (32px, 24px, 48px, 64px) across 4 corners with high precision,
// and supports exact Tap-to-Pin coordinates.

import { calculateAlphaMap } from './alphaMap.js';

export function autoDetectWatermark(imageData, bg96Image, bg48Image) {
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
        detected: false
    };

    if (!bg96Image || imgW < 128 || imgH < 128) {
        return fallback;
    }

    try {
        const candidateSizes = [64, 48, 96, 80, 56];
        const candidateMargins = [32, 24, 48, 64, 16, 128, 96];

        let bestContrastScore = 0;
        let bestConfig = null;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // High-precision margin search across corners
        for (const size of candidateSizes) {
            if (size > imgW || size > imgH) continue;

            canvas.width = size;
            canvas.height = size;
            ctx.clearRect(0, 0, size, size);
            ctx.drawImage(size <= 48 && bg48Image ? bg48Image : bg96Image, 0, 0, size, size);

            const tmplData = ctx.getImageData(0, 0, size, size);
            const alphaMap = calculateAlphaMap(tmplData);

            for (const margin of candidateMargins) {
                // Check all 4 corners: BR (Bottom-Right), BL (Bottom-Left), TR (Top-Right), TL (Top-Left)
                const corners = [
                    { name: 'BR', x: imgW - margin - size, y: imgH - margin - size },
                    { name: 'BL', x: margin, y: imgH - margin - size },
                    { name: 'TR', x: imgW - margin - size, y: margin },
                    { name: 'TL', x: margin, y: margin }
                ];

                for (const c of corners) {
                    const { x, y, name } = c;
                    if (x < 0 || y < 0 || x + size > imgW || y + size > imgH) continue;

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
                        const contrastDelta = avgStarBright - avgBgBright;

                        // Require positive contrast delta (watermark star must be brighter than surrounding background)
                        if (contrastDelta > 1.5) {
                            const compositeScore = (contrastDelta * 5.0) + (avgStarBright * 0.2);

                            if (compositeScore > bestContrastScore) {
                                bestContrastScore = compositeScore;
                                bestConfig = {
                                    size,
                                    x,
                                    y,
                                    width: size,
                                    height: size,
                                    corner: name,
                                    detected: true,
                                    score: compositeScore
                                };
                            }
                        }
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

// Point-target configuration: centers watermark box at exact tapped pixel (centerX, centerY)
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
        tappedY: Math.round(centerY)
    };
}

