// js/ari-circle/notifications/circle-notifications.js
// ARI Circle Notifications V2.4.1
// Single owner for notification state, rendering, badge, actions, and compact UI.
//
// V2.4.1:
// - Allows actionable system notifications to navigate to a same-origin href.
// - Rejects cross-origin notification hrefs and preserves the legacy system event fallback.
//
// V2.4.0:
// - Bundles repeated direct-message notifications by conversation/person.
// - Gives incoming Circle requests a dedicated action row owned by the card.
// - Uses the compact Activity header contract and cache-busts notification CSS.
// - Opening a message bundle marks every bundled message read and removes the
//   resolved bundle from the active inbox before opening the conversation.
//
// V2.2.0:
// - Resolved incoming Circle request cards leave the active Activity inbox immediately.
// - Resolved request notifications are persisted as read before removal.
// - Refreshed/realtime notification payloads cannot re-add a request already resolved this session.

import CircleStore from "../core/circle-store.js";
import CircleEvents, { EVENT_NAMES } from "../core/circle-events.js";

const VERSION = "2.4.1";
const SOURCE = "ari-circle/notifications/circle-notifications";
const STYLE_ID = "ari-circle-notifications-style";
const STYLE_HREF = "assets/css/ari-circle-notifications-v4.css?v=2.4.1";

const NOTIFICATION_TYPES = Object.freeze({
  CONNECTION_REQUEST: "connection_request",
  CONNECTION_ACCEPTED: "connection_accepted",
  MESSAGE_REQUEST: "message_request",
  MESSAGE: "message",
  LOVE: "love",
  PROFILE: "profile",
  SYSTEM: "system"
});

const VALID_NOTIFICATION_TYPES = new Set(Object.values(NOTIFICATION_TYPES));

function clean(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeNotificationType(value) {
  const type = clean(value)?.toLowerCase();
  return type && VALID_NOTIFICATION_TYPES.has(type)
    ? type
    : NOTIFICATION_TYPES.SYSTEM;
}

function normalizeNotification(notification) {
  if (!notification || typeof notification !== "object") return null;

  const id = clean(
    notification.id ||
    notification.notification_id ||
    notification.notificationId
  );
  if (!id) return null;

  return Object.freeze({
    id,
    type: normalizeNotificationType(notification.type),
    title: clean(notification.title) || "ARI Circle",
    body: clean(notification.body || notification.message || notification.text),
    actorUserId: clean(notification.actor_user_id || notification.actorUserId),
    actorDisplayName: clean(notification.actor_display_name || notification.actorDisplayName),
    actorHandle: clean(notification.actor_handle || notification.actorHandle),
    actorAvatarUrl: clean(notification.actor_avatar_url || notification.actorAvatarUrl),
    requestId: clean(
      notification.request_id ||
      notification.requestId ||
      notification.data?.connection_id
    ),
    conversationId: clean(notification.conversation_id || notification.conversationId),
    commentId: clean(notification.comment_id || notification.commentId),
    profileUserId: clean(notification.profile_user_id || notification.profileUserId),
    read: Boolean(notification.read ?? notification.is_read ?? notification.isRead),
    createdAt: clean(notification.created_at || notification.createdAt) || new Date().toISOString(),
    data: notification.data && typeof notification.data === "object"
      ? { ...notification.data }
      : {}
  });
}

function cloneNotification(notification) {
  return notification ? { ...notification, data: { ...(notification.data || {}) } } : null;
}

function clampUnreadCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.min(Math.floor(count), 999);
}

function getInitials(notification) {
  const value = clean(notification?.actorDisplayName) || clean(notification?.actorHandle) || "A";
  const words = value.replace(/^@/, "").split(/\s+/).filter(Boolean);
  if (!words.length) return "A";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function formatTime(value) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";
  const delta = Math.max(0, Date.now() - timestamp);
  const minute = 60000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (delta < minute) return "now";
  if (delta < hour) return `${Math.max(1, Math.floor(delta / minute))}m`;
  if (delta < day) return `${Math.floor(delta / hour)}h`;
  if (delta < 7 * day) return `${Math.floor(delta / day)}d`;
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function actorName(notification) {
  return clean(notification?.actorDisplayName) ||
    clean(notification?.actorHandle)?.replace(/^@/, "") ||
    "Someone";
}

function conciseTitle(notification) {
  const name = actorName(notification);
  switch (notification.type) {
    case NOTIFICATION_TYPES.CONNECTION_REQUEST:
      return `${name} sent you a Circle request`;
    case NOTIFICATION_TYPES.CONNECTION_ACCEPTED:
      return `${name} accepted your Circle request`;
    case NOTIFICATION_TYPES.MESSAGE_REQUEST:
      return `${name} sent you a message request`;
    case NOTIFICATION_TYPES.MESSAGE:
      return `${name} sent you a message`;
    case NOTIFICATION_TYPES.LOVE:
      return `${name} interacted with your activity`;
    case NOTIFICATION_TYPES.PROFILE:
      return `${name} interacted with your profile`;
    default:
      return notification.title || "ARI Circle activity";
  }
}

function conciseBody(notification) {
  const body = clean(notification.body);
  if (!body) return null;
  const title = clean(notification.title);
  if (title && body.toLowerCase() === title.toLowerCase()) return null;
  return body;
}

function messageBundleKey(notification) {
  if (notification?.type !== NOTIFICATION_TYPES.MESSAGE) return null;
  if (notification.conversationId) return `conversation:${notification.conversationId}`;
  if (notification.actorUserId) return `actor:${notification.actorUserId}`;
  const handle = clean(notification.actorHandle)?.toLowerCase();
  return handle ? `handle:${handle}` : null;
}

function newestFirst(a, b) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function buildInboxEntries(notifications) {
  const entries = [];
  const messageGroups = new Map();

  (Array.isArray(notifications) ? notifications : []).forEach(notification => {
    const key = messageBundleKey(notification);
    if (!key) {
      entries.push({
        kind: "single",
        latest: notification,
        notifications: [notification]
      });
      return;
    }

    const group = messageGroups.get(key) || [];
    group.push(notification);
    messageGroups.set(key, group);
  });

  messageGroups.forEach(group => {
    const ordered = [...group].sort(newestFirst);
    entries.push({
      kind: ordered.length > 1 ? "message-bundle" : "single",
      latest: ordered[0],
      notifications: ordered
    });
  });

  return entries.sort((a, b) => newestFirst(a.latest, b.latest));
}

function ensureStyle() {
  let link = document.getElementById(STYLE_ID);
  if (!link) {
    link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (!link.href.endsWith(STYLE_HREF)) link.href = STYLE_HREF;
}

const CircleNotifications = {
  version: VERSION,
  source: SOURCE,

  state: {
    initialized: false,
    items: [],
    panelOpen: false,
    resolvedRequests: new Map(),
    unsubscribers: []
  },

  dom: {
    button: null,
    badge: null,
    dialog: null,
    list: null,
    empty: null,
    markAll: null
  },

  init() {
    ensureStyle();
    if (this.state.initialized) return this.getDiagnostics();
    this.cacheDom();
    this.prepareDialog();
    this.bindActions();
    this.bindStore();
    this.bindDomainEvents();
    this.renderBadge(CircleStore.get("notifications.unreadCount"));
    this.renderPanel();
    this.state.initialized = true;
    return this.getDiagnostics();
  },

  cacheDom() {
    this.dom.button = document.getElementById("circle-notifications-button");
    this.dom.badge = document.getElementById("circle-notification-badge");
    this.dom.dialog = document.getElementById("circle-notifications-dialog");
    this.dom.list = document.getElementById("circle-notifications-list");
    this.dom.empty = document.getElementById("circle-notifications-empty");
    this.dom.markAll = document.getElementById("circle-notifications-mark-all");
  },

  prepareDialog() {
    const dialog = this.dom.dialog;
    if (!dialog) return;
    dialog.dataset.notificationUi = VERSION;

    const eyebrow = dialog.querySelector(".circle-section-eyebrow");
    if (eyebrow) eyebrow.textContent = "ACTIVITY";

    const title = dialog.querySelector(".circle-dialog__header h2");
    if (title) title.textContent = "Notifications";

    const note = dialog.querySelector(".circle-notifications-toolbar .circle-section-note");
    if (note) {
      note.textContent = "";
      note.hidden = true;
    }

    if (this.dom.markAll) {
      this.dom.markAll.textContent = "Clear";
      this.dom.markAll.setAttribute("aria-label", "Clear notifications");
    }
  },

  bindActions() {
    this.state.unsubscribers.push(
      CircleEvents.onAction("open-notifications", () => this.openNotifications()),
      CircleEvents.onAction("close-notifications", () => this.closeNotifications()),
      CircleEvents.onAction("mark-all-notifications-read", () => this.markAllRead()),
      CircleEvents.onAction("open-circle-notification", payload => {
        const id = clean(payload?.trigger?.dataset?.notificationId);
        if (id) this.activate(id);
      }),
      CircleEvents.onAction("open-notification-bundle", payload => {
        const id = clean(payload?.trigger?.dataset?.notificationId);
        if (id) this.activateMessageBundle(id);
      })
    );
  },

  bindStore() {
    this.state.unsubscribers.push(
      CircleStore.subscribe((state, change) => {
        const keys = Array.isArray(change?.keys) ? change.keys : [];
        if (!keys.length || keys.includes("notifications")) {
          this.renderBadge(state.notifications?.unreadCount);
        }
      })
    );
  },

  bindDomainEvents() {
    this.state.unsubscribers.push(
      CircleEvents.on("circle:incoming-request-resolved", payload => {
        const detail = payload?.detail || {};
        const requestId = clean(detail.requestId || detail.request?.id);
        if (!requestId) return;
        const action = clean(detail.action) || "resolved";
        this.state.resolvedRequests.set(requestId, action);

        const resolvedNotificationIds = this.state.items
          .filter(item => (
            item.type === NOTIFICATION_TYPES.CONNECTION_REQUEST &&
            item.requestId === requestId
          ))
          .map(item => item.id);

        resolvedNotificationIds.forEach(notificationId => {
          this.markRead(notificationId, { render: false, sync: false });
          this.removeNotification(notificationId, { render: false, sync: false });
        });
        this.syncUnreadCount();
        this.renderPanel();
      })
    );
  },

  setNotifications(notifications = []) {
    this.state.items = Array.isArray(notifications)
      ? notifications
          .map(normalizeNotification)
          .filter(notification => {
            if (!notification || notification.read) return false;
            if (
              notification.type === NOTIFICATION_TYPES.CONNECTION_REQUEST &&
              notification.requestId &&
              this.state.resolvedRequests.has(notification.requestId)
            ) {
              return false;
            }
            return true;
          })
          .sort(newestFirst)
      : [];
    this.syncUnreadCount();
    this.renderPanel();
    return this.getNotifications();
  },

  getNotifications() {
    return this.state.items.map(cloneNotification);
  },

  getNotification(notificationId) {
    const id = clean(notificationId);
    if (!id) return null;
    return cloneNotification(this.state.items.find(item => item.id === id));
  },

  addNotification(notification) {
    const normalized = normalizeNotification(notification);
    if (!normalized || normalized.read) return null;
    if (
      normalized.type === NOTIFICATION_TYPES.CONNECTION_REQUEST &&
      normalized.requestId &&
      this.state.resolvedRequests.has(normalized.requestId)
    ) {
      return null;
    }
    this.state.items = [normalized, ...this.state.items.filter(item => item.id !== normalized.id)]
      .sort(newestFirst);
    this.syncUnreadCount();
    this.renderPanel();
    CircleEvents.emit(EVENT_NAMES.NOTIFICATIONS_CHANGED, {
      action: "add",
      notification: cloneNotification(normalized)
    });
    return cloneNotification(normalized);
  },

  removeNotification(notificationId, options = {}) {
    const id = clean(notificationId);
    if (!id) return false;
    const before = this.state.items.length;
    this.state.items = this.state.items.filter(item => item.id !== id);
    if (before === this.state.items.length) return false;
    if (options.sync !== false) this.syncUnreadCount();
    if (options.render !== false) this.renderPanel();
    if (options.emit !== false) {
      CircleEvents.emit(EVENT_NAMES.NOTIFICATIONS_CHANGED, {
        action: "remove",
        notificationId: id
      });
    }
    return true;
  },

  markRead(notificationId, options = {}) {
    const id = clean(notificationId);
    if (!id) return false;
    let changed = false;
    this.state.items = this.state.items.map(item => {
      if (item.id !== id || item.read) return item;
      changed = true;
      return Object.freeze({ ...item, read: true });
    });
    if (!changed) return false;
    if (options.sync !== false) this.syncUnreadCount();
    if (options.render !== false) this.renderPanel();
    if (options.persist !== false) {
      CircleEvents.emit("circle:notification-read", { notificationId: id, persist: true });
    }
    return true;
  },

  markUnread(notificationId, options = {}) {
    const id = clean(notificationId);
    if (!id) return false;
    let changed = false;
    this.state.items = this.state.items.map(item => {
      if (item.id !== id || !item.read) return item;
      changed = true;
      return Object.freeze({ ...item, read: false });
    });
    if (!changed) return false;
    if (options.sync !== false) this.syncUnreadCount();
    if (options.render !== false) this.renderPanel();
    if (options.persist !== false) {
      CircleEvents.emit("circle:notification-unread", { notificationId: id, persist: true });
    }
    return true;
  },

  markAllRead(options = {}) {
    const count = this.state.items.length;
    if (!count) return 0;

    const ids = this.state.items.map(item => item.id);
    this.state.items = [];
    this.syncUnreadCount();
    this.renderPanel();

    if (options.persist !== false) {
      CircleEvents.emit("circle:notifications-all-read", {
        notificationIds: ids,
        persist: true,
        clearVisibleInbox: true
      });
    }

    return count;
  },

  syncUnreadCount() {
    const unreadCount = this.state.items.reduce(
      (total, item) => total + (item.read ? 0 : 1),
      0
    );
    CircleStore.setNotificationsState({ unreadCount });
    return unreadCount;
  },

  renderBadge(value) {
    const count = clampUnreadCount(value);
    if (!this.dom.badge) return;
    if (count <= 0) {
      this.dom.badge.hidden = true;
      this.dom.badge.textContent = "";
      this.dom.button?.setAttribute("aria-label", "Notifications");
      return;
    }
    this.dom.badge.hidden = false;
    this.dom.badge.textContent = count > 99 ? "99+" : String(count);
    this.dom.button?.setAttribute("aria-label", `Notifications, ${count} unread`);
  },

  renderPanel() {
    ensureStyle();
    this.prepareDialog();
    const list = this.dom.list;
    if (!list) return;
    list.replaceChildren();

    const notifications = this.state.items;
    const entries = buildInboxEntries(notifications);

    if (this.dom.empty) {
      this.dom.empty.hidden = notifications.length > 0;
      const p = this.dom.empty.querySelector("p");
      if (p) p.textContent = "You're all caught up.";
    }
    if (this.dom.markAll) {
      this.dom.markAll.disabled = notifications.length === 0;
    }

    entries.forEach(entry => {
      if (entry.kind === "message-bundle") {
        list.appendChild(this.createMessageBundleElement(entry));
      } else {
        list.appendChild(this.createNotificationElement(entry.latest));
      }
    });
  },

  createAvatar(notification) {
    const avatar = document.createElement(notification.actorUserId ? "button" : "div");
    avatar.className = "circle-notification-item__avatar";
    if (notification.actorUserId) {
      avatar.type = "button";
      avatar.dataset.circleAction = "open-profile";
      avatar.dataset.userId = notification.actorUserId;
      if (notification.actorHandle) avatar.dataset.handle = notification.actorHandle;
      avatar.setAttribute("aria-label", `View ${actorName(notification)}`);
    }

    if (notification.actorAvatarUrl) {
      const image = document.createElement("img");
      image.src = notification.actorAvatarUrl;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      avatar.appendChild(image);
    } else {
      const fallback = document.createElement("span");
      fallback.textContent = getInitials(notification);
      avatar.appendChild(fallback);
    }

    return avatar;
  },

  createContentButton(notification, {
    titleText = null,
    bodyText = undefined,
    action = "open-circle-notification"
  } = {}) {
    const content = document.createElement("button");
    content.type = "button";
    content.className = "circle-notification-item__content";
    content.dataset.circleAction = action;
    content.dataset.notificationId = notification.id;

    const title = document.createElement("span");
    title.className = "circle-notification-item__title";
    title.textContent = titleText || conciseTitle(notification);

    const preview = bodyText === undefined ? conciseBody(notification) : clean(bodyText);
    const text = document.createElement("span");
    text.className = "circle-notification-item__text";
    text.textContent = preview || "";
    text.hidden = !preview;

    const time = document.createElement("time");
    time.className = "circle-notification-item__time";
    time.dateTime = notification.createdAt;
    time.textContent = formatTime(notification.createdAt);

    content.append(title);
    if (preview) content.append(text);
    content.append(time);
    return content;
  },

  createUnreadDot(notification) {
    if (notification.read) return null;
    const dot = document.createElement("span");
    dot.className = "circle-notification-item__unread-dot";
    dot.setAttribute("aria-label", "Unread");
    return dot;
  },

  createNotificationElement(notification) {
    const isRequest = notification.type === NOTIFICATION_TYPES.CONNECTION_REQUEST;
    const article = document.createElement("article");
    article.className = "circle-notification-item circle-notification-item--compact";
    if (isRequest) article.classList.add("circle-notification-item--request");
    article.dataset.read = notification.read ? "true" : "false";
    article.dataset.type = notification.type;
    article.dataset.notificationId = notification.id;

    const avatar = this.createAvatar(notification);
    const body = document.createElement("div");
    body.className = "circle-notification-item__body";
    body.appendChild(this.createContentButton(notification));

    const dot = this.createUnreadDot(notification);
    if (dot) article.append(avatar, body, dot);
    else article.append(avatar, body);

    if (isRequest) {
      const actions = document.createElement("div");
      actions.className = "circle-notification-item__actions";
      const resolvedAction = notification.requestId
        ? this.state.resolvedRequests.get(notification.requestId)
        : null;

      if (notification.requestId && !resolvedAction) {
        const accept = document.createElement("button");
        accept.type = "button";
        accept.className = "circle-button circle-button--primary circle-button--small circle-notification-action";
        accept.dataset.circleAction = "accept-incoming-request";
        accept.dataset.requestId = notification.requestId;
        accept.textContent = "Accept";

        const decline = document.createElement("button");
        decline.type = "button";
        decline.className = "circle-button circle-button--secondary circle-button--small circle-notification-action";
        decline.dataset.circleAction = "decline-incoming-request";
        decline.dataset.requestId = notification.requestId;
        decline.textContent = "Decline";

        actions.append(accept, decline);
      } else if (resolvedAction) {
        const status = document.createElement("span");
        status.className = "circle-notification-item__resolved";
        status.textContent = resolvedAction === "accepted"
          ? "Accepted"
          : resolvedAction === "declined"
            ? "Declined"
            : "Handled";
        actions.appendChild(status);
      }

      if (actions.childNodes.length) article.appendChild(actions);
    }

    return article;
  },

  createMessageBundleElement(entry) {
    const notifications = entry.notifications || [];
    const latest = entry.latest;
    const count = notifications.length;
    const name = actorName(latest);

    const article = document.createElement("article");
    article.className = "circle-notification-item circle-notification-item--compact circle-notification-item--bundle";
    article.dataset.read = notifications.some(item => !item.read) ? "false" : "true";
    article.dataset.type = NOTIFICATION_TYPES.MESSAGE;
    article.dataset.notificationId = latest.id;
    article.dataset.bundleCount = String(count);

    const avatar = this.createAvatar(latest);
    const body = document.createElement("div");
    body.className = "circle-notification-item__body";

    const latestPreview = conciseBody(latest);
    const bundleBody = latestPreview || "Tap to open conversation";
    body.appendChild(this.createContentButton(latest, {
      titleText: `${name} sent you ${count} messages`,
      bodyText: bundleBody,
      action: "open-notification-bundle"
    }));

    const countPill = document.createElement("span");
    countPill.className = "circle-notification-item__count";
    countPill.textContent = String(count);
    countPill.setAttribute("aria-label", `${count} unread messages`);

    article.append(avatar, body, countPill);
    return article;
  },

  openNotifications() {
    const context = CircleStore.get("context");
    if (!context?.isAuthenticated) {
      CircleEvents.showToast("Sign in to view notifications.");
      return false;
    }

    this.state.panelOpen = true;
    const profileMenu = document.getElementById("circle-profile-menu");
    const profileMenuButton = document.getElementById("circle-profile-menu-button");
    if (profileMenu) profileMenu.hidden = true;
    profileMenuButton?.setAttribute("aria-expanded", "false");

    this.renderPanel();
    const dialog = this.dom.dialog;
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }

    CircleEvents.emit("circle:notifications-opened", {
      notifications: this.getNotifications(),
      unreadCount: CircleStore.get("notifications.unreadCount") || 0
    });
    return true;
  },

  closeNotifications() {
    if (!this.state.panelOpen && !this.dom.dialog?.open) return false;
    this.state.panelOpen = false;
    const dialog = this.dom.dialog;
    if (dialog?.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
    CircleEvents.emit("circle:notifications-closed", {});
    return true;
  },

  activateMessageBundle(notificationId) {
    const anchor = this.getNotification(notificationId);
    const key = messageBundleKey(anchor);
    if (!anchor || !key) return this.activate(notificationId);

    const bundle = this.state.items
      .filter(item => messageBundleKey(item) === key)
      .sort(newestFirst);

    if (bundle.length <= 1) return this.activate(notificationId);

    const ids = new Set(bundle.map(item => item.id));
    bundle.forEach(item => {
      if (!item.read) {
        CircleEvents.emit("circle:notification-read", {
          notificationId: item.id,
          persist: true
        });
      }
    });

    this.state.items = this.state.items.filter(item => !ids.has(item.id));
    this.syncUnreadCount();
    this.renderPanel();
    CircleEvents.emit(EVENT_NAMES.NOTIFICATIONS_CHANGED, {
      action: "remove-bundle",
      notificationIds: [...ids],
      conversationId: anchor.conversationId || null
    });

    const latest = bundle[0];
    if (latest.conversationId) {
      CircleEvents.emit("circle:notification-open-conversation", {
        notification: cloneNotification(latest),
        conversationId: latest.conversationId,
        bundledNotificationIds: [...ids],
        messageCount: bundle.length
      });
    }
    return true;
  },

  activate(notificationId) {
    const notification = this.getNotification(notificationId);
    if (!notification) return false;
    this.markRead(notification.id);

    switch (notification.type) {
      case NOTIFICATION_TYPES.CONNECTION_REQUEST:
        this.closeNotifications();
        CircleEvents.emit("circle:open-incoming-request", {
          notification,
          requestId: notification.requestId,
          actorUserId: notification.actorUserId
        });
        break;
      case NOTIFICATION_TYPES.CONNECTION_ACCEPTED:
      case NOTIFICATION_TYPES.PROFILE:
        this.openProfileFromNotification(notification);
        break;
      case NOTIFICATION_TYPES.MESSAGE_REQUEST:
        CircleEvents.emit("circle:notification-open-message-request", {
          notification,
          requestId: notification.requestId,
          actorUserId: notification.actorUserId
        });
        break;
      case NOTIFICATION_TYPES.MESSAGE:
        if (notification.conversationId) {
          CircleEvents.emit("circle:notification-open-conversation", {
            notification,
            conversationId: notification.conversationId
          });
        }
        break;
      case NOTIFICATION_TYPES.LOVE:
        CircleEvents.emit("circle:notification-open-love", {
          notification,
          commentId: notification.commentId,
          profileUserId: notification.profileUserId
        });
        break;
      default: {
        const href = clean(notification?.data?.href);
        if (href) {
          try {
            const url = new URL(href, window.location.href);
            if (url.origin === window.location.origin) {
              this.closeNotifications();
              window.location.assign(url.href);
              break;
            }
          } catch (error) {
            console.warn("ARI Circle notification href was invalid:", error);
          }
        }
        CircleEvents.emit("circle:notification-open-system", { notification });
        break;
      }
    }
    return true;
  },

  openProfileFromNotification(notification) {
    const userId = clean(notification?.actorUserId || notification?.profileUserId);
    const handle = clean(notification?.actorHandle);
    if (!userId && !handle) return false;

    CircleEvents.emit("circle:notification-open-profile", { notification, userId, handle });
    const url = new URL("ari-circle.html", window.location.href);
    if (handle) url.searchParams.set("handle", handle.replace(/^@+/, ""));
    else url.searchParams.set("user", userId);
    window.location.assign(url.href);
    return true;
  },

  getUnreadNotifications() {
    return this.state.items.filter(item => !item.read).map(cloneNotification);
  },

  clear() {
    this.state.items = [];
    this.state.panelOpen = false;
    this.state.resolvedRequests.clear();
    CircleStore.setNotificationsState({ unreadCount: 0 });
    this.renderPanel();
  },

  destroy() {
    this.state.unsubscribers.forEach(unsubscribe => {
      try { unsubscribe?.(); } catch (error) { console.warn("ARI Circle notifications unsubscribe failed", error); }
    });
    this.state.unsubscribers = [];
    this.closeNotifications();
    this.clear();
    this.state.initialized = false;
  },

  getDiagnostics() {
    return {
      ready: this.state.initialized,
      source: this.source,
      version: this.version,
      notificationCount: this.state.items.length,
      renderedEntryCount: buildInboxEntries(this.state.items).length,
      unreadCount: clampUnreadCount(CircleStore.get("notifications.unreadCount")),
      panelOpen: this.state.panelOpen,
      buttonFound: Boolean(this.dom.button),
      badgeFound: Boolean(this.dom.badge),
      dialogFound: Boolean(this.dom.dialog),
      listFound: Boolean(this.dom.list)
    };
  }
};

export {
  CircleNotifications,
  NOTIFICATION_TYPES,
  normalizeNotification,
  buildInboxEntries,
  messageBundleKey
};
export default CircleNotifications;
