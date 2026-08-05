// js/ari-circle/core/circle-events.js
// ARI Circle
// V1.0.0
//
// Purpose:
// - Central event bus for ARI Circle feature modules.
// - Provide clean module-to-module communication without direct coupling.
// - Own lightweight UI notifications such as the shared Circle toast.
// - Support DOM action delegation for data-circle-action hooks.
//
// This module does NOT:
// - Store application state.
// - Query Supabase.
// - Render profile data.
// - Decide business rules.
// - Replace CircleStore.
//
// CircleStore = current state authority.
// CircleEvents = communication/event authority.

const VERSION = "1.0.0";
const SOURCE = "ari-circle/core/circle-events";

const EVENT_NAMES = Object.freeze({
  APP_READY:
    "circle:app-ready",

  CONTEXT_READY:
    "circle:context-ready",

  PROFILE_LOADED:
    "circle:profile-loaded",

  PROFILE_UPDATED:
    "circle:profile-updated",

  PRESENCE_CHANGED:
    "circle:presence-changed",

  CONNECTION_CHANGED:
    "circle:connection-changed",

  CONNECTION_REQUESTED:
    "circle:connection-requested",

  CONNECTION_ACCEPTED:
    "circle:connection-accepted",

  CONNECTION_DECLINED:
    "circle:connection-declined",

  CONNECTION_REMOVED:
    "circle:connection-removed",

  TOP_CIRCLE_CHANGED:
    "circle:top-circle-changed",

  LOVE_CREATED:
    "circle:love-created",

  LOVE_DELETED:
    "circle:love-deleted",

  MESSAGE_RECEIVED:
    "circle:message-received",

  MESSAGE_SENT:
    "circle:message-sent",

  MESSAGE_REQUEST_RECEIVED:
    "circle:message-request-received",

  NOTIFICATIONS_CHANGED:
    "circle:notifications-changed",

  REALTIME_CONNECTED:
    "circle:realtime-connected",

  REALTIME_DISCONNECTED:
    "circle:realtime-disconnected",

  UI_ACTION:
    "circle:ui-action",

  UI_ERROR:
    "circle:ui-error"
});

function normalizeEventName(name) {
  if (
    typeof name !== "string"
  ) {
    return null;
  }

  const normalized =
    name.trim();

  return normalized
    ? normalized
    : null;
}

function normalizeActionName(name) {
  if (
    typeof name !== "string"
  ) {
    return null;
  }

  const normalized =
    name.trim();

  return normalized
    ? normalized
    : null;
}

const CircleEvents = {
  version:
    VERSION,

  source:
    SOURCE,

  listeners:
    new Map(),

  actionListeners:
    new Map(),

  dom: {
    root: null,
    toast: null
  },

  state: {
    initialized: false,
    actionDelegationBound: false,
    toastTimer: null
  },

  init(options = {}) {
    if (this.state.initialized) {
      return this.getDiagnostics();
    }

    this.cacheDom(options);
    this.bindActionDelegation();

    this.state.initialized =
      true;

    return this.getDiagnostics();
  },

  cacheDom(options = {}) {
    this.dom.root =
      options.root ||
      document;

    this.dom.toast =
      options.toast ||
      document.getElementById(
        "circle-toast"
      );
  },

  on(eventName, listener) {
    const name =
      normalizeEventName(
        eventName
      );

    if (!name) {
      throw new TypeError(
        "CircleEvents.on requires a valid event name."
      );
    }

    if (
      typeof listener !==
      "function"
    ) {
      throw new TypeError(
        "CircleEvents.on requires a listener function."
      );
    }

    if (
      !this.listeners.has(name)
    ) {
      this.listeners.set(
        name,
        new Set()
      );
    }

    const listeners =
      this.listeners.get(name);

    listeners.add(
      listener
    );

    return () => {
      this.off(
        name,
        listener
      );
    };
  },

  once(eventName, listener) {
    if (
      typeof listener !==
      "function"
    ) {
      throw new TypeError(
        "CircleEvents.once requires a listener function."
      );
    }

    let unsubscribe =
      null;

    unsubscribe =
      this.on(
        eventName,
        payload => {
          unsubscribe?.();
          listener(payload);
        }
      );

    return unsubscribe;
  },

  off(eventName, listener) {
    const name =
      normalizeEventName(
        eventName
      );

    if (!name) {
      return false;
    }

    const listeners =
      this.listeners.get(name);

    if (!listeners) {
      return false;
    }

    const removed =
      listeners.delete(
        listener
      );

    if (
      listeners.size ===
      0
    ) {
      this.listeners.delete(
        name
      );
    }

    return removed;
  },

  emit(eventName, detail = {}) {
    const name =
      normalizeEventName(
        eventName
      );

    if (!name) {
      throw new TypeError(
        "CircleEvents.emit requires a valid event name."
      );
    }

    const payload =
      Object.freeze({
        source:
          this.source,

        event:
          name,

        timestamp:
          Date.now(),

        detail
      });

    const listeners =
      this.listeners.get(name);

    if (listeners) {
      for (
        const listener
        of listeners
      ) {
        try {
          listener(
            payload
          );
        } catch (error) {
          console.error(
            `ARI Circle event listener failed for "${name}"`,
            error
          );
        }
      }
    }

    /*
     * Also mirror ARI Circle events onto document so other
     * application layers can observe them without importing
     * this module directly.
     */
    document.dispatchEvent(
      new CustomEvent(
        name,
        {
          detail:
            payload
        }
      )
    );

    return payload;
  },

  onAction(actionName, listener) {
    const action =
      normalizeActionName(
        actionName
      );

    if (!action) {
      throw new TypeError(
        "CircleEvents.onAction requires a valid action name."
      );
    }

    if (
      typeof listener !==
      "function"
    ) {
      throw new TypeError(
        "CircleEvents.onAction requires a listener function."
      );
    }

    if (
      !this.actionListeners.has(
        action
      )
    ) {
      this.actionListeners.set(
        action,
        new Set()
      );
    }

    const listeners =
      this.actionListeners.get(
        action
      );

    listeners.add(
      listener
    );

    return () => {
      this.offAction(
        action,
        listener
      );
    };
  },

  offAction(actionName, listener) {
    const action =
      normalizeActionName(
        actionName
      );

    if (!action) {
      return false;
    }

    const listeners =
      this.actionListeners.get(
        action
      );

    if (!listeners) {
      return false;
    }

    const removed =
      listeners.delete(
        listener
      );

    if (
      listeners.size ===
      0
    ) {
      this.actionListeners.delete(
        action
      );
    }

    return removed;
  },

  bindActionDelegation() {
    if (
      this.state
        .actionDelegationBound
    ) {
      return;
    }

    const root =
      this.dom.root ||
      document;

    root.addEventListener(
      "click",
      event => {
        const trigger =
          event.target
            ?.closest?.(
              "[data-circle-action]"
            );

        if (!trigger) {
          return;
        }

        const action =
          normalizeActionName(
            trigger.dataset
              .circleAction
          );

        if (!action) {
          return;
        }

        const payload =
          Object.freeze({
            action,
            trigger,
            originalEvent:
              event
          });

        this.emit(
          EVENT_NAMES.UI_ACTION,
          payload
        );

        const listeners =
          this.actionListeners.get(
            action
          );

        if (!listeners) {
          return;
        }

        for (
          const listener
          of listeners
        ) {
          try {
            listener(
              payload
            );
          } catch (error) {
            console.error(
              `ARI Circle action listener failed for "${action}"`,
              error
            );
          }
        }
      }
    );

    this.state
      .actionDelegationBound =
      true;
  },

  showToast(message, options = {}) {
    const text =
      typeof message ===
      "string"
        ? message.trim()
        : "";

    if (!text) {
      return;
    }

    const toast =
      this.dom.toast ||
      document.getElementById(
        "circle-toast"
      );

    if (!toast) {
      console.info(
        "ARI Circle:",
        text
      );

      return;
    }

    const duration =
      Number.isFinite(
        options.duration
      )
        ? Math.max(
            500,
            Number(
              options.duration
            )
          )
        : 2600;

    window.clearTimeout(
      this.state.toastTimer
    );

    toast.textContent =
      text;

    toast.hidden =
      false;

    toast.dataset.type =
      options.type ||
      "info";

    this.state.toastTimer =
      window.setTimeout(
        () => {
          toast.hidden =
            true;

          delete toast.dataset
            .type;
        },
        duration
      );
  },

  hideToast() {
    const toast =
      this.dom.toast ||
      document.getElementById(
        "circle-toast"
      );

    window.clearTimeout(
      this.state.toastTimer
    );

    this.state.toastTimer =
      null;

    if (!toast) {
      return;
    }

    toast.hidden =
      true;

    toast.textContent =
      "";

    delete toast.dataset.type;
  },

  reportError(error, options = {}) {
    const message =
      typeof options.message ===
      "string" &&
      options.message.trim()
        ? options.message.trim()
        : "Something went wrong in ARI Circle.";

    const normalizedError =
      error instanceof Error
        ? error
        : new Error(
            String(
              error ||
              message
            )
          );

    console.error(
      "ARI Circle error",
      normalizedError
    );

    this.emit(
      EVENT_NAMES.UI_ERROR,
      {
        message,
        error:
          normalizedError
      }
    );

    if (
      options.toast !==
      false
    ) {
      this.showToast(
        message,
        {
          type:
            "error",

          duration:
            options.duration
        }
      );
    }

    return normalizedError;
  },

  clearListeners() {
    this.listeners.clear();
    this.actionListeners.clear();
  },

  getDiagnostics() {
    let listenerCount =
      0;

    for (
      const listeners
      of this.listeners.values()
    ) {
      listenerCount +=
        listeners.size;
    }

    let actionListenerCount =
      0;

    for (
      const listeners
      of this.actionListeners.values()
    ) {
      actionListenerCount +=
        listeners.size;
    }

    return {
      ready:
        this.state.initialized,

      source:
        this.source,

      version:
        this.version,

      listenerCount,
      actionListenerCount,

      actionDelegationBound:
        this.state
          .actionDelegationBound,

      hasToast:
        Boolean(
          this.dom.toast
        )
    };
  }
};

export {
  CircleEvents,
  EVENT_NAMES
};

export default CircleEvents;
