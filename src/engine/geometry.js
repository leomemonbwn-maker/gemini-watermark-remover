// Pure watermark geometry.
//
// Gemini places the visible sparkle watermark in the bottom-right corner.
// Default corner margin is 32px from the image edges.
//   - 64px logo with 32px margin for images where the short side > 512
//   - 48px logo with 24px margin for smaller images

export function getWatermarkInfo(width, height) {
    const shortSide = Math.min(width, height);
    const isLarge = shortSide > 512;
    const size = isLarge ? 64 : 48;
    const margin = isLarge ? 32 : 24;

    return {
        size,
        x: Math.max(0, width - margin - size),
        y: Math.max(0, height - margin - size),
        width: size,
        height: size,
    };
}
