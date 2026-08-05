// js/ari-circle/messaging/message-requests.js
// ARI Circle
// V1.0.0
//
// Purpose:
// - Own first-contact private message request state.
// - Create outgoing message requests.
// - Accept or decline incoming message requests.
// - Prevent duplicate pending requests between the same two users.
// - Promote an accepted request into a normal direct conversation.
// - Emit persistence events for the future data layer.
//
// This module does NOT:
// - Query or write to Supabase directly.
// - Render the full message request inbox.
// - Render a conversation thread.
// - Subscribe to realtime channels.
//
// Future persistence flow:
//   message-requests.js
//        -> CircleEvents
//        -> data/circle-api.js
//
// Future realtime flow:
//   data/circle-realtime.js
//        -> MessageRequests.addIncomingRequest(...)
//
// conversations.js owns normal direct-message threads.
// message-requests.js owns permission-gated first contact.

import CircleStore from "../core/circle-store.js";
import CircleEvents from "../core/circle-events.js";
import Conversations from "./conversations.js";

const VERSION = "1.0.0";
const SOURCE = "ari-circle/messaging/message-requests";

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

const MESSAGE_REQUEST_MAX_LENGTH = 1000;

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
    normalizeString(value)
      ?.toLowerCase();

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

function createLocalId(prefix) {
  if (
    globalThis.crypto
      ?.randomUUID
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return (
    `${prefix}-` +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}

function normalizeProfile(profile) {
  if (
    !profile ||
    typeof profile !== "object"
  ) {
    return null;
  }

  const userId =
    normalizeString(
      profile.user_id ||
      profile.userId ||
      profile.id
    );

  if (!userId) {
    return null;
  }

  return Object.freeze({
    userId,

    displayName:
      normalizeString(
        profile.display_name ||
        profile.displayName ||
        profile.name
      ) ||
      "ARI User",

    handle:
      normalizeString(
        profile.handle ||
        profile.username
      ),

    avatarUrl:
      normalizeString(
        profile.avatar_url ||
        profile.avatarUrl ||
        profile.photo_url ||
        profile.photoUrl
      )
  });
}

function normalizeRequest(request) {
  if (
    !request ||
    typeof request !== "object"
  ) {
    return null;
  }

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

  const message =
    normalizeString(
      request.message ||
      request.body ||
      request.text
    );

  if (
    !senderUserId ||
    !receiverUserId ||
    !message
  ) {
    return null;
  }

  return Object.freeze({
    id:
      normalizeString(
        request.id ||
        request.request_id ||
        request.requestId
      ) ||
      createLocalId(
        "message-request"
      ),

    senderUserId,
    receiverUserId,

    message:
      message.slice(
        0,
        MESSAGE_REQUEST_MAX_LENGTH
      ),

    state:
      normalizeRequestState(
        request.state ||
        request.status
      ),

    createdAt:
      normalizeString(
        request.created_at ||
        request.createdAt
      ) ||
      new Date()
        .toISOString(),

    updatedAt:
      normalizeString(
        request.updated_at ||
        request.updatedAt
      ),

    senderProfile:
      normalizeProfile(
        request.sender_profile ||
        request.senderProfile
      ),

    receiverProfile:
      normalizeProfile(
        request.receiver_profile ||
        request.receiverProfile
      )
  });
}

function cloneRequest(request) {
  if (!request) {
    return null;
  }

  return {
    ...request,

    senderProfile:
      request.senderProfile
        ? {
            ...request.senderProfile
          }
        : null,

    receiverProfile:
      request.receiverProfile
        ? {
            ...request.receiverProfile
          }
        : null
  };
}

const MessageRequests = {
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

    composerTarget:
      null,

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
        "circle:message-request-composer",
        payload => {
          const detail =
            payload?.detail ||
            {};

          this.openComposer({
            viewerUserId:
              detail.viewerUserId,

            recipientUserId:
              detail.recipientUserId,

            profile:
              detail.profile
          });
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

    return this.getOutgoingRequests();
  },

  getIncomingRequests() {
    return this.state.incoming
      .map(
        cloneRequest
      );
  },

  getOutgoingRequests() {
    return this.state.outgoing
      .map(
        cloneRequest
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

  findPendingBetween(
    senderUserId,
    receiverUserId
  ) {
    const senderId =
      normalizeString(
        senderUserId
      );

    const receiverId =
      normalizeString(
        receiverUserId
      );

    if (
      !senderId ||
      !receiverId
    ) {
      return null;
    }

    const outgoing =
      this.state.outgoing.find(
        request =>
          request.senderUserId ===
            senderId &&
          request.receiverUserId ===
            receiverId &&
          request.state ===
            REQUEST_STATES.PENDING
      );

    if (outgoing) {
      return {
        direction:
          "outgoing",

        request:
          outgoing
      };
    }

    const incoming =
      this.state.incoming.find(
        request =>
          request.senderUserId ===
            receiverId &&
          request.receiverUserId ===
            senderId &&
          request.state ===
            REQUEST_STATES.PENDING
      );

    if (incoming) {
      return {
        direction:
          "incoming",

        request:
          incoming
      };
    }

    return null;
  },

  openComposer({
    viewerUserId,
    recipientUserId,
    profile = null
  } = {}) {
    const senderId =
      normalizeString(
        viewerUserId
      );

    const receiverId =
      normalizeString(
        recipientUserId
      );

    if (
      !senderId ||
      !receiverId ||
      senderId === receiverId
    ) {
      return false;
    }

    const existing =
      this.findPendingBetween(
        senderId,
        receiverId
      );

    if (existing) {
      if (
        existing.direction ===
        "outgoing"
      ) {
        CircleEvents.showToast(
          "You already sent a message request."
        );
      } else {
        CircleEvents.showToast(
          "This person already sent you a message request."
        );
      }

      CircleEvents.emit(
        "circle:message-request-existing",
        {
          direction:
            existing.direction,

          request:
            cloneRequest(
              existing.request
            )
        }
      );

      return false;
    }

    this.state.composerTarget = {
      viewerUserId:
        senderId,

      recipientUserId:
        receiverId,

      profile:
        profile &&
        typeof profile === "object"
          ? {
              ...profile
            }
          : null
    };

    /*
     * A future message request composer UI can listen for this.
     * For now this event carries the complete target context.
     */
    CircleEvents.emit(
      "circle:message-request-composer-opened",
      {
        ...this.state
          .composerTarget
      }
    );

    return true;
  },

  closeComposer() {
    if (
      !this.state.composerTarget
    ) {
      return false;
    }

    this.state.composerTarget =
      null;

    CircleEvents.emit(
      "circle:message-request-composer-closed",
      {}
    );

    return true;
  },

  createRequest({
    message,
    viewerProfile = null
  } = {}) {
    const target =
      this.state
        .composerTarget;

    if (!target) {
      CircleEvents.showToast(
        "No message request recipient is selected."
      );

      return null;
    }

    const text =
      normalizeString(
        message
      );

    if (!text) {
      CircleEvents.showToast(
        "Write a message first."
      );

      return null;
    }

    if (
      text.length >
      MESSAGE_REQUEST_MAX_LENGTH
    ) {
      CircleEvents.showToast(
        `Message requests can be up to ${MESSAGE_REQUEST_MAX_LENGTH} characters.`
      );

      return null;
    }

    const duplicate =
      this.findPendingBetween(
        target.viewerUserId,
        target.recipientUserId
      );

    if (duplicate) {
      CircleEvents.showToast(
        "A message request already exists."
      );

      return null;
    }

    const request =
      normalizeRequest({
        id:
          createLocalId(
            "message-request"
          ),

        senderUserId:
          target.viewerUserId,

        receiverUserId:
          target.recipientUserId,

        message:
          text,

        state:
          REQUEST_STATES.PENDING,

        createdAt:
          new Date()
            .toISOString(),

        senderProfile:
          viewerProfile,

        receiverProfile:
          target.profile
      });

    if (!request) {
      return null;
    }

    this.state.outgoing =
      [
        request,
        ...this.state.outgoing
      ];

    CircleEvents.emit(
      "circle:message-request-created",
      {
        request:
          cloneRequest(
            request
          ),

        persist:
          true
      }
    );

    this.closeComposer();

    CircleEvents.showToast(
      "Message request sent."
    );

    return cloneRequest(
      request
    );
  },

  addIncomingRequest(request) {
    const normalized =
      normalizeRequest(
        request
      );

    if (
      !normalized ||
      normalized.state !==
        REQUEST_STATES.PENDING
    ) {
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

    CircleEvents.emit(
      "circle:message-request-received",
      {
        request:
          cloneRequest(
            normalized
          )
      }
    );

    return cloneRequest(
      normalized
    );
  },

  addOutgoingRequest(request) {
    const normalized =
      normalizeRequest(
        request
      );

    if (
      !normalized ||
      normalized.state !==
        REQUEST_STATES.PENDING
    ) {
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

    return cloneRequest(
      normalized
    );
  },

  async accept(requestId) {
    const request =
      this.getIncomingRequest(
        requestId
      );

    if (!request) {
      CircleEvents.showToast(
        "Message request not found."
      );

      return null;
    }

    if (
      this.isBusy(
        request.id
      )
    ) {
      return null;
    }

    this.setBusy(
      request.id,
      true
    );

    try {
      this.removeIncomingRequest(
        request.id
      );

      const acceptedRequest = {
        ...request,
        state:
          REQUEST_STATES.ACCEPTED,

        updatedAt:
          new Date()
            .toISOString()
      };

      /*
       * Once accepted, normal direct messaging takes over.
       * Conversations will reuse an existing direct conversation
       * or create a new local shell.
       */
      const conversation =
        Conversations
          .openOrCreateDirectConversation({
            viewerUserId:
              request.receiverUserId,

            recipientUserId:
              request.senderUserId,

            recipientProfile:
              request.senderProfile
          });

      /*
       * Preserve the first-contact message as the first message
       * in the accepted conversation.
       */
      if (conversation) {
        Conversations.appendMessage({
          conversationId:
            conversation.id,

          senderUserId:
            request.senderUserId,

          body:
            request.message,

          createdAt:
            request.createdAt,

          status:
            "sent",

          local:
            false
        });
      }

      CircleEvents.emit(
        "circle:message-request-accepted",
        {
          request:
            acceptedRequest,

          conversation,

          persist:
            true
        }
      );

      CircleEvents.showToast(
        "Message request accepted."
      );

      return {
        request:
          acceptedRequest,

        conversation
      };
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not accept the message request."
        }
      );

      return null;
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
        "Message request not found."
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

      const declinedRequest = {
        ...request,
        state:
          REQUEST_STATES.DECLINED,

        updatedAt:
          new Date()
            .toISOString()
      };

      CircleEvents.emit(
        "circle:message-request-declined",
        {
          request:
            declinedRequest,

          persist:
            true
        }
      );

      CircleEvents.showToast(
        "Message request declined."
      );

      return true;
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not decline the message request."
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
        "Message request not found."
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

      const canceledRequest = {
        ...request,
        state:
          REQUEST_STATES.CANCELED,

        updatedAt:
          new Date()
            .toISOString()
      };

      CircleEvents.emit(
        "circle:message-request-canceled",
        {
          request:
            canceledRequest,

          persist:
            true
        }
      );

      CircleEvents.showToast(
        "Message request canceled."
      );

      return true;
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not cancel the message request."
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

  removeIncomingRequest(requestId) {
    const id =
      normalizeString(
        requestId
      );

    if (!id) {
      return false;
    }

    const before =
      this.state.incoming
        .length;

    this.state.incoming =
      this.state.incoming
        .filter(
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
      this.state.outgoing
        .length;

    this.state.outgoing =
      this.state.outgoing
        .filter(
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
      this.state
        .busyRequestIds
        .has(id)
    );
  },

  setBusy(
    requestId,
    value
  ) {
    const id =
      normalizeString(
        requestId
      );

    if (!id) {
      return;
    }

    if (value) {
      this.state
        .busyRequestIds
        .add(id);
    } else {
      this.state
        .busyRequestIds
        .delete(id);
    }
  },

  clear() {
    this.state.incoming =
      [];

    this.state.outgoing =
      [];

    this.state
      .busyRequestIds
      .clear();

    this.state.composerTarget =
      null;
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
          "ARI Circle message request unsubscribe failed",
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
        this.state.incoming
          .length,

      outgoingCount:
        this.state.outgoing
          .length,

      busyCount:
        this.state
          .busyRequestIds
          .size,

      composerOpen:
        Boolean(
          this.state
            .composerTarget
        )
    };
  }
};

export {
  MessageRequests,
  REQUEST_STATES,
  MESSAGE_REQUEST_MAX_LENGTH,
  normalizeRequest
};

export default MessageRequests;
