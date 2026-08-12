// GemClean AI In-Flow Content Script

(function () {
  let bg48Data = null;
  let bg96Data = null;
  let alphaMap48 = null;
  let alphaMap96 = null;

  // Preload watermark reference assets
  async function loadAssets() {
    if (alphaMap48 && alphaMap96) return;
    try {
      const bg48Url = chrome.runtime.getURL("assets/bg_48.png");
      const bg96Url = chrome.runtime.getURL("assets/bg_96.png");

      const [img48, img96] = await Promise.all([
        loadImage(bg48Url),
        loadImage(bg96Url),
      ]);

      alphaMap48 = createAlphaMapFromImage(img48, 48);
      alphaMap96 = createAlphaMapFromImage(img96, 96);
    } catch (err) {
      console.warn("GemClean AI: Assets preloading fallback", err);
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function createAlphaMapFromImage(img, size) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, size, size);
    const alphaMap = new Float32Array(size * size);
    for (let i = 0; i < alphaMap.length; i++) {
      const idx = i * 4;
      alphaMap[i] = Math.max(imageData.data[idx], imageData.data[idx + 1], imageData.data[idx + 2]) / 255.0;
    }
    return alphaMap;
  }

  // Pure Reverse Alpha Blending
  function removeWatermark(imageData, alphaMap, position) {
    const { x, y, width, height } = position;
    const ALPHA_THRESHOLD = 0.002;
    const MAX_ALPHA = 0.99;
    const LOGO_VALUE = 255;

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const imgIdx = ((y + row) * imageData.width + (x + col)) * 4;
        const alphaIdx = row * width + col;

        let alpha = alphaMap[alphaIdx];
        if (alpha < ALPHA_THRESHOLD) continue;
        alpha = Math.min(alpha, MAX_ALPHA);

        for (let c = 0; c < 3; c++) {
          const watermarked = imageData.data[imgIdx + c];
          const original = (watermarked - alpha * LOGO_VALUE) / (1.0 - alpha);
          imageData.data[imgIdx + c] = Math.max(0, Math.min(255, Math.round(original)));
        }
      }
    }
  }

  function getWatermarkInfo(width, height) {
    const isLarge = Math.min(width, height) > 1024;
    const size = isLarge ? 96 : 48;
    const margin = isLarge ? 64 : 32;
    return {
      size,
      x: Math.max(0, width - margin - size),
      y: Math.max(0, height - margin - size),
      width: size,
      height: size,
    };
  }

  async function processImageSource(srcUrl) {
    await loadAssets();
    const img = await loadImage(srcUrl);
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pos = getWatermarkInfo(canvas.width, canvas.height);
    const alphaMap = pos.size === 96 ? alphaMap96 : alphaMap48;

    if (alphaMap) {
      removeWatermark(imageData, alphaMap, pos);
      ctx.putImageData(imageData, 0, 0);
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve({
          blobUrl: URL.createObjectURL(blob),
          width: img.width,
          height: img.height,
        });
      }, "image/png");
    });
  }

  // Show In-Page Modal Preview
  function showInPageModal(cleanedBlobUrl) {
    const existing = document.getElementById("gemclean-modal-root");
    if (existing) existing.remove();

    const root = document.createElement("div");
    root.id = "gemclean-modal-root";
    root.className = "gemclean-modal-backdrop";
    root.innerHTML = `
      <div class="gemclean-modal-card">
        <div class="gemclean-modal-header">
          <div class="gemclean-modal-title">
            <span>✨ GemClean AI — Watermark Cleaned!</span>
          </div>
          <button class="gemclean-modal-close" id="gemclean-modal-close-btn">&times;</button>
        </div>
        <div class="gemclean-modal-body">
          <img src="${cleanedBlobUrl}" class="gemclean-preview-img" alt="Cleaned Gemini Image" />
          <a href="${cleanedBlobUrl}" download="gemclean-image.png" class="gemclean-download-btn">
            💾 Download Clean Image (PNG)
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    document.getElementById("gemclean-modal-close-btn").onclick = () => root.remove();
    root.onclick = (e) => {
      if (e.target === root) root.remove();
    };
  }

  // Attach Floating Hover Buttons to Gemini / Web Images
  function attachHoverButtons() {
    const images = document.querySelectorAll("img:not([data-gemclean-attached])");
    images.forEach((img) => {
      if (img.width < 120 || img.height < 120) return; // Skip tiny icons/thumbnails
      img.setAttribute("data-gemclean-attached", "true");

      const parent = img.parentElement;
      if (!parent) return;

      // Wrap image if needed
      if (window.getComputedStyle(parent).position === "static") {
        parent.style.position = "relative";
      }

      const btn = document.createElement("button");
      btn.className = "gemclean-hover-btn";
      btn.innerHTML = `<span>✨ Clean Watermark</span>`;
      btn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.innerText = "⏳ Cleaning...";
        try {
          const result = await processImageSource(img.src);
          showInPageModal(result.blobUrl);
        } catch (err) {
          console.error("GemClean AI error:", err);
          alert("Could not process image directly due to CORS restrictions. Open GemClean AI Extension popup!");
        } finally {
          btn.innerHTML = `<span>✨ Clean Watermark</span>`;
        }
      };

      parent.appendChild(btn);
    });
  }

  // Listen to messages from background service worker (Context Menu)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "clean_element" && message.srcUrl) {
      processImageSource(message.srcUrl)
        .then((res) => {
          showInPageModal(res.blobUrl);
        })
        .catch((err) => {
          console.error("GemClean AI context menu error:", err);
          alert("Image cleaning failed. Please use GemClean AI popup.");
        });
    }
  });

  // Run observer for dynamically added images (e.g. Gemini response stream)
  const observer = new MutationObserver(() => {
    attachHoverButtons();
  });

  if (document.body) {
    attachHoverButtons();
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      attachHoverButtons();
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
})();
