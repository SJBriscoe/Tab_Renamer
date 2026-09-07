const form = document.querySelector("#rename-form");
const input = document.querySelector("#tab-name");
const count = document.querySelector("#character-count");
const resetButton = document.querySelector("#reset-button");
const status = document.querySelector("#status");

let activeTab;

function updateCount() {
  count.textContent = `${input.value.length}/80`;
}

function showStatus(message) {
  status.textContent = message;
  window.setTimeout(() => {
    status.textContent = "";
  }, 2200);
}

async function loadActiveTab() {
  [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) {
    input.disabled = true;
    return;
  }

  const stored = await browser.storage.local.get("renamedTabs");
  input.value = stored.renamedTabs?.[activeTab.id] || "";
  updateCount();
  input.focus();
}

input.addEventListener("input", updateCount);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title || !activeTab) return;

  await browser.runtime.sendMessage({ type: "rename-tab", tabId: activeTab.id, title });
  showStatus("Tab renamed");
});

resetButton.addEventListener("click", async () => {
  if (!activeTab) return;

  await browser.runtime.sendMessage({ type: "reset-tab", tabId: activeTab.id });
  input.value = "";
  updateCount();
  showStatus("Page title restored");
});

loadActiveTab().catch(() => {
  showStatus("This tab cannot be renamed");
});
