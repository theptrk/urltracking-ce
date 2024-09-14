// console.log("url-tracker.js");

const verbose = true;

const RECENT_URLS_LIST_LIMIT = 100;

// Function to extract domain with subdomains (excluding 'www')
function extractDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split(".");
    if (parts[0] === "www") {
      let result = parts.slice(1).join(".");
      return result;
    }
    return hostname;
  } catch (error) {
    console.error("Invalid URL:", url);
    return "Unknown";
  }
}

class RecentUrl {
  constructor(tab, method) {
    this.title = tab.title;
    this.url = tab.url;
    this.domain = extractDomain(tab.url);
    this.timestamp = new Date().toISOString();
    this.method = method;
  }

  // Static method to create a RecentUrl from a plain object
  static fromObject(obj) {
    const recentUrl = Object.create(RecentUrl.prototype);
    return Object.assign(recentUrl, obj);
  }
}

async function getRecentUrls() {
  const result = await chrome.storage.local.get("recent_urls");
  return (result.recent_urls || []).map(RecentUrl.fromObject);
}

async function handleTabTitleChange(tabId, changeInfo, tab) {
  if (changeInfo.title) {
    console.log("handleTabTitleChange", tabId, changeInfo, tab);
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
}

async function addRecentUrl(method, tab) {
  if (!tab.url) return;

  if (verbose) {
    console.log("addRecentUrl", tab.url, method, tab);
  }

  let recent_urls = await getRecentUrls();

  const new_url_obj = new RecentUrl(tab, method);
  recent_urls.push(new_url_obj);

  // Limit the list to RECENT_URLS_LIST_LIMIT items
  recent_urls = recent_urls.slice(-RECENT_URLS_LIST_LIMIT);

  // Store as plain objects
  await chrome.storage.local.set({ recent_urls: recent_urls });
}

async function updateTitle(method, tab) {
  if (!tab.url) return;
  if (!tab.title) return;

  let recent_urls = (await getRecentUrls()) || [];
  const same_url =
    recent_urls.length > 0 &&
    recent_urls[recent_urls.length - 1].url === tab.url;
  if (same_url) {
    recent_urls[recent_urls.length - 1].title = tab.title;
  }
  chrome.storage.local.set({ recent_urls });
}

function handleTabNavigation(tab, method) {
  addRecentUrl(tab, method);
}

// Listen for URL changes on the current tab
// https://developer.chrome.com/docs/extensions/reference/api/tabs#event-onUpdated
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Check if the tab is the current active tab
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (activeTab.id !== tab.id) {
    if (verbose) console.log("Skipping non-active tab:", tab.url);
    return;
  }

  // Navigation to url is complete
  if (changeInfo.status === "complete" && tab.url) {
    addRecentUrl("tabs.onUpdated", tab);
  } else if (changeInfo.title) {
    // Even if no navigation happens, the title can change
    updateTitle("tabs.onUpdated", tab);
  }
});

// Listen for tab activation,
// https://developer.chrome.com/docs/extensions/reference/api/tabs#event-onActivated
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // if tab is activated get tab by id
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      addRecentUrl("tabs.onActivated", tab);
    }
  });
});

// Listen for window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        const tab = tabs[0];
        addRecentUrl("windows.onFocusChanged", tab);
      }
    });
  }
});
