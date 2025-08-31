// Simple Site Rotator - Background Script
let rotationActive = false;
let currentIndex = 0;
let rotationTabId = null;
let rotationInterval = null;

// Default test sites - modify these for your local testing
const DEFAULT_SITES = [
  'http://linkedin.com',
  'http://detik.com',
  'http://microsoft.com',
  'http://tokopedia.com',
  'http://kompas.com',
  'http://kemhan.go.id',
  'http://kompas.com',
  'http://gojek.com',
  'http://indonesia.go.id',
  'http://tni.mil.id',
  'http://polri.go.id',
  'http://kemenkeu.go.id',
  'http://youtube.com',
  'http://facebook.com',
  'http://wikipedia.org',
  'http://instagram.com',
  'http://shopee.co.id',
  'http://traveloka.com',
  'http://cnnindonesia.com',
  'http://tribunnews.com',
  'http://twitter.com',
  'http://cnbcindonesia.com',
  'https://www.google.com',
  'http://channelnewsasia.com',
  'https://webmail.belengx.local',
  'http://web.belengx.local',
  'http://bnnc.belengx.local'
];

// Initialize on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ 
    sites: DEFAULT_SITES,
    rotationActive: true  // Changed to true for auto-start
  });
  // Auto-start on installation
  startRotation();
});

// Auto-start when browser starts
chrome.runtime.onStartup.addListener(() => {
  startRotation();
});

// Start rotation
async function startRotation() {
  if (rotationActive) return;
  
  rotationActive = true;
  chrome.storage.local.set({ rotationActive: true });
  
  // Get or create the rotation tab
  if (!rotationTabId) {
    const tab = await chrome.tabs.create({ active: true });
    rotationTabId = tab.id;
  }
  
  // Start rotating
  rotateSite();
  
  // Set interval for rotation (15 seconds)
  rotationInterval = setInterval(() => {
    rotateSite();
  }, 29000);
}

// Stop rotation
function stopRotation() {
  rotationActive = false;
  chrome.storage.local.set({ rotationActive: false });
  
  if (rotationInterval) {
    clearInterval(rotationInterval);
    rotationInterval = null;
  }
}

// Rotate to next site
async function rotateSite() {
  if (!rotationActive) return;
  
  try {
    const result = await chrome.storage.local.get(['sites']);
    const sites = result.sites || DEFAULT_SITES;
    
    if (sites.length === 0) return;
    
    const url = sites[currentIndex];
    currentIndex = (currentIndex + 1) % sites.length;
    
    // Update the tab
    if (rotationTabId) {
      try {
        await chrome.tabs.update(rotationTabId, { url: url });
      } catch (error) {
        // Tab was closed, create new one
        const tab = await chrome.tabs.create({ url: url, active: true });
        rotationTabId = tab.id;
      }
    }
  } catch (error) {
    console.error('Error rotating site:', error);
  }
}

// Listen for tab closure
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === rotationTabId) {
    rotationTabId = null;
    if (rotationActive) {
      // Recreate tab and continue rotation
      chrome.tabs.create({ active: true }).then(tab => {
        rotationTabId = tab.id;
        rotateSite();
      });
    }
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'start':
      startRotation().then(() => {
        sendResponse({ success: true });
      });
      return true;
      
    case 'stop':
      stopRotation();
      sendResponse({ success: true });
      break;
      
    case 'getStatus':
      sendResponse({ 
        active: rotationActive,
        currentIndex: currentIndex,
        tabId: rotationTabId
      });
      break;
      
    case 'updateSites':
      chrome.storage.local.set({ sites: request.sites });
      currentIndex = 0;
      sendResponse({ success: true });
      break;
  }
});
