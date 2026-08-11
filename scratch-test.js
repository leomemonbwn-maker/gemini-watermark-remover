import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';
import { calculateAlphaMap } from './src/engine/alphaMap.js';

// We need canvas in node. Let's see if we can use it.
