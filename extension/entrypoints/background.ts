export default defineBackground(() => {
  chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_OVERLAY' });
      // Reflect active state on the icon badge
      chrome.action.setBadgeText({
        tabId: tab.id,
        text: response?.active ? 'ON' : '',
      });
      chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#1a1a1a' });
    } catch {
      // Content script not ready (e.g. on chrome:// pages)
    }
  });
});
