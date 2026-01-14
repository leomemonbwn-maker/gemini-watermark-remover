import { WatermarkEngine } from './engine.js';

document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewSection = document.getElementById('previewSection');
    const previewContainer = document.getElementById('previewContainer');

    // Buttons & Overlay
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const resetBtn = document.getElementById('resetBtn');

    let engine = null;
    let allProcessedFiles = []; 

    // Initialize Engine
    try {
        engine = await WatermarkEngine.create();
    } catch (e) {
        alert("Error: Could not load background assets. Please ensure 'assets/bg_48.png' and 'assets/bg_96.png' exist.");
    }

    // --- Event Listeners ---
    uploadArea.addEventListener('click', () => fileInput.click());

    // Drag & Drop Logic
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    uploadArea.addEventListener('dragover', () => uploadArea.classList.add('border-brand-primary', 'bg-blue-50'));
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('border-brand-primary', 'bg-blue-50'));

    uploadArea.addEventListener('drop', (e) => {
        uploadArea.classList.remove('border-brand-primary', 'bg-blue-50');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    // Cleanup and Reset
    resetBtn.addEventListener('click', () => {
        // Revoke Object URLs to prevent memory leaks
        allProcessedFiles.forEach(file => {
            if (file.url) URL.revokeObjectURL(file.url);
        });
        
        previewSection.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        fileInput.value = '';
        previewContainer.innerHTML = '';
        downloadBtn.classList.add('hidden');
        downloadAllBtn.classList.add('hidden');
        allProcessedFiles = [];
    });

    // Sidebar Single Download Button Logic
    downloadBtn.addEventListener('click', () => {
        if (allProcessedFiles.length === 1) {
            const item = allProcessedFiles[0];
            const a = document.createElement('a');
            a.href = item.url;
            a.download = item.name;
            a.click();
        }
    });

    // Bulk Download ZIP
    downloadAllBtn.addEventListener('click', async () => {
        if (allProcessedFiles.length === 0) return;

        const zip = new JSZip();
        allProcessedFiles.forEach(item => {
            zip.file(item.name, item.blob);
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cleaned_images_${Date.now()}.zip`;
        a.click();
        
        // Cleanup ZIP URL after download
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    function createLoadingCard(fileName, index) {
        const card = document.createElement('div');
        card.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white dark:bg-theme-cardDark rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 animate-fade-in';
        card.id = `preview-card-${index}`;

        card.innerHTML = `
            <div class="bg-white dark:bg-theme-cardDark rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div class="bg-gray-50 dark:bg-gray-800/80 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-gray-400"></span>
                        <h3 class="font-bold text-slate-700 dark:text-slate-200 text-xs truncate">${fileName}</h3>
                    </div>
                </div>
                <div class="p-3 flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-800">
                    <div class="text-center">
                        <div class="w-12 h-12 mx-auto mb-3 rounded-full border-4 border-gray-300 border-t-brand-primary animate-spin"></div>
                        <p class="text-sm text-gray-500">Loading...</p>
                    </div>
                </div>
            </div>
            <div class="bg-white dark:bg-theme-cardDark rounded-xl shadow-md overflow-hidden border border-brand-primary/30">
                <div class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 px-3 py-2 border-b border-brand-primary/20">
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
                        <h3 class="font-bold text-brand-primary dark:text-indigo-400 text-xs">Processing...</h3>
                    </div>
                </div>
                <div class="p-3 flex items-center justify-center h-48 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
                    <div class="text-center">
                        <div class="w-12 h-12 mx-auto mb-3 rounded-full border-4 border-brand-primary/30 border-t-brand-primary animate-spin"></div>
                        <p class="text-sm text-brand-primary font-semibold">Removing watermark...</p>
                    </div>
                </div>
            </div>
        `;
        return card;
    }

    function updateCardWithResult(index, fileData, fileName) {
        const card = document.getElementById(`preview-card-${index}`);
        if (!card) return;

        const sizeText = `${fileData.width} × ${fileData.height} px`;

        // Fixed Button Styling: Increased padding and font size for better mobile tap targets
        card.innerHTML = `
            <div class="bg-white dark:bg-theme-cardDark rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div class="bg-gray-50 dark:bg-gray-800/80 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-gray-400"></span>
                        <h3 class="font-bold text-slate-700 dark:text-slate-200 text-xs">Original</h3>
                    </div>
                    <div class="text-[10px] font-mono text-slate-500 dark:text-slate-400">${sizeText}</div>
                </div>
                <div class="p-3 bg-gray-50/50 flex justify-center h-64">
                    <img src="${fileData.originalSrc}" class="max-h-full object-contain rounded shadow-sm mx-auto" />
                </div>
            </div>
            <div class="bg-white dark:bg-theme-cardDark rounded-xl shadow-md overflow-hidden border border-green-500/40 ring-2 ring-green-500/20">
                <div class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-3 py-2 border-b border-green-500/30 flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <iconify-icon icon="ph:check-circle-fill" class="text-green-500" width="16"></iconify-icon>
                        <h3 class="font-bold text-green-600 dark:text-green-400 text-xs">Completed</h3>
                    </div>
                    <button class="flex items-center gap-1 px-3 py-1.5 text-[11px] sm:text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all active:scale-95" data-index="${index}">
                        <iconify-icon icon="ph:download-simple-bold" width="14"></iconify-icon> Download
                    </button>
                </div>
                <div class="p-3 bg-gray-50/50 flex justify-center h-64">
                    <img src="${fileData.url}" class="max-h-full object-contain rounded shadow-sm mx-auto" />
                </div>
            </div>
        `;

        card.querySelector('button[data-index]').addEventListener('click', () => {
            const a = document.createElement('a');
            a.href = fileData.url;
            a.download = fileName;
            a.click();
        });
    }

    async function handleFiles(files) {
        const validFiles = Array.from(files).filter(f => f.type.match('image.*'));
        if (validFiles.length === 0) {
            alert("Please upload valid images (PNG, JPG, WebP)");
            return;
        }

        uploadArea.classList.add('hidden');
        previewSection.classList.remove('hidden');
        previewContainer.innerHTML = '';
        allProcessedFiles = [];

        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            const loadingCard = createLoadingCard(file.name, i);
            previewContainer.appendChild(loadingCard);

            try {
                const result = await engine.process(file);
                const fileName = `clean_${file.name.replace(/\.[^/.]+$/, "")}.png`;

                const fileData = {
                    name: fileName,
                    blob: result.blob,
                    url: URL.createObjectURL(result.blob),
                    originalSrc: result.originalSrc,
                    width: result.width,
                    height: result.height
                };

                allProcessedFiles.push(fileData);
                updateCardWithResult(i, fileData, fileName);
            } catch (err) {
                console.error(`Failed to process ${file.name}:`, err);
            }
        }

        // Updated button visibility logic
        if (allProcessedFiles.length === 1) {
            downloadBtn.classList.remove('hidden');
            downloadAllBtn.classList.add('hidden');
        } else if (allProcessedFiles.length > 1) {
            downloadBtn.classList.add('hidden');
            downloadAllBtn.classList.remove('hidden');
        }
    }
});