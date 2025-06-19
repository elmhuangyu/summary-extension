export default defineBackground(() => {
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('Error setting side panel behavior:', error));

  browser.runtime.onInstalled.addListener(details => {
    if (details.reason === browser.runtime.OnInstalledReason.INSTALL) {
      browser.runtime.openOptionsPage();
    }
  });
});
