// js/ari-circle/messaging/messages-controller.js
// ARI Circle
// V2.0.0
//
// Single routing authority for messaging entry points inside ari-circle.html.
// ARI Messages is the ONLY direct-message UI.
//
// Header Messages -> ari-circle-messages.html
// Visitor Profile Message -> ari-circle-messages.html?user=<id>
//
// This controller no longer opens the legacy in-page conversation system,
// does not create local conversation shells, and does not open a separate
// message-request composer. The canonical Messages page decides whether an
// existing conversation should open or a new direct conversation should be
// created.

import CircleStore from "../core/circle-store.js";
import CircleEvents from "../core/circle-events.js";

const VERSION = "2.0.0";
const SOURCE = "ari-circle/messaging/messages-controller";

const MESSAGE_ACCESS = Object.freeze({
  DIRECT: "direct",
  REQUEST: "request",
  CIRCLE_ONLY: "circle_only",
  NOBODY: "nobody"
});

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function profileUserId(profile) {
  return clean(
    profile?.user_id ||
    profile?.userId ||
    profile?.id ||
    ""
  );
}

function connectionStatus(connection) {
  return clean(connection?.status || "none").toLowerCase() || "none";
}

function clampUnreadCount(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return Math.min(Math.floor(number), 999);
}

function messagesUrl(userId = "") {
  const id = clean(userId);
  return id
    ? `ari-circle-messages.html?user=${encodeURIComponent(id)}`
    : "ari-circle-messages.html";
}

const MessagesController = {
  version: VERSION,
  source: SOURCE,

  state: {
    initialized: false,
    navigating: false,
    unsubscribers: []
  },

  dom: {
    inboxButton: null,
    profileMessageButton: null,
    unreadBadge: null
  },

  init() {
    if (this.state.initialized) return this.getDiagnostics();
    this.cacheDom();
    this.bindActions();
    this.bindStore();
    this.render(CircleStore.getState());
    this.state.initialized = true;
    return this.getDiagnostics();
  },

  cacheDom() {
    this.dom.inboxButton = document.getElementById("circle-messages-button");
    this.dom.profileMessageButton = document.getElementById("circle-message-action");
    this.dom.unreadBadge = document.getElementById("circle-message-badge");
  },

  bindActions() {
    this.state.unsubscribers.push(
      CircleEvents.onAction("open-messages", () => this.openInbox())
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction("message", () => this.startProfileMessage())
    );
  },

  bindStore() {
    const unsubscribe = CircleStore.subscribe((state, change) => {
      const keys = Array.isArray(change?.keys) ? change.keys : [];
      if (
        !keys.length ||
        keys.includes("messaging") ||
        keys.includes("context") ||
        keys.includes("profile") ||
        keys.includes("connection")
      ) {
        this.render(state);
      }
    });
    this.state.unsubscribers.push(unsubscribe);
  },

  render(state) {
    this.renderUnreadBadge(state?.messaging?.unreadCount);
    this.renderProfileMessageAction({
      context: state?.context,
      profile: state?.profile,
      connection: state?.connection
    });
  },

  renderUnreadBadge(value) {
    const count = clampUnreadCount(value);
    const badge = this.dom.unreadBadge;
    const button = this.dom.inboxButton;
    if (!badge) return;

    if (!count) {
      badge.hidden = true;
      badge.textContent = "";
      button?.setAttribute("aria-label", "Messages");
      return;
    }

    badge.hidden = false;
    badge.textContent = count > 99 ? "99+" : String(count);
    button?.setAttribute("aria-label", `Messages, ${count} unread`);
  },

  renderProfileMessageAction({ context, profile, connection }) {
    const button = this.dom.profileMessageButton;
    if (!button) return;

    const targetUserId = profileUserId(profile);
    const status = connectionStatus(connection);

    if (context?.isGuest || !context?.isAuthenticated) {
      button.disabled = true;
      button.textContent = "Sign in to Message";
      return;
    }

    if (context?.isOwner) {
      button.disabled = true;
      button.textContent = "Message";
      return;
    }

    if (!targetUserId || status === "blocked") {
      button.disabled = true;
      button.textContent = "Message";
      return;
    }

    const rawAccess = clean(
      profile?.messaging_visibility ||
      profile?.messagingVisibility ||
      profile?.message_access ||
      profile?.messageAccess ||
      profile?.privacy?.messaging ||
      "request"
    ).toLowerCase();

    // A recipient may explicitly disable all DMs. Otherwise ARI Messages is
    // reachable even when the users are not friends; safety/block controls
    // are handled by the canonical messaging backend and profile controls.
    if (rawAccess === MESSAGE_ACCESS.NOBODY) {
      button.disabled = true;
      button.textContent = "Messages Off";
      return;
    }

    button.disabled = this.state.navigating;
    button.textContent = "Message";
    button.dataset.messagesDestination = messagesUrl(targetUserId);
  },

  navigate(url) {
    if (this.state.navigating) return false;
    this.state.navigating = true;
    window.location.assign(url);
    return true;
  },

  openInbox() {
    const context = CircleStore.get("context");
    if (!context?.isAuthenticated) {
      CircleEvents.showToast("Sign in to open your messages.");
      return false;
    }
    return this.navigate(messagesUrl());
  },

  startProfileMessage() {
    const state = CircleStore.getState();
    const context = state?.context;
    const profile = state?.profile;
    const connection = state?.connection || {};

    if (!context?.isAuthenticated) {
      CircleEvents.showToast("Sign in to send messages.");
      return false;
    }

    if (context?.isOwner) return false;

    const targetUserId = profileUserId(profile);
    if (!targetUserId) {
      CircleEvents.showToast("This profile is still loading.");
      return false;
    }

    if (connectionStatus(connection) === "blocked") {
      CircleEvents.showToast("Messaging is unavailable for this profile.");
      return false;
    }

    const rawAccess = clean(
      profile?.messaging_visibility ||
      profile?.messagingVisibility ||
      profile?.message_access ||
      profile?.messageAccess ||
      profile?.privacy?.messaging ||
      "request"
    ).toLowerCase();

    if (rawAccess === MESSAGE_ACCESS.NOBODY) {
      CircleEvents.showToast("This person is not accepting messages.");
      return false;
    }

    return this.navigate(messagesUrl(targetUserId));
  },

  setUnreadCount(value) {
    const count = clampUnreadCount(value);
    CircleStore.setMessagingState({ unreadCount: count });
    return count;
  },

  incrementUnreadCount(amount = 1) {
    const current = clampUnreadCount(CircleStore.get("messaging.unreadCount"));
    const delta = Number.isFinite(Number(amount))
      ? Math.max(0, Math.floor(Number(amount)))
      : 1;
    return this.setUnreadCount(current + delta);
  },

  decrementUnreadCount(amount = 1) {
    const current = clampUnreadCount(CircleStore.get("messaging.unreadCount"));
    const delta = Number.isFinite(Number(amount))
      ? Math.max(0, Math.floor(Number(amount)))
      : 1;
    return this.setUnreadCount(Math.max(0, current - delta));
  },

  handleIncomingMessage(message) {
    if (!message || typeof message !== "object") return false;
    this.incrementUnreadCount(1);
    return true;
  },

  destroy() {
    for (const unsubscribe of this.state.unsubscribers) {
      try { unsubscribe?.(); } catch {}
    }
    this.state.unsubscribers = [];
    this.state.initialized = false;
    this.state.navigating = false;
  },

  getDiagnostics() {
    return {
      ready: this.state.initialized,
      source: this.source,
      version: this.version,
      canonicalMessagesPage: "ari-circle-messages.html",
      inboxButtonFound: Boolean(this.dom.inboxButton),
      profileMessageButtonFound: Boolean(this.dom.profileMessageButton)
    };
  }
};

export { MessagesController, MESSAGE_ACCESS };
export default MessagesController;
