// GemClean AI Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "gemclean-clean-image",
    title: "✨ Clean Watermark with GemClean AI",
    contexts: ["image", "video"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "gemclean-clean-image" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: "clean_element",
      srcUrl: info.srcUrl || info.linkUrl || info.pageUrl,
      mediaType: info.mediaType
    });
  }
});
