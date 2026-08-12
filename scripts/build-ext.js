import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Packaging GemClean AI Chrome Extension...');

const manifestSrc = path.join(rootDir, 'public', 'manifest.ext.json');
const manifestDest = path.join(rootDir, 'dist', 'manifest.json');
const distDir = path.join(rootDir, 'dist');
const zipDest = path.join(rootDir, 'GemCleanAI-Extension.zip');

if (fs.existsSync(manifestSrc)) {
  fs.copyFileSync(manifestSrc, manifestDest);
  console.log('✅ Copied manifest.ext.json -> dist/manifest.json');
} else {
  console.error('❌ Could not find public/manifest.ext.json');
}

// Compress dist folder to GemCleanAI-Extension.zip
try {
  if (fs.existsSync(zipDest)) {
    fs.unlinkSync(zipDest);
  }
  const psCmd = `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipDest}' -Force"`;
  execSync(psCmd, { stdio: 'inherit' });
  console.log('📦 Successfully created GemCleanAI-Extension.zip!');
  
  // Copy zip to public and dist for direct website download
  const publicZip = path.join(rootDir, 'public', 'GemCleanAI-Extension.zip');
  const distZip = path.join(rootDir, 'dist', 'GemCleanAI-Extension.zip');
  fs.copyFileSync(zipDest, publicZip);
  fs.copyFileSync(zipDest, distZip);
  console.log('✅ Copied extension zip to public & dist for web download!');
} catch (err) {
  console.error('⚠️ Warning: Zip creation failed via PowerShell, dist folder is ready to load in chrome://extensions as un-packed extension.');
}

