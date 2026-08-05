// js/ari-circle/presence/presence-controller.js
// ARI Circle
// V1.0.0
//
// Purpose:
// - Own ARI Circle online/offline presence state.
// - Render the viewed profile's presence indicator.
// - Update Top Circle member presence through shared events.
// - Respect profile presence visibility.
// - Provide a clean entry point for future realtime presence updates.
//
// This module does NOT:
// - Open Supabase realtime channels directly.
// - Persist presence as permanent profile data.
// - Decide authentication.
// - Render Top Circle members.
//
// Future realtime flow:
//   data/circle-realtime.js
//        -> PresenceController.applyPresence(...)
//        -> CircleStore
//        -> profile UI / Top Circle UI
//
// Presence should remain ephemeral.
// Do not store "online" as a permanent profile field.

import CircleStore from "../core/circle-store.js";
import CircleEvents, {
  EVENT_NAMES
} from "../core/circle-events.js";

const VERSION = "1.0.0";
const SOURCE = "ari-circle/presence/presence-controller";

const PRESENCE_STATES = Object.freeze({
  ONLINE:
    "online",

  AWAY:
    "away",

  OFFLINE:
    "offline"
});

const VALID_PRESENCE_STATES =
  new Set(
    Object.values(
      PRESENCE_STATES
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

function normalizePresence(value) {
  const normalized =
    normalizeString(value)
      ?.toLowerCase();

  if (
    normalized &&
    VALID_PRESENCE_STATES.has(
      normalized
    )
  ) {
    return normalized;
  }

  return PRESENCE_STATES.OFFLINE;
}

function normalizeTimestamp(value) {
  const normalized =
    normalizeString(value);

  if (!normalized) {
    return null;
  }

  const date =
    new Date(normalized);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
}

function formatLastSeen(value) {
  const timestamp =
    normalizeTimestamp(
      value
    );

  if (!timestamp) {
    return "Offline";
  }

  const date =
    new Date(timestamp);

  const diffMs =
    Date.now() -
    date.getTime();

  const diffMinutes =
    Math.max(
      0,
      Math.floor(
        diffMs / 60000
      )
    );

  if (diffMinutes < 1) {
    return "Offline Â· Just now";
  }

  if (diffMinutes < 60) {
    return `Offline Â· ${diffMinutes}m ago`;
  }

  const diffHours =
    Math.floor(
      diffMinutes / 60
    );

  if (diffHours < 24) {
    return `Offline Â· ${diffHours}h ago`;
  }

  const diffDays =
    Math.floor(
      diffHours / 24
    );

  if (diffDays === 1) {
    return "Offline Â· Yesterday";
  }

  return `Offline Â· ${new Intl.DateTimeFormat(
    undefined,
    {
      month: "short",
      day: "numeric"
    }
  ).format(date)}`;
}

const PresenceController = {
  version:
    VERSION,

  source:
    SOURCE,

  state: {
    initialized:
      false,

    members:
      new Map(),

    unsubscribers:
      []
  },

  dom: {
    presence:
      null,

    presenceText:
      null,

    presenceIndicator:
      null,

    avatarPresence:
      null
  },

  init() {
    if (
      this.state.initialized
    ) {
      return this.getDiagnostics();
    }

    this.cacheDom();
    this.bindStore();

    this.renderProfilePresence(
      CircleStore.get(
        "presence"
      )
    );

    this.state.initialized =
      true;

    return this.getDiagnostics();
  },

  cacheDom() {
    this.dom.presence =
      document.getElementById(
        "circle-presence"
      );

    this.dom.presenceText =
      document.getElementById(
        "circle-presence-text"
      );

    this.dom.presenceIndicator =
      document.getElementById(
        "circle-presence-indicator"
      );

    this.dom.avatarPresence =
      document.getElementById(
        "circle-avatar-presence"
      );
  },

  bindStore() {
    const unsubscribe =
      CircleStore.subscribe(
        (state, change) => {
          const keys =
            Array.isArray(
              change?.keys
            )
              ? change.keys
              : [];

          if (
            !keys.length ||
            keys.includes("presence")
          ) {
            this.renderProfilePresence(
              state.presence
            );
          }
        }
      );

    this.state.unsubscribers.push(
      unsubscribe
    );
  },

  setProfilePresence({
    status,
    lastSeenAt,
    visible
  } = {}) {
    const current =
      CircleStore.get(
        "presence"
      ) || {};

    const next = {
      status:
        status !== undefined
          ? normalizePresence(
              status
            )
          : normalizePresence(
              current.status
            ),

      lastSeenAt:
        lastSeenAt !== undefined
          ? normalizeTimestamp(
              lastSeenAt
            )
          : normalizeTimestamp(
              current.lastSeenAt
            ),

      visible:
        visible !== undefined
          ? Boolean(visible)
          : current.visible !== false
    };

    CircleStore.setPresence(
      next
    );

    CircleEvents.emit(
      EVENT_NAMES.PRESENCE_CHANGED,
      {
        scope:
          "profile",

        presence:
          next
      }
    );

    return CircleStore.get(
      "presence"
    );
  },

  renderProfilePresence(presence) {
    const status =
      normalizePresence(
        presence?.status
      );

    const visible =
      presence?.visible !==
      false;

    if (
      this.dom.presence
    ) {
      this.dom.presence.hidden =
        !visible;
    }

    if (
      this.dom.avatarPresence
    ) {
      this.dom.avatarPresence.hidden =
        !visible;

      this.applyPresenceClasses(
        this.dom.avatarPresence,
        status
      );
    }

    if (
      this.dom.presenceIndicator
    ) {
      this.applyPresenceClasses(
        this.dom.presenceIndicator,
        status
      );
    }

    if (
      !this.dom.presenceText
    ) {
      return;
    }

    if (!visible) {
      this.dom.presenceText.textContent =
        "";

      return;
    }

    switch (status) {
      case PRESENCE_STATES.ONLINE:
        this.dom.presenceText.textContent =
          "Online";
        break;

      case PRESENCE_STATES.AWAY:
        this.dom.presenceText.textContent =
          "Away";
        break;

      case PRESENCE_STATES.OFFLINE:
      default:
        this.dom.presenceText.textContent =
          formatLastSeen(
            presence?.lastSeenAt
          );
        break;
    }
  },

  applyPresenceClasses(
    element,
    status
  ) {
    if (!element) {
      return;
    }

    element.dataset.status =
      status;

    element.classList.toggle(
      "circle-presence-dot--online",
      status ===
        PRESENCE_STATES.ONLINE
    );

    element.classList.toggle(
      "circle-presence-dot--away",
      status ===
        PRESENCE_STATES.AWAY
    );

    element.classList.toggle(
      "circle-presence-dot--offline",
      status ===
        PRESENCE_STATES.OFFLINE
    );
  },

  applyPresence({
    userId,
    status,
    lastSeenAt = null,
    visible = true
  } = {}) {
    const id =
      normalizeString(
        userId
      );

    if (!id) {
      return null;
    }

    const nextPresence = {
      userId:
        id,

      status:
        normalizePresence(
          status
        ),

      lastSeenAt:
        normalizeTimestamp(
          lastSeenAt
        ),

      visible:
        visible !== false
    };

    this.state.members.set(
      id,
      Object.freeze(
        nextPresence
      )
    );

    const context =
      CircleStore.get(
        "context"
      );

    const profileUserId =
      normalizeString(
        context?.profileUserId
      );

    /*
     * If this presence update belongs to the profile currently open,
     * synchronize the profile presence state.
     */
    if (
      profileUserId &&
      profileUserId === id
    ) {
      CircleStore.setPresence({
        status:
          nextPresence.status,

        lastSeenAt:
          nextPresence.lastSeenAt,

        visible:
          nextPresence.visible
      });
    }

    /*
     * TopCircle listens for this event and updates the member's
     * presence dot without PresenceController owning Top Circle DOM.
     */
    CircleEvents.emit(
      EVENT_NAMES.PRESENCE_CHANGED,
      {
        scope:
          "member",

        userId:
          id,

        presence:
          nextPresence
      }
    );

    return {
      ...nextPresence
    };
  },

  applyPresenceBatch(items = []) {
    if (!Array.isArray(items)) {
      return [];
    }

    const applied =
      [];

    for (
      const item
      of items
    ) {
      const result =
        this.applyPresence(
          item
        );

      if (result) {
        applied.push(
          result
        );
      }
    }

    return applied;
  },

  getPresence(userId) {
    const id =
      normalizeString(
        userId
      );

    if (!id) {
      return null;
    }

    const presence =
      this.state.members.get(
        id
      );

    return presence
      ? {
          ...presence
        }
      : null;
  },

  removePresence(userId) {
    const id =
      normalizeString(
        userId
      );

    if (!id) {
      return false;
    }

    return this.state.members.delete(
      id
    );
  },

  markOffline(
    userId,
    lastSeenAt = null
  ) {
    return this.applyPresence({
      userId,

      status:
        PRESENCE_STATES.OFFLINE,

      lastSeenAt:
        lastSeenAt ||
        new Date()
          .toISOString(),

      visible:
        true
    });
  },

  markOnline(userId) {
    return this.applyPresence({
      userId,

      status:
        PRESENCE_STATES.ONLINE,

      lastSeenAt:
        null,

      visible:
        true
    });
  },

  markAway(userId) {
    return this.applyPresence({
      userId,

      status:
        PRESENCE_STATES.AWAY,

      lastSeenAt:
        null,

      visible:
        true
    });
  },

  hidePresence(userId) {
    const current =
      this.getPresence(
        userId
      );

    if (!current) {
      return this.applyPresence({
        userId,

        status:
          PRESENCE_STATES.OFFLINE,

        visible:
          false
      });
    }

    return this.applyPresence({
      ...current,
      visible:
        false
    });
  },

  clear() {
    this.state.members.clear();

    CircleStore.setPresence({
      status:
        PRESENCE_STATES.OFFLINE,

      lastSeenAt:
        null,

      visible:
        true
    });
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
          "ARI Circle presence unsubscribe failed",
          error
        );
      }
    }

    this.state.unsubscribers =
      [];

    this.state.members.clear();

    this.state.initialized =
      false;
  },

  getDiagnostics() {
    return {
      ready:
        this.state.initialized,

      source:
        this.source,

      version:
        this.version,

      trackedMemberCount:
        this.state.members.size,

      profilePresence:
        CircleStore.get(
          "presence"
        ),

      profilePresenceFound:
        Boolean(
          this.dom.presence
        ),

      avatarPresenceFound:
        Boolean(
          this.dom.avatarPresence
        )
    };
  }
};

export {
  PresenceController,
  PRESENCE_STATES
};

export default PresenceController;
