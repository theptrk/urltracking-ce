console.log("url-tracker.js");

const RECENT_URLS_LIST_LIMIT = 100;

// Function to add URL with timestamp
async function addTab(tab, method) {
  if (tab.url) {
    let { recent_urls = [] } = await chrome.storage.local.get("recent_urls");
    recent_urls.push({
      title: tab.title,
      url: tab.url,
      timestamp: new Date().toISOString(),
      method: method,
    });
    recent_urls = recent_urls.slice(-RECENT_URLS_LIST_LIMIT);
    chrome.storage.local.set({ recent_urls });
  }
}

// Listen for URL changes
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    addTab(tab, "tabs.onUpdated");
  }
  // Even if no navigation happens, the title can change
  if (changeInfo.title) {
    let { recent_urls = [] } = await chrome.storage.local.get("recent_urls");
    // If the last URL in the list is the same as the current URL, update the title
    if (
      recent_urls.length > 0 &&
      recent_urls[recent_urls.length - 1].url === tab.url
    ) {
      recent_urls[recent_urls.length - 1].title = tab.title;
    }
    chrome.storage.local.set({ recent_urls });
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      addTab(tab, "tabs.onActivated");
    }
  });
});

// Listen for window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        const tab = tabs[0];
        addTab(tab, "windows.onFocusChanged");
      }
    });
  }
});
