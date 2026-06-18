import { api } from "../utils/messaging.js";
import {
  createToastController,
  escapeHtml,
  bindDelegatedClick,
} from "../utils/dom.js";
import { formatDate, formatRam, formatTabCount } from "../utils/format.js";
import { AVG_RAM_PER_TAB_MB } from "../utils/constants.js";

const workspaceGrid = document.getElementById("workspaceGrid");
const statWorkspaces = document.getElementById("statWorkspaces");
const statTabs = document.getElementById("statTabs");
const statRam = document.getElementById("statRam");
const toast = createToastController(document.getElementById("toast"), 2800);

function faviconHtml(favIconUrl) {
  if (!favIconUrl) {
    return '<div class="tab-favicon placeholder"></div>';
  }

  return `<img class="tab-favicon" src="${escapeHtml(favIconUrl)}" alt="" loading="lazy" onerror="this.classList.add('placeholder');this.removeAttribute('src')" />`;
}

function renderTabList(workspace) {
  if (!workspace.tabs.length) {
    return '<p class="empty-tabs">No tabs in this workspace.</p>';
  }

  return `<ul class="tab-list">${workspace.tabs
    .map(
      (tab, index) => `
        <li class="tab-item">
          ${faviconHtml(tab.favIconUrl)}
          <div class="tab-details">
            <div class="tab-title">${escapeHtml(tab.title)}</div>
            <div class="tab-url">${escapeHtml(tab.url)}</div>
          </div>
          <button
            class="btn-remove-tab"
            data-workspace-id="${escapeHtml(workspace.id)}"
            data-tab-index="${index}"
          >
            Remove
          </button>
        </li>
      `
    )
    .join("")}</ul>`;
}

function renderWorkspaceCard(workspace) {
  return `
    <article class="workspace-card" data-id="${escapeHtml(workspace.id)}">
      <div class="card-header">
        <div class="card-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          </svg>
        </div>
        <div class="card-info">
          <div class="card-name">${escapeHtml(workspace.name)}</div>
          <div class="card-meta">
            ${formatTabCount(workspace.tabsCount)} · ${formatDate(workspace.createdAt, { includeYear: true })}
          </div>
        </div>
        <div class="card-actions">
          <button class="btn-launch-card" data-id="${escapeHtml(workspace.id)}">Launch</button>
          <button class="btn-icon danger btn-delete" data-id="${escapeHtml(workspace.id)}" title="Delete workspace" aria-label="Delete workspace">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
        <svg class="expand-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="card-body">
        <div class="rename-row">
          <input
            class="rename-input"
            type="text"
            value="${escapeHtml(workspace.name)}"
            maxlength="80"
            data-id="${escapeHtml(workspace.id)}"
            aria-label="Workspace name"
          />
          <button class="btn-sm primary btn-rename" data-id="${escapeHtml(workspace.id)}">Rename</button>
        </div>
        ${renderTabList(workspace)}
      </div>
    </article>
  `;
}

function renderEmptyState() {
  return `
    <div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
      <p>No workspaces saved yet.</p>
      <p class="empty-hint">Use the extension popup to save your first session.</p>
    </div>
  `;
}

function bindCardHeaderToggle() {
  bindDelegatedClick(workspaceGrid, ".card-header", (event, header) => {
    if (event.target.closest(".btn-launch-card, .btn-delete, .btn-icon")) return;
    header.closest(".workspace-card").classList.toggle("expanded");
  });
}

bindDelegatedClick(workspaceGrid, ".btn-launch-card", async (_event, button) => {
  button.disabled = true;
  button.textContent = "Launching…";

  try {
    await api.restoreWorkspace(button.dataset.id);
    toast.show("Workspace launched in a new window!");
  } catch (error) {
    toast.show(error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = "Launch";
  }
});

bindDelegatedClick(workspaceGrid, ".btn-delete", async (event, button) => {
  event.stopPropagation();
  if (!confirm("Delete this workspace permanently?")) return;

  try {
    await api.deleteWorkspace(button.dataset.id);
    toast.show("Workspace deleted.");
    await loadDashboard();
  } catch (error) {
    toast.show(error.message, true);
  }
});

async function renameWorkspace(button) {
  const input = workspaceGrid.querySelector(
    `.rename-input[data-id="${button.dataset.id}"]`
  );
  const name = input.value.trim();
  if (!name) {
    toast.show("Workspace name cannot be empty.", true);
    return;
  }

  await api.renameWorkspace(button.dataset.id, name);
  toast.show("Workspace renamed.");
  await loadDashboard();
}

bindDelegatedClick(workspaceGrid, ".btn-rename", async (event, button) => {
  event.stopPropagation();
  try {
    await renameWorkspace(button);
  } catch (error) {
    toast.show(error.message, true);
  }
});

workspaceGrid.addEventListener("keydown", (event) => {
  const input = event.target.closest(".rename-input");
  if (!input || event.key !== "Enter") return;

  event.preventDefault();
  workspaceGrid
    .querySelector(`.btn-rename[data-id="${input.dataset.id}"]`)
    ?.click();
});

bindDelegatedClick(workspaceGrid, ".btn-remove-tab", async (event, button) => {
  event.stopPropagation();

  try {
    await api.removeTab(button.dataset.workspaceId, Number(button.dataset.tabIndex));
    toast.show("Tab removed.");
    await loadDashboard();
  } catch (error) {
    toast.show(error.message, true);
  }
});

async function loadDashboard() {
  const [{ workspaces }, { stats }] = await Promise.all([
    api.getWorkspaces(),
    api.getStats(),
  ]);

  statWorkspaces.textContent = stats.workspaceCount;
  statTabs.textContent = stats.savedTabCount;
  statRam.textContent = formatRam(stats.savedTabCount * AVG_RAM_PER_TAB_MB);

  workspaceGrid.innerHTML = workspaces.length
    ? workspaces.map(renderWorkspaceCard).join("")
    : renderEmptyState();

  bindCardHeaderToggle();
}

loadDashboard();
