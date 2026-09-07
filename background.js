const renamedTabs = new Map();

function titleScript(title) {
  // JSON.stringify safely escapes quotes and other characters before the title
  // is embedded in the script executed in the tab.
  return `document.title = ${JSON.stringify(title)};`;
}

async function applyTitle(tabId, title) {
  try {
    await browser.tabs.executeScript(tabId, { code: titleScript(title) });
    return true;
  } catch (error) {
    // Firefox rejects script injection on protected pages and built-in viewers.
    console.debug(`Tab Renamer could not update tab ${tabId}.`, error);
    return false;
  }
}

async function restoreTitle(tabId) {
  const title = renamedTabs.get(tabId);
  if (title) {
    await applyTitle(tabId, title);
  }
}

browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === "rename-tab" && Number.isInteger(message.tabId)) {
    const title = message.title.trim();
    if (title) {
      const applied = await applyTitle(message.tabId, title);
      if (applied) {
        // Do not remember a name that Firefox could not apply to the page.
        renamedTabs.set(message.tabId, title);
        await browser.storage.local.set({ renamedTabs: Object.fromEntries(renamedTabs) });
      }
      return { applied };
    }
  }

  if (message.type === "reset-tab" && Number.isInteger(message.tabId)) {
    renamedTabs.delete(message.tabId);
    await browser.storage.local.set({ renamedTabs: Object.fromEntries(renamedTabs) });
    await browser.tabs.reload(message.tabId);
  }
});

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    // Navigation replaces the document title, so apply the custom name again.
    restoreTitle(tabId);
  }
});

browser.tabs.onRemoved.addListener(async (tabId) => {
  // Avoid retaining names for tabs that no longer exist.
  if (renamedTabs.delete(tabId)) {
    await browser.storage.local.set({ renamedTabs: Object.fromEntries(renamedTabs) });
  }
});

browser.commands.onCommand.addListener(async (command) => {
  if (command === "rename-current-tab") {
    await browser.browserAction.openPopup();
  }
});

browser.storage.local.get("renamedTabs").then((result) => {
  // Restore the in-memory cache when the background script starts.
  for (const [tabId, title] of Object.entries(result.renamedTabs || {})) {
    renamedTabs.set(Number(tabId), title);
  }
});
