import { ref, reactive, computed } from 'vue';

const currentLang = ref(localStorage.getItem('gemclean_lang') || 'en');

const translations = {
  en: {
    // Header
    installApp: 'Install App',
    about: 'About',
    github: 'GitHub',
    appearance: 'Appearance',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    
    // Hero
    heroBadge: 'GemClean AI 2.0',
    heroBadgeSub: 'Free & Private',
    heroTitle1: 'Remove AI',
    heroTitle2: 'Watermarks Instantly',
    heroSubtitle: 'Pixel-perfect removal of Gemini sparkle logos & Veo video watermarks. Zero uploads. Zero compression. 100% browser-side.',
    noServerUpload: 'No Server Upload',
    imageFormats: 'PNG • JPG • WebP',
    videoFormats: 'MP4 • WebM • MOV',
    scrollDown: 'Scroll to begin',
    
    // Tabs
    tabImages: 'Images',
    tabVideos: 'Videos',
    tabNew: 'NEW',
    
    // Upload
    uploadTitle: 'Click to upload, drag images, or',
    uploadPaste: 'to paste',
    uploadFormats: 'PNG, JPG, WebP · Multiple files supported',
    advancedMode: 'Advanced: touch & drag target box',
    
    // Results
    originalPhoto: 'Original Photo',
    cleaned: 'Cleaned',
    lossless: '100% Lossless',
    autoLocated: '✨ 100% Auto-Located',
    sideBySide: 'Side-by-Side',
    compareSlider: 'Compare Slider',
    download: 'Download',
    downloadAll: 'Download All ZIP',
    copy: 'Copy',
    copied: 'Copied',
    processAnother: 'Process Another',
    askAi: 'Ask AI',
    format: 'Format',
    share: 'Share',
    
    // Confidence
    watermarkDetected: 'Watermark detected',
    confidence: 'Confidence',
    confirmProcess: 'Confirm & Process',
    
    // History
    historyTitle: 'Processing History',
    historyEmpty: 'No processed images yet. Upload and clean your first image!',
    historyClearAll: 'Clear All',
    historyDownload: 'Download',
    historyDelete: 'Delete',
    
    // Pipeline
    pipelineTitle: 'The',
    pipelineTitleHighlight: 'Removal Pipeline',
    pipelineSubtitle: 'Every watermark removal follows this exact 5-step mathematical pipeline — entirely in your browser.',
    step: 'Step',
    
    // Pipeline Steps
    stepDecode: 'Decode Input',
    stepDecodeDesc: 'Parse image/video file into raw RGBA pixel buffer via Canvas 2D API',
    stepLocate: 'Locate Watermark',
    stepLocateDesc: 'Compute watermark box using resolution-adaptive geometry (48px or 96px)',
    stepAlpha: 'Build Alpha Map',
    stepAlphaDesc: 'Generate sparkle template opacity mask from reference bg_96.png asset',
    stepBlend: 'Reverse Blend',
    stepBlendDesc: 'Apply inverse alpha: Original = (Watermarked − α×Logo) ÷ (1−α) per channel',
    stepExport: 'Export Clean',
    stepExportDesc: 'Re-encode pristine pixels to lossless PNG or H.264 MP4 with audio passthrough',
    
    // Formula
    coreFormula: 'Core Formula',
    formulaWhere: 'Where',
    formulaAlpha: 'is the sparkle template opacity and',
    formulaL: 'is the logo pixel value (255). Applied per-channel (R, G, B) independently.',
    
    // Stats
    uploadLatency: 'Upload Latency',
    statsLossless: 'Lossless',
    bytesLogged: 'Bytes Logged',
    filesPerDay: 'Files / Day',
    
    // Before/After
    realOutput: 'Real Output',
    seeTheDifference: 'See the',
    differenceHighlight: 'Difference',
    sliderHint: 'Drag the slider to compare the watermarked original with the losslessly cleaned output.',
    
    // FAQ
    faqSupport: 'Support',
    faqTitle: 'Frequently Asked',
    faqTitleHighlight: 'Questions',
    
    // Footer
    poweredBy: 'Powered by',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    contactUs: 'Contact',
    allRightsReserved: 'All rights reserved.',
    
    // Tip
    tip: 'Tip: Use the official Download button in Gemini for best results. Avoid screenshots.',
    
    // Shortcuts
    shortcuts: 'Shortcuts',
    keyboardShortcuts: 'Keyboard Shortcuts',
    pasteImage: 'Paste image from clipboard',
    toggleShortcuts: 'Toggle shortcuts modal',
    closeModal: 'Close modal / Reset',
    
    // Video
    videoUnsupported: 'Your browser does not support video processing.',
    videoProcessing: 'Processing video...',
    videoComplete: 'Video processing complete!',
    
    // Onboarding
    onboardingWelcome: 'Welcome to GemClean AI!',
    onboardingStep1: 'Upload your Gemini AI image here',
    onboardingStep2: 'The watermark is automatically detected',
    onboardingStep3: 'Compare before and after results',
    onboardingStep4: 'Download your clean image',
    onboardingSkip: 'Skip Tour',
    onboardingNext: 'Next',
    onboardingDone: 'Get Started!',
    
    // Notifications
    notifProcessingDone: 'Your image has been cleaned successfully!',
    notifVideoDone: 'Your video processing is complete!',
    
    // Support Popup
    keepFree: 'Keep GemClean AI Free!',
    supportDev: 'Support the Developer',
    supportMsg: 'Running this tool ad-free and open-source takes time and effort. If GemClean AI saved your day, consider supporting!',
    donateUpi: 'Donate via UPI',
    maybeLater: 'Maybe Later',
    
    // Extension Modal
    addExtension: 'Add Chrome Extension',
    extensionModalTitle: 'Get GemClean AI for Chrome',
    extensionModalSubtitle: 'Clean Gemini photos & videos directly from your browser toolbar with 1-click!',
    downloadExtensionZip: 'Download Extension (.zip)',
    extensionStep1Title: '1. Download & Unzip',
    extensionStep1Desc: 'Click the button above to download GemCleanAI-Extension.zip',
    extensionStep2Title: '2. Open chrome://extensions',
    extensionStep2Desc: 'Turn ON Developer Mode in top-right corner of Chrome',
    extensionStep3Title: '3. Load Unpacked',
    extensionStep3Desc: 'Click "Load Unpacked" and select the unzipped folder. Done!',

    // APK Modal
    apkModalTitle: 'GemClean AI for Android',
    apkModalSubtitle: 'Super-smooth native app for removing Gemini watermarks on your phone!',
    downloadApk: 'Download APK',
    apkStep1Title: '1. Download APK',
    apkStep1Desc: 'Click the button above to download GemCleanAI.apk',
    apkStep2Title: '2. Allow Install',
    apkStep2Desc: 'If prompted, enable "Install from unknown sources" in Settings',
    apkStep3Title: '3. Open & Enjoy',
    apkStep3Desc: 'Open the app and start cleaning watermarks instantly!',

    // Quality
    qualityScore: 'Quality Score',
  },
  hi: {
    // Header
    installApp: 'ऐप इंस्टॉल करें',
    about: 'हमारे बारे में',
    github: 'GitHub',
    appearance: 'दिखावट',
    darkMode: 'डार्क मोड',
    lightMode: 'लाइट मोड',
    
    // Hero
    heroBadge: 'GemClean AI 2.0',
    heroBadgeSub: 'फ्री और प्राइवेट',
    heroTitle1: 'AI वॉटरमार्क',
    heroTitle2: 'तुरंत हटाएं',
    heroSubtitle: 'Gemini स्पार्कल लोगो और Veo वीडियो वॉटरमार्क को पिक्सेल-परफेक्ट हटाएं। कोई अपलोड नहीं। कोई कम्प्रेशन नहीं। 100% ब्राउज़र में।',
    noServerUpload: 'कोई सर्वर अपलोड नहीं',
    imageFormats: 'PNG • JPG • WebP',
    videoFormats: 'MP4 • WebM • MOV',
    scrollDown: 'शुरू करने के लिए स्क्रॉल करें',
    
    // Tabs
    tabImages: 'इमेज',
    tabVideos: 'वीडियो',
    tabNew: 'नया',
    
    // Upload
    uploadTitle: 'अपलोड करें, ड्रैग करें, या',
    uploadPaste: 'पेस्ट करें',
    uploadFormats: 'PNG, JPG, WebP · एकाधिक फाइलें समर्थित',
    advancedMode: 'एडवांस्ड: टच और ड्रैग टारगेट बॉक्स',
    
    // Results
    originalPhoto: 'ओरिजिनल फोटो',
    cleaned: 'साफ किया',
    lossless: '100% लॉसलेस',
    autoLocated: '✨ 100% ऑटो-लोकेटेड',
    sideBySide: 'साथ-साथ',
    compareSlider: 'तुलना स्लाइडर',
    download: 'डाउनलोड',
    downloadAll: 'सब ZIP डाउनलोड',
    copy: 'कॉपी',
    copied: 'कॉपी हुआ',
    processAnother: 'और प्रोसेस करें',
    askAi: 'AI से पूछें',
    format: 'फॉर्मैट',
    share: 'शेयर',
    
    // Confidence
    watermarkDetected: 'वॉटरमार्क मिला',
    confidence: 'विश्वसनीयता',
    confirmProcess: 'पुष्टि करें और प्रोसेस करें',
    
    // History
    historyTitle: 'प्रोसेसिंग हिस्ट्री',
    historyEmpty: 'अभी कोई प्रोसेस की गई इमेज नहीं है। अपनी पहली इमेज अपलोड करें!',
    historyClearAll: 'सब हटाएं',
    historyDownload: 'डाउनलोड',
    historyDelete: 'हटाएं',
    
    // Pipeline
    pipelineTitle: 'द',
    pipelineTitleHighlight: 'रिमूवल पाइपलाइन',
    pipelineSubtitle: 'हर वॉटरमार्क रिमूवल इसी 5-स्टेप गणितीय पाइपलाइन का पालन करता है — पूरी तरह आपके ब्राउज़र में।',
    step: 'स्टेप',
    
    // Pipeline Steps
    stepDecode: 'इनपुट डीकोड',
    stepDecodeDesc: 'Canvas 2D API के जरिए इमेज/वीडियो फाइल को रॉ RGBA पिक्सेल बफर में पार्स करें',
    stepLocate: 'वॉटरमार्क ढूंढें',
    stepLocateDesc: 'रिज़ॉल्यूशन-एडैप्टिव ज्योमेट्री से वॉटरमार्क बॉक्स कैलकुलेट करें (48px या 96px)',
    stepAlpha: 'अल्फा मैप बनाएं',
    stepAlphaDesc: 'रेफरेंस bg_96.png एसेट से स्पार्कल टेम्पलेट ओपेसिटी मास्क जनरेट करें',
    stepBlend: 'रिवर्स ब्लेंड',
    stepBlendDesc: 'इनवर्स अल्फा लागू करें: Original = (Watermarked − α×Logo) ÷ (1−α) प्रति चैनल',
    stepExport: 'क्लीन एक्सपोर्ट',
    stepExportDesc: 'प्रिस्टीन पिक्सेल्स को लॉसलेस PNG या H.264 MP4 में री-एनकोड करें, ऑडियो पासथ्रू के साथ',
    
    // Formula
    coreFormula: 'कोर फॉर्मूला',
    formulaWhere: 'जहां',
    formulaAlpha: 'स्पार्कल टेम्पलेट ओपेसिटी है और',
    formulaL: 'लोगो पिक्सेल वैल्यू (255) है। प्रति-चैनल (R, G, B) स्वतंत्र रूप से लागू।',
    
    // Stats
    uploadLatency: 'अपलोड लेटेंसी',
    statsLossless: 'लॉसलेस',
    bytesLogged: 'बाइट्स लॉग',
    filesPerDay: 'फाइलें / दिन',
    
    // Before/After
    realOutput: 'असली आउटपुट',
    seeTheDifference: 'देखें',
    differenceHighlight: 'अंतर',
    sliderHint: 'वॉटरमार्क वाले ओरिजिनल और लॉसलेस क्लीन आउटपुट की तुलना करने के लिए स्लाइडर ड्रैग करें।',
    
    // FAQ
    faqSupport: 'सहायता',
    faqTitle: 'अक्सर पूछे जाने वाले',
    faqTitleHighlight: 'सवाल',
    
    // Footer
    poweredBy: 'संचालित',
    privacyPolicy: 'गोपनीयता नीति',
    termsOfService: 'सेवा की शर्तें',
    contactUs: 'संपर्क',
    allRightsReserved: 'सर्वाधिकार सुरक्षित।',
    
    // Tip
    tip: 'टिप: सबसे अच्छे परिणामों के लिए Gemini में आधिकारिक डाउनलोड बटन का उपयोग करें। स्क्रीनशॉट से बचें।',
    
    // Shortcuts
    shortcuts: 'शॉर्टकट',
    keyboardShortcuts: 'कीबोर्ड शॉर्टकट',
    pasteImage: 'क्लिपबोर्ड से इमेज पेस्ट करें',
    toggleShortcuts: 'शॉर्टकट मोडल टॉगल करें',
    closeModal: 'मोडल बंद करें / रीसेट',
    
    // Video
    videoUnsupported: 'आपका ब्राउज़र वीडियो प्रोसेसिंग को सपोर्ट नहीं करता।',
    videoProcessing: 'वीडियो प्रोसेस हो रहा है...',
    videoComplete: 'वीडियो प्रोसेसिंग पूरी हो गई!',
    
    // Onboarding
    onboardingWelcome: 'GemClean AI में स्वागत है!',
    onboardingStep1: 'अपनी Gemini AI इमेज यहां अपलोड करें',
    onboardingStep2: 'वॉटरमार्क अपने आप डिटेक्ट होता है',
    onboardingStep3: 'पहले और बाद के रिजल्ट की तुलना करें',
    onboardingStep4: 'अपनी क्लीन इमेज डाउनलोड करें',
    onboardingSkip: 'टूर छोड़ें',
    onboardingNext: 'अगला',
    onboardingDone: 'शुरू करें!',
    
    // Notifications
    notifProcessingDone: 'आपकी इमेज सफलतापूर्वक साफ हो गई!',
    notifVideoDone: 'आपकी वीडियो प्रोसेसिंग पूरी हो गई!',
    
    // Support Popup
    keepFree: 'GemClean AI को फ्री रखें!',
    supportDev: 'डेवलपर को सपोर्ट करें',
    supportMsg: 'इस टूल को एड-फ्री और ओपन-सोर्स चलाने में समय और मेहनत लगती है। अगर GemClean AI ने आपकी मदद की, तो सपोर्ट करें!',
    donateUpi: 'UPI से डोनेट करें',
    maybeLater: 'बाद में',
    
    // APK Modal
    apkModalTitle: 'Android के लिए GemClean AI',
    apkModalSubtitle: 'फोन पर Gemini वॉटरमार्क हटाने के लिए सुपर-स्मूथ नेटिव ऐप!',
    downloadApk: 'APK डाउनलोड करें',
    apkStep1Title: '1. APK डाउनलोड करें',
    apkStep1Desc: 'ऊपर दिए गए बटन पर क्लिक करके GemCleanAI.apk डाउनलोड करें',
    apkStep2Title: '2. इंस्टॉल की अनुमति दें',
    apkStep2Desc: 'अगर पूछा जाए तो Settings में "Install from unknown sources" चालू करें',
    apkStep3Title: '3. खोलें और आनंद लें',
    apkStep3Desc: 'ऐप खोलें और तुरंत वॉटरमार्क साफ करना शुरू करें!',

    // Quality
    qualityScore: 'क्वालिटी स्कोर',
  }
};

export function useI18n() {
  function t(key) {
    const lang = currentLang.value;
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  }

  function setLang(lang) {
    currentLang.value = lang;
    localStorage.setItem('gemclean_lang', lang);
  }

  const availableLanguages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  ];

  return {
    t,
    currentLang,
    setLang,
    availableLanguages,
  };
}
