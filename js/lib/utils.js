/**
 * Logs messages to the console if debug mode is enabled.
 * Retrieves the 'debugMode' setting from chrome.storage.local.
 * @param {...any} args - The messages or objects to log.
 */
async function debugLog(...args) {
  try {
    const data = await chrome.storage.local.get('debugMode');
    if (data.debugMode) {
      console.log(...args);
    }
  } catch (error) {
    console.error('Error accessing debugMode setting:', error);
    // Optionally, log the message anyway or handle the error differently
    // console.log(...args); // Uncomment to log even if storage access fails
  }
}
