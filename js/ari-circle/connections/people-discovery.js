// js/ari-circle/connections/people-discovery.js
// ARI Circle
// V1.1.0
//
// Purpose:
// - Own the Discover Friends dialog.
// - Show 20 random eligible ARI Circle users at a time.
// - Search by display name or @handle.
// - Send Circle requests without querying Supabase directly.
// - Let a just-sent request be canceled from the same discovery card.
//
// Eligibility is enforced server-side by ari_circle_discover_people():
// - excludes the signed-in user
// - excludes any existing connection/request/block relationship

import CircleStore from "../core/circle-store.js";
import CircleEvents, { EVENT_NAMES } from "../core/circle-events.js";
import ConnectionRequests from "./connection-requests.js?v=1.1.0";

const VERSION = "1.1.0";
const SOURCE = "ari-circle/connections/people-discovery";
const DISCOVERY_LIMIT = 20;

function clean(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function normalizeHandle(value) {
  return clean(value)?.replace(/^@+/, "").trim().toLowerCase() || null;
}

function detailOf(payload) {
  return payload?.detail && typeof payload.detail === "object"
    ? payload.detail
    : payload && typeof payload === "object"
      ? payload
      : {};
}

function createRequestId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeProfile(row) {
  if (!row || typeof row !== "object") return null;
  const userId = clean(row.user_id || row.userId || row.id);
  if (!userId) return null;
  return {
    userId,
    displayName: clean(row.display_name || row.displayName || row.name) || "ARI Circle User",
    handle: normalizeHandle(row.handle),
    bio: clean(row.bio),
    avatarUrl: clean(row.avatar_url || row.avatarUrl)
  };
}

function initials(user) {
  const words = clean(user?.displayName)?.split(/\s+/).filter(Boolean) || [];
  if (words.length > 1) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return user?.handle?.charAt(0)?.toUpperCase() || "A";
}

const PeopleDiscovery = {
  version: VERSION,
  source: SOURCE,

  state: {
    initialized: false,
    loading: false,
    query: "",
    activeRequestId: null,
    users: [],
    requestedUserIds: new Set(),
    pendingUserIds: new Set(),
    requestIdsByUserId: new Map(),
    unsubscribers: []
  },

  dom: {
    dialog: null,
    form: null,
    input: null,
    status: null,
    list: null,
    empty: null,
    refresh: null,
    template: null
  },

  init() {
    if (this.state.initialized) return this.getDiagnostics();
    this.cacheDom();
    this.bindActions();
    this.bindForm();
    this.bindEvents();
    this.state.initialized = true;
    return this.getDiagnostics();
  },

  cacheDom() {
    this.dom.dialog = document.getElementById("circle-people-discovery");
    this.dom.form = document.getElementById("circle-friend-search-form");
    this.dom.input = document.getElementById("circle-friend-search-input");
    this.dom.status = document.getElementById("circle-discovery-status");
    this.dom.list = document.getElementById("circle-discovery-list");
    this.dom.empty = document.getElementById("circle-discovery-empty");
    this.dom.refresh = document.getElementById("circle-discovery-refresh-button");
    this.dom.template = document.getElementById("circle-discovery-user-template");
  },

  bindActions() {
    this.state.unsubscribers.push(
      CircleEvents.onAction("find-friends", () => this.open()),
      CircleEvents.onAction("close-people-discovery", () => this.close()),
      CircleEvents.onAction("refresh-people-discovery", () => this.load(this.state.query)),
      CircleEvents.onAction("open-discovery-profile", payload => this.openProfile(payload?.trigger)),
      CircleEvents.onAction("add-discovery-friend", payload => this.toggleFriendRequest(payload?.trigger))
    );
  },

  bindForm() {
    this.dom.form?.addEventListener("submit", event => {
      event.preventDefault();
      this.load(this.dom.input?.value || "");
    });
  },

  bindEvents() {
    const on = (eventName, handler) => {
      this.state.unsubscribers.push(
        CircleEvents.on(eventName, payload => handler.call(this, detailOf(payload)))
      );
    };

    on(EVENT_NAMES.PEOPLE_DISCOVERY_RESULTS, this.handleResults);
    on(EVENT_NAMES.PEOPLE_DISCOVERY_REQUEST_SAVED, this.handleRequestSaved);
    on(EVENT_NAMES.CONNECTION_CHANGED, this.handleConnectionChanged);
  },

  canUse() {
    const context = CircleStore.get("context");
    return Boolean(context?.isAuthenticated && context?.viewerUserId);
  },

  open() {
    if (!this.canUse()) {
      CircleEvents.showToast("Sign in to find friends.");
      return false;
    }
    if (!this.dom.dialog) return false;

    try {
      if (typeof this.dom.dialog.showModal === "function" && !this.dom.dialog.open) {
        this.dom.dialog.showModal();
      } else {
        this.dom.dialog.setAttribute("open", "");
      }
    } catch {
      this.dom.dialog.setAttribute("open", "");
    }

    this.state.query = "";
    if (this.dom.input) this.dom.input.value = "";
    this.load("");
    return true;
  },

  close() {
    if (!this.dom.dialog) return false;
    try {
      this.dom.dialog.close?.();
    } catch {
      this.dom.dialog.removeAttribute("open");
    }
    return true;
  },

  load(query = "") {
    if (this.state.loading || !this.canUse()) return false;

    const normalizedQuery = clean(query) || "";
    const requestId = createRequestId("discover");
    this.state.loading = true;
    this.state.query = normalizedQuery;
    this.state.activeRequestId = requestId;
    this.setStatus(normalizedQuery ? `Searching for "${normalizedQuery}"...` : "Finding 20 people...");
    if (this.dom.refresh) this.dom.refresh.disabled = true;

    CircleEvents.emit(EVENT_NAMES.PEOPLE_DISCOVERY_QUERY, {
      requestId,
      query: normalizedQuery,
      limit: DISCOVERY_LIMIT
    });
    return true;
  },

  handleResults(detail) {
    const requestId = clean(detail?.requestId);
    if (requestId && this.state.activeRequestId && requestId !== this.state.activeRequestId) return;

    this.state.loading = false;
    this.state.activeRequestId = null;
    if (this.dom.refresh) this.dom.refresh.disabled = false;

    if (detail?.error) {
      this.state.users = [];
      this.render();
      this.setStatus(clean(detail.error) || "Could not load people.");
      return;
    }

    this.state.users = (Array.isArray(detail?.users) ? detail.users : [])
      .map(normalizeProfile)
      .filter(Boolean);
    this.render();

    if (!this.state.users.length) {
      this.setStatus(this.state.query ? "No matching users found." : "No new people are available right now.");
      return;
    }

    this.setStatus(
      this.state.query
        ? `${this.state.users.length} result${this.state.users.length === 1 ? "" : "s"} found.`
        : `Showing ${this.state.users.length} people.`
    );
  },

  render() {
    if (!this.dom.list) return;
    this.dom.list.replaceChildren();
    if (this.dom.empty) this.dom.empty.hidden = this.state.users.length > 0;
    for (const user of this.state.users) {
      const node = this.createUserNode(user);
      if (node) this.dom.list.appendChild(node);
    }
  },

  createUserNode(user) {
    if (!this.dom.template?.content) return null;
    const fragment = this.dom.template.content.cloneNode(true);
    const article = fragment.querySelector(".circle-discovery-user");
    const avatar = fragment.querySelector(".circle-discovery-user__avatar");
    const fallback = fragment.querySelector(".circle-discovery-user__avatar-fallback");
    const name = fragment.querySelector(".circle-discovery-user__name");
    const handle = fragment.querySelector(".circle-discovery-user__handle");
    const bio = fragment.querySelector(".circle-discovery-user__bio");
    const add = fragment.querySelector(".circle-discovery-user__add");

    article?.setAttribute("data-user-id", user.userId);
    fragment.querySelectorAll("[data-circle-action]").forEach(element => {
      element.dataset.userId = user.userId;
    });

    if (avatar && user.avatarUrl) {
      avatar.src = user.avatarUrl;
      avatar.alt = `${user.displayName} profile photo`;
      avatar.hidden = false;
      if (fallback) fallback.hidden = true;
    } else if (fallback) {
      fallback.textContent = initials(user);
      fallback.hidden = false;
    }

    if (name) name.textContent = user.displayName;
    if (handle) handle.textContent = user.handle ? `@${user.handle}` : "";
    if (bio && user.bio) {
      bio.textContent = user.bio;
      bio.hidden = false;
    }

    const requested = this.state.requestedUserIds.has(user.userId);
    const pending = this.state.pendingUserIds.has(user.userId);

    if (add) {
      if (requested) {
        add.textContent = "Requested ✓";
        add.disabled = false;
        add.dataset.requestState = "outgoing_pending";
        add.setAttribute("aria-label", `Cancel Circle request to ${user.displayName}`);
      } else if (pending) {
        add.textContent = "Sending...";
        add.disabled = true;
        add.dataset.requestState = "saving";
      } else {
        add.textContent = "Add to Circle";
        add.disabled = false;
        delete add.dataset.requestState;
        add.setAttribute("aria-label", `Add ${user.displayName} to your Circle`);
      }
    }

    return fragment;
  },

  openProfile(trigger) {
    const userId = clean(trigger?.dataset?.userId);
    if (!userId) return false;
    globalThis.location.assign(`ari-circle.html?user=${encodeURIComponent(userId)}`);
    return true;
  },

  toggleFriendRequest(trigger) {
    const targetUserId = clean(trigger?.dataset?.userId);
    if (!targetUserId) return false;
    if (this.state.requestedUserIds.has(targetUserId)) {
      return this.cancelFriendRequest(targetUserId);
    }
    return this.addFriend(targetUserId);
  },

  addFriend(targetUserId) {
    const id = clean(targetUserId);
    if (!id || this.state.pendingUserIds.has(id) || this.state.requestedUserIds.has(id)) return false;

    this.state.pendingUserIds.add(id);
    this.render();
    CircleEvents.emit(EVENT_NAMES.PEOPLE_DISCOVERY_REQUESTED, {
      localRequestId: createRequestId("friend"),
      targetUserId: id,
      persist: true
    });
    return true;
  },

  async cancelFriendRequest(targetUserId) {
    const id = clean(targetUserId);
    if (!id) return false;

    const user = this.state.users.find(item => item.userId === id);
    const requestId = this.state.requestIdsByUserId.get(id)
      || ConnectionRequests.getRequestForUser?.(id)?.request?.id
      || null;

    if (!requestId) {
      CircleEvents.showToast("That Circle request is still syncing. Try again in a moment.");
      return false;
    }

    const label = user?.displayName || "this person";
    const confirmed = typeof globalThis.confirm === "function"
      ? globalThis.confirm(`Cancel your Circle request to ${label}?`)
      : true;
    if (!confirmed) return false;

    const canceled = await ConnectionRequests.cancel(requestId);
    if (!canceled) return false;

    this.state.requestedUserIds.delete(id);
    this.state.pendingUserIds.delete(id);
    this.state.requestIdsByUserId.delete(id);
    this.render();
    return true;
  },

  handleRequestSaved(detail) {
    const targetUserId = clean(detail?.targetUserId);
    if (!targetUserId) return;

    this.state.pendingUserIds.delete(targetUserId);

    if (detail?.success) {
      const saved = detail?.connection && typeof detail.connection === "object"
        ? detail.connection
        : null;
      const requestId = clean(saved?.id || saved?.request_id || saved?.requestId);

      if (saved) ConnectionRequests.addOutgoingRequest?.(saved);
      if (requestId) this.state.requestIdsByUserId.set(targetUserId, requestId);
      this.state.requestedUserIds.add(targetUserId);
      CircleEvents.showToast("Circle request sent.");
    } else {
      CircleEvents.showToast(clean(detail?.error) || "Could not send Circle request.");
    }

    this.render();
  },

  handleConnectionChanged(detail) {
    if (clean(detail?.action)?.toLowerCase() !== "cancel-request") return;
    const targetUserId = clean(
      detail?.request?.receiverUserId
      || detail?.request?.receiver_user_id
      || detail?.request?.addressee_user_id
      || detail?.connection?.targetUserId
      || detail?.targetUserId
    );
    if (!targetUserId) return;

    this.state.requestedUserIds.delete(targetUserId);
    this.state.pendingUserIds.delete(targetUserId);
    this.state.requestIdsByUserId.delete(targetUserId);
    this.render();
  },

  setStatus(message) {
    if (this.dom.status) this.dom.status.textContent = clean(message) || "";
  },

  destroy() {
    for (const unsubscribe of this.state.unsubscribers) {
      try { unsubscribe?.(); } catch { /* best effort */ }
    }
    this.state.unsubscribers = [];
    this.state.users = [];
    this.state.pendingUserIds.clear();
    this.state.requestedUserIds.clear();
    this.state.requestIdsByUserId.clear();
    this.state.initialized = false;
  },

  getDiagnostics() {
    return {
      ready: this.state.initialized,
      source: this.source,
      version: this.version,
      loading: this.state.loading,
      query: this.state.query,
      visibleUsers: this.state.users.length,
      requestedUsers: this.state.requestedUserIds.size
    };
  }
};

export { PeopleDiscovery, DISCOVERY_LIMIT };
export default PeopleDiscovery;
