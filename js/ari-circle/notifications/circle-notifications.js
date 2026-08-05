// js/ari-circle/notifications/circle-notifications.js
// ARI Circle
// V1.1.0
//
// Purpose:
// - Own the ARI Circle notification collection and unread badge.
// - Render the notification center dialog.
// - Route notification actions to the correct feature module.
// - Let incoming Circle requests be accepted/declined from notifications.
// - Keep Supabase access out of the UI layer.
//
// Persistence:
//   CircleNotifications -> CircleEvents -> circle-api.js
//
// Request lifecycle:
//   notification action -> ConnectionRequests -> CircleEvents -> circle-api.js

import CircleStore from "../core/circle-store.js";
import CircleEvents, {
  EVENT_NAMES
} from "../core/circle-events.js";

const VERSION = "1.1.0";
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

  return Object.freeze({
    id,

    type:
      normalizeNotificationType(
        notification.type
      ),

    title:
      normalizeString(
        notification.title
      ) ||
      "ARI Circle",

    body:
      normalizeString(
        notification.body ||
        notification.message ||
        notification.text
      ),

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
        notification.requestId ||
        notification.data?.connection_id
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
        notification.read ??
        notification.is_read ??
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

function getInitials(notification) {
  const value =
    normalizeString(
      notification?.actorDisplayName
    ) ||
    normalizeString(
      notification?.actorHandle
    ) ||
    "A";

  const words =
    value
      .replace(/^@/, "")
      .split(/\s+/)
      .filter(Boolean);

  if (!words.length) {
    return "A";
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();
}

function formatTime(value) {
  const timestamp =
    new Date(value)
      .getTime();

  if (!Number.isFinite(timestamp)) {
    return "";
  }

  const delta =
    Date.now() -
    timestamp;

  const minute =
    60 * 1000;

  const hour =
    60 * minute;

  const day =
    24 * hour;

  if (delta < minute) {
    return "now";
  }

  if (delta < hour) {
    return `${Math.max(
      1,
      Math.floor(delta / minute)
    )}m`;
  }

  if (delta < day) {
    return `${Math.floor(
      delta / hour
    )}h`;
  }

  if (delta < 7 * day) {
    return `${Math.floor(
      delta / day
    )}d`;
  }

  return new Date(value)
    .toLocaleDateString(
      undefined,
      {
        month:
          "short",

        day:
          "numeric"
      }
    );
}

function getNotificationLabel(type) {
  switch (type) {
    case NOTIFICATION_TYPES.CONNECTION_REQUEST:
      return "CIRCLE REQUEST";

    case NOTIFICATION_TYPES.CONNECTION_ACCEPTED:
      return "CIRCLE UPDATE";

    case NOTIFICATION_TYPES.MESSAGE_REQUEST:
      return "MESSAGE REQUEST";

    case NOTIFICATION_TYPES.MESSAGE:
      return "MESSAGE";

    case NOTIFICATION_TYPES.LOVE:
      return "PROFILE LOVE";

    case NOTIFICATION_TYPES.PROFILE:
      return "PROFILE";

    default:
      return "SYSTEM";
  }
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

    resolvedRequests:
      new Map(),

    unsubscribers:
      []
  },

  dom: {
    button:
      null,

    badge:
      null,

    dialog:
      null,

    list:
      null,

    empty:
      null,

    markAll:
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
    this.bindDomainEvents();

    this.renderBadge(
      CircleStore.get(
        "notifications.unreadCount"
      )
    );

    this.renderPanel();

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

    this.dom.dialog =
      document.getElementById(
        "circle-notifications-dialog"
      );

    this.dom.list =
      document.getElementById(
        "circle-notifications-list"
      );

    this.dom.empty =
      document.getElementById(
        "circle-notifications-empty"
      );

    this.dom.markAll =
      document.getElementById(
        "circle-notifications-mark-all"
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

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "close-notifications",
        () =>
          this.closeNotifications()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "mark-all-notifications-read",
        () => {
          this.markAllRead();
          this.renderPanel();
        }
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "open-circle-notification",
        payload => {
          const notificationId =
            normalizeString(
              payload?.trigger
                ?.dataset
                ?.notificationId
            );

          if (notificationId) {
            this.activate(
              notificationId
            );
          }
        }
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

  bindDomainEvents() {
    this.state.unsubscribers.push(
      CircleEvents.on(
        "circle:incoming-request-resolved",
        payload => {
          const detail =
            payload?.detail ||
            {};

          const requestId =
            normalizeString(
              detail?.requestId ||
              detail?.request?.id
            );

          if (!requestId) {
            return;
          }

          const action =
            normalizeString(
              detail?.action
            ) ||
            "resolved";

          this.state
            .resolvedRequests
            .set(
              requestId,
              action
            );

          for (
            const item
            of this.state.items
          ) {
            if (
              item.type ===
                NOTIFICATION_TYPES
                  .CONNECTION_REQUEST &&
              item.requestId ===
                requestId
            ) {
              this.markRead(
                item.id
              );
            }
          }

          this.renderPanel();
        }
      )
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
    this.renderPanel();

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
    this.renderPanel();

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
      this.renderPanel();

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
    this.renderPanel();

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
    this.renderPanel();

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
    this.renderPanel();

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

  renderPanel() {
    const list =
      this.dom.list;

    if (!list) {
      return;
    }

    list.textContent =
      "";

    const notifications =
      this.state.items;

    this.dom.empty &&
      (
        this.dom.empty.hidden =
          notifications.length >
          0
      );

    if (this.dom.markAll) {
      this.dom.markAll.disabled =
        !notifications.some(
          item =>
            !item.read
        );
    }

    for (
      const notification
      of notifications
    ) {
      list.appendChild(
        this.createNotificationElement(
          notification
        )
      );
    }
  },

  createNotificationElement(
    notification
  ) {
    const article =
      document.createElement(
        "article"
      );

    article.className =
      "circle-notification-item";

    article.dataset.read =
      notification.read
        ? "true"
        : "false";

    article.dataset.type =
      notification.type;

    const avatar =
      document.createElement(
        notification.actorUserId
          ? "button"
          : "div"
      );

    avatar.className =
      "circle-notification-item__avatar";

    if (
      notification.actorUserId
    ) {
      avatar.type =
        "button";

      avatar.dataset.circleAction =
        "open-profile";

      avatar.dataset.userId =
        notification.actorUserId;

      if (
        notification.actorHandle
      ) {
        avatar.dataset.handle =
          notification.actorHandle;
      }

      avatar.setAttribute(
        "aria-label",
        `View ${
          notification.actorDisplayName ||
          "profile"
        }`
      );
    }

    if (
      notification.actorAvatarUrl
    ) {
      const image =
        document.createElement(
          "img"
        );

      image.src =
        notification.actorAvatarUrl;

      image.alt =
        "";

      avatar.appendChild(
        image
      );
    } else {
      const fallback =
        document.createElement(
          "span"
        );

      fallback.textContent =
        getInitials(
          notification
        );

      avatar.appendChild(
        fallback
      );
    }

    const body =
      document.createElement(
        "div"
      );

    body.className =
      "circle-notification-item__body";

    const meta =
      document.createElement(
        "div"
      );

    meta.className =
      "circle-notification-item__meta";

    const type =
      document.createElement(
        "span"
      );

    type.className =
      "circle-notification-item__type";

    type.textContent =
      getNotificationLabel(
        notification.type
      );

    const time =
      document.createElement(
        "time"
      );

    time.className =
      "circle-notification-item__time";

    time.dateTime =
      notification.createdAt;

    time.textContent =
      formatTime(
        notification.createdAt
      );

    meta.append(
      type,
      time
    );

    const title =
      document.createElement(
        "button"
      );

    title.type =
      "button";

    title.className =
      "circle-notification-item__title";

    title.dataset.circleAction =
      "open-circle-notification";

    title.dataset.notificationId =
      notification.id;

    title.textContent =
      notification.title;

    const text =
      document.createElement(
        "p"
      );

    text.className =
      "circle-notification-item__text";

    text.textContent =
      notification.body ||
      "";

    body.append(
      meta,
      title
    );

    if (
      notification.body
    ) {
      body.appendChild(
        text
      );
    }

    const actions =
      document.createElement(
        "div"
      );

    actions.className =
      "circle-notification-item__actions";

    const resolvedAction =
      notification.requestId
        ? this.state
            .resolvedRequests
            .get(
              notification.requestId
            )
        : null;

    if (
      notification.type ===
        NOTIFICATION_TYPES
          .CONNECTION_REQUEST &&
      notification.requestId &&
      !resolvedAction
    ) {
      const view =
        document.createElement(
          "button"
        );

      view.type =
        "button";

      view.className =
        "circle-button circle-button--secondary circle-button--small";

      view.dataset.circleAction =
        "open-incoming-request";

      view.dataset.requestId =
        notification.requestId;

      view.textContent =
        "View Request";

      const decline =
        document.createElement(
          "button"
        );

      decline.type =
        "button";

      decline.className =
        "circle-button circle-button--secondary circle-button--small";

      decline.dataset.circleAction =
        "decline-incoming-request";

      decline.dataset.requestId =
        notification.requestId;

      decline.textContent =
        "Decline";

      const accept =
        document.createElement(
          "button"
        );

      accept.type =
        "button";

      accept.className =
        "circle-button circle-button--primary circle-button--small";

      accept.dataset.circleAction =
        "accept-incoming-request";

      accept.dataset.requestId =
        notification.requestId;

      accept.textContent =
        "Accept";

      actions.append(
        view,
        decline,
        accept
      );
    } else if (
      resolvedAction
    ) {
      const status =
        document.createElement(
          "span"
        );

      status.className =
        "circle-notification-item__resolved";

      status.textContent =
        resolvedAction ===
          "accepted"
          ? "Accepted"
          : resolvedAction ===
              "declined"
            ? "Declined"
            : "Handled";

      actions.appendChild(
        status
      );
    } else {
      const open =
        document.createElement(
          "button"
        );

      open.type =
        "button";

      open.className =
        "circle-button circle-button--secondary circle-button--small";

      open.dataset.circleAction =
        "open-circle-notification";

      open.dataset.notificationId =
        notification.id;

      open.textContent =
        "Open";

      actions.appendChild(
        open
      );
    }

    body.appendChild(
      actions
    );

    article.append(
      avatar,
      body
    );

    return article;
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
     * Notifications live inside the overflow menu. Once selected,
     * close that menu so it is not waiting behind the modal.
     */
    const profileMenu =
      document.getElementById(
        "circle-profile-menu"
      );

    const profileMenuButton =
      document.getElementById(
        "circle-profile-menu-button"
      );

    if (profileMenu) {
      profileMenu.hidden =
        true;
    }

    profileMenuButton
      ?.setAttribute(
        "aria-expanded",
        "false"
      );

    this.renderPanel();

    const dialog =
      this.dom.dialog;

    if (
      dialog &&
      !dialog.open
    ) {
      if (
        typeof dialog.showModal ===
          "function"
      ) {
        dialog.showModal();
      } else {
        dialog.setAttribute(
          "open",
          ""
        );
      }
    }

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
      !this.state.panelOpen &&
      !this.dom.dialog?.open
    ) {
      return false;
    }

    this.state.panelOpen =
      false;

    const dialog =
      this.dom.dialog;

    if (
      dialog?.open
    ) {
      if (
        typeof dialog.close ===
          "function"
      ) {
        dialog.close();
      } else {
        dialog.removeAttribute(
          "open"
        );
      }
    }

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
        this.closeNotifications();

        CircleEvents.emit(
          "circle:open-incoming-request",
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

    const url =
      new URL(
        "ari-circle.html",
        window.location.href
      );

    if (handle) {
      url.searchParams.set(
        "handle",
        handle.replace(
          /^@+/,
          ""
        )
      );
    } else {
      url.searchParams.set(
        "user",
        userId
      );
    }

    window.location.assign(
      url.href
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

    this.state
      .resolvedRequests
      .clear();

    CircleStore.setNotificationsState({
      unreadCount:
        0
    });

    this.renderPanel();
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

    this.closeNotifications();
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
        ),

      dialogFound:
        Boolean(
          this.dom.dialog
        ),

      listFound:
        Boolean(
          this.dom.list
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
