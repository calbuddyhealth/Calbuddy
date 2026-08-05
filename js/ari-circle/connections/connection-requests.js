// js/ari-circle/connections/connection-requests.js
// ARI Circle
// V1.1.0
//
// Purpose:
// - Own incoming and outgoing Circle request workflows.
// - Normalize request records before they enter CircleStore.
// - Accept or decline incoming Circle requests.
// - Cancel outgoing Circle requests.
// - Keep request-specific behavior separate from the profile connection UI.
//
// This module does NOT:
// - Query or write to Supabase directly.
// - Render the full notifications screen.
// - Render the Top Circle.
// - Own profile page relationship button styling.
//
// Future persistence flow:
//   connection-requests.js
//        -> emits persistence event
//        -> data/circle-api.js
//
// ConnectionsController owns the profile action button.
// ConnectionRequests owns request lifecycle behavior.

import CircleStore from "../core/circle-store.js";
import CircleEvents, {
  EVENT_NAMES
} from "../core/circle-events.js";

import {
  CONNECTION_STATES
} from "./connections-controller.js";

const VERSION = "1.1.0";
const SOURCE = "ari-circle/connections/connection-requests";

const REQUEST_STATES = Object.freeze({
  PENDING:
    "pending",

  ACCEPTED:
    "accepted",

  DECLINED:
    "declined",

  CANCELED:
    "canceled"
});

const VALID_REQUEST_STATES =
  new Set(
    Object.values(
      REQUEST_STATES
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

function normalizeRequestState(value) {
  const normalized =
    normalizeString(value);

  if (
    normalized &&
    VALID_REQUEST_STATES.has(
      normalized
    )
  ) {
    return normalized;
  }

  return REQUEST_STATES.PENDING;
}

function normalizeRequest(request) {
  if (
    !request ||
    typeof request !== "object"
  ) {
    return null;
  }

  const id =
    normalizeString(
      request.id ||
      request.request_id ||
      request.requestId
    );

  const senderUserId =
    normalizeString(
      request.sender_user_id ||
      request.senderUserId ||
      request.requester_user_id ||
      request.requesterUserId ||
      request.from_user_id ||
      request.fromUserId
    );

  const receiverUserId =
    normalizeString(
      request.receiver_user_id ||
      request.receiverUserId ||
      request.addressee_user_id ||
      request.addresseeUserId ||
      request.to_user_id ||
      request.toUserId
    );

  if (
    !senderUserId ||
    !receiverUserId
  ) {
    return null;
  }

  return Object.freeze({
    id,

    senderUserId,
    receiverUserId,

    state:
      normalizeRequestState(
        request.state ||
        request.status
      ),

    createdAt:
      normalizeString(
        request.created_at ||
        request.createdAt
      ),

    updatedAt:
      normalizeString(
        request.updated_at ||
        request.updatedAt
      ),

    senderProfile:
      request.senderProfile ||
      request.sender_profile ||
      null,

    receiverProfile:
      request.receiverProfile ||
      request.receiver_profile ||
      null
  });
}

const ConnectionRequests = {
  version:
    VERSION,

  source:
    SOURCE,

  state: {
    initialized:
      false,

    incoming:
      [],

    outgoing:
      [],

    activeRequestId:
      null,

    busyRequestIds:
      new Set(),

    unsubscribers:
      []
  },

  dom: {
    dialog:
      null,

    avatar:
      null,

    avatarFallback:
      null,

    name:
      null,

    handle:
      null,

    text:
      null,

    viewProfile:
      null,

    decline:
      null,

    accept:
      null
  },

  init() {
    if (
      this.state.initialized
    ) {
      return this.getDiagnostics();
    }

    this.cacheDom();
    this.bindEvents();

    this.state.initialized =
      true;

    return this.getDiagnostics();
  },

  cacheDom() {
    this.dom.dialog =
      document.getElementById(
        "circle-request-dialog"
      );

    this.dom.avatar =
      document.getElementById(
        "circle-request-avatar"
      );

    this.dom.avatarFallback =
      document.getElementById(
        "circle-request-avatar-fallback"
      );

    this.dom.name =
      document.getElementById(
        "circle-request-name"
      );

    this.dom.handle =
      document.getElementById(
        "circle-request-handle"
      );

    this.dom.text =
      document.getElementById(
        "circle-request-text"
      );

    this.dom.viewProfile =
      document.getElementById(
        "circle-request-view-profile"
      );

    this.dom.decline =
      document.getElementById(
        "circle-request-decline"
      );

    this.dom.accept =
      document.getElementById(
        "circle-request-accept"
      );
  },

  bindEvents() {
    const openFromPayload =
      payload => {
        const detail =
          payload?.detail ||
          {};

        const requestId =
          normalizeString(
            detail?.requestId ||
            detail?.notification
              ?.requestId ||
            detail?.connection
              ?.requestId
          );

        if (requestId) {
          this.openIncomingRequest(
            requestId
          );
        }
      };

    this.state.unsubscribers.push(
      CircleEvents.on(
        "circle:open-incoming-request",
        openFromPayload
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        "circle:notification-open-connection-request",
        openFromPayload
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "open-incoming-request",
        payload => {
          const requestId =
            normalizeString(
              payload?.trigger
                ?.dataset
                ?.requestId
            );

          if (requestId) {
            this.openIncomingRequest(
              requestId
            );
          }
        }
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "close-incoming-request",
        () =>
          this.closeIncomingRequest()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "accept-incoming-request",
        payload => {
          const requestId =
            normalizeString(
              payload?.trigger
                ?.dataset
                ?.requestId
            ) ||
            this.state.activeRequestId;

          if (requestId) {
            this.accept(
              requestId
            );
          }
        }
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "decline-incoming-request",
        payload => {
          const requestId =
            normalizeString(
              payload?.trigger
                ?.dataset
                ?.requestId
            ) ||
            this.state.activeRequestId;

          if (requestId) {
            this.decline(
              requestId
            );
          }
        }
      )
    );
  },

  setIncomingRequests(requests = []) {
    this.state.incoming =
      Array.isArray(requests)
        ? requests
            .map(
              normalizeRequest
            )
            .filter(Boolean)
            .filter(
              request =>
                request.state ===
                REQUEST_STATES.PENDING
            )
        : [];

    this.syncCurrentProfileRequest();

    return this.getIncomingRequests();
  },

  setOutgoingRequests(requests = []) {
    this.state.outgoing =
      Array.isArray(requests)
        ? requests
            .map(
              normalizeRequest
            )
            .filter(Boolean)
            .filter(
              request =>
                request.state ===
                REQUEST_STATES.PENDING
            )
        : [];

    this.syncCurrentProfileRequest();

    return this.getOutgoingRequests();
  },

  getIncomingRequests() {
    return this.state.incoming.map(
      request => ({
        ...request
      })
    );
  },

  getOutgoingRequests() {
    return this.state.outgoing.map(
      request => ({
        ...request
      })
    );
  },

  getIncomingRequest(requestId) {
    const id =
      normalizeString(
        requestId
      );

    if (!id) {
      return null;
    }

    return (
      this.state.incoming.find(
        request =>
          request.id === id
      ) ||
      null
    );
  },

  getOutgoingRequest(requestId) {
    const id =
      normalizeString(
        requestId
      );

    if (!id) {
      return null;
    }

    return (
      this.state.outgoing.find(
        request =>
          request.id === id
      ) ||
      null
    );
  },

  getRequestForUser(userId) {
    const targetUserId =
      normalizeString(
        userId
      );

    if (!targetUserId) {
      return null;
    }

    const context =
      CircleStore.get(
        "context"
      );

    const viewerUserId =
      normalizeString(
        context?.viewerUserId
      );

    if (!viewerUserId) {
      return null;
    }

    const incoming =
      this.state.incoming.find(
        request =>
          request.senderUserId ===
            targetUserId &&
          request.receiverUserId ===
            viewerUserId
      );

    if (incoming) {
      return {
        direction:
          "incoming",

        request:
          incoming
      };
    }

    const outgoing =
      this.state.outgoing.find(
        request =>
          request.senderUserId ===
            viewerUserId &&
          request.receiverUserId ===
            targetUserId
      );

    if (outgoing) {
      return {
        direction:
          "outgoing",

        request:
          outgoing
      };
    }

    return null;
  },

  syncCurrentProfileRequest() {
    const profile =
      CircleStore.get(
        "profile"
      );

    const profileUserId =
      normalizeString(
        profile?.user_id ||
        profile?.userId ||
        profile?.id
      );

    if (!profileUserId) {
      return;
    }

    const match =
      this.getRequestForUser(
        profileUserId
      );

    if (!match) {
      return;
    }

    if (
      match.direction ===
      "incoming"
    ) {
      CircleStore.setConnection({
        status:
          CONNECTION_STATES.INCOMING_PENDING,

        requestId:
          match.request.id,

        requestedByUserId:
          match.request.senderUserId,

        targetUserId:
          match.request.receiverUserId,

        pendingPersistence:
          false
      });

      return;
    }

    CircleStore.setConnection({
      status:
        CONNECTION_STATES.OUTGOING_PENDING,

      requestId:
        match.request.id,

      requestedByUserId:
        match.request.senderUserId,

      targetUserId:
        match.request.receiverUserId,

      pendingPersistence:
        false
    });
  },

  openIncomingRequest(requestId) {
    const request =
      this.getIncomingRequest(
        requestId
      );

    if (!request) {
      CircleEvents.showToast(
        "That Circle request is no longer available."
      );

      return false;
    }

    this.state.activeRequestId =
      request.id;

    this.renderIncomingRequest(
      request
    );

    if (
      this.dom.dialog &&
      !this.dom.dialog.open
    ) {
      if (
        typeof this.dom.dialog
          .showModal === "function"
      ) {
        this.dom.dialog.showModal();
      } else {
        this.dom.dialog.setAttribute(
          "open",
          ""
        );
      }
    }

    CircleEvents.emit(
      "circle:incoming-request-ready",
      {
        request
      }
    );

    return true;
  },

  renderIncomingRequest(request) {
    const profile =
      request?.senderProfile ||
      {};

    const displayName =
      normalizeString(
        profile.display_name ||
        profile.displayName ||
        profile.name
      ) ||
      "ARI user";

    const handle =
      normalizeString(
        profile.handle
      );

    const avatarUrl =
      normalizeString(
        profile.avatar_url ||
        profile.avatarUrl
      );

    if (this.dom.name) {
      this.dom.name.textContent =
        displayName;
    }

    if (this.dom.handle) {
      this.dom.handle.textContent =
        handle
          ? `@${handle.replace(
              /^@+/,
              ""
            )}`
          : "";

      this.dom.handle.hidden =
        !handle;
    }

    if (this.dom.text) {
      this.dom.text.textContent =
        `${displayName} wants to join your Circle.`;
    }

    if (this.dom.avatar) {
      if (avatarUrl) {
        this.dom.avatar.src =
          avatarUrl;

        this.dom.avatar.alt =
          `${displayName} profile photo`;

        this.dom.avatar.hidden =
          false;
      } else {
        this.dom.avatar.hidden =
          true;

        this.dom.avatar.removeAttribute(
          "src"
        );
      }
    }

    if (this.dom.avatarFallback) {
      const initials =
        displayName
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map(
            part =>
              part[0]
          )
          .join("")
          .toUpperCase() ||
        "A";

      this.dom.avatarFallback
        .textContent =
        initials;

      this.dom.avatarFallback.hidden =
        Boolean(
          avatarUrl
        );
    }

    if (this.dom.viewProfile) {
      this.dom.viewProfile.dataset.userId =
        request.senderUserId;

      if (handle) {
        this.dom.viewProfile.dataset.handle =
          handle.replace(
            /^@+/,
            ""
          );
      } else {
        delete this.dom
          .viewProfile
          .dataset
          .handle;
      }
    }

    for (
      const button
      of [
        this.dom.decline,
        this.dom.accept
      ]
    ) {
      if (button) {
        button.dataset.requestId =
          request.id;
      }
    }
  },

  closeIncomingRequest() {
    this.state.activeRequestId =
      null;

    if (
      this.dom.dialog?.open
    ) {
      if (
        typeof this.dom.dialog
          .close === "function"
      ) {
        this.dom.dialog.close();
      } else {
        this.dom.dialog.removeAttribute(
          "open"
        );
      }
    }

    return true;
  },

  async accept(requestId) {
    const request =
      this.getIncomingRequest(
        requestId
      );

    if (!request) {
      CircleEvents.showToast(
        "Circle request not found."
      );

      return false;
    }

    if (
      this.isBusy(
        request.id
      )
    ) {
      return false;
    }

    this.setBusy(
      request.id,
      true
    );

    try {
      this.removeIncomingRequest(
        request.id
      );

      const context =
        CircleStore.get(
          "context"
        );

      const profile =
        CircleStore.get(
          "profile"
        );

      const profileUserId =
        normalizeString(
          profile?.user_id ||
          profile?.userId ||
          profile?.id
        );

      /*
       * If the currently open profile belongs to the sender,
       * update the profile-level relationship immediately.
       */
      if (
        profileUserId &&
        profileUserId ===
          request.senderUserId
      ) {
        CircleStore.setConnection({
          status:
            CONNECTION_STATES.CONNECTED,

          requestId:
            null,

          requestedByUserId:
            request.senderUserId,

          targetUserId:
            context?.viewerUserId ||
            request.receiverUserId,

          pendingPersistence:
            true
        });
      }

      CircleEvents.emit(
        EVENT_NAMES.CONNECTION_ACCEPTED,
        {
          request,
          persist:
            true
        }
      );

      CircleEvents.emit(
        EVENT_NAMES.CONNECTION_CHANGED,
        {
          action:
            "accept-request",

          request,

          connection: {
            status:
              CONNECTION_STATES.CONNECTED
          },

          persist:
            true
        }
      );

      CircleEvents.emit(
        "circle:incoming-request-resolved",
        {
          action:
            "accepted",

          requestId:
            request.id,

          request
        }
      );

      this.closeIncomingRequest();

      CircleEvents.showToast(
        "Added to your Circle."
      );

      return true;
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not accept the Circle request."
        }
      );

      return false;
    } finally {
      this.setBusy(
        request.id,
        false
      );
    }
  },

  async decline(requestId) {
    const request =
      this.getIncomingRequest(
        requestId
      );

    if (!request) {
      CircleEvents.showToast(
        "Circle request not found."
      );

      return false;
    }

    if (
      this.isBusy(
        request.id
      )
    ) {
      return false;
    }

    this.setBusy(
      request.id,
      true
    );

    try {
      this.removeIncomingRequest(
        request.id
      );

      const profile =
        CircleStore.get(
          "profile"
        );

      const profileUserId =
        normalizeString(
          profile?.user_id ||
          profile?.userId ||
          profile?.id
        );

      if (
        profileUserId &&
        profileUserId ===
          request.senderUserId
      ) {
        CircleStore.setConnection({
          status:
            CONNECTION_STATES.NONE,

          requestId:
            null,

          requestedByUserId:
            null,

          targetUserId:
            profileUserId,

          pendingPersistence:
            true
        });
      }

      CircleEvents.emit(
        EVENT_NAMES.CONNECTION_DECLINED,
        {
          request,
          persist:
            true
        }
      );

      CircleEvents.emit(
        EVENT_NAMES.CONNECTION_CHANGED,
        {
          action:
            "decline-request",

          request,

          connection: {
            status:
              CONNECTION_STATES.NONE
          },

          persist:
            true
        }
      );

      CircleEvents.emit(
        "circle:incoming-request-resolved",
        {
          action:
            "declined",

          requestId:
            request.id,

          request
        }
      );

      this.closeIncomingRequest();

      CircleEvents.showToast(
        "Circle request declined."
      );

      return true;
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not decline the Circle request."
        }
      );

      return false;
    } finally {
      this.setBusy(
        request.id,
        false
      );
    }
  },

  async cancel(requestId) {
    const request =
      this.getOutgoingRequest(
        requestId
      );

    if (!request) {
      CircleEvents.showToast(
        "Circle request not found."
      );

      return false;
    }

    if (
      this.isBusy(
        request.id
      )
    ) {
      return false;
    }

    this.setBusy(
      request.id,
      true
    );

    try {
      this.removeOutgoingRequest(
        request.id
      );

      const profile =
        CircleStore.get(
          "profile"
        );

      const profileUserId =
        normalizeString(
          profile?.user_id ||
          profile?.userId ||
          profile?.id
        );

      if (
        profileUserId &&
        profileUserId ===
          request.receiverUserId
      ) {
        CircleStore.setConnection({
          status:
            CONNECTION_STATES.NONE,

          requestId:
            null,

          requestedByUserId:
            null,

          targetUserId:
            profileUserId,

          pendingPersistence:
            true
        });
      }

      CircleEvents.emit(
        EVENT_NAMES.CONNECTION_CHANGED,
        {
          action:
            "cancel-request",

          request,

          connection: {
            status:
              CONNECTION_STATES.NONE
          },

          persist:
            true
        }
      );

      CircleEvents.showToast(
        "Circle request canceled."
      );

      return true;
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not cancel the Circle request."
        }
      );

      return false;
    } finally {
      this.setBusy(
        request.id,
        false
      );
    }
  },

  addIncomingRequest(request) {
    const normalized =
      normalizeRequest(
        request
      );

    if (!normalized) {
      return null;
    }

    this.state.incoming =
      [
        normalized,
        ...this.state.incoming.filter(
          item =>
            item.id !==
            normalized.id
        )
      ];

    this.syncCurrentProfileRequest();

    return normalized;
  },

  addOutgoingRequest(request) {
    const normalized =
      normalizeRequest(
        request
      );

    if (!normalized) {
      return null;
    }

    this.state.outgoing =
      [
        normalized,
        ...this.state.outgoing.filter(
          item =>
            item.id !==
            normalized.id
        )
      ];

    this.syncCurrentProfileRequest();

    return normalized;
  },

  removeIncomingRequest(requestId) {
    const id =
      normalizeString(
        requestId
      );

    if (!id) {
      return false;
    }

    const before =
      this.state.incoming.length;

    this.state.incoming =
      this.state.incoming.filter(
        request =>
          request.id !== id
      );

    return (
      this.state.incoming.length !==
      before
    );
  },

  removeOutgoingRequest(requestId) {
    const id =
      normalizeString(
        requestId
      );

    if (!id) {
      return false;
    }

    const before =
      this.state.outgoing.length;

    this.state.outgoing =
      this.state.outgoing.filter(
        request =>
          request.id !== id
      );

    return (
      this.state.outgoing.length !==
      before
    );
  },

  isBusy(requestId) {
    const id =
      normalizeString(
        requestId
      );

    return Boolean(
      id &&
      this.state.busyRequestIds.has(
        id
      )
    );
  },

  setBusy(requestId, value) {
    const id =
      normalizeString(
        requestId
      );

    if (!id) {
      return;
    }

    if (value) {
      this.state.busyRequestIds.add(
        id
      );
    } else {
      this.state.busyRequestIds.delete(
        id
      );
    }
  },

  clear() {
    this.state.incoming =
      [];

    this.state.outgoing =
      [];

    this.state.activeRequestId =
      null;

    this.state.busyRequestIds.clear();

    if (
      this.dom.dialog?.open
    ) {
      try {
        this.dom.dialog.close();
      } catch {
        this.dom.dialog.removeAttribute(
          "open"
        );
      }
    }
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
          "ARI Circle request unsubscribe failed",
          error
        );
      }
    }

    this.state.unsubscribers =
      [];

    this.clear();

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

      incomingCount:
        this.state.incoming.length,

      outgoingCount:
        this.state.outgoing.length,

      activeRequestId:
        this.state.activeRequestId,

      dialogFound:
        Boolean(
          this.dom.dialog
        ),

      busyCount:
        this.state.busyRequestIds.size
    };
  }
};

export {
  ConnectionRequests,
  REQUEST_STATES,
  normalizeRequest
};

export default ConnectionRequests;
