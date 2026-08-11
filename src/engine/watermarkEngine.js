import { calculateAlphaMap } from './alphaMap.js';
import { removeWatermark } from './blendModes.js';
import { getWatermarkInfo } from './geometry.js';
import { autoDetectWatermark, autoDetectWatermarks } from './detector.js';

export class WatermarkEngine {
    constructor(bg48, bg96) {
        this.bg48 = bg48;
        this.bg96 = bg96;
        this.alphaMaps = {};
    }

    static async create() {
        const loadImage = (src) => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });

        try {
            const [bg48, bg96] = await Promise.all([
                loadImage('/assets/bg_48.png'),
                loadImage('/assets/bg_96.png')
            ]);
            return new WatermarkEngine(bg48, bg96);
        } catch (e) {
            console.error("Failed to load assets.");
            throw e;
        }
    }

    getWatermarkInfo(width, height) {
        return getWatermarkInfo(width, height);
    }

    async getAlphaMap(size) {
        if (this.alphaMaps[size]) return this.alphaMaps[size];

        if (size === 48 || size === 96) {
            const canvas = document.createElement('canvas');
            canvas.width = size; canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(size === 48 ? this.bg48 : this.bg96, 0, 0);

            const map = calculateAlphaMap(ctx.getImageData(0, 0, size, size));
            this.alphaMaps[size] = map;
            return map;
        }

        return this.buildScaledAlphaMap(size);
    }

    buildScaledAlphaMap(size) {
        if (this.alphaMaps[size]) return this.alphaMaps[size];

        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.clearRect(0, 0, size, size);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(this.bg96, 0, 0, size, size);

        const map = calculateAlphaMap(ctx.getImageData(0, 0, size, size));
        this.alphaMaps[size] = map;
        return map;
    }

    async process(imageFile, customConfig = null) {
        const objectUrl = URL.createObjectURL(imageFile);
        const img = await new Promise((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i); 
            i.onerror = reject;
            i.src = objectUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Use custom config if provided, otherwise auto-detect or use geometry defaults
        let config = customConfig;
        if (!config) {
            config = autoDetectWatermark(imageData, this.bg96, this.bg48);
        }

        const alphaMap = await this.getAlphaMap(config.size);
        removeWatermark(imageData, alphaMap, config);
        
        ctx.putImageData(imageData, 0, 0);
        
        return {
            blob: await new Promise(r => canvas.toBlob(r, 'image/png')),
            originalSrc: objectUrl,
            width: img.width,
            height: img.height,
            config
        };
    }

    /**
     * Multi-watermark removal: scans the full image for ALL watermarks and
     * removes each one.  Returns configs[] (plural) so the UI can render
     * overlays for every detection.
     */
    async processMulti(imageFile, customConfigs = null) {
        const objectUrl = URL.createObjectURL(imageFile);
        const img = await new Promise((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = reject;
            i.src = objectUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Use custom configs if provided, otherwise auto-detect all watermarks
        const configs = customConfigs || autoDetectWatermarks(imageData, this.bg96, this.bg48);

        // Remove each watermark sequentially on the same pixel buffer
        for (const config of configs) {
            const alphaMap = await this.getAlphaMap(config.size);
            removeWatermark(imageData, alphaMap, config);
        }

        ctx.putImageData(imageData, 0, 0);

        return {
            blob: await new Promise(r => canvas.toBlob(r, 'image/png')),
            originalSrc: objectUrl,
            width: img.width,
            height: img.height,
            configs,
            // Backward-compat: expose the primary detection as `config`
            config: configs[0] || null,
        };
    }

    async prepareForSize(width, height) {
        const config = this.getWatermarkInfo(width, height);
        const alphaMap = await this.getAlphaMap(config.size);
        return { config, alphaMap };
    }

    removeFromImageData(imageData, prepared) {
        const { config, alphaMap } =
            prepared || this._sync(imageData.width, imageData.height);
        removeWatermark(imageData, alphaMap, config);
        return imageData;
    }

    _sync(width, height) {
        const config = this.getWatermarkInfo(width, height);
        return { config, alphaMap: this.alphaMaps[config.size] || this.buildScaledAlphaMap(config.size) };
    }
}