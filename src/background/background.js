import { ACTIONS, COMMANDS } from "../utils/constants.js";
import {
  getSortedWorkspaces,
  getWorkspace,
  deleteWorkspace,
  removeTabFromWorkspace,
  getStats,
  quickSaveWorkspaceName,
} from "../utils/storage.js";
import {
  saveCurrentSession,
  restoreTabsInNewWindow,
  renameWorkspaceSession,
} from "../utils/tabs.js";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((error) => {
      sendResponse({ success: false, error: error.message });
    });

  return true;
});

async function handleMessage(message) {
  if (!message?.action) {
    throw new Error("Missing message action.");
  }

  switch (message.action) {
    case ACTIONS.saveSession:
      return {
        success: true,
        workspace: await saveCurrentSession(message.name),
      };

    case ACTIONS.getWorkspaces:
      return {
        success: true,
        workspaces: await getSortedWorkspaces(),
      };

    case ACTIONS.restoreWorkspace: {
      if (!message.id) throw new Error("Workspace id is required.");
      const workspace = await getWorkspace(message.id);
      if (!workspace) throw new Error("Workspace not found.");
      const window = await restoreTabsInNewWindow(workspace.tabs);
      return { success: true, windowId: window.id };
    }

    case ACTIONS.renameWorkspace: {
      if (!message.id) throw new Error("Workspace id is required.");
      const workspace = await renameWorkspaceSession(message.id, message.name);
      return { success: true, workspace };
    }

    case ACTIONS.deleteWorkspace: {
      if (!message.id) throw new Error("Workspace id is required.");
      const deleted = await deleteWorkspace(message.id);
      if (!deleted) throw new Error("Workspace not found.");
      return { success: true };
    }

    case ACTIONS.removeTab: {
      if (!message.workspaceId) throw new Error("Workspace id is required.");
      const tabIndex = Number(message.tabIndex);
      if (!Number.isInteger(tabIndex)) {
        throw new Error("Tab index must be an integer.");
      }
      const workspace = await removeTabFromWorkspace(message.workspaceId, tabIndex);
      return { success: true, workspace };
    }

    case ACTIONS.getStats:
      return {
        success: true,
        stats: await getStats(),
      };

    default:
      throw new Error(`Unknown action: ${message.action}`);
  }
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== COMMANDS.saveWorkspace) return;

  try {
    await saveCurrentSession(quickSaveWorkspaceName());
  } catch (error) {
    console.error("Quick save failed:", error.message);
  }
});
