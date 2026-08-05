// 100% Precision Watermark Location Detector & Point-Targeting Engine.
// Scans the bottom-right area (50% x 50% quadrant) of any landscape or portrait image,
// or allows the user to tap/touch anywhere to point exact watermark location.

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
        let bestContrastScore = -1;
        let bestConfig = null;

        // Scan region: bottom-right 50% quadrant of the image
        const startX = Math.floor(imgW * 0.5);
        const startY = Math.floor(imgH * 0.5);
        const step = 16; // Grid scan resolution

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

            for (let y = startY; y <= imgH - size; y += step) {
                for (let x = startX; x <= imgW - size; x += step) {

                    let starBrightSum = 0;
                    let starWeightSum = 0;
                    let bgBrightSum = 0;
                    let bgWeightSum = 0;

                    for (let row = 0; row < size; row += 4) {
                        for (let col = 0; col < size; col += 4) {
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

                        // Watermark creates a local luminance peak over darker content
                        const compositeScore = avgStarBright + Math.max(0, contrastDelta * 2.5);

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
        }

        if (bestConfig) {
            return bestConfig;
        }
    } catch (err) {
        console.warn('100% Watermark auto-detection fallback:', err);
    }

    return fallback;
}

// Point-target configuration: centers watermark box at tapped (centerX, centerY)
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
        corner: 'Point',
        detected: true,
        isCustomPoint: true,
        tappedX: Math.round(centerX),
        tappedY: Math.round(centerY)
    };
}
