// Simple popup script
document.addEventListener('DOMContentLoaded', async () => {
  // Load current status
  updateStatus();
  
  // Load saved sites
  const result = await chrome.storage.local.get(['sites']);
  if (result.sites) {
    document.getElementById('sitesInput').value = result.sites.join('\n');
  }
  
  // Button handlers
  document.getElementById('startBtn').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ action: 'start' });
    updateStatus();
  });
  
  document.getElementById('stopBtn').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ action: 'stop' });
    updateStatus();
  });
  
  document.getElementById('saveBtn').addEventListener('click', async () => {
    const sites = document.getElementById('sitesInput').value
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    await chrome.runtime.sendMessage({ 
      action: 'updateSites', 
      sites: sites 
    });
    
    // Show confirmation
    const btn = document.getElementById('saveBtn');
    const originalText = btn.textContent;
    btn.textContent = '✓ Saved!';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  });
});

async function updateStatus() {
  const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
  const statusDiv = document.getElementById('status');
  const statusText = document.getElementById('statusText');
  
  if (response.active) {
    statusDiv.className = 'status status-active';
    statusText.textContent = 'RUNNING';
  } else {
    statusDiv.className = 'status status-inactive';
    statusText.textContent = 'STOPPED';
  }
}
