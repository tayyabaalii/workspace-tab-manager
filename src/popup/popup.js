import { api } from "../utils/messaging.js";
import { createToastController, escapeHtml, bindDelegatedClick } from "../utils/dom.js";
import { formatDate, formatTabCount } from "../utils/format.js";
import { POPUP_RECENT_LIMIT } from "../utils/constants.js";
import { isRestrictedUrl } from "../utils/urls.js";

const workspaceNameInput = document.getElementById("workspaceName");
const saveBtn = document.getElementById("saveBtn");
const manageBtn = document.getElementById("manageBtn");
const workspaceList = document.getElementById("workspaceList");
const tabCountEl = document.getElementById("tabCount");
const toast = createToastController(document.getElementById("toast"));

const saveBtnDefaultHtml = saveBtn.innerHTML;

async function updateTabCount() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const savableCount = tabs.filter((tab) => !isRestrictedUrl(tab.url)).length;
  tabCountEl.textContent = `${formatTabCount(savableCount)} in window`;
}

function renderWorkspaceItem(workspace) {
  return `
    <div class="workspace-item" data-id="${escapeHtml(workspace.id)}">
      <div class="workspace-info">
        <div class="workspace-name">${escapeHtml(workspace.name)}</div>
        <div class="workspace-meta">
          ${formatTabCount(workspace.tabsCount)} · ${formatDate(workspace.createdAt)}
        </div>
      </div>
      <button class="btn-launch" data-id="${escapeHtml(workspace.id)}">Launch</button>
    </div>
  `;
}

async function loadWorkspaces() {
  const { workspaces } = await api.getWorkspaces();

  if (!workspaces.length) {
    workspaceList.innerHTML =
      '<div class="empty-state">No saved workspaces yet.</div>';
    return;
  }

  workspaceList.innerHTML = workspaces
    .slice(0, POPUP_RECENT_LIMIT)
    .map(renderWorkspaceItem)
    .join("");
}

bindDelegatedClick(workspaceList, ".btn-launch", async (_event, button) => {
  button.disabled = true;
  button.textContent = "…";

  try {
    await api.restoreWorkspace(button.dataset.id);
    toast.show("Workspace launched!");
    window.close();
  } catch (error) {
    toast.show(error.message || "Launch failed", true);
    button.disabled = false;
    button.textContent = "Launch";
  }
});

saveBtn.addEventListener("click", async () => {
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  try {
    const { workspace } = await api.saveSession(workspaceNameInput.value);
    toast.show(`"${workspace.name}" saved!`);
    setTimeout(() => window.close(), 800);
  } catch (error) {
    toast.show(error.message || "Save failed", true);
    saveBtn.disabled = false;
    saveBtn.innerHTML = saveBtnDefaultHtml;
  }
});

manageBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

workspaceNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") saveBtn.click();
});

updateTabCount();
loadWorkspaces();
