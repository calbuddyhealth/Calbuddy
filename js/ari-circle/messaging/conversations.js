// js/ari-circle/messaging/conversations.js
// ARI Circle
// V1.0.1
//
// Purpose:
// - Own direct-message conversation and message state.
// - Find an existing 1-to-1 conversation for two users.
// - Create a local conversation shell when one does not exist.
// - Reconcile local conversation shells with persisted Supabase conversations.
// - Open / close active conversations.
// - Append sent and received messages.
// - Emit persistence events for the data layer.
//
// V1.0.1:
// - Listens for "circle:conversation-persisted".
// - Replaces temporary local conversation IDs with the real Supabase ID.
// - Preserves the active conversation when a local ID is replaced.
// - Moves any locally staged message collection to the persisted ID.
// - Correctly normalizes member profiles returned by CircleApi.
// - Prevents sending messages against temporary local conversation IDs.
//
// This module does NOT:
// - Query or write to Supabase directly.
// - Own message-request approval logic.
// - Subscribe to realtime channels.
// - Render the full inbox/thread UI.
//
// Persistence flow:
//   conversations.js
//        -> CircleEvents
//        -> data/circle-api.js
//        -> circle:conversation-persisted
//        -> conversations.js reconciles local state
//
// Realtime flow:
//   data/circle-realtime.js
//        -> Conversations.receiveMessage(...)
//
// CircleStore keeps shared messaging summary state.
// Conversations owns the detailed local conversation/message collection.

import CircleStore from "../core/circle-store.js";
import CircleEvents, {
  EVENT_NAMES
} from "../core/circle-events.js";

const VERSION = "1.0.1";
const SOURCE = "ari-circle/messaging/conversations";

const MESSAGE_MAX_LENGTH = 4000;

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

function isLocalConversationId(value) {
  const id =
    normalizeString(
      value
    );

  return Boolean(
    id &&
    id.startsWith(
      "conversation-"
    )
  );
}

function normalizeMember(member) {
  if (
    !member ||
    typeof member !== "object"
  ) {
    return null;
  }

  /*
   * CircleApi returns conversation members as:
   *
   * {
   *   user_id,
   *   profile: {
   *     display_name,
   *     handle,
   *     avatar_url,
   *     ...
   *   }
   * }
   *
   * Local conversation shells may instead place profile fields
   * directly on the member object.
   */
  const profile =
    member?.profile &&
    typeof member.profile ===
      "object"
      ? member.profile
      : member;

  const userId =
    normalizeString(
      member.user_id ||
      member.userId ||
      member.id ||
      profile?.user_id ||
      profile?.userId ||
      profile?.id
    );

  if (!userId) {
    return null;
  }

  return Object.freeze({
    userId,

    displayName:
      normalizeString(
        profile?.display_name ||
        profile?.displayName ||
        profile?.name ||
        member?.display_name ||
        member?.displayName ||
        member?.name
      ) ||
      "ARI User",

    handle:
      normalizeString(
        profile?.handle ||
        profile?.username ||
        member?.handle ||
        member?.username
      ),

    avatarUrl:
      normalizeString(
        profile?.avatar_url ||
        profile?.avatarUrl ||
        profile?.photo_url ||
        profile?.photoUrl ||
        member?.avatar_url ||
        member?.avatarUrl ||
        member?.photo_url ||
        member?.photoUrl
      )
  });
}

function normalizeConversation(conversation) {
  if (
    !conversation ||
    typeof conversation !== "object"
  ) {
    return null;
  }

  const id =
    normalizeString(
      conversation.id ||
      conversation.conversation_id ||
      conversation.conversationId
    );

  if (!id) {
    return null;
  }

  const members =
    Array.isArray(
      conversation.members
    )
      ? conversation.members
          .map(
            normalizeMember
          )
          .filter(Boolean)
      : [];

  return Object.freeze({
    id,

    type:
      normalizeString(
        conversation.type
      ) ||
      "direct",

    members,

    createdAt:
      normalizeString(
        conversation.created_at ||
        conversation.createdAt
      ),

    updatedAt:
      normalizeString(
        conversation.updated_at ||
        conversation.updatedAt
      ),

    lastMessageAt:
      normalizeString(
        conversation.last_message_at ||
        conversation.lastMessageAt
      ),

    unreadCount:
      Number.isFinite(
        Number(
          conversation.unread_count ??
          conversation.unreadCount
        )
      )
        ? Math.max(
            0,
            Number(
              conversation.unread_count ??
              conversation.unreadCount
            )
          )
        : 0,

    local:
      Boolean(
        conversation.local ||
        isLocalConversationId(id)
      ),

    pendingPersistence:
      Boolean(
        conversation.pendingPersistence ||
        conversation.pending_persistence ||
        isLocalConversationId(id)
      )
  });
}

function normalizeMessage(message) {
  if (
    !message ||
    typeof message !== "object"
  ) {
    return null;
  }

  const conversationId =
    normalizeString(
      message.conversation_id ||
      message.conversationId
    );

  const senderUserId =
    normalizeString(
      message.sender_user_id ||
      message.senderUserId
    );

  const body =
    normalizeString(
      message.body ||
      message.text ||
      message.message
    );

  if (
    !conversationId ||
    !senderUserId ||
    !body
  ) {
    return null;
  }

  return Object.freeze({
    id:
      normalizeString(
        message.id ||
        message.message_id ||
        message.messageId
      ) ||
      createLocalId(
        "message"
      ),

    conversationId,
    senderUserId,

    body:
      body.slice(
        0,
        MESSAGE_MAX_LENGTH
      ),

    createdAt:
      normalizeString(
        message.created_at ||
        message.createdAt
      ) ||
      new Date()
        .toISOString(),

    status:
      normalizeString(
        message.status
      ) ||
      "sent",

    local:
      Boolean(
        message.local
      )
  });
}

function sameDirectMembers(
  conversation,
  userA,
  userB
) {
  if (
    conversation?.type !== "direct"
  ) {
    return false;
  }

  const ids =
    conversation.members
      .map(
        member =>
          member.userId
      )
      .filter(Boolean);

  if (ids.length !== 2) {
    return false;
  }

  const set =
    new Set(ids);

  return (
    set.has(userA) &&
    set.has(userB)
  );
}

const Conversations = {
  version:
    VERSION,

  source:
    SOURCE,

  state: {
    initialized:
      false,

    conversations:
      [],

    messagesByConversation:
      new Map(),

    busyConversationIds:
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
        "circle:conversation-requested",
        payload => {
          const detail =
            payload?.detail ||
            {};

          this.openOrCreateDirectConversation({
            viewerUserId:
              detail.viewerUserId,

            recipientUserId:
              detail.recipientUserId,

            recipientProfile:
              detail.profile
          });
        }
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        "circle:open-messages",
        () => {
          this.openInbox();
        }
      )
    );

    /*
     * V1.0.1:
     * CircleApi creates the real Supabase conversation and then emits
     * this event with both the local temporary ID and persisted row.
     */
    this.state.unsubscribers.push(
      CircleEvents.on(
        "circle:conversation-persisted",
        payload => {
          const detail =
            payload?.detail ||
            {};

          this.reconcilePersistedConversation({
            localConversationId:
              detail.localConversationId,

            conversation:
              detail.conversation
          });
        }
      )
    );
  },

  setConversations(conversations = []) {
    this.state.conversations =
      Array.isArray(
        conversations
      )
        ? conversations
            .map(
              normalizeConversation
            )
            .filter(Boolean)
        : [];

    this.recalculateUnreadCount();

    return this.getConversations();
  },

  getConversations() {
    return this.state.conversations
      .map(
        conversation => ({
          ...conversation,

          members:
            conversation.members
              .map(
                member => ({
                  ...member
                })
              )
        })
      );
  },

  getConversation(conversationId) {
    const id =
      normalizeString(
        conversationId
      );

    if (!id) {
      return null;
    }

    return (
      this.state.conversations
        .find(
          conversation =>
            conversation.id === id
        ) ||
      null
    );
  },

  findDirectConversation(
    userA,
    userB
  ) {
    const first =
      normalizeString(userA);

    const second =
      normalizeString(userB);

    if (
      !first ||
      !second ||
      first === second
    ) {
      return null;
    }

    return (
      this.state.conversations
        .find(
          conversation =>
            sameDirectMembers(
              conversation,
              first,
              second
            )
        ) ||
      null
    );
  },

  openOrCreateDirectConversation({
    viewerUserId,
    recipientUserId,
    recipientProfile = null
  } = {}) {
    const viewerId =
      normalizeString(
        viewerUserId
      );

    const recipientId =
      normalizeString(
        recipientUserId
      );

    if (
      !viewerId ||
      !recipientId ||
      viewerId === recipientId
    ) {
      return null;
    }

    let conversation =
      this.findDirectConversation(
        viewerId,
        recipientId
      );

    if (!conversation) {
      conversation =
        normalizeConversation({
          id:
            createLocalId(
              "conversation"
            ),

          type:
            "direct",

          createdAt:
            new Date()
              .toISOString(),

          updatedAt:
            new Date()
              .toISOString(),

          unreadCount:
            0,

          local:
            true,

          pendingPersistence:
            true,

          members: [
            {
              userId:
                viewerId,

              displayName:
                "You"
            },
            {
              userId:
                recipientId,

              displayName:
                normalizeString(
                  recipientProfile
                    ?.display_name ||
                  recipientProfile
                    ?.displayName ||
                  recipientProfile
                    ?.name
                ) ||
                "ARI User",

              handle:
                normalizeString(
                  recipientProfile
                    ?.handle ||
                  recipientProfile
                    ?.username
                ),

              avatarUrl:
                normalizeString(
                  recipientProfile
                    ?.avatar_url ||
                  recipientProfile
                    ?.avatarUrl
                )
            }
          ]
        });

      this.state.conversations =
        [
          conversation,
          ...this.state
            .conversations
        ];

      CircleEvents.emit(
        "circle:conversation-created",
        {
          conversation,
          persist:
            true
        }
      );
    }

    this.openConversation(
      conversation.id
    );

    return conversation;
  },

  reconcilePersistedConversation({
    localConversationId,
    conversation
  } = {}) {
    const localId =
      normalizeString(
        localConversationId
      );

    const persisted =
      normalizeConversation(
        {
          ...(conversation || {}),

          local:
            false,

          pendingPersistence:
            false
        }
      );

    if (!persisted) {
      return null;
    }

    /*
     * If there was no temporary local shell, simply merge the persisted
     * conversation into the collection.
     */
    if (!localId) {
      const existingIndex =
        this.state.conversations
          .findIndex(
            item =>
              item.id ===
              persisted.id
          );

      if (existingIndex >= 0) {
        this.state.conversations =
          this.state.conversations
            .map(
              (
                item,
                index
              ) =>
                index ===
                existingIndex
                  ? persisted
                  : item
            );
      } else {
        this.state.conversations =
          [
            persisted,
            ...this.state
              .conversations
          ];
      }

      this.recalculateUnreadCount();

      return persisted;
    }

    const localConversation =
      this.getConversation(
        localId
      );

    const existingPersisted =
      this.getConversation(
        persisted.id
      );

    /*
     * Remove both the temporary shell and any duplicate persisted record,
     * then insert one canonical persisted conversation.
     */
    this.state.conversations =
      this.state.conversations
        .filter(
          item =>
            item.id !== localId &&
            item.id !==
              persisted.id
        );

    const merged =
      normalizeConversation({
        ...(localConversation || {}),
        ...persisted,

        members:
          persisted.members
            ?.length
              ? persisted.members
              : localConversation
                ?.members ||
                [],

        unreadCount:
          Math.max(
            Number(
              existingPersisted
                ?.unreadCount
            ) || 0,
            Number(
              persisted
                .unreadCount
            ) || 0
          ),

        local:
          false,

        pendingPersistence:
          false
      });

    this.state.conversations =
      [
        merged,
        ...this.state
          .conversations
      ];

    /*
     * Move any staged local messages to the real conversation ID.
     * This is mostly defensive because sendMessage() blocks temporary IDs,
     * but it protects state if another UI module staged messages locally.
     */
    const localMessages =
      this.state
        .messagesByConversation
        .get(localId) ||
      [];

    const persistedMessages =
      this.state
        .messagesByConversation
        .get(
          persisted.id
        ) ||
      [];

    if (
      localMessages.length ||
      persistedMessages.length
    ) {
      const mergedMessages =
        [
          ...persistedMessages,
          ...localMessages
        ]
          .map(
            message =>
              normalizeMessage({
                ...message,

                conversationId:
                  persisted.id
              })
          )
          .filter(Boolean);

      const seen =
        new Set();

      const deduped =
        mergedMessages
          .filter(
            message => {
              if (
                seen.has(
                  message.id
                )
              ) {
                return false;
              }

              seen.add(
                message.id
              );

              return true;
            }
          )
          .sort(
            (a, b) =>
              new Date(
                a.createdAt
              ).getTime() -
              new Date(
                b.createdAt
              ).getTime()
          );

      this.state
        .messagesByConversation
        .set(
          persisted.id,
          deduped
        );
    }

    this.state
      .messagesByConversation
      .delete(localId);

    /*
     * Preserve the open thread when the temporary ID becomes permanent.
     */
    const activeConversationId =
      normalizeString(
        CircleStore.get(
          "messaging.activeConversationId"
        )
      );

    if (
      activeConversationId ===
      localId
    ) {
      CircleStore.setMessagingState({
        activeConversationId:
          persisted.id
      });
    }

    this.recalculateUnreadCount();

    CircleEvents.emit(
      "circle:conversation-reconciled",
      {
        localConversationId:
          localId,

        conversation:
          merged
      }
    );

    /*
     * Re-emit the opened event with the canonical conversation so the
     * conversation UI can switch from the temporary shell to the real ID.
     */
    if (
      activeConversationId ===
      localId
    ) {
      CircleEvents.emit(
        "circle:conversation-opened",
        {
          conversation:
            merged,

          reconciled:
            true
        }
      );
    }

    return merged;
  },

  openConversation(
    conversationId
  ) {
    const conversation =
      this.getConversation(
        conversationId
      );

    if (!conversation) {
      return false;
    }

    CircleStore.setMessagingState({
      activeConversationId:
        conversation.id
    });

    this.markConversationRead(
      conversation.id
    );

    CircleEvents.emit(
      "circle:conversation-opened",
      {
        conversation
      }
    );

    return true;
  },

  closeConversation() {
    const activeConversationId =
      CircleStore.get(
        "messaging.activeConversationId"
      );

    if (!activeConversationId) {
      return false;
    }

    CircleStore.setMessagingState({
      activeConversationId:
        null
    });

    CircleEvents.emit(
      "circle:conversation-closed",
      {
        conversationId:
          activeConversationId
      }
    );

    return true;
  },

  openInbox() {
    CircleEvents.emit(
      "circle:inbox-opened",
      {
        conversations:
          this.getConversations()
      }
    );

    return true;
  },

  setMessages(
    conversationId,
    messages = []
  ) {
    const id =
      normalizeString(
        conversationId
      );

    if (!id) {
      return [];
    }

    const normalized =
      Array.isArray(messages)
        ? messages
            .map(
              normalizeMessage
            )
            .filter(
              message =>
                message &&
                message.conversationId ===
                  id
            )
        : [];

    normalized.sort(
      (a, b) =>
        new Date(
          a.createdAt
        ).getTime() -
        new Date(
          b.createdAt
        ).getTime()
    );

    this.state
      .messagesByConversation
      .set(
        id,
        normalized
      );

    return this.getMessages(
      id
    );
  },

  getMessages(
    conversationId
  ) {
    const id =
      normalizeString(
        conversationId
      );

    if (!id) {
      return [];
    }

    const messages =
      this.state
        .messagesByConversation
        .get(id) ||
      [];

    return messages.map(
      message => ({
        ...message
      })
    );
  },

  async sendMessage({
    conversationId,
    body
  } = {}) {
    const id =
      normalizeString(
        conversationId
      );

    const text =
      normalizeString(
        body
      );

    const context =
      CircleStore.get(
        "context"
      );

    if (
      !id ||
      !text ||
      !context?.viewerUserId
    ) {
      return null;
    }

    /*
     * Never persist a message using a temporary browser-only conversation
     * ID. Wait for circle:conversation-persisted to replace it first.
     */
    if (
      isLocalConversationId(
        id
      )
    ) {
      CircleEvents.showToast(
        "Preparing this conversation. Try again in a moment."
      );

      return null;
    }

    if (
      text.length >
      MESSAGE_MAX_LENGTH
    ) {
      CircleEvents.showToast(
        `Messages can be up to ${MESSAGE_MAX_LENGTH} characters.`
      );

      return null;
    }

    const conversation =
      this.getConversation(
        id
      );

    if (!conversation) {
      return null;
    }

    if (
      conversation
        .pendingPersistence
    ) {
      CircleEvents.showToast(
        "Preparing this conversation. Try again in a moment."
      );

      return null;
    }

    if (
      this.isBusy(id)
    ) {
      return null;
    }

    this.setBusy(
      id,
      true
    );

    try {
      const message =
        normalizeMessage({
          id:
            createLocalId(
              "message"
            ),

          conversationId:
            id,

          senderUserId:
            context.viewerUserId,

          body:
            text,

          createdAt:
            new Date()
              .toISOString(),

          status:
            "sending",

          local:
            true
        });

      this.appendMessage(
        message
      );

      this.touchConversation(
        id,
        {
          lastMessageAt:
            message.createdAt,

          updatedAt:
            message.createdAt
        }
      );

      CircleEvents.emit(
        EVENT_NAMES.MESSAGE_SENT,
        {
          message,
          conversation,
          persist:
            true
        }
      );

      return message;
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not send your message."
        }
      );

      return null;
    } finally {
      this.setBusy(
        id,
        false
      );
    }
  },

  receiveMessage(message) {
    const normalized =
      normalizeMessage(
        message
      );

    if (!normalized) {
      return null;
    }

    this.appendMessage(
      normalized
    );

    this.touchConversation(
      normalized
        .conversationId,
      {
        lastMessageAt:
          normalized
            .createdAt,

        updatedAt:
          normalized
            .createdAt
      }
    );

    const activeConversationId =
      normalizeString(
        CircleStore.get(
          "messaging.activeConversationId"
        )
      );

    if (
      activeConversationId ===
      normalized.conversationId
    ) {
      this.markConversationRead(
        normalized
          .conversationId
      );
    } else {
      this.incrementConversationUnread(
        normalized
          .conversationId
      );
    }

    CircleEvents.emit(
      EVENT_NAMES.MESSAGE_RECEIVED,
      {
        message:
          normalized
      }
    );

    return normalized;
  },

  appendMessage(message) {
    const normalized =
      normalizeMessage(
        message
      );

    if (!normalized) {
      return null;
    }

    const id =
      normalized
        .conversationId;

    const current =
      this.state
        .messagesByConversation
        .get(id) ||
      [];

    const withoutDuplicate =
      current.filter(
        item =>
          item.id !==
          normalized.id
      );

    const next =
      [
        ...withoutDuplicate,
        normalized
      ];

    next.sort(
      (a, b) =>
        new Date(
          a.createdAt
        ).getTime() -
        new Date(
          b.createdAt
        ).getTime()
    );

    this.state
      .messagesByConversation
      .set(
        id,
        next
      );

    CircleEvents.emit(
      "circle:conversation-messages-changed",
      {
        conversationId:
          id,

        messages:
          this.getMessages(id)
      }
    );

    return normalized;
  },

  touchConversation(
    conversationId,
    patch = {}
  ) {
    const id =
      normalizeString(
        conversationId
      );

    if (!id) {
      return null;
    }

    let updated =
      null;

    this.state.conversations =
      this.state.conversations
        .map(
          conversation => {
            if (
              conversation.id !== id
            ) {
              return conversation;
            }

            updated =
              Object.freeze({
                ...conversation,
                ...patch
              });

            return updated;
          }
        );

    return updated;
  },

  incrementConversationUnread(
    conversationId,
    amount = 1
  ) {
    const id =
      normalizeString(
        conversationId
      );

    if (!id) {
      return false;
    }

    const delta =
      Math.max(
        1,
        Number(amount) || 1
      );

    let changed =
      false;

    this.state.conversations =
      this.state.conversations
        .map(
          conversation => {
            if (
              conversation.id !== id
            ) {
              return conversation;
            }

            changed =
              true;

            return Object.freeze({
              ...conversation,

              unreadCount:
                Math.max(
                  0,
                  Number(
                    conversation
                      .unreadCount
                  ) || 0
                ) +
                delta
            });
          }
        );

    if (changed) {
      this.recalculateUnreadCount();
    }

    return changed;
  },

  markConversationRead(
    conversationId
  ) {
    const id =
      normalizeString(
        conversationId
      );

    if (!id) {
      return false;
    }

    let changed =
      false;

    this.state.conversations =
      this.state.conversations
        .map(
          conversation => {
            if (
              conversation.id !== id
            ) {
              return conversation;
            }

            if (
              Number(
                conversation
                  .unreadCount
              ) === 0
            ) {
              return conversation;
            }

            changed =
              true;

            return Object.freeze({
              ...conversation,
              unreadCount:
                0
            });
          }
        );

    if (changed) {
      this.recalculateUnreadCount();

      CircleEvents.emit(
        "circle:conversation-read",
        {
          conversationId:
            id,

          persist:
            true
        }
      );
    }

    return changed;
  },

  recalculateUnreadCount() {
    const total =
      this.state.conversations
        .reduce(
          (
            sum,
            conversation
          ) =>
            sum +
            Math.max(
              0,
              Number(
                conversation
                  .unreadCount
              ) || 0
            ),
          0
        );

    CircleStore.setMessagingState({
      unreadCount:
        total
    });

    return total;
  },

  isBusy(
    conversationId
  ) {
    const id =
      normalizeString(
        conversationId
      );

    return Boolean(
      id &&
      this.state
        .busyConversationIds
        .has(id)
    );
  },

  setBusy(
    conversationId,
    value
  ) {
    const id =
      normalizeString(
        conversationId
      );

    if (!id) {
      return;
    }

    if (value) {
      this.state
        .busyConversationIds
        .add(id);
    } else {
      this.state
        .busyConversationIds
        .delete(id);
    }
  },

  clear() {
    this.state.conversations =
      [];

    this.state
      .messagesByConversation
      .clear();

    this.state
      .busyConversationIds
      .clear();

    CircleStore.setMessagingState({
      unreadCount:
        0,

      activeConversationId:
        null
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
          "ARI Circle conversations unsubscribe failed",
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
    const activeConversationId =
      CircleStore.get(
        "messaging.activeConversationId"
      );

    return {
      ready:
        this.state.initialized,

      source:
        this.source,

      version:
        this.version,

      conversationCount:
        this.state
          .conversations
          .length,

      activeConversationId:
        activeConversationId ||
        null,

      messageCollectionCount:
        this.state
          .messagesByConversation
          .size,

      busyConversationCount:
        this.state
          .busyConversationIds
          .size,

      localConversationCount:
        this.state.conversations
          .filter(
            conversation =>
              conversation.local ||
              conversation
                .pendingPersistence
          )
          .length
    };
  }
};

export {
  Conversations,
  MESSAGE_MAX_LENGTH,
  normalizeConversation,
  normalizeMessage
};

export default Conversations;
