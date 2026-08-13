const ALPHA_THRESHOLD = 0.002;
const MAX_ALPHA = 0.99;
const LOGO_VALUE = 255;

export function removeWatermark(imageData, alphaMap, position, options = {}) {
    const { x, y, width, height } = position;
    // alphaGain scales the alpha map strength (video calibration). Defaults to
    // 1, which keeps the image path's behaviour byte-for-byte identical.
    const gain = Number.isFinite(options.alphaGain) && options.alphaGain > 0
        ? options.alphaGain
        : 1;
    // Edge feathering: smooth transition at watermark boundaries.
    // Enabled by default; set options.edgeBlend = false to disable.
    const doFeather = options.edgeBlend !== false;
    const featherPx = options.featherRadius || 3;

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const imgIdx = ((y + row) * imageData.width + (x + col)) * 4;
            const alphaIdx = row * width + col;

            let alpha = alphaMap[alphaIdx] * gain;
            if (alpha < ALPHA_THRESHOLD) continue;
            alpha = Math.min(alpha, MAX_ALPHA);

            // Edge feathering: reduce alpha at watermark boundaries for seamless blend
            if (doFeather) {
                const distToEdge = Math.min(row, col, height - 1 - row, width - 1 - col);
                if (distToEdge < featherPx) {
                    const featherFactor = distToEdge / featherPx;
                    // Smooth cubic ease
                    alpha *= featherFactor * featherFactor * (3 - 2 * featherFactor);
                    if (alpha < ALPHA_THRESHOLD) continue;
                }
            }

            for (let c = 0; c < 3; c++) {
                const watermarked = imageData.data[imgIdx + c];
                // Reverse Alpha Blending Formula
                const original = (watermarked - alpha * LOGO_VALUE) / (1.0 - alpha);
                imageData.data[imgIdx + c] = Math.max(0, Math.min(255, Math.round(original)));
            }
        }
    }
}

/**
 * Post-process: Gaussian blur the boundary between cleaned and original pixels.
 * Call after removeWatermark() for extra-smooth edges.
 */
export function featherEdges(imageData, x, y, width, height, radius = 2) {
    const imgW = imageData.width;
    const imgH = imageData.height;
    const data = imageData.data;
    const copy = new Uint8ClampedArray(data);

    // Only process pixels in a ring around the watermark box
    const padded = radius + 1;
    const x0 = Math.max(0, x - padded);
    const y0 = Math.max(0, y - padded);
    const x1 = Math.min(imgW, x + width + padded);
    const y1 = Math.min(imgH, y + height + padded);

    for (let py = y0; py < y1; py++) {
        for (let px = x0; px < x1; px++) {
            // Is this an edge pixel? (inside box but near boundary)
            const inBox = px >= x && px < x + width && py >= y && py < y + height;
            const nearEdge =
                px < x + padded || px >= x + width - padded ||
                py < y + padded || py >= y + height - padded;

            if (!inBox || !nearEdge) continue;

            let rSum = 0, gSum = 0, bSum = 0, wSum = 0;
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = px + dx;
                    const ny = py + dy;
                    if (nx < 0 || nx >= imgW || ny < 0 || ny >= imgH) continue;
                    const d2 = dx * dx + dy * dy;
                    const w = Math.exp(-d2 / (2 * radius * radius));
                    const pi = (ny * imgW + nx) * 4;
                    rSum += copy[pi] * w;
                    gSum += copy[pi + 1] * w;
                    bSum += copy[pi + 2] * w;
                    wSum += w;
                }
            }
            if (wSum > 0) {
                const pi = (py * imgW + px) * 4;
                data[pi] = Math.round(rSum / wSum);
                data[pi + 1] = Math.round(gSum / wSum);
                data[pi + 2] = Math.round(bSum / wSum);
            }
        }
    }
}