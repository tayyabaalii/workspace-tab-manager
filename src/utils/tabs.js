import { ACTIVE_RESTORE_COUNT } from "./constants.js";
import {
  generateWorkspaceId,
  saveWorkspace,
  defaultWorkspaceName,
  sanitizeWorkspaceName,
  updateWorkspace,
} from "./storage.js";
import { isRestrictedUrl } from "./urls.js";

export async function getCurrentWindowTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  return tabs.filter((tab) => !isRestrictedUrl(tab.url));
}

export function serializeTabs(tabs) {
  return tabs.map((tab) => ({
    title: tab.title || "Untitled",
    url: tab.url,
    favIconUrl: tab.favIconUrl || "",
  }));
}

export async function nukeCurrentTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const newTab = await chrome.tabs.create({
    url: "chrome://newtab/",
    active: true,
  });

  const idsToRemove = tabs
    .map((tab) => tab.id)
    .filter((id) => id !== newTab.id);

  if (idsToRemove.length > 0) {
    await chrome.tabs.remove(idsToRemove);
  }
}

export async function restoreTabsInNewWindow(tabs) {
  const urls = tabs
    .map((tab) => tab.url)
    .filter((url) => !isRestrictedUrl(url));

  if (urls.length === 0) {
    throw new Error("No restorable tabs in this workspace.");
  }

  const window = await chrome.windows.create({ url: urls[0], focused: true });

  for (let i = 1; i < urls.length; i++) {
    await chrome.tabs.create({
      windowId: window.id,
      url: urls[i],
      active: i < ACTIVE_RESTORE_COUNT,
    });
  }

  return window;
}

export async function saveCurrentSession(name) {
  const tabs = await getCurrentWindowTabs();
  if (tabs.length === 0) {
    throw new Error("No savable tabs in the current window.");
  }

  const workspaceName = (() => {
    const trimmed = String(name ?? "").trim();
    return trimmed || defaultWorkspaceName();
  })();

  sanitizeWorkspaceName(workspaceName);

  const workspace = {
    id: generateWorkspaceId(),
    name: workspaceName,
    createdAt: Date.now(),
    tabs: serializeTabs(tabs),
  };

  await saveWorkspace(workspace);
  await nukeCurrentTabs();

  return workspace;
}

export async function renameWorkspaceSession(id, name) {
  const nextName = sanitizeWorkspaceName(name);
  const workspace = await updateWorkspace(id, { name: nextName });
  if (!workspace) {
    throw new Error("Workspace not found.");
  }
  return workspace;
}
