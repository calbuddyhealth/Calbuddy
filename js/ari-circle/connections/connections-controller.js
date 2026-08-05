// js/ari-circle/connections/connections-controller.js
// ARI Circle
// V1.0.1
//
// Purpose:
// - Own the connection relationship UI for the profile being viewed.
// - Render the Add to Circle button from CircleStore connection state.
// - Start / cancel outgoing Circle requests.
// - Remove an existing Circle connection.
// - Coordinate block/report confirmation dialogs.
// - Emit connection events for the future data layer.
//
// V1.0.1:
// - Fixes corrupted UTF-8 checkmark text in connection buttons.
// - "Requested â" is now "Requested ✓".
// - "In Your Circle â" is now "In Your Circle ✓".
//
// This module does NOT:
// - Query or write to Supabase.
// - Render the Top Circle orbit.
// - Accept/decline incoming requests in the notifications UI.
// - Load the user's full Circle.
//
// Future persistence modules:
//   data/circle-api.js
//   connections/connection-requests.js
//
// Canonical connection states:
//   none
//   outgoing_pending
//   incoming_pending
//   connected
//   blocked
//
// CircleStore remains the client-side state authority.

import CircleStore from "../core/circle-store.js";
import CircleEvents, {
  EVENT_NAMES
} from "../core/circle-events.js";

const VERSION = "1.0.1";
const SOURCE = "ari-circle/connections/connections-controller";

const CONNECTION_STATES = Object.freeze({
  NONE:
    "none",

  OUTGOING_PENDING:
    "outgoing_pending",

  INCOMING_PENDING:
    "incoming_pending",

  CONNECTED:
    "connected",

  BLOCKED:
    "blocked"
});

const VALID_CONNECTION_STATES =
  new Set(
    Object.values(
      CONNECTION_STATES
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

function normalizeConnectionState(value) {
  const normalized =
    normalizeString(value);

  if (
    normalized &&
    VALID_CONNECTION_STATES.has(
      normalized
    )
  ) {
    return normalized;
  }

  return CONNECTION_STATES.NONE;
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

const ConnectionsController = {
  version:
    VERSION,

  source:
    SOURCE,

  state: {
    initialized:
      false,

    busy:
      false,

    pendingDialogAction:
      null,

    unsubscribers:
      []
  },

  dom: {
    connectionAction:
      null,

    removeConnectionButton:
      null,

    blockUserButton:
      null,

    reportUserButton:
      null,

    connectionDialog:
      null,

    connectionDialogTitle:
      null,

    connectionDialogText:
      null,

    connectionDialogPrimary:
      null,

    connectionDialogSecondary:
      null,

    safetyDialog:
      null,

    safetyDialogTitle:
      null,

    safetyDialogText:
      null,

    safetyCancel:
      null,

    safetyConfirm:
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
    this.bindDialogButtons();
    this.bindStore();

    this.render(
      CircleStore.getState()
    );

    this.state.initialized =
      true;

    return this.getDiagnostics();
  },

  cacheDom() {
    this.dom.connectionAction =
      document.getElementById(
        "circle-connection-action"
      );

    this.dom.removeConnectionButton =
      document.getElementById(
        "circle-remove-connection-button"
      );

    this.dom.blockUserButton =
      document.getElementById(
        "circle-block-user-button"
      );

    this.dom.reportUserButton =
      document.getElementById(
        "circle-report-user-button"
      );

    this.dom.connectionDialog =
      document.getElementById(
        "circle-connection-dialog"
      );

    this.dom.connectionDialogTitle =
      document.getElementById(
        "circle-connection-dialog-title"
      );

    this.dom.connectionDialogText =
      document.getElementById(
        "circle-connection-dialog-text"
      );

    this.dom.connectionDialogPrimary =
      document.getElementById(
        "circle-connection-dialog-primary"
      );

    this.dom.connectionDialogSecondary =
      document.getElementById(
        "circle-connection-dialog-secondary"
      );

    this.dom.safetyDialog =
      document.getElementById(
        "circle-safety-dialog"
      );

    this.dom.safetyDialogTitle =
      document.getElementById(
        "circle-safety-dialog-title"
      );

    this.dom.safetyDialogText =
      document.getElementById(
        "circle-safety-dialog-text"
      );

    this.dom.safetyCancel =
      document.getElementById(
        "circle-safety-cancel"
      );

    this.dom.safetyConfirm =
      document.getElementById(
        "circle-safety-confirm"
      );
  },

  bindActions() {
    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "connection",
        () =>
          this.handleConnectionAction()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "remove-connection",
        () =>
          this.confirmRemoveConnection()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "block-user",
        () =>
          this.confirmBlockUser()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "report-user",
        () =>
          this.confirmReportUser()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "close-connection-dialog",
        () =>
          this.closeConnectionDialog()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "close-safety-dialog",
        () =>
          this.closeSafetyDialog()
      )
    );
  },

  bindDialogButtons() {
    this.dom.connectionDialogPrimary
      ?.addEventListener(
        "click",
        () =>
          this.runConnectionDialogAction(
            "primary"
          )
      );

    this.dom.connectionDialogSecondary
      ?.addEventListener(
        "click",
        () =>
          this.runConnectionDialogAction(
            "secondary"
          )
      );

    this.dom.safetyCancel
      ?.addEventListener(
        "click",
        () =>
          this.closeSafetyDialog()
      );

    this.dom.safetyConfirm
      ?.addEventListener(
        "click",
        () =>
          this.runSafetyDialogAction()
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
            keys.includes("connection") ||
            keys.includes("context") ||
            keys.includes("profile")
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
    const context =
      state?.context;

    const profile =
      state?.profile;

    const connection =
      state?.connection || {};

    const status =
      normalizeConnectionState(
        connection.status
      );

    this.renderConnectionButton({
      context,
      profile,
      status
    });

    this.renderConnectedOnly(
      status ===
        CONNECTION_STATES.CONNECTED
    );
  },

  renderConnectionButton({
    context,
    profile,
    status
  }) {
    const button =
      this.dom.connectionAction;

    if (!button) {
      return;
    }

    const canUseConnectionAction =
      Boolean(
        context?.isVisitor &&
        context?.isAuthenticated &&
        getProfileUserId(profile)
      );

    button.disabled =
      this.state.busy ||
      status ===
        CONNECTION_STATES.BLOCKED ||
      !canUseConnectionAction;

    button.dataset.connectionState =
      status;

    switch (status) {
      case CONNECTION_STATES.OUTGOING_PENDING:
        button.textContent =
          "Requested ✓";
        break;

      case CONNECTION_STATES.INCOMING_PENDING:
        button.textContent =
          "Respond to Request";
        break;

      case CONNECTION_STATES.CONNECTED:
        button.textContent =
          "In Your Circle ✓";
        break;

      case CONNECTION_STATES.BLOCKED:
        button.textContent =
          "Blocked";
        break;

      case CONNECTION_STATES.NONE:
      default:
        button.textContent =
          "Add to Circle";
        break;
    }

    if (
      context?.isGuest
    ) {
      button.disabled =
        true;

      button.textContent =
        "Sign in to Connect";
    }
  },

  renderConnectedOnly(isConnected) {
    const elements =
      document.querySelectorAll(
        "[data-connected-only]"
      );

    for (
      const element
      of elements
    ) {
      element.hidden =
        !isConnected;
    }
  },

  handleConnectionAction() {
    if (this.state.busy) {
      return;
    }

    const context =
      CircleStore.get(
        "context"
      );

    const profile =
      CircleStore.get(
        "profile"
      );

    const connection =
      CircleStore.get(
        "connection"
      ) || {};

    const status =
      normalizeConnectionState(
        connection.status
      );

    if (
      !context?.isAuthenticated
    ) {
      CircleEvents.showToast(
        "Sign in to add people to your Circle."
      );

      return;
    }

    if (!context?.isVisitor) {
      return;
    }

    if (
      !getProfileUserId(profile)
    ) {
      CircleEvents.showToast(
        "This Circle profile is still loading."
      );

      return;
    }

    switch (status) {
      case CONNECTION_STATES.NONE:
        this.requestConnection();
        break;

      case CONNECTION_STATES.OUTGOING_PENDING:
        this.confirmCancelRequest();
        break;

      case CONNECTION_STATES.INCOMING_PENDING:
        CircleEvents.emit(
          "circle:open-incoming-request",
          {
            profile,
            connection
          }
        );
        break;

      case CONNECTION_STATES.CONNECTED:
        this.confirmRemoveConnection();
        break;

      case CONNECTION_STATES.BLOCKED:
        CircleEvents.showToast(
          "This profile is blocked."
        );
        break;

      default:
        break;
    }
  },

  requestConnection() {
    const context =
      CircleStore.get(
        "context"
      );

    const profile =
      CircleStore.get(
        "profile"
      );

    const profileUserId =
      getProfileUserId(
        profile
      );

    if (
      !context?.viewerUserId ||
      !profileUserId
    ) {
      return false;
    }

    const nextConnection = {
      status:
        CONNECTION_STATES.OUTGOING_PENDING,

      requestId:
        null,

      requestedByUserId:
        context.viewerUserId,

      targetUserId:
        profileUserId,

      pendingPersistence:
        true
    };

    CircleStore.setConnection(
      nextConnection
    );

    CircleEvents.emit(
      EVENT_NAMES.CONNECTION_REQUESTED,
      {
        connection:
          nextConnection,

        profile,

        persist:
          true
      }
    );

    CircleEvents.showToast(
      "Circle request sent."
    );

    return true;
  },

  confirmCancelRequest() {
    const profile =
      CircleStore.get(
        "profile"
      );

    const name =
      getDisplayName(
        profile
      );

    this.openConnectionDialog({
      title:
        "Cancel Circle Request?",

      text:
        `Cancel your Circle request to ${name}?`,

      primaryLabel:
        "Keep Request",

      secondaryLabel:
        "Cancel Request",

      primary:
        () =>
          this.closeConnectionDialog(),

      secondary:
        () =>
          this.cancelOutgoingRequest()
    });
  },

  cancelOutgoingRequest() {
    const current =
      CircleStore.get(
        "connection"
      ) || {};

    const profile =
      CircleStore.get(
        "profile"
      );

    const previous =
      {
        ...current
      };

    const nextConnection = {
      status:
        CONNECTION_STATES.NONE,

      requestId:
        null,

      requestedByUserId:
        null,

      targetUserId:
        getProfileUserId(
          profile
        ),

      pendingPersistence:
        true
    };

    CircleStore.setConnection(
      nextConnection
    );

    CircleEvents.emit(
      EVENT_NAMES.CONNECTION_CHANGED,
      {
        action:
          "cancel-request",

        previous,
        connection:
          nextConnection,

        profile,

        persist:
          true
      }
    );

    this.closeConnectionDialog();

    CircleEvents.showToast(
      "Circle request canceled."
    );

    return true;
  },

  confirmRemoveConnection() {
    const profile =
      CircleStore.get(
        "profile"
      );

    const name =
      getDisplayName(
        profile
      );

    this.openConnectionDialog({
      title:
        "Remove from Circle?",

      text:
        `${name} will no longer be in your Circle.`,

      primaryLabel:
        "Keep in Circle",

      secondaryLabel:
        "Remove",

      primary:
        () =>
          this.closeConnectionDialog(),

      secondary:
        () =>
          this.removeConnection()
    });
  },

  removeConnection() {
    const current =
      CircleStore.get(
        "connection"
      ) || {};

    if (
      normalizeConnectionState(
        current.status
      ) !==
      CONNECTION_STATES.CONNECTED
    ) {
      this.closeConnectionDialog();
      return false;
    }

    const profile =
      CircleStore.get(
        "profile"
      );

    const previous =
      {
        ...current
      };

    const nextConnection = {
      status:
        CONNECTION_STATES.NONE,

      requestId:
        null,

      requestedByUserId:
        null,

      targetUserId:
        getProfileUserId(
          profile
        ),

      pendingPersistence:
        true
    };

    CircleStore.setConnection(
      nextConnection
    );

    CircleEvents.emit(
      EVENT_NAMES.CONNECTION_REMOVED,
      {
        previous,
        connection:
          nextConnection,

        profile,

        persist:
          true
      }
    );

    this.closeConnectionDialog();
    this.closeProfileMenuIfOpen();

    CircleEvents.showToast(
      "Removed from your Circle."
    );

    return true;
  },

  confirmBlockUser() {
    const profile =
      CircleStore.get(
        "profile"
      );

    const name =
      getDisplayName(
        profile
      );

    this.openSafetyDialog({
      action:
        "block",

      title:
        `Block ${name}?`,

      text:
        "They will not be able to send you Circle requests or interact with you through ARI Circle.",

      confirmLabel:
        "Block"
    });
  },

  confirmReportUser() {
    const profile =
      CircleStore.get(
        "profile"
      );

    const name =
      getDisplayName(
        profile
      );

    this.openSafetyDialog({
      action:
        "report",

      title:
        `Report ${name}?`,

      text:
        "This will start the ARI Circle reporting flow.",

      confirmLabel:
        "Report"
    });
  },

  runSafetyDialogAction() {
    const action =
      this.state
        .pendingDialogAction;

    if (
      action?.type === "block"
    ) {
      this.blockUser();
      return;
    }

    if (
      action?.type === "report"
    ) {
      this.reportUser();
      return;
    }

    this.closeSafetyDialog();
  },

  blockUser() {
    const profile =
      CircleStore.get(
        "profile"
      );

    const current =
      CircleStore.get(
        "connection"
      ) || {};

    const nextConnection = {
      ...current,

      status:
        CONNECTION_STATES.BLOCKED,

      pendingPersistence:
        true
    };

    CircleStore.setConnection(
      nextConnection
    );

    CircleEvents.emit(
      EVENT_NAMES.CONNECTION_CHANGED,
      {
        action:
          "block",

        connection:
          nextConnection,

        profile,

        persist:
          true
      }
    );

    this.closeSafetyDialog();
    this.closeProfileMenuIfOpen();

    CircleEvents.showToast(
      "Profile blocked."
    );

    return true;
  },

  reportUser() {
    const profile =
      CircleStore.get(
        "profile"
      );

    CircleEvents.emit(
      "circle:report-user",
      {
        profile,
        persist:
          true
      }
    );

    this.closeSafetyDialog();
    this.closeProfileMenuIfOpen();

    CircleEvents.showToast(
      "Report started."
    );

    return true;
  },

  openConnectionDialog({
    title,
    text,
    primaryLabel,
    secondaryLabel,
    primary,
    secondary
  }) {
    if (
      !this.dom.connectionDialog ||
      typeof this.dom
        .connectionDialog
        .showModal !== "function"
    ) {
      return false;
    }

    if (
      this.dom.connectionDialogTitle
    ) {
      this.dom.connectionDialogTitle.textContent =
        title || "Circle";
    }

    if (
      this.dom.connectionDialogText
    ) {
      this.dom.connectionDialogText.textContent =
        text || "";
    }

    if (
      this.dom.connectionDialogPrimary
    ) {
      this.dom.connectionDialogPrimary.textContent =
        primaryLabel || "OK";
    }

    if (
      this.dom.connectionDialogSecondary
    ) {
      this.dom.connectionDialogSecondary.textContent =
        secondaryLabel || "Cancel";
    }

    this.state.pendingDialogAction = {
      type:
        "connection",

      primary:
        typeof primary === "function"
          ? primary
          : null,

      secondary:
        typeof secondary === "function"
          ? secondary
          : null
    };

    if (
      !this.dom.connectionDialog.open
    ) {
      this.dom.connectionDialog.showModal();
    }

    return true;
  },

  runConnectionDialogAction(which) {
    const action =
      this.state
        .pendingDialogAction;

    if (
      !action ||
      action.type !== "connection"
    ) {
      this.closeConnectionDialog();
      return;
    }

    const callback =
      which === "primary"
        ? action.primary
        : action.secondary;

    if (
      typeof callback === "function"
    ) {
      callback();
      return;
    }

    this.closeConnectionDialog();
  },

  closeConnectionDialog() {
    if (
      this.dom.connectionDialog
        ?.open
    ) {
      this.dom.connectionDialog.close();
    }

    if (
      this.state.pendingDialogAction
        ?.type === "connection"
    ) {
      this.state.pendingDialogAction =
        null;
    }
  },

  openSafetyDialog({
    action,
    title,
    text,
    confirmLabel
  }) {
    if (
      !this.dom.safetyDialog ||
      typeof this.dom
        .safetyDialog
        .showModal !== "function"
    ) {
      return false;
    }

    if (
      this.dom.safetyDialogTitle
    ) {
      this.dom.safetyDialogTitle.textContent =
        title || "Profile Options";
    }

    if (
      this.dom.safetyDialogText
    ) {
      this.dom.safetyDialogText.textContent =
        text || "";
    }

    if (
      this.dom.safetyConfirm
    ) {
      this.dom.safetyConfirm.textContent =
        confirmLabel || "Confirm";
    }

    this.state.pendingDialogAction = {
      type:
        action
    };

    if (
      !this.dom.safetyDialog.open
    ) {
      this.dom.safetyDialog.showModal();
    }

    return true;
  },

  closeSafetyDialog() {
    if (
      this.dom.safetyDialog?.open
    ) {
      this.dom.safetyDialog.close();
    }

    if (
      this.state.pendingDialogAction
        ?.type !== "connection"
    ) {
      this.state.pendingDialogAction =
        null;
    }
  },

  closeProfileMenuIfOpen() {
    const menu =
      document.getElementById(
        "circle-profile-menu"
      );

    const button =
      document.getElementById(
        "circle-profile-menu-button"
      );

    if (menu) {
      menu.hidden =
        true;
    }

    button?.setAttribute(
      "aria-expanded",
      "false"
    );
  },

  setBusy(value) {
    this.state.busy =
      Boolean(value);

    this.render(
      CircleStore.getState()
    );
  },

  setConnection(connection) {
    const normalized =
      {
        ...(connection || {})
      };

    normalized.status =
      normalizeConnectionState(
        normalized.status
      );

    CircleStore.setConnection(
      normalized
    );

    return CircleStore.get(
      "connection"
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
          "ARI Circle connections unsubscribe failed",
          error
        );
      }
    }

    this.state.unsubscribers =
      [];

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

      busy:
        this.state.busy,

      connectionState:
        normalizeConnectionState(
          CircleStore.get(
            "connection.status"
          )
        ),

      connectionButtonFound:
        Boolean(
          this.dom.connectionAction
        ),

      connectionDialogFound:
        Boolean(
          this.dom.connectionDialog
        ),

      safetyDialogFound:
        Boolean(
          this.dom.safetyDialog
        )
    };
  }
};

export {
  ConnectionsController,
  CONNECTION_STATES
};

export default ConnectionsController;
