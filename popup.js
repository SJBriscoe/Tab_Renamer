const form = document.querySelector("#rename-form");
const input = document.querySelector("#tab-name");
const count = document.querySelector("#character-count");
const resetButton = document.querySelector("#reset-button");
const status = document.querySelector("#status");

let activeTab;

function isProtectedTab(tab) {
  return /^(about|moz-extension|resource|view-source):/.test(tab.url || "") || /\.pdf(?:$|[?#])/i.test(tab.url || "");
}

function updateCount() {
  count.textContent = `${input.value.length}/80`;
}

function showStatus(message, persistent = false) {
  status.textContent = message;
  status.classList.toggle("protected", persistent);
  if (!persistent) {
    window.setTimeout(() => {
      status.textContent = "";
      status.classList.remove("protected");
    }, 2200);
  }
}

async function loadActiveTab() {
  [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) {
    input.disabled = true;
    return;
  }

  if (isProtectedTab(activeTab)) {
    input.disabled = true;
    input.placeholder = "This tab cannot be renamed";
    form.querySelector("button").disabled = true;
    resetButton.disabled = true;
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

  const result = await browser.runtime.sendMessage({ type: "rename-tab", tabId: activeTab.id, title });
  showStatus(result?.applied ? "Tab renamed" : "This tab cannot be renamed");
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
