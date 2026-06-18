export const STORAGE_KEYS = {
  workspaces: "workspaces",
  stats: "stats",
};

export const DEFAULT_STATS = {
  totalTabsSuspended: 0,
  totalWorkspacesSaved: 0,
};

export const RESTRICTED_URL_PREFIXES = [
  "chrome://",
  "chrome-extension://",
  "edge://",
  "about:",
  "devtools://",
  "view-source:",
  "chrome-search://",
  "chrome-devtools://",
];

export const ACTIVE_RESTORE_COUNT = 3;
export const AVG_RAM_PER_TAB_MB = 70;
export const MAX_WORKSPACE_NAME_LENGTH = 80;
export const POPUP_RECENT_LIMIT = 8;

export const ACTIONS = {
  saveSession: "saveSession",
  getWorkspaces: "getWorkspaces",
  restoreWorkspace: "restoreWorkspace",
  renameWorkspace: "renameWorkspace",
  deleteWorkspace: "deleteWorkspace",
  removeTab: "removeTab",
  getStats: "getStats",
};

export const COMMANDS = {
  saveWorkspace: "save-workspace",
};
