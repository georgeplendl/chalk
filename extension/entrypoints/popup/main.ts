const toggleBtn = document.getElementById('toggle') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const errorEl = document.getElementById('error') as HTMLDivElement;

async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

async function sendToContent(tabId: number, message: object): Promise<Record<string, unknown> | null> {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch {
    return null;
  }
}

function setUI(active: boolean, count?: number) {
  if (active) {
    toggleBtn.textContent = 'Stop drawing';
    toggleBtn.className = 'on';
    statusEl.textContent = count !== undefined
      ? `${count} annotation${count !== 1 ? 's' : ''} on this page`
      : 'Drawing mode on';
  } else {
    toggleBtn.textContent = 'Draw on this page';
    toggleBtn.className = 'off';
    statusEl.textContent = count !== undefined && count > 0
      ? `${count} annotation${count !== 1 ? 's' : ''} on this page`
      : '';
  }
}

async function init() {
  const tab = await getActiveTab();
  if (!tab?.id) {
    errorEl.textContent = 'Cannot run on this page.';
    toggleBtn.disabled = true;
    return;
  }

  const state = await sendToContent(tab.id, { type: 'GET_STATE' });
  if (!state) {
    errorEl.textContent = 'Reload the page to use Chalk.';
    toggleBtn.disabled = true;
    return;
  }

  setUI(Boolean(state.active), state.count as number | undefined);

  toggleBtn.addEventListener('click', async () => {
    const tab = await getActiveTab();
    if (!tab?.id) return;
    const response = await sendToContent(tab.id, { type: 'TOGGLE_OVERLAY' });
    if (response) setUI(Boolean(response.active), response.count as number | undefined);
  });
}

init();
