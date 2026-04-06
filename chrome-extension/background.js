// BotFarm Reporter - Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('[BotFarm] Extension installed');
  
  // Initialize storage
  chrome.storage.local.set({
    stats: { scanned: 0, reported: 0, blocked: 0 },
    autoAddButtons: true,
    reportedAccounts: [],
    blockedAccounts: []
  });
});

// Listen for tab updates to inject content script on Twitter pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('twitter.com') || tab.url.includes('x.com')) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      }).catch(() => {
        // Script may already be injected, ignore error
      });
    }
  }
});

// Update stats
function updateStats(updates) {
  chrome.storage.local.get(['stats'], (result) => {
    const stats = result.stats || { scanned: 0, reported: 0, blocked: 0 };
    
    if (updates.scanned) stats.scanned += updates.scanned;
    if (updates.reported) stats.reported += updates.reported;
    if (updates.blocked) stats.blocked += updates.blocked;
    
    chrome.storage.local.set({ stats });
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStats') {
    updateStats(request.updates);
  } else if (request.action === 'getStats') {
    chrome.storage.local.get(['stats'], (result) => {
      sendResponse({ stats: result.stats || { scanned: 0, reported: 0, blocked: 0 } });
    });
    return true; // Async response
  }
});

console.log('[BotFarm] Background service worker loaded');
