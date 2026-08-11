import { WatermarkEngine } from './src/engine/watermarkEngine.js';
import { autoDetectWatermarks } from './src/engine/detector.js';

// No node-canvas available easily, let's just inspect the detector logic.
// The issue is the scoring function:
// compositeScore = (contrastDelta * 5.0) + (avgStarBright * 0.2)

// If contrastDelta is 83, it's 83 brightness levels higher.
// A real Gemini watermark has a subtle contrast delta (like 3 to 10).
// An actual WATERMARK shouldn't have a contrast delta of 83! It's semi-transparent!
// Max alpha is 0.5. So at most, it adds 128 brightness.
// If it adds 128 brightness, contrastDelta COULD be up to 128.
