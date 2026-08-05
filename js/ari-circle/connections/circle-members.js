// js/ari-circle/connections/circle-members.js
// ARI Circle
// V1.0.0
//
// Purpose:
// - Own the "View Entire Circle" experience.
// - Open a full-screen Circle manager from:
//     data-circle-action="view-entire-circle"
// - Show:
//     1. Accepted friends
//     2. Incoming Circle requests
//     3. Sent Circle requests
// - Allow profile navigation.
// - Allow incoming request accept/decline.
// - Allow sent request cancellation.
// - Refresh from Supabase through CircleApi.
//
// This module creates its own dialog markup at runtime so
// ari-circle.html does not need a new dialog block.
//
// Requires:
// - ../core/circle-store.js
// - ../core/circle-events.js
// - ../data/circle-api.js
// - ./connection-requests.js

import CircleStore from "../core/circle-store.js";
import CircleEvents, {
  EVENT_NAMES
} from "../core/circle-events.js";
import CircleApi from "../data/circle-api.js?v=1.3.1";
import ConnectionRequests from "./connection-requests.js?v=1.1.0";

const VERSION = "1.0.0";
const SOURCE = "ari-circle/connections/circle-members";

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

function normalizeId(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return normalizeString(
    String(value)
  );
}

function escapeHtml(value) {
  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

function getProfileUserId(profile) {
  return normalizeId(
    profile?.user_id ||
    profile?.userId ||
    profile?.id
  );
}

function getProfileName(profile) {
  return normalizeString(
    profile?.display_name ||
    profile?.displayName ||
    profile?.name
  ) ||
  "ARI User";
}

function getProfileHandle(profile) {
  const handle =
    normalizeString(
      profile?.handle ||
      profile?.username
    );

  if (!handle) {
    return "";
  }

  return handle.startsWith("@")
    ? handle
    : `@${handle}`;
}

function getProfileAvatar(profile) {
  return normalizeString(
    profile?.avatar_url ||
    profile?.avatarUrl
  );
}

function getInitial(profile) {
  return getProfileName(
    profile
  )
    .charAt(0)
    .toUpperCase() ||
    "A";
}

function getRequestSenderProfile(request) {
  return (
    request?.senderProfile ||
    request?.requesterProfile ||
    null
  );
}

function getRequestReceiverProfile(request) {
  return (
    request?.receiverProfile ||
    request?.addresseeProfile ||
    null
  );
}

function getRequestId(request) {
  return normalizeId(
    request?.id ||
    request?.requestId
  );
}

function getRequesterId(request) {
  return normalizeId(
    request?.requester_user_id ||
    request?.sender_user_id ||
    request?.requesterUserId ||
    request?.senderUserId
  );
}

function getAddresseeId(request) {
  return normalizeId(
    request?.addressee_user_id ||
    request?.receiver_user_id ||
    request?.addresseeUserId ||
    request?.receiverUserId
  );
}

function buildProfileUrl(userId) {
  const id =
    normalizeId(
      userId
    );

  if (!id) {
    return "ari-circle.html";
  }

  return (
    "ari-circle.html?user=" +
    encodeURIComponent(id)
  );
}

const CircleMembers = {
  version:
    VERSION,

  source:
    SOURCE,

  state: {
    initialized:
      false,

    loading:
      false,

    activeTab:
      "friends",

    connections:
      [],

    incoming:
      [],

    outgoing:
      [],

    unsubscribers:
      []
  },

  dom: {
    dialog:
      null,

    panel:
      null,

    titleCount:
      null,

    tabs:
      null,

    list:
      null,

    status:
      null
  },

  init() {
    if (
      this.state.initialized
    ) {
      return this.getDiagnostics();
    }

    this.ensureDialog();
    this.bindActions();

    this.state.initialized =
      true;

    return this.getDiagnostics();
  },

  ensureDialog() {
    let dialog =
      document.getElementById(
        "circle-members-dialog"
      );

    if (!dialog) {
      dialog =
        document.createElement(
          "dialog"
        );

      dialog.id =
        "circle-members-dialog";

      dialog.className =
        "circle-dialog circle-members-dialog";

      dialog.innerHTML = `
        <div class="circle-dialog__panel circle-members-dialog__panel">
          <header class="circle-dialog__header">
            <div>
              <p class="circle-section-eyebrow">YOUR CONNECTIONS</p>
              <h2>
                My Circle
                <span id="circle-members-title-count"></span>
              </h2>
            </div>

            <button
              class="circle-icon-button"
              type="button"
              aria-label="Close Entire Circle"
              data-circle-action="close-entire-circle"
            >
              &times;
            </button>
          </header>

          <div
            class="circle-members-tabs"
            id="circle-members-tabs"
            role="tablist"
            aria-label="Circle relationship groups"
          >
            <button
              class="circle-members-tab active"
              type="button"
              role="tab"
              aria-selected="true"
              data-circle-members-tab="friends"
            >
              Friends
              <span data-circle-members-count="friends">0</span>
            </button>

            <button
              class="circle-members-tab"
              type="button"
              role="tab"
              aria-selected="false"
              data-circle-members-tab="requests"
            >
              Requests
              <span data-circle-members-count="requests">0</span>
            </button>

            <button
              class="circle-members-tab"
              type="button"
              role="tab"
              aria-selected="false"
              data-circle-members-tab="sent"
            >
              Sent
              <span data-circle-members-count="sent">0</span>
            </button>
          </div>

          <p
            id="circle-members-status"
            class="circle-section-note circle-members-status"
            role="status"
            aria-live="polite"
          ></p>

          <div
            id="circle-members-list"
            class="circle-members-list"
            aria-live="polite"
          ></div>
        </div>
      `;

      document.body.appendChild(
        dialog
      );

      this.injectStyles();
    }

    this.dom.dialog =
      dialog;

    this.dom.panel =
      dialog.querySelector(
        ".circle-members-dialog__panel"
      );

    this.dom.titleCount =
      dialog.querySelector(
        "#circle-members-title-count"
      );

    this.dom.tabs =
      dialog.querySelector(
        "#circle-members-tabs"
      );

    this.dom.list =
      dialog.querySelector(
        "#circle-members-list"
      );

    this.dom.status =
      dialog.querySelector(
        "#circle-members-status"
      );
  },

  injectStyles() {
    if (
      document.getElementById(
        "circle-members-runtime-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "circle-members-runtime-styles";

    style.textContent = `
      .circle-members-dialog__panel {
        width: min(100%, 760px);
        max-height: min(92dvh, 900px);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .circle-members-tabs {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin: 4px 0 14px;
      }

      .circle-members-tab {
        min-height: 44px;
        border: 1px solid rgba(104, 231, 255, 0.28);
        border-radius: 12px;
        background: rgba(5, 18, 27, 0.72);
        color: inherit;
        font: inherit;
        cursor: pointer;
      }

      .circle-members-tab.active {
        border-color: rgba(104, 231, 255, 0.8);
        box-shadow: inset 0 0 18px rgba(104, 231, 255, 0.12);
      }

      .circle-members-tab span {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        margin-left: 4px;
        padding: 0 5px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        font-size: 0.75rem;
      }

      .circle-members-status {
        min-height: 20px;
        margin: 0 0 10px;
      }

      .circle-members-list {
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: 2px 1px 10px;
      }

      .circle-members-person {
        display: grid;
        grid-template-columns: 54px minmax(0, 1fr);
        gap: 12px;
        align-items: center;
        padding: 13px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .circle-members-person:last-child {
        border-bottom: 0;
      }

      .circle-members-avatar-button {
        width: 54px;
        height: 54px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: transparent;
        cursor: pointer;
        overflow: hidden;
      }

      .circle-members-avatar,
      .circle-members-avatar-fallback {
        width: 54px;
        height: 54px;
        border-radius: 50%;
      }

      .circle-members-avatar {
        display: block;
        object-fit: cover;
      }

      .circle-members-avatar-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(104, 231, 255, 0.42);
        background: rgba(7, 24, 35, 0.92);
        font-family: "Orbitron", sans-serif;
        font-weight: 700;
      }

      .circle-members-person__body {
        min-width: 0;
      }

      .circle-members-person__identity {
        display: flex;
        align-items: baseline;
        gap: 8px;
        flex-wrap: wrap;
      }

      .circle-members-person__name {
        padding: 0;
        border: 0;
        background: none;
        color: inherit;
        font: inherit;
        font-weight: 700;
        text-align: left;
        cursor: pointer;
      }

      .circle-members-person__handle {
        opacity: 0.68;
        font-size: 0.82rem;
      }

      .circle-members-person__meta {
        margin: 3px 0 0;
        opacity: 0.72;
        font-size: 0.78rem;
      }

      .circle-members-person__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }

      .circle-members-empty {
        padding: 26px 4px;
        text-align: center;
        opacity: 0.72;
      }

      @media (max-width: 520px) {
        .circle-members-dialog {
          padding: 0;
        }

        .circle-members-dialog__panel {
          width: 100%;
          min-height: 100dvh;
          max-height: 100dvh;
          border-radius: 0;
        }

        .circle-members-person__actions .circle-button {
          flex: 1 1 auto;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  },

  bindActions() {
    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "view-entire-circle",
        () =>
          this.open()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "close-entire-circle",
        () =>
          this.close()
      )
    );

    this.dom.tabs
      ?.addEventListener(
        "click",
        event => {
          const button =
            event.target.closest(
              "[data-circle-members-tab]"
            );

          if (!button) {
            return;
          }

          const tab =
            normalizeString(
              button.dataset
                .circleMembersTab
            );

          if (
            tab === "friends" ||
            tab === "requests" ||
            tab === "sent"
          ) {
            this.setActiveTab(
              tab
            );
          }
        }
      );

    this.dom.list
      ?.addEventListener(
        "click",
        event => {
          const target =
            event.target.closest(
              "[data-circle-members-action]"
            );

          if (!target) {
            return;
          }

          const action =
            normalizeString(
              target.dataset
                .circleMembersAction
            );

          const userId =
            normalizeId(
              target.dataset.userId
            );

          const requestId =
            normalizeId(
              target.dataset.requestId
            );

          if (
            action ===
            "open-profile"
          ) {
            this.openProfile(
              userId
            );

            return;
          }

          if (
            action ===
            "accept-request"
          ) {
            this.acceptRequest(
              requestId
            );

            return;
          }

          if (
            action ===
            "decline-request"
          ) {
            this.declineRequest(
              requestId
            );

            return;
          }

          if (
            action ===
            "cancel-request"
          ) {
            this.cancelRequest(
              requestId
            );
          }
        }
      );

    this.dom.dialog
      ?.addEventListener(
        "cancel",
        event => {
          event.preventDefault();
          this.close();
        }
      );
  },

  async open() {
    if (
      !this.dom.dialog ||
      typeof this.dom.dialog
        .showModal !== "function"
    ) {
      CircleEvents.showToast(
        "Your Circle could not be opened."
      );

      return false;
    }

    if (
      !this.dom.dialog.open
    ) {
      this.dom.dialog
        .showModal();
    }

    await this.refresh();

    return true;
  },

  close() {
    if (
      this.dom.dialog?.open
    ) {
      this.dom.dialog.close();
    }

    return true;
  },

  async refresh() {
    if (this.state.loading) {
      return false;
    }

    const viewerUserId =
      normalizeId(
        CircleStore.get(
          "context.viewerUserId"
        )
      );

    if (!viewerUserId) {
      this.setStatus(
        "Sign in to view your Circle."
      );

      return false;
    }

    this.state.loading =
      true;

    this.setStatus(
      "Loading your Circle..."
    );

    try {
      const [
        connectionsResult,
        requestsResult
      ] =
        await Promise.allSettled([
          CircleApi
            .getAcceptedConnections(
              viewerUserId
            ),

          CircleApi
            .getPendingConnectionRequests(
              viewerUserId
            )
        ]);

      if (
        connectionsResult.status ===
        "fulfilled"
      ) {
        this.state.connections =
          connectionsResult.value ||
          [];
      } else {
        console.warn(
          "ARI Circle full member list failed to load.",
          connectionsResult.reason
        );

        this.state.connections =
          [];
      }

      let requests =
        [];

      if (
        requestsResult.status ===
        "fulfilled"
      ) {
        requests =
          requestsResult.value ||
          [];
      } else {
        console.warn(
          "ARI Circle request list failed to load.",
          requestsResult.reason
        );
      }

      this.state.incoming =
        requests.filter(
          request =>
            getAddresseeId(
              request
            ) ===
            viewerUserId
        );

      this.state.outgoing =
        requests.filter(
          request =>
            getRequesterId(
              request
            ) ===
            viewerUserId
        );

      /*
       * Keep the existing request module synchronized with the same
       * canonical rows used by this manager.
       */
      ConnectionRequests
        .setIncomingRequests?.(
          this.state.incoming
        );

      ConnectionRequests
        .setOutgoingRequests?.(
          this.state.outgoing
        );

      this.setStatus(
        ""
      );

      this.render();

      return true;
    } catch (error) {
      console.error(
        "ARI Circle full Circle refresh failed.",
        error
      );

      this.setStatus(
        "Your Circle could not be loaded."
      );

      CircleEvents.reportError?.(
        error,
        {
          message:
            "Your Circle could not be loaded."
        }
      );

      return false;
    } finally {
      this.state.loading =
        false;
    }
  },

  setStatus(text) {
    if (this.dom.status) {
      this.dom.status.textContent =
        text || "";
    }
  },

  setActiveTab(tab) {
    if (
      tab !== "friends" &&
      tab !== "requests" &&
      tab !== "sent"
    ) {
      return;
    }

    this.state.activeTab =
      tab;

    this.renderTabs();
    this.renderList();
  },

  render() {
    this.renderTabs();
    this.renderList();

    if (
      this.dom.titleCount
    ) {
      this.dom.titleCount.textContent =
        `(${this.state.connections.length})`;
    }
  },

  renderTabs() {
    if (!this.dom.tabs) {
      return;
    }

    const counts = {
      friends:
        this.state.connections.length,

      requests:
        this.state.incoming.length,

      sent:
        this.state.outgoing.length
    };

    for (
      const button
      of this.dom.tabs.querySelectorAll(
        "[data-circle-members-tab]"
      )
    ) {
      const tab =
        button.dataset
          .circleMembersTab;

      const active =
        tab ===
        this.state.activeTab;

      button.classList.toggle(
        "active",
        active
      );

      button.setAttribute(
        "aria-selected",
        String(active)
      );
    }

    for (
      const badge
      of this.dom.tabs.querySelectorAll(
        "[data-circle-members-count]"
      )
    ) {
      const key =
        badge.dataset
          .circleMembersCount;

      badge.textContent =
        String(
          counts[key] ||
          0
        );
    }
  },

  renderList() {
    if (!this.dom.list) {
      return;
    }

    switch (
      this.state.activeTab
    ) {
      case "requests":
        this.renderIncoming();
        break;

      case "sent":
        this.renderOutgoing();
        break;

      case "friends":
      default:
        this.renderFriends();
        break;
    }
  },

  renderFriends() {
    const connections =
      this.state.connections;

    if (!connections.length) {
      this.dom.list.innerHTML = `
        <div class="circle-members-empty">
          <p>No accepted Circle connections yet.</p>
        </div>
      `;

      return;
    }

    this.dom.list.innerHTML =
      connections
        .map(
          connection => {
            const profile =
              connection
                ?.friendProfile ||
              {};

            const userId =
              normalizeId(
                connection
                  ?.friend_user_id ||
                getProfileUserId(
                  profile
                )
              );

            return this.renderPerson({
              profile,
              userId,
              meta:
                "In your Circle",

              actions: [
                {
                  label:
                    "View Profile",

                  action:
                    "open-profile",

                  className:
                    "circle-button circle-button--secondary circle-button--small"
                }
              ]
            });
          }
        )
        .join("");
  },

  renderIncoming() {
    const requests =
      this.state.incoming;

    if (!requests.length) {
      this.dom.list.innerHTML = `
        <div class="circle-members-empty">
          <p>No incoming Circle requests.</p>
        </div>
      `;

      return;
    }

    this.dom.list.innerHTML =
      requests
        .map(
          request => {
            const profile =
              getRequestSenderProfile(
                request
              ) ||
              {};

            const userId =
              getRequesterId(
                request
              );

            const requestId =
              getRequestId(
                request
              );

            return this.renderPerson({
              profile,
              userId,
              requestId,
              meta:
                "Wants to join your Circle",

              actions: [
                {
                  label:
                    "View Profile",

                  action:
                    "open-profile",

                  className:
                    "circle-button circle-button--secondary circle-button--small"
                },

                {
                  label:
                    "Decline",

                  action:
                    "decline-request",

                  className:
                    "circle-button circle-button--secondary circle-button--small"
                },

                {
                  label:
                    "Accept",

                  action:
                    "accept-request",

                  className:
                    "circle-button circle-button--primary circle-button--small"
                }
              ]
            });
          }
        )
        .join("");
  },

  renderOutgoing() {
    const requests =
      this.state.outgoing;

    if (!requests.length) {
      this.dom.list.innerHTML = `
        <div class="circle-members-empty">
          <p>No sent Circle requests.</p>
        </div>
      `;

      return;
    }

    this.dom.list.innerHTML =
      requests
        .map(
          request => {
            const profile =
              getRequestReceiverProfile(
                request
              ) ||
              {};

            const userId =
              getAddresseeId(
                request
              );

            const requestId =
              getRequestId(
                request
              );

            return this.renderPerson({
              profile,
              userId,
              requestId,
              meta:
                "Request pending",

              actions: [
                {
                  label:
                    "View Profile",

                  action:
                    "open-profile",

                  className:
                    "circle-button circle-button--secondary circle-button--small"
                },

                {
                  label:
                    "Cancel Request",

                  action:
                    "cancel-request",

                  className:
                    "circle-button circle-button--secondary circle-button--small"
                }
              ]
            });
          }
        )
        .join("");
  },

  renderPerson({
    profile,
    userId,
    requestId = null,
    meta = "",
    actions = []
  }) {
    const name =
      getProfileName(
        profile
      );

    const handle =
      getProfileHandle(
        profile
      );

    const avatar =
      getProfileAvatar(
        profile
      );

    const initial =
      getInitial(
        profile
      );

    const avatarMarkup =
      avatar
        ? `
          <img
            class="circle-members-avatar"
            src="${escapeHtml(avatar)}"
            alt="${escapeHtml(name)}"
          />
        `
        : `
          <span
            class="circle-members-avatar-fallback"
            aria-hidden="true"
          >
            ${escapeHtml(initial)}
          </span>
        `;

    const actionMarkup =
      actions
        .map(
          item => `
            <button
              class="${escapeHtml(item.className)}"
              type="button"
              data-circle-members-action="${escapeHtml(item.action)}"
              data-user-id="${escapeHtml(userId || "")}"
              data-request-id="${escapeHtml(requestId || "")}"
            >
              ${escapeHtml(item.label)}
            </button>
          `
        )
        .join("");

    return `
      <article class="circle-members-person">
        <button
          class="circle-members-avatar-button"
          type="button"
          aria-label="Open ${escapeHtml(name)} profile"
          data-circle-members-action="open-profile"
          data-user-id="${escapeHtml(userId || "")}"
        >
          ${avatarMarkup}
        </button>

        <div class="circle-members-person__body">
          <div class="circle-members-person__identity">
            <button
              class="circle-members-person__name"
              type="button"
              data-circle-members-action="open-profile"
              data-user-id="${escapeHtml(userId || "")}"
            >
              ${escapeHtml(name)}
            </button>

            ${
              handle
                ? `
                  <span class="circle-members-person__handle">
                    ${escapeHtml(handle)}
                  </span>
                `
                : ""
            }
          </div>

          ${
            meta
              ? `
                <p class="circle-members-person__meta">
                  ${escapeHtml(meta)}
                </p>
              `
              : ""
          }

          ${
            actionMarkup
              ? `
                <div class="circle-members-person__actions">
                  ${actionMarkup}
                </div>
              `
              : ""
          }
        </div>
      </article>
    `;
  },

  openProfile(userId) {
    const id =
      normalizeId(
        userId
      );

    if (!id) {
      CircleEvents.showToast(
        "This profile could not be opened."
      );

      return false;
    }

    window.location.href =
      buildProfileUrl(
        id
      );

    return true;
  },

  async acceptRequest(
    requestId
  ) {
    const id =
      normalizeId(
        requestId
      );

    if (
      !id ||
      this.state.loading
    ) {
      return false;
    }

    this.state.loading =
      true;

    this.setStatus(
      "Accepting Circle request..."
    );

    try {
      await CircleApi
        .updateConnectionStatus(
          id,
          "accepted"
        );

      ConnectionRequests
        .removeIncomingRequest?.(
          id
        );

      CircleEvents.emit(
        EVENT_NAMES
          .CONNECTION_ACCEPTED,
        {
          requestId:
            id,

          persist:
            false
        }
      );

      CircleEvents.showToast(
        "Added to your Circle."
      );

      this.state.activeTab =
        "friends";

      return await this.refresh();
    } catch (error) {
      console.error(
        "ARI Circle request acceptance failed.",
        error
      );

      CircleEvents.reportError?.(
        error,
        {
          message:
            "Could not accept Circle request."
        }
      );

      this.setStatus(
        "Could not accept Circle request."
      );

      return false;
    } finally {
      this.state.loading =
        false;
    }
  },

  async declineRequest(
    requestId
  ) {
    const id =
      normalizeId(
        requestId
      );

    if (
      !id ||
      this.state.loading
    ) {
      return false;
    }

    this.state.loading =
      true;

    this.setStatus(
      "Declining Circle request..."
    );

    try {
      await CircleApi
        .updateConnectionStatus(
          id,
          "declined"
        );

      ConnectionRequests
        .removeIncomingRequest?.(
          id
        );

      CircleEvents.emit(
        EVENT_NAMES
          .CONNECTION_DECLINED,
        {
          requestId:
            id,

          persist:
            false
        }
      );

      CircleEvents.showToast(
        "Circle request declined."
      );

      return await this.refresh();
    } catch (error) {
      console.error(
        "ARI Circle request decline failed.",
        error
      );

      CircleEvents.reportError?.(
        error,
        {
          message:
            "Could not decline Circle request."
        }
      );

      this.setStatus(
        "Could not decline Circle request."
      );

      return false;
    } finally {
      this.state.loading =
        false;
    }
  },

  async cancelRequest(
    requestId
  ) {
    const id =
      normalizeId(
        requestId
      );

    if (
      !id ||
      this.state.loading
    ) {
      return false;
    }

    this.state.loading =
      true;

    this.setStatus(
      "Canceling Circle request..."
    );

    try {
      await CircleApi
        .deleteConnection(
          id
        );

      ConnectionRequests
        .removeOutgoingRequest?.(
          id
        );

      CircleEvents.emit(
        EVENT_NAMES
          .CONNECTION_CHANGED,
        {
          action:
            "cancel-request",

          requestId:
            id,

          persist:
            false
        }
      );

      CircleEvents.showToast(
        "Circle request canceled."
      );

      return await this.refresh();
    } catch (error) {
      console.error(
        "ARI Circle request cancellation failed.",
        error
      );

      CircleEvents.reportError?.(
        error,
        {
          message:
            "Could not cancel Circle request."
        }
      );

      this.setStatus(
        "Could not cancel Circle request."
      );

      return false;
    } finally {
      this.state.loading =
        false;
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
          "ARI Circle members unsubscribe failed.",
          error
        );
      }
    }

    this.state.unsubscribers =
      [];

    this.dom.dialog
      ?.remove();

    document
      .getElementById(
        "circle-members-runtime-styles"
      )
      ?.remove();

    this.state.connections =
      [];

    this.state.incoming =
      [];

    this.state.outgoing =
      [];

    this.state.initialized =
      false;

    return true;
  },

  getDiagnostics() {
    return {
      ready:
        this.state.initialized,

      source:
        this.source,

      version:
        this.version,

      dialogFound:
        Boolean(
          this.dom.dialog
        ),

      activeTab:
        this.state.activeTab,

      counts: {
        friends:
          this.state.connections
            .length,

        incoming:
          this.state.incoming
            .length,

        outgoing:
          this.state.outgoing
            .length
      }
    };
  }
};

export {
  CircleMembers
};

export default CircleMembers;
