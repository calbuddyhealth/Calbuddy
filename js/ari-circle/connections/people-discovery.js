// js/ari-circle/connections/people-discovery.js
// ARI Circle
// V1.0.0
//
// Purpose:
// - Own the Find Friends dialog.
// - Show 20 random eligible ARI Circle users at a time.
// - Search by display name or @handle.
// - Send Circle requests without querying Supabase directly.
//
// Eligibility is enforced server-side by ari_circle_discover_people():
// - excludes the signed-in user
// - excludes any existing connection/request/block relationship

import CircleStore from "../core/circle-store.js";
import CircleEvents, {
  EVENT_NAMES
} from "../core/circle-events.js";

const VERSION = "1.0.0";
const SOURCE =
  "ari-circle/connections/people-discovery";

const DISCOVERY_LIMIT = 20;

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

function normalizeId(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return normalizeString(
    String(value)
  );
}

function normalizeHandle(value) {
  const normalized =
    normalizeString(value);

  if (!normalized) {
    return null;
  }

  return normalized
    .replace(/^@+/, "")
    .trim()
    .toLowerCase() || null;
}

function getEventDetail(payload) {
  if (
    payload?.detail &&
    typeof payload.detail ===
      "object"
  ) {
    return payload.detail;
  }

  return payload &&
    typeof payload ===
      "object"
    ? payload
    : {};
}

function createRequestId(prefix) {
  if (
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID ===
      "function"
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function normalizeProfile(row) {
  if (
    !row ||
    typeof row !== "object"
  ) {
    return null;
  }

  const userId =
    normalizeId(
      row.user_id ||
      row.userId ||
      row.id
    );

  if (!userId) {
    return null;
  }

  return {
    userId,

    displayName:
      normalizeString(
        row.display_name ||
        row.displayName ||
        row.name
      ) ||
      "ARI Circle User",

    handle:
      normalizeHandle(
        row.handle
      ),

    bio:
      normalizeString(
        row.bio
      ),

    avatarUrl:
      normalizeString(
        row.avatar_url ||
        row.avatarUrl
      )
  };
}

function getInitials(user) {
  const name =
    normalizeString(
      user?.displayName
    );

  if (name) {
    const initials =
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part =>
          part.charAt(0)
        )
        .join("")
        .toUpperCase();

    if (initials) {
      return initials;
    }
  }

  return user?.handle
    ?.charAt(0)
    ?.toUpperCase() ||
    "A";
}

const PeopleDiscovery = {
  version:
    VERSION,

  source:
    SOURCE,

  state: {
    initialized:
      false,

    loading:
      false,

    query:
      "",

    activeRequestId:
      null,

    users:
      [],

    requestedUserIds:
      new Set(),

    pendingUserIds:
      new Set(),

    unsubscribers:
      []
  },

  dom: {
    dialog:
      null,

    form:
      null,

    input:
      null,

    status:
      null,

    list:
      null,

    empty:
      null,

    refresh:
      null,

    template:
      null
  },

  init() {
    if (
      this.state.initialized
    ) {
      return this.getDiagnostics();
    }

    this.cacheDom();
    this.bindActions();
    this.bindForm();
    this.bindEvents();

    this.state.initialized =
      true;

    return this.getDiagnostics();
  },

  cacheDom() {
    this.dom.dialog =
      document.getElementById(
        "circle-people-discovery"
      );

    this.dom.form =
      document.getElementById(
        "circle-friend-search-form"
      );

    this.dom.input =
      document.getElementById(
        "circle-friend-search-input"
      );

    this.dom.status =
      document.getElementById(
        "circle-discovery-status"
      );

    this.dom.list =
      document.getElementById(
        "circle-discovery-list"
      );

    this.dom.empty =
      document.getElementById(
        "circle-discovery-empty"
      );

    this.dom.refresh =
      document.getElementById(
        "circle-discovery-refresh-button"
      );

    this.dom.template =
      document.getElementById(
        "circle-discovery-user-template"
      );
  },

  bindActions() {
    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "find-friends",
        () =>
          this.open()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "close-people-discovery",
        () =>
          this.close()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "refresh-people-discovery",
        () =>
          this.load(
            this.state.query
          )
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "open-discovery-profile",
        payload =>
          this.openProfile(
            payload?.trigger
          )
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "add-discovery-friend",
        payload =>
          this.addFriend(
            payload?.trigger
          )
      )
    );
  },

  bindForm() {
    this.dom.form
      ?.addEventListener(
        "submit",
        event => {
          event.preventDefault();

          this.load(
            this.dom.input
              ?.value ||
            ""
          );
        }
      );
  },

  bindEvents() {
    const on =
      (
        eventName,
        handler
      ) => {
        const unsubscribe =
          CircleEvents.on(
            eventName,
            payload =>
              handler.call(
                this,
                getEventDetail(
                  payload
                )
              )
          );

        this.state
          .unsubscribers
          .push(
            unsubscribe
          );
      };

    on(
      EVENT_NAMES
        .PEOPLE_DISCOVERY_RESULTS,
      this.handleResults
    );

    on(
      EVENT_NAMES
        .PEOPLE_DISCOVERY_REQUEST_SAVED,
      this.handleRequestSaved
    );
  },

  canUse() {
    const context =
      CircleStore.get(
        "context"
      );

    return Boolean(
      context
        ?.isAuthenticated &&
      context
        ?.viewerUserId
    );
  },

  open() {
    if (!this.canUse()) {
      CircleEvents.showToast(
        "Sign in to find friends."
      );

      return false;
    }

    if (!this.dom.dialog) {
      return false;
    }

    try {
      if (
        typeof this.dom.dialog
          .showModal ===
          "function" &&
        !this.dom.dialog.open
      ) {
        this.dom.dialog.showModal();
      } else {
        this.dom.dialog.setAttribute(
          "open",
          ""
        );
      }
    } catch {
      this.dom.dialog.setAttribute(
        "open",
        ""
      );
    }

    this.state.query =
      "";

    if (this.dom.input) {
      this.dom.input.value =
        "";
    }

    this.load("");

    return true;
  },

  close() {
    if (!this.dom.dialog) {
      return false;
    }

    try {
      this.dom.dialog.close?.();
    } catch {
      this.dom.dialog.removeAttribute(
        "open"
      );
    }

    return true;
  },

  load(query = "") {
    if (
      this.state.loading ||
      !this.canUse()
    ) {
      return false;
    }

    const normalizedQuery =
      normalizeString(
        query
      ) ||
      "";

    const requestId =
      createRequestId(
        "discover"
      );

    this.state.loading =
      true;

    this.state.query =
      normalizedQuery;

    this.state.activeRequestId =
      requestId;

    this.setStatus(
      normalizedQuery
        ? `Searching for "${normalizedQuery}"...`
        : "Finding 20 people..."
    );

    if (this.dom.refresh) {
      this.dom.refresh.disabled =
        true;
    }

    CircleEvents.emit(
      EVENT_NAMES
        .PEOPLE_DISCOVERY_QUERY,
      {
        requestId,

        query:
          normalizedQuery,

        limit:
          DISCOVERY_LIMIT
      }
    );

    return true;
  },

  handleResults(detail) {
    const requestId =
      normalizeString(
        detail?.requestId
      );

    if (
      requestId &&
      this.state
        .activeRequestId &&
      requestId !==
        this.state
          .activeRequestId
    ) {
      return;
    }

    this.state.loading =
      false;

    this.state.activeRequestId =
      null;

    if (this.dom.refresh) {
      this.dom.refresh.disabled =
        false;
    }

    if (detail?.error) {
      this.state.users =
        [];

      this.render();

      this.setStatus(
        normalizeString(
          detail.error
        ) ||
        "Could not load people."
      );

      return;
    }

    this.state.users =
      (
        Array.isArray(
          detail?.users
        )
          ? detail.users
          : []
      )
        .map(
          normalizeProfile
        )
        .filter(Boolean);

    this.render();

    if (
      this.state.users.length ===
      0
    ) {
      this.setStatus(
        this.state.query
          ? "No matching users found."
          : "No new people are available right now."
      );

      return;
    }

    this.setStatus(
      this.state.query
        ? `${this.state.users.length} result${this.state.users.length === 1 ? "" : "s"} found.`
        : `Showing ${this.state.users.length} people.`
    );
  },

  render() {
    if (!this.dom.list) {
      return;
    }

    this.dom.list
      .replaceChildren();

    if (this.dom.empty) {
      this.dom.empty.hidden =
        this.state.users.length >
        0;
    }

    for (
      const user
      of this.state.users
    ) {
      const node =
        this.createUserNode(
          user
        );

      if (node) {
        this.dom.list
          .appendChild(
            node
          );
      }
    }
  },

  createUserNode(user) {
    const template =
      this.dom.template;

    if (
      !template
        ?.content
    ) {
      return null;
    }

    const fragment =
      template.content
        .cloneNode(
          true
        );

    const article =
      fragment.querySelector(
        ".circle-discovery-user"
      );

    const avatar =
      fragment.querySelector(
        ".circle-discovery-user__avatar"
      );

    const fallback =
      fragment.querySelector(
        ".circle-discovery-user__avatar-fallback"
      );

    const name =
      fragment.querySelector(
        ".circle-discovery-user__name"
      );

    const handle =
      fragment.querySelector(
        ".circle-discovery-user__handle"
      );

    const bio =
      fragment.querySelector(
        ".circle-discovery-user__bio"
      );

    const add =
      fragment.querySelector(
        ".circle-discovery-user__add"
      );

    article?.setAttribute(
      "data-user-id",
      user.userId
    );

    fragment
      .querySelectorAll(
        "[data-circle-action]"
      )
      .forEach(
        element => {
          element.dataset.userId =
            user.userId;
        }
      );

    if (
      avatar &&
      user.avatarUrl
    ) {
      avatar.src =
        user.avatarUrl;

      avatar.alt =
        `${user.displayName} profile photo`;

      avatar.hidden =
        false;

      if (fallback) {
        fallback.hidden =
          true;
      }
    } else if (fallback) {
      fallback.textContent =
        getInitials(
          user
        );

      fallback.hidden =
        false;
    }

    if (name) {
      name.textContent =
        user.displayName;
    }

    if (handle) {
      handle.textContent =
        user.handle
          ? `@${user.handle}`
          : "";
    }

    if (
      bio &&
      user.bio
    ) {
      bio.textContent =
        user.bio;

      bio.hidden =
        false;
    }

    const requested =
      this.state
        .requestedUserIds
        .has(
          user.userId
        );

    const pending =
      this.state
        .pendingUserIds
        .has(
          user.userId
        );

    if (add) {
      if (requested) {
        add.textContent =
          "Requested â";

        add.disabled =
          true;
      } else if (pending) {
        add.textContent =
          "Sending...";

        add.disabled =
          true;
      }
    }

    return fragment;
  },

  openProfile(trigger) {
    const userId =
      normalizeId(
        trigger?.dataset
          ?.userId
      );

    if (!userId) {
      return false;
    }

    globalThis.location.assign(
      `ari-circle.html?user=${encodeURIComponent(
        userId
      )}`
    );

    return true;
  },

  addFriend(trigger) {
    const targetUserId =
      normalizeId(
        trigger?.dataset
          ?.userId
      );

    if (
      !targetUserId ||
      this.state
        .pendingUserIds
        .has(targetUserId) ||
      this.state
        .requestedUserIds
        .has(targetUserId)
    ) {
      return false;
    }

    this.state
      .pendingUserIds
      .add(
        targetUserId
      );

    this.render();

    CircleEvents.emit(
      EVENT_NAMES
        .PEOPLE_DISCOVERY_REQUESTED,
      {
        localRequestId:
          createRequestId(
            "friend"
          ),

        targetUserId,

        persist:
          true
      }
    );

    return true;
  },

  handleRequestSaved(detail) {
    const targetUserId =
      normalizeId(
        detail?.targetUserId
      );

    if (!targetUserId) {
      return;
    }

    this.state
      .pendingUserIds
      .delete(
        targetUserId
      );

    if (detail?.success) {
      this.state
        .requestedUserIds
        .add(
          targetUserId
        );

      CircleEvents.showToast(
        "Circle request sent."
      );
    }

    this.render();
  },

  setStatus(message) {
    if (this.dom.status) {
      this.dom.status.textContent =
        normalizeString(
          message
        ) ||
        "";
    }
  },

  destroy() {
    for (
      const unsubscribe
      of this.state
        .unsubscribers
    ) {
      try {
        unsubscribe?.();
      } catch {
        // Best-effort cleanup.
      }
    }

    this.state.unsubscribers =
      [];

    this.state.users =
      [];

    this.state
      .pendingUserIds
      .clear();

    this.state
      .requestedUserIds
      .clear();

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

      loading:
        this.state.loading,

      query:
        this.state.query,

      visibleUsers:
        this.state.users.length
    };
  }
};

export {
  PeopleDiscovery,
  DISCOVERY_LIMIT
};

export default PeopleDiscovery;
