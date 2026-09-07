const renamedTabs = new Map();

function titleScript(title) {
  return `document.title = ${JSON.stringify(title)};`;
}

async function applyTitle(tabId, title) {
  try {
    await browser.tabs.executeScript(tabId, { code: titleScript(title) });
  } catch (error) {
    console.debug(`Tab Renamer could not update tab ${tabId}.`, error);
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
      renamedTabs.set(message.tabId, title);
      await browser.storage.local.set({ renamedTabs: Object.fromEntries(renamedTabs) });
      await applyTitle(message.tabId, title);
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
    restoreTitle(tabId);
  }
});

browser.tabs.onRemoved.addListener(async (tabId) => {
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
  for (const [tabId, title] of Object.entries(result.renamedTabs || {})) {
    renamedTabs.set(Number(tabId), title);
  }
});
