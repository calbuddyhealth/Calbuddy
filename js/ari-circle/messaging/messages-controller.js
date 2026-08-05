// js/ari-circle/messaging/messages-controller.js
// ARI Circle
// V1.0.1
//
// Purpose:
// - Own ARI Circle messaging entry points.
// - Handle the profile "Message" action.
// - Handle the header Messages button.
// - Render the unread-message badge from CircleStore.
// - Route messaging intent to conversations.js or message-requests.js.
// - Keep messaging permissions and UI state coordinated.
//
// V1.0.1:
// - Accepted Circle connections now resolve to DIRECT messaging unless
//   the profile explicitly has messaging disabled with "nobody".
// - Non-connections with "request" still use the message-request flow.
// - "circle_only" remains unavailable to non-connections.
// - "nobody" always disables messaging.
//
// This module does NOT:
// - Query or write to Supabase directly.
// - Store individual messages.
// - Render a full conversation thread.
// - Manage message request records.
// - Subscribe to realtime message channels.
//
// CircleStore remains the client-side state authority.

import CircleStore from "../core/circle-store.js";
import CircleEvents, {
  EVENT_NAMES
} from "../core/circle-events.js";

const VERSION = "1.0.1";
const SOURCE = "ari-circle/messaging/messages-controller";

const MESSAGE_ACCESS = Object.freeze({
  DIRECT: "direct",
  REQUEST: "request",
  CIRCLE_ONLY: "circle_only",
  NOBODY: "nobody"
});

const VALID_MESSAGE_ACCESS =
  new Set(
    Object.values(
      MESSAGE_ACCESS
    )
  );

function normalizeString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim();

  return normalized
    ? normalized
    : null;
}

function normalizeMessageAccess(value) {
  const normalized =
    normalizeString(value)
      ?.toLowerCase();

  if (
    normalized &&
    VALID_MESSAGE_ACCESS.has(
      normalized
    )
  ) {
    return normalized;
  }

  return MESSAGE_ACCESS.REQUEST;
}

function getProfileUserId(profile) {
  return normalizeString(
    profile?.user_id ||
    profile?.userId ||
    profile?.id
  );
}

function getDisplayName(profile) {
  return normalizeString(
    profile?.display_name ||
    profile?.displayName ||
    profile?.name
  ) || "this person";
}

function getConnectionStatus(connection) {
  return normalizeString(
    connection?.status
  ) || "none";
}

function clampUnreadCount(value) {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return 0;
  }

  return Math.min(
    Math.floor(number),
    999
  );
}

const MessagesController = {
  version: VERSION,
  source: SOURCE,

  state: {
    initialized: false,
    busy: false,
    unsubscribers: []
  },

  dom: {
    inboxButton: null,
    profileMessageButton: null,
    unreadBadge: null
  },

  init() {
    if (this.state.initialized) {
      return this.getDiagnostics();
    }

    this.cacheDom();
    this.bindActions();
    this.bindStore();

    this.render(
      CircleStore.getState()
    );

    this.state.initialized = true;

    return this.getDiagnostics();
  },

  cacheDom() {
    this.dom.inboxButton =
      document.getElementById(
        "circle-messages-button"
      );

    this.dom.profileMessageButton =
      document.getElementById(
        "circle-message-action"
      );

    this.dom.unreadBadge =
      document.getElementById(
        "circle-message-badge"
      );
  },

  bindActions() {
    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "open-messages",
        () => this.openInbox()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "message",
        () => this.startProfileMessage()
      )
    );
  },

  bindStore() {
    const unsubscribe =
      CircleStore.subscribe(
        (state, change) => {
          const keys =
            Array.isArray(change?.keys)
              ? change.keys
              : [];

          if (
            !keys.length ||
            keys.includes("messaging") ||
            keys.includes("context") ||
            keys.includes("profile") ||
            keys.includes("connection")
          ) {
            this.render(state);
          }
        }
      );

    this.state.unsubscribers.push(
      unsubscribe
    );
  },

  render(state) {
    this.renderUnreadBadge(
      state?.messaging?.unreadCount
    );

    this.renderProfileMessageAction({
      context: state?.context,
      profile: state?.profile,
      connection: state?.connection
    });
  },

  renderUnreadBadge(value) {
    const count =
      clampUnreadCount(value);

    if (!this.dom.unreadBadge) {
      return;
    }

    if (count <= 0) {
      this.dom.unreadBadge.hidden = true;
      this.dom.unreadBadge.textContent = "";

      this.dom.inboxButton
        ?.removeAttribute(
          "aria-label"
        );

      this.dom.inboxButton
        ?.setAttribute(
          "aria-label",
          "Messages"
        );

      return;
    }

    this.dom.unreadBadge.hidden = false;
    this.dom.unreadBadge.textContent =
      count > 99
        ? "99+"
        : String(count);

    this.dom.inboxButton
      ?.setAttribute(
        "aria-label",
        `Messages, ${count} unread`
      );
  },

  renderProfileMessageAction({
    context,
    profile,
    connection
  }) {
    const button =
      this.dom.profileMessageButton;

    if (!button) {
      return;
    }

    const profileUserId =
      getProfileUserId(profile);

    const connectionStatus =
      getConnectionStatus(connection);

    const access =
      this.resolveProfileMessageAccess(
        profile,
        connection
      );

    button.dataset.messageAccess = access;

    if (
      context?.isGuest ||
      !context?.isAuthenticated
    ) {
      button.disabled = true;
      button.textContent =
        "Sign in to Message";
      return;
    }

    if (context?.isOwner) {
      button.disabled = true;
      button.textContent = "Message";
      return;
    }

    if (!profileUserId) {
      button.disabled = true;
      button.textContent = "Message";
      return;
    }

    if (
      connectionStatus ===
      "blocked"
    ) {
      button.disabled = true;
      button.textContent = "Message";
      return;
    }

    if (
      access ===
      MESSAGE_ACCESS.NOBODY
    ) {
      button.disabled = true;
      button.textContent =
        "Messages Off";
      return;
    }

    if (
      access ===
        MESSAGE_ACCESS.CIRCLE_ONLY &&
      connectionStatus !==
        "connected"
    ) {
      button.disabled = true;
      button.textContent =
        "Circle Only";
      return;
    }

    button.disabled =
      this.state.busy;

    button.textContent =
      "Message";
  },

  resolveProfileMessageAccess(
    profile,
    connection
  ) {
    const rawAccess =
      profile?.messaging_visibility ||
      profile?.messagingVisibility ||
      profile?.message_access ||
      profile?.messageAccess ||
      profile?.privacy?.messaging;

    const access =
      normalizeMessageAccess(
        rawAccess
      );

    const connectionStatus =
      getConnectionStatus(
        connection
      );

    /*
     * V1.0.1:
     * Accepted Circle friends use direct messaging unless the recipient
     * explicitly disabled messaging entirely.
     *
     * This fixes accepted friends whose profile still has the default
     * "request" visibility being incorrectly sent through first-contact
     * message-request logic.
     */
    if (
      connectionStatus ===
        "connected" &&
      access !==
        MESSAGE_ACCESS.NOBODY
    ) {
      return MESSAGE_ACCESS.DIRECT;
    }

    return access;
  },

  openInbox() {
    const context =
      CircleStore.get(
        "context"
      );

    if (!context?.isAuthenticated) {
      CircleEvents.showToast(
        "Sign in to open your messages."
      );

      return false;
    }

    CircleEvents.emit(
      "circle:open-messages",
      {
        viewerUserId:
          context.viewerUserId
      }
    );

    return true;
  },

  startProfileMessage() {
    if (this.state.busy) {
      return false;
    }

    const state =
      CircleStore.getState();

    const context = state.context;
    const profile = state.profile;
    const connection =
      state.connection || {};

    if (!context?.isAuthenticated) {
      CircleEvents.showToast(
        "Sign in to send messages."
      );

      return false;
    }

    if (context?.isOwner) {
      return false;
    }

    const profileUserId =
      getProfileUserId(profile);

    if (!profileUserId) {
      CircleEvents.showToast(
        "This Circle profile is still loading."
      );

      return false;
    }

    if (
      getConnectionStatus(
        connection
      ) === "blocked"
    ) {
      CircleEvents.showToast(
        "Messaging is unavailable for this profile."
      );

      return false;
    }

    const access =
      this.resolveProfileMessageAccess(
        profile,
        connection
      );

    switch (access) {
      case MESSAGE_ACCESS.DIRECT:
        return this.openOrCreateConversation(
          profile
        );

      case MESSAGE_ACCESS.REQUEST:
        return this.openMessageRequestComposer(
          profile
        );

      case MESSAGE_ACCESS.CIRCLE_ONLY:
        CircleEvents.showToast(
          `${getDisplayName(profile)} only accepts messages from people in their Circle.`
        );
        return false;

      case MESSAGE_ACCESS.NOBODY:
        CircleEvents.showToast(
          `${getDisplayName(profile)} is not accepting messages.`
        );
        return false;

      default:
        return false;
    }
  },

  openOrCreateConversation(profile) {
    const context =
      CircleStore.get(
        "context"
      );

    const recipientUserId =
      getProfileUserId(profile);

    if (
      !context?.viewerUserId ||
      !recipientUserId
    ) {
      return false;
    }

    CircleEvents.emit(
      "circle:conversation-requested",
      {
        viewerUserId:
          context.viewerUserId,

        recipientUserId,

        profile
      }
    );

    return true;
  },

  openMessageRequestComposer(profile) {
    const context =
      CircleStore.get(
        "context"
      );

    const recipientUserId =
      getProfileUserId(profile);

    if (
      !context?.viewerUserId ||
      !recipientUserId
    ) {
      return false;
    }

    CircleEvents.emit(
      "circle:message-request-composer",
      {
        viewerUserId:
          context.viewerUserId,

        recipientUserId,

        profile
      }
    );

    return true;
  },

  setUnreadCount(value) {
    const count =
      clampUnreadCount(value);

    CircleStore.setMessagingState({
      unreadCount: count
    });

    return count;
  },

  incrementUnreadCount(amount = 1) {
    const current =
      clampUnreadCount(
        CircleStore.get(
          "messaging.unreadCount"
        )
      );

    const delta =
      Number.isFinite(
        Number(amount)
      )
        ? Math.max(
            0,
            Math.floor(
              Number(amount)
            )
          )
        : 1;

    return this.setUnreadCount(
      current + delta
    );
  },

  decrementUnreadCount(amount = 1) {
    const current =
      clampUnreadCount(
        CircleStore.get(
          "messaging.unreadCount"
        )
      );

    const delta =
      Number.isFinite(
        Number(amount)
      )
        ? Math.max(
            0,
            Math.floor(
              Number(amount)
            )
          )
        : 1;

    return this.setUnreadCount(
      Math.max(
        0,
        current - delta
      )
    );
  },

  handleIncomingMessage(message) {
    if (
      !message ||
      typeof message !== "object"
    ) {
      return false;
    }

    const activeConversationId =
      normalizeString(
        CircleStore.get(
          "messaging.activeConversationId"
        )
      );

    const messageConversationId =
      normalizeString(
        message.conversation_id ||
        message.conversationId
      );

    const isActiveConversation =
      Boolean(
        activeConversationId &&
        messageConversationId &&
        activeConversationId ===
          messageConversationId
      );

    if (!isActiveConversation) {
      this.incrementUnreadCount(1);
    }

    CircleEvents.emit(
      EVENT_NAMES.MESSAGE_RECEIVED,
      {
        message
      }
    );

    return true;
  },

  setActiveConversation(
    conversationId
  ) {
    const normalized =
      normalizeString(
        conversationId
      );

    CircleStore.setMessagingState({
      activeConversationId:
        normalized
    });

    return normalized;
  },

  clearActiveConversation() {
    CircleStore.setMessagingState({
      activeConversationId:
        null
    });
  },

  setBusy(value) {
    this.state.busy =
      Boolean(value);

    this.render(
      CircleStore.getState()
    );
  },

  destroy() {
    for (
      const unsubscribe
      of this.state.unsubscribers
    ) {
      try {
        unsubscribe?.();
      } catch (error) {
        console.warn(
          "ARI Circle messages unsubscribe failed",
          error
        );
      }
    }

    this.state.unsubscribers = [];
    this.state.initialized = false;
    this.state.busy = false;
  },

  getDiagnostics() {
    return {
      ready:
        this.state.initialized,

      source:
        this.source,

      version:
        this.version,

      busy:
        this.state.busy,

      unreadCount:
        clampUnreadCount(
          CircleStore.get(
            "messaging.unreadCount"
          )
        ),

      activeConversationId:
        CircleStore.get(
          "messaging.activeConversationId"
        ) || null,

      inboxButtonFound:
        Boolean(
          this.dom.inboxButton
        ),

      profileMessageButtonFound:
        Boolean(
          this.dom.profileMessageButton
        )
    };
  }
};

export {
  MessagesController,
  MESSAGE_ACCESS
};

export default MessagesController;
