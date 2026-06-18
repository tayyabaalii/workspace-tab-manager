import {
  STORAGE_KEYS,
  DEFAULT_STATS,
  MAX_WORKSPACE_NAME_LENGTH,
} from "./constants.js";

function normalizeWorkspace(workspace) {
  return {
    ...workspace,
    tabsCount: workspace.tabs?.length ?? 0,
  };
}

function sortWorkspaces(workspaces) {
  return Object.values(workspaces)
    .map(normalizeWorkspace)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAllData() {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.workspaces,
    STORAGE_KEYS.stats,
  ]);

  return {
    workspaces: result[STORAGE_KEYS.workspaces] || {},
    stats: { ...DEFAULT_STATS, ...(result[STORAGE_KEYS.stats] || {}) },
  };
}

export async function getSortedWorkspaces() {
  const { workspaces } = await getAllData();
  return sortWorkspaces(workspaces);
}

export async function getWorkspace(id) {
  const { workspaces } = await getAllData();
  const workspace = workspaces[id];
  return workspace ? normalizeWorkspace(workspace) : null;
}

export async function saveWorkspace(workspace) {
  const { workspaces, stats } = await getAllData();
  const normalized = normalizeWorkspace(workspace);
  workspaces[normalized.id] = normalized;

  await chrome.storage.local.set({
    [STORAGE_KEYS.workspaces]: workspaces,
    [STORAGE_KEYS.stats]: {
      ...stats,
      totalTabsSuspended: stats.totalTabsSuspended + normalized.tabs.length,
      totalWorkspacesSaved: stats.totalWorkspacesSaved + 1,
    },
  });

  return normalized;
}

export async function updateWorkspace(id, updates) {
  const { workspaces } = await getAllData();
  const existing = workspaces[id];
  if (!existing) return null;

  const updated = normalizeWorkspace({ ...existing, ...updates });
  workspaces[id] = updated;
  await chrome.storage.local.set({ [STORAGE_KEYS.workspaces]: workspaces });
  return updated;
}

export async function deleteWorkspace(id) {
  const { workspaces } = await getAllData();
  if (!workspaces[id]) return false;

  delete workspaces[id];
  await chrome.storage.local.set({ [STORAGE_KEYS.workspaces]: workspaces });
  return true;
}

export async function removeTabFromWorkspace(workspaceId, tabIndex) {
  const { workspaces } = await getAllData();
  const workspace = workspaces[workspaceId];
  if (!workspace) return null;

  const tabs = [...workspace.tabs];
  if (tabIndex < 0 || tabIndex >= tabs.length) {
    throw new Error("Tab not found in workspace.");
  }

  tabs.splice(tabIndex, 1);

  if (tabs.length === 0) {
    delete workspaces[workspaceId];
    await chrome.storage.local.set({ [STORAGE_KEYS.workspaces]: workspaces });
    return null;
  }

  const updated = normalizeWorkspace({ ...workspace, tabs });
  workspaces[workspaceId] = updated;
  await chrome.storage.local.set({ [STORAGE_KEYS.workspaces]: workspaces });
  return updated;
}

export async function getStats() {
  const { stats, workspaces } = await getAllData();
  const savedTabCount = sortWorkspaces(workspaces).reduce(
    (sum, workspace) => sum + workspace.tabsCount,
    0
  );

  return {
    ...stats,
    savedTabCount,
    workspaceCount: Object.keys(workspaces).length,
  };
}

export function generateWorkspaceId() {
  return `ws_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function sanitizeWorkspaceName(name) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) {
    throw new Error("Workspace name cannot be empty.");
  }
  if (trimmed.length > MAX_WORKSPACE_NAME_LENGTH) {
    throw new Error(
      `Workspace name must be ${MAX_WORKSPACE_NAME_LENGTH} characters or fewer.`
    );
  }
  return trimmed;
}

export function defaultWorkspaceName() {
  return `Workspace ${new Date().toLocaleDateString()}`;
}

export function quickSaveWorkspaceName() {
  return `Quick Save ${new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
