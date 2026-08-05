// js/ari-circle/connections/connection-requests.js
// ARI Circle
// V1.0.0
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

const VERSION = "1.0.0";
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
      request.from_user_id ||
      request.fromUserId
    );

  const receiverUserId =
    normalizeString(
      request.receiver_user_id ||
      request.receiverUserId ||
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

    busyRequestIds:
      new Set(),

    unsubscribers:
      []
  },

  init() {
    if (
      this.state.initialized
    ) {
      return this.getDiagnostics();
    }

    this.bindEvents();

    this.state.initialized =
      true;

    return this.getDiagnostics();
  },

  bindEvents() {
    this.state.unsubscribers.push(
      CircleEvents.on(
        "circle:open-incoming-request",
        payload => {
          const connection =
            payload?.detail
              ?.connection ||
            {};

          const requestId =
            normalizeString(
              connection.requestId
            );

          if (requestId) {
            this.openIncomingRequest(
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

    CircleEvents.emit(
      "circle:incoming-request-ready",
      {
        request
      }
    );

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

    this.state.busyRequestIds.clear();
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
