# GemClean AI

[![Stack](https://img.shields.io/badge/tech-Vue%20%7C%20Vite%20%7C%20Tailwind-3B82F6?style=flat-square)](https://github.com/your-username/gemclean-ai)
[![License](https://img.shields.io/badge/license-MIT-orange?style=flat-square)](LICENSE)

A high-performance, **100% client-side** web application for removing the visible Google Gemini ✦ AI sparkle watermark from both **images and videos**. Built with **Vue 3 + Vite + Tailwind CSS**, it uses a mathematically precise **Reverse Alpha Blending** algorithm to restore pixels with zero quality loss.

---

## ✨ Features

* **Images & Videos:** Remove sparkle watermarks from Gemini AI images and Veo videos.
* **100% Client-Side Processing:** No servers involved. Files are processed locally for maximum privacy.
* **Lossless Image Restoration:** Uses exact mathematical inversion rather than AI inpainting, preserving original pixel quality.
* **Audio-Preserving Video Cleaning:** Videos are processed frame-by-frame and re-encoded with their original audio intact.
* **Auto-Detection:** Automatically detects watermark size (48px or 96px) based on image resolution.
* **Centralized Branding (`src/config/brandConfig.js`):** Easily brand & customize title, logo, links, social links, and legal disclaimers.

---

## 🛠️ Local Setup & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```

---

## ⚙️ Customizing Brand Settings

Edit `src/config/brandConfig.js` to change:
- Brand Name
- Tagline & Description
- Social links (Twitter, Instagram, GitHub, Telegram)
- Domain / Site URL

---

## 📜 License

MIT License. Free for personal and commercial customization.