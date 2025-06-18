console.log("Background script loaded.");

// Open the side panel when the extension icon is clicked
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error setting side panel behavior:', error));

// On first install, open the settings page
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    // This will open the settings page in a new tab.
    // Ensure 'options_page' is defined in manifest.json for this to work seamlessly.
    chrome.runtime.openOptionsPage();
    console.log("Extension installed, opening options page.");
  }
  // You could also add logic for 'UPDATE' if needed, e.g., to show release notes.
});

// Optional: Listen for messages if any global coordination is needed,
// though direct sidepanel-content script communication is often sufficient.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openOptionsPage") {
    chrome.runtime.openOptionsPage();
    sendResponse({ status: "Options page opened" });
    return true;
  }
  // Add other global message handlers here if necessary
});

console.log("Background script setup complete: side panel on click, options on install.");
