// Pure (DOM-free) watermark geometry. Shared by the browser image engine and
// the Cloudflare Worker MCP server.
//
// Gemini places the visible sparkle watermark in the bottom-right corner.
// The logo size depends on the shorter dimension of the image:
//   - 96px logo with a 64px margin for images where the short side > 512
//   - 48px logo with a 32px margin for smaller images
export function getWatermarkInfo(width, height) {
    const shortSide = Math.min(width, height);
    const isLarge = shortSide > 512;
    const size = isLarge ? 96 : 48;
    const margin = isLarge ? 64 : 32;

    return {
        size,
        x: width - margin - size,
        y: height - margin - size,
        width: size,
        height: size,
    };
}
