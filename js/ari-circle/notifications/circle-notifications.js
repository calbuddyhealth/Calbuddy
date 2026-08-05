// js/ari-circle/notifications/circle-notifications.js
// ARI Circle
// V1.0.0
//
// Purpose:
// - Own the ARI Circle notification collection.
// - Render the header notification badge.
// - Normalize Circle notification records.
// - Mark notifications read/unread.
// - Route notification actions to the correct feature module.
// - Provide one notification entry point for connection requests,
//   message requests, comments, messages, and Circle activity.
//
// This module does NOT:
// - Query or write to Supabase directly.
// - Render a full notification center UI yet.
// - Own connection request state.
// - Own message request state.
// - Own private conversation state.
//
// Future persistence flow:
//   circle-notifications.js
//        -> CircleEvents
//        -> data/circle-api.js
//
// Future realtime flow:
//   data/circle-realtime.js
//        -> CircleNotifications.addNotification(...)
//
// CircleStore holds notification summary state.
// This module owns the detailed local notification collection.

import CircleStore from "../core/circle-store.js";
import CircleEvents, {
  EVENT_NAMES
} from "../core/circle-events.js";

const VERSION = "1.0.0";
const SOURCE = "ari-circle/notifications/circle-notifications";

const NOTIFICATION_TYPES = Object.freeze({
  CONNECTION_REQUEST:
    "connection_request",

  CONNECTION_ACCEPTED:
    "connection_accepted",

  MESSAGE_REQUEST:
    "message_request",

  MESSAGE:
    "message",

  LOVE:
    "love",

  PROFILE:
    "profile",

  SYSTEM:
    "system"
});

const VALID_NOTIFICATION_TYPES =
  new Set(
    Object.values(
      NOTIFICATION_TYPES
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

function normalizeNotificationType(value) {
  const normalized =
    normalizeString(value)
      ?.toLowerCase();

  if (
    normalized &&
    VALID_NOTIFICATION_TYPES.has(
      normalized
    )
  ) {
    return normalized;
  }

  return NOTIFICATION_TYPES.SYSTEM;
}

function normalizeNotification(notification) {
  if (
    !notification ||
    typeof notification !== "object"
  ) {
    return null;
  }

  const id =
    normalizeString(
      notification.id ||
      notification.notification_id ||
      notification.notificationId
    );

  if (!id) {
    return null;
  }

  const type =
    normalizeNotificationType(
      notification.type
    );

  const title =
    normalizeString(
      notification.title
    ) ||
    "ARI Circle";

  const body =
    normalizeString(
      notification.body ||
      notification.message ||
      notification.text
    );

  return Object.freeze({
    id,
    type,
    title,
    body,

    actorUserId:
      normalizeString(
        notification.actor_user_id ||
        notification.actorUserId
      ),

    actorDisplayName:
      normalizeString(
        notification.actor_display_name ||
        notification.actorDisplayName
      ),

    actorHandle:
      normalizeString(
        notification.actor_handle ||
        notification.actorHandle
      ),

    actorAvatarUrl:
      normalizeString(
        notification.actor_avatar_url ||
        notification.actorAvatarUrl
      ),

    requestId:
      normalizeString(
        notification.request_id ||
        notification.requestId
      ),

    conversationId:
      normalizeString(
        notification.conversation_id ||
        notification.conversationId
      ),

    commentId:
      normalizeString(
        notification.comment_id ||
        notification.commentId
      ),

    profileUserId:
      normalizeString(
        notification.profile_user_id ||
        notification.profileUserId
      ),

    read:
      Boolean(
        notification.read ||
        notification.is_read ||
        notification.isRead
      ),

    createdAt:
      normalizeString(
        notification.created_at ||
        notification.createdAt
      ) ||
      new Date().toISOString(),

    data:
      notification.data &&
      typeof notification.data === "object"
        ? {
            ...notification.data
          }
        : {}
  });
}

function cloneNotification(notification) {
  if (!notification) {
    return null;
  }

  return {
    ...notification,
    data: {
      ...(notification.data || {})
    }
  };
}

function clampUnreadCount(value) {
  const count =
    Number(value);

  if (
    !Number.isFinite(count) ||
    count <= 0
  ) {
    return 0;
  }

  return Math.min(
    Math.floor(count),
    999
  );
}

const CircleNotifications = {
  version:
    VERSION,

  source:
    SOURCE,

  state: {
    initialized:
      false,

    items:
      [],

    panelOpen:
      false,

    unsubscribers:
      []
  },

  dom: {
    button:
      null,

    badge:
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
    this.bindStore();

    this.renderBadge(
      CircleStore.get(
        "notifications.unreadCount"
      )
    );

    this.state.initialized =
      true;

    return this.getDiagnostics();
  },

  cacheDom() {
    this.dom.button =
      document.getElementById(
        "circle-notifications-button"
      );

    this.dom.badge =
      document.getElementById(
        "circle-notification-badge"
      );
  },

  bindActions() {
    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "open-notifications",
        () =>
          this.openNotifications()
      )
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
            keys.includes(
              "notifications"
            )
          ) {
            this.renderBadge(
              state.notifications
                ?.unreadCount
            );
          }
        }
      );

    this.state.unsubscribers.push(
      unsubscribe
    );
  },

  setNotifications(
    notifications = []
  ) {
    this.state.items =
      Array.isArray(
        notifications
      )
        ? notifications
            .map(
              normalizeNotification
            )
            .filter(Boolean)
            .sort(
              (a, b) =>
                new Date(
                  b.createdAt
                ).getTime() -
                new Date(
                  a.createdAt
                ).getTime()
            )
        : [];

    this.syncUnreadCount();

    return this.getNotifications();
  },

  getNotifications() {
    return this.state.items
      .map(
        cloneNotification
      );
  },

  getNotification(
    notificationId
  ) {
    const id =
      normalizeString(
        notificationId
      );

    if (!id) {
      return null;
    }

    const notification =
      this.state.items.find(
        item =>
          item.id === id
      );

    return cloneNotification(
      notification
    );
  },

  addNotification(
    notification
  ) {
    const normalized =
      normalizeNotification(
        notification
      );

    if (!normalized) {
      return null;
    }

    this.state.items =
      [
        normalized,
        ...this.state.items
          .filter(
            item =>
              item.id !==
              normalized.id
          )
      ];

    this.syncUnreadCount();

    CircleEvents.emit(
      EVENT_NAMES.NOTIFICATIONS_CHANGED,
      {
        action:
          "add",

        notification:
          cloneNotification(
            normalized
          )
      }
    );

    return cloneNotification(
      normalized
    );
  },

  removeNotification(
    notificationId
  ) {
    const id =
      normalizeString(
        notificationId
      );

    if (!id) {
      return false;
    }

    const before =
      this.state.items.length;

    this.state.items =
      this.state.items.filter(
        item =>
          item.id !== id
      );

    const changed =
      before !==
      this.state.items.length;

    if (changed) {
      this.syncUnreadCount();

      CircleEvents.emit(
        EVENT_NAMES.NOTIFICATIONS_CHANGED,
        {
          action:
            "remove",

          notificationId:
            id
        }
      );
    }

    return changed;
  },

  markRead(
    notificationId,
    options = {}
  ) {
    const id =
      normalizeString(
        notificationId
      );

    if (!id) {
      return false;
    }

    let changed =
      false;

    this.state.items =
      this.state.items.map(
        item => {
          if (
            item.id !== id ||
            item.read
          ) {
            return item;
          }

          changed =
            true;

          return Object.freeze({
            ...item,
            read:
              true
          });
        }
      );

    if (!changed) {
      return false;
    }

    this.syncUnreadCount();

    if (
      options.persist !==
      false
    ) {
      CircleEvents.emit(
        "circle:notification-read",
        {
          notificationId:
            id,

          persist:
            true
        }
      );
    }

    return true;
  },

  markUnread(
    notificationId,
    options = {}
  ) {
    const id =
      normalizeString(
        notificationId
      );

    if (!id) {
      return false;
    }

    let changed =
      false;

    this.state.items =
      this.state.items.map(
        item => {
          if (
            item.id !== id ||
            !item.read
          ) {
            return item;
          }

          changed =
            true;

          return Object.freeze({
            ...item,
            read:
              false
          });
        }
      );

    if (!changed) {
      return false;
    }

    this.syncUnreadCount();

    if (
      options.persist !==
      false
    ) {
      CircleEvents.emit(
        "circle:notification-unread",
        {
          notificationId:
            id,

          persist:
            true
        }
      );
    }

    return true;
  },

  markAllRead(
    options = {}
  ) {
    const unread =
      this.state.items
        .filter(
          item =>
            !item.read
        );

    if (!unread.length) {
      return 0;
    }

    const unreadIds =
      unread.map(
        item =>
          item.id
      );

    this.state.items =
      this.state.items.map(
        item =>
          item.read
            ? item
            : Object.freeze({
                ...item,
                read:
                  true
              })
      );

    this.syncUnreadCount();

    if (
      options.persist !==
      false
    ) {
      CircleEvents.emit(
        "circle:notifications-all-read",
        {
          notificationIds:
            unreadIds,

          persist:
            true
        }
      );
    }

    return unreadIds.length;
  },

  syncUnreadCount() {
    const unreadCount =
      this.state.items
        .reduce(
          (
            total,
            item
          ) =>
            total +
            (
              item.read
                ? 0
                : 1
            ),
          0
        );

    CircleStore.setNotificationsState({
      unreadCount
    });

    return unreadCount;
  },

  renderBadge(value) {
    const count =
      clampUnreadCount(
        value
      );

    if (!this.dom.badge) {
      return;
    }

    if (count <= 0) {
      this.dom.badge.hidden =
        true;

      this.dom.badge.textContent =
        "";

      this.dom.button
        ?.setAttribute(
          "aria-label",
          "Notifications"
        );

      return;
    }

    this.dom.badge.hidden =
      false;

    this.dom.badge.textContent =
      count > 99
        ? "99+"
        : String(count);

    this.dom.button
      ?.setAttribute(
        "aria-label",
        `Notifications, ${count} unread`
      );
  },

  openNotifications() {
    const context =
      CircleStore.get(
        "context"
      );

    if (
      !context?.isAuthenticated
    ) {
      CircleEvents.showToast(
        "Sign in to view notifications."
      );

      return false;
    }

    this.state.panelOpen =
      true;

    /*
     * A future notification center UI can listen for this event.
     * We keep the controller usable before that UI exists.
     */
    CircleEvents.emit(
      "circle:notifications-opened",
      {
        notifications:
          this.getNotifications(),

        unreadCount:
          CircleStore.get(
            "notifications.unreadCount"
          ) || 0
      }
    );

    return true;
  },

  closeNotifications() {
    if (
      !this.state.panelOpen
    ) {
      return false;
    }

    this.state.panelOpen =
      false;

    CircleEvents.emit(
      "circle:notifications-closed",
      {}
    );

    return true;
  },

  activate(
    notificationId
  ) {
    const notification =
      this.getNotification(
        notificationId
      );

    if (!notification) {
      return false;
    }

    this.markRead(
      notification.id
    );

    switch (
      notification.type
    ) {
      case NOTIFICATION_TYPES.CONNECTION_REQUEST:
        CircleEvents.emit(
          "circle:notification-open-connection-request",
          {
            notification,

            requestId:
              notification.requestId,

            actorUserId:
              notification.actorUserId
          }
        );
        break;

      case NOTIFICATION_TYPES.CONNECTION_ACCEPTED:
        this.openProfileFromNotification(
          notification
        );
        break;

      case NOTIFICATION_TYPES.MESSAGE_REQUEST:
        CircleEvents.emit(
          "circle:notification-open-message-request",
          {
            notification,

            requestId:
              notification.requestId,

            actorUserId:
              notification.actorUserId
          }
        );
        break;

      case NOTIFICATION_TYPES.MESSAGE:
        if (
          notification
            .conversationId
        ) {
          CircleEvents.emit(
            "circle:notification-open-conversation",
            {
              notification,

              conversationId:
                notification
                  .conversationId
            }
          );
        }
        break;

      case NOTIFICATION_TYPES.LOVE:
        CircleEvents.emit(
          "circle:notification-open-love",
          {
            notification,

            commentId:
              notification.commentId,

            profileUserId:
              notification.profileUserId
          }
        );
        break;

      case NOTIFICATION_TYPES.PROFILE:
        this.openProfileFromNotification(
          notification
        );
        break;

      case NOTIFICATION_TYPES.SYSTEM:
      default:
        CircleEvents.emit(
          "circle:notification-open-system",
          {
            notification
          }
        );
        break;
    }

    return true;
  },

  openProfileFromNotification(
    notification
  ) {
    const userId =
      normalizeString(
        notification
          ?.actorUserId ||
        notification
          ?.profileUserId
      );

    const handle =
      normalizeString(
        notification
          ?.actorHandle
      );

    if (
      !userId &&
      !handle
    ) {
      return false;
    }

    CircleEvents.emit(
      "circle:notification-open-profile",
      {
        notification,

        userId,
        handle
      }
    );

    return true;
  },

  getUnreadNotifications() {
    return this.state.items
      .filter(
        item =>
          !item.read
      )
      .map(
        cloneNotification
      );
  },

  clear() {
    this.state.items =
      [];

    this.state.panelOpen =
      false;

    CircleStore.setNotificationsState({
      unreadCount:
        0
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
          "ARI Circle notifications unsubscribe failed",
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

      notificationCount:
        this.state.items
          .length,

      unreadCount:
        clampUnreadCount(
          CircleStore.get(
            "notifications.unreadCount"
          )
        ),

      panelOpen:
        this.state.panelOpen,

      buttonFound:
        Boolean(
          this.dom.button
        ),

      badgeFound:
        Boolean(
          this.dom.badge
        )
    };
  }
};

export {
  CircleNotifications,
  NOTIFICATION_TYPES,
  normalizeNotification
};

export default CircleNotifications;
