// js/ari-circle/core/circle-store.js
// ARI Circle
// V1.0.0
//
// Purpose:
// - Single client-side state authority for ARI Circle.
// - Hold resolved context plus loaded profile/social state.
// - Let controllers update state without owning duplicate copies.
// - Notify subscribers when state changes.
//
// This module does NOT:
// - Query Supabase.
// - Render the DOM.
// - Interpret URLs.
// - Own realtime subscriptions.
// - Persist data.
//
// Data/API modules fetch data.
// Controllers decide actions.
// The store holds the current truth for the page.

const VERSION = "1.0.0";
const SOURCE = "ari-circle/core/circle-store";

const DEFAULT_STATE = Object.freeze({
  ready: false,

  context: null,

  profile: null,

  presence: {
    status: "offline",
    lastSeenAt: null,
    visible: true
  },

  connection: {
    status: "none",
    requestId: null,
    requestedByUserId: null
  },

  topCircle: {
    limit: 6,
    members: []
  },

  love: {
    items: [],
    total: 0,
    hasMore: false,
    loading: false
  },

  circle: {
    count: 0,
    mutualCount: 0,
    joinedAt: null
  },

  messaging: {
    unreadCount: 0,
    activeConversationId: null
  },

  notifications: {
    unreadCount: 0
  },

  ui: {
    loading: false,
    error: null
  }
});

function cloneValue(value) {
  if (
    typeof structuredClone === "function"
  ) {
    return structuredClone(value);
  }

  return JSON.parse(
    JSON.stringify(value)
  );
}

function createInitialState() {
  return cloneValue(
    DEFAULT_STATE
  );
}

function isPlainObject(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function mergeObjects(target, patch) {
  if (
    !isPlainObject(target) ||
    !isPlainObject(patch)
  ) {
    return cloneValue(patch);
  }

  const output = {
    ...target
  };

  for (
    const [key, value]
    of Object.entries(patch)
  ) {
    if (
      isPlainObject(value) &&
      isPlainObject(output[key])
    ) {
      output[key] =
        mergeObjects(
          output[key],
          value
        );

      continue;
    }

    output[key] =
      cloneValue(value);
  }

  return output;
}

function freezeSnapshot(value) {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    value.forEach(
      freezeSnapshot
    );

    return Object.freeze(value);
  }

  Object.values(value)
    .forEach(
      freezeSnapshot
    );

  return Object.freeze(value);
}

const CircleStore = {
  version:
    VERSION,

  source:
    SOURCE,

  state:
    createInitialState(),

  subscribers:
    new Set(),

  initialize(context = null) {
    this.state =
      createInitialState();

    this.state.context =
      context;

    this.state.ready =
      Boolean(context);

    this.emit({
      type: "store:initialized",
      keys: [
        "context",
        "ready"
      ]
    });

    return this.getState();
  },

  getState() {
    return freezeSnapshot(
      cloneValue(
        this.state
      )
    );
  },

  get(path) {
    if (!path) {
      return this.getState();
    }

    const segments =
      Array.isArray(path)
        ? path
        : String(path)
            .split(".")
            .filter(Boolean);

    let current =
      this.state;

    for (
      const segment
      of segments
    ) {
      if (
        current == null ||
        typeof current !== "object"
      ) {
        return undefined;
      }

      current =
        current[segment];
    }

    return freezeSnapshot(
      cloneValue(current)
    );
  },

  set(path, value, meta = {}) {
    const segments =
      Array.isArray(path)
        ? path
        : String(path)
            .split(".")
            .filter(Boolean);

    if (!segments.length) {
      throw new Error(
        "CircleStore.set requires a state path."
      );
    }

    let target =
      this.state;

    for (
      let index = 0;
      index < segments.length - 1;
      index += 1
    ) {
      const segment =
        segments[index];

      if (
        !isPlainObject(
          target[segment]
        )
      ) {
        target[segment] =
          {};
      }

      target =
        target[segment];
    }

    const finalKey =
      segments[
        segments.length - 1
      ];

    target[finalKey] =
      cloneValue(value);

    this.emit({
      type:
        meta.type ||
        "store:set",

      path:
        segments.join("."),

      keys: [
        segments[0]
      ],

      meta
    });

    return this.get(
      segments
    );
  },

  patch(patch, meta = {}) {
    if (!isPlainObject(patch)) {
      throw new TypeError(
        "CircleStore.patch requires a plain object."
      );
    }

    this.state =
      mergeObjects(
        this.state,
        patch
      );

    this.emit({
      type:
        meta.type ||
        "store:patch",

      keys:
        Object.keys(patch),

      meta
    });

    return this.getState();
  },

  setContext(context) {
    this.state.context =
      context;

    this.state.ready =
      Boolean(context);

    this.emit({
      type:
        "context:changed",

      keys: [
        "context",
        "ready"
      ]
    });

    return this.get("context");
  },

  setProfile(profile) {
    this.state.profile =
      profile
        ? cloneValue(profile)
        : null;

    this.emit({
      type:
        "profile:changed",

      keys: [
        "profile"
      ]
    });

    return this.get("profile");
  },

  setPresence(presence = {}) {
    this.state.presence =
      mergeObjects(
        this.state.presence,
        presence
      );

    this.emit({
      type:
        "presence:changed",

      keys: [
        "presence"
      ]
    });

    return this.get("presence");
  },

  setConnection(connection = {}) {
    this.state.connection =
      mergeObjects(
        this.state.connection,
        connection
      );

    this.emit({
      type:
        "connection:changed",

      keys: [
        "connection"
      ]
    });

    return this.get("connection");
  },

  setTopCircle({
    limit,
    members
  } = {}) {
    if (
      limit !== undefined
    ) {
      this.state.topCircle.limit =
        Number(limit) === 4
          ? 4
          : 6;
    }

    if (
      members !== undefined
    ) {
      this.state.topCircle.members =
        Array.isArray(members)
          ? cloneValue(members)
          : [];
    }

    this.emit({
      type:
        "top-circle:changed",

      keys: [
        "topCircle"
      ]
    });

    return this.get("topCircle");
  },

  setLoveState(love = {}) {
    this.state.love =
      mergeObjects(
        this.state.love,
        love
      );

    this.emit({
      type:
        "love:changed",

      keys: [
        "love"
      ]
    });

    return this.get("love");
  },

  setCircleDetails(circle = {}) {
    this.state.circle =
      mergeObjects(
        this.state.circle,
        circle
      );

    this.emit({
      type:
        "circle-details:changed",

      keys: [
        "circle"
      ]
    });

    return this.get("circle");
  },

  setMessagingState(messaging = {}) {
    this.state.messaging =
      mergeObjects(
        this.state.messaging,
        messaging
      );

    this.emit({
      type:
        "messaging:changed",

      keys: [
        "messaging"
      ]
    });

    return this.get("messaging");
  },

  setNotificationsState(notifications = {}) {
    this.state.notifications =
      mergeObjects(
        this.state.notifications,
        notifications
      );

    this.emit({
      type:
        "notifications:changed",

      keys: [
        "notifications"
      ]
    });

    return this.get(
      "notifications"
    );
  },

  setLoading(isLoading) {
    this.state.ui.loading =
      Boolean(isLoading);

    this.emit({
      type:
        "ui:loading",

      keys: [
        "ui"
      ]
    });

    return this.state.ui.loading;
  },

  setError(error) {
    this.state.ui.error =
      error
        ? String(
            error?.message ||
            error
          )
        : null;

    this.emit({
      type:
        "ui:error",

      keys: [
        "ui"
      ]
    });

    return this.state.ui.error;
  },

  subscribe(listener, options = {}) {
    if (
      typeof listener !==
      "function"
    ) {
      throw new TypeError(
        "CircleStore.subscribe requires a function."
      );
    }

    this.subscribers.add(
      listener
    );

    if (
      options.immediate === true
    ) {
      listener(
        this.getState(),
        {
          type:
            "store:subscribe",

          keys:
            Object.keys(
              this.state
            )
        }
      );
    }

    return () => {
      this.subscribers.delete(
        listener
      );
    };
  },

  emit(change = {}) {
    if (
      !this.subscribers.size
    ) {
      return;
    }

    const snapshot =
      this.getState();

    for (
      const listener
      of this.subscribers
    ) {
      try {
        listener(
          snapshot,
          Object.freeze({
            source:
              this.source,

            ...change
          })
        );
      } catch (error) {
        console.error(
          "ARI Circle store subscriber failed",
          error
        );
      }
    }
  },

  reset() {
    this.state =
      createInitialState();

    this.emit({
      type:
        "store:reset",

      keys:
        Object.keys(
          this.state
        )
    });

    return this.getState();
  },

  getDiagnostics() {
    return {
      ready:
        this.state.ready,

      source:
        this.source,

      version:
        this.version,

      subscriberCount:
        this.subscribers.size,

      hasContext:
        Boolean(
          this.state.context
        ),

      hasProfile:
        Boolean(
          this.state.profile
        )
    };
  }
};

export {
  CircleStore,
  DEFAULT_STATE
};

export default CircleStore;
