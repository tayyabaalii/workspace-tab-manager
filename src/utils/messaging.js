import { ACTIONS } from "./constants.js";

export function sendMessage(action, data = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action, ...data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response) {
        reject(new Error("No response from extension background."));
        return;
      }

      if (response.success === false) {
        reject(new Error(response.error || "Request failed"));
        return;
      }

      resolve(response);
    });
  });
}

export const api = {
  saveSession: (name) => sendMessage(ACTIONS.saveSession, { name }),
  getWorkspaces: () => sendMessage(ACTIONS.getWorkspaces),
  restoreWorkspace: (id) => sendMessage(ACTIONS.restoreWorkspace, { id }),
  renameWorkspace: (id, name) => sendMessage(ACTIONS.renameWorkspace, { id, name }),
  deleteWorkspace: (id) => sendMessage(ACTIONS.deleteWorkspace, { id }),
  removeTab: (workspaceId, tabIndex) =>
    sendMessage(ACTIONS.removeTab, { workspaceId, tabIndex }),
  getStats: () => sendMessage(ACTIONS.getStats),
};
