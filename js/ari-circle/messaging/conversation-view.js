// js/ari-circle/messaging/conversation-view.js
// ARI Circle
// V1.0.1
//
// V1.0.1:
// - Fixes the mobile chat composer being pushed below the visible viewport.
// - Makes the dialog use the safe mobile viewport instead of overflowing behind Safari chrome.
// - Keeps the message composer pinned inside the visible chat panel.
// - Adds safe-area padding for iPhone home indicator / browser controls.
// - Keeps the message list independently scrollable so the composer stays reachable.
//
// Purpose:
// - Render the visible ARI Circle messaging interface.
// - Open a conversation when Conversations emits:
//     "circle:conversation-opened"
// - Render the Messages inbox when Conversations emits:
//     "circle:inbox-opened"
// - Load persisted messages through CircleApi.
// - Send messages through Conversations.sendMessage().
// - Reconcile locally-sent messages when CircleApi emits:
//     "circle:message-persisted"
// - Handle temporary conversation shells while Supabase creates the
//   canonical direct conversation.
//
// This is the visual/UI layer that was missing from the messaging flow.
//
// Flow:
//
//   Profile MESSAGE button
//          â
//   MessagesController
//          â
//   Conversations
//          â
//   circle:conversation-opened
//          â
//   ConversationView
//          â
//   Visible chat dialog
//
// Requires:
// - ../core/circle-store.js
// - ../core/circle-events.js
// - ./conversations.js V1.0.1+
// - ../data/circle-api.js V1.3.1+

import CircleStore from "../core/circle-store.js";
import CircleEvents from "../core/circle-events.js";
import Conversations from "./conversations.js?v=1.0.1";
import CircleApi from "../data/circle-api.js?v=1.3.1";

const VERSION = "1.0.1";
const SOURCE = "ari-circle/messaging/conversation-view";

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

function isLocalConversationId(value) {
  const id =
    normalizeId(
      value
    );

  return Boolean(
    id &&
    id.startsWith(
      "conversation-"
    )
  );
}

function getViewerUserId() {
  return normalizeId(
    CircleStore.get(
      "context.viewerUserId"
    )
  );
}

function getOtherMember(
  conversation
) {
  const viewerUserId =
    getViewerUserId();

  const members =
    Array.isArray(
      conversation?.members
    )
      ? conversation.members
      : [];

  return (
    members.find(
      member =>
        normalizeId(
          member?.userId ||
          member?.user_id ||
          member?.id
        ) !== viewerUserId
    ) ||
    members[0] ||
    null
  );
}

function getMemberName(member) {
  return normalizeString(
    member?.displayName ||
    member?.display_name ||
    member?.name
  ) ||
  "ARI User";
}

function getMemberHandle(member) {
  const handle =
    normalizeString(
      member?.handle ||
      member?.username
    );

  if (!handle) {
    return "";
  }

  return handle.startsWith("@")
    ? handle
    : `@${handle}`;
}

function getMemberAvatar(member) {
  return normalizeString(
    member?.avatarUrl ||
    member?.avatar_url ||
    member?.photoUrl ||
    member?.photo_url
  );
}

function getInitial(member) {
  return getMemberName(
    member
  )
    .charAt(0)
    .toUpperCase() ||
    "A";
}

function formatMessageTime(value) {
  const raw =
    normalizeString(
      value
    );

  if (!raw) {
    return "";
  }

  const date =
    new Date(raw);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(
      undefined,
      {
        hour:
          "numeric",

        minute:
          "2-digit"
      }
    ).format(date);
  } catch {
    return "";
  }
}

function formatConversationTime(value) {
  const raw =
    normalizeString(
      value
    );

  if (!raw) {
    return "";
  }

  const date =
    new Date(raw);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const now =
    new Date();

  const sameDay =
    date.getFullYear() ===
      now.getFullYear() &&
    date.getMonth() ===
      now.getMonth() &&
    date.getDate() ===
      now.getDate();

  try {
    if (sameDay) {
      return new Intl.DateTimeFormat(
        undefined,
        {
          hour:
            "numeric",

          minute:
            "2-digit"
        }
      ).format(date);
    }

    return new Intl.DateTimeFormat(
      undefined,
      {
        month:
          "short",

        day:
          "numeric"
      }
    ).format(date);
  } catch {
    return "";
  }
}

const ConversationView = {
  version:
    VERSION,

  source:
    SOURCE,

  state: {
    initialized:
      false,

    mode:
      "inbox",

    activeConversationId:
      null,

    activeConversation:
      null,

    loadingMessages:
      false,

    sending:
      false,

    unsubscribers:
      []
  },

  dom: {
    dialog:
      null,

    eyebrow:
      null,

    title:
      null,

    subtitle:
      null,

    backButton:
      null,

    closeButton:
      null,

    inbox:
      null,

    inboxList:
      null,

    thread:
      null,

    messageList:
      null,

    status:
      null,

    composer:
      null,

    input:
      null,

    sendButton:
      null
  },

  init() {
    if (
      this.state.initialized
    ) {
      return this.getDiagnostics();
    }

    this.ensureDialog();
    this.bindEvents();
    this.bindDom();

    this.state.initialized =
      true;

    return this.getDiagnostics();
  },

  ensureDialog() {
    let dialog =
      document.getElementById(
        "circle-conversation-view"
      );

    if (!dialog) {
      dialog =
        document.createElement(
          "dialog"
        );

      dialog.id =
        "circle-conversation-view";

      dialog.className =
        "circle-dialog circle-conversation-view";

      dialog.innerHTML = `
        <div class="circle-dialog__panel circle-conversation-view__panel">

          <header class="circle-conversation-view__header">
            <button
              id="circle-conversation-back"
              class="circle-icon-button"
              type="button"
              aria-label="Back to Messages"
              hidden
            >
              &larr;
            </button>

            <div class="circle-conversation-view__heading">
              <p
                id="circle-conversation-eyebrow"
                class="circle-section-eyebrow"
              >
                ARI CIRCLE
              </p>

              <h2 id="circle-conversation-title">
                Messages
              </h2>

              <p
                id="circle-conversation-subtitle"
                class="circle-conversation-view__subtitle"
                hidden
              ></p>
            </div>

            <button
              id="circle-conversation-close"
              class="circle-icon-button"
              type="button"
              aria-label="Close Messages"
            >
              &times;
            </button>
          </header>

          <p
            id="circle-conversation-status"
            class="circle-section-note circle-conversation-view__status"
            role="status"
            aria-live="polite"
          ></p>

          <section
            id="circle-conversation-inbox"
            class="circle-conversation-inbox"
          >
            <div
              id="circle-conversation-inbox-list"
              class="circle-conversation-inbox__list"
              aria-live="polite"
            ></div>
          </section>

          <section
            id="circle-conversation-thread"
            class="circle-conversation-thread"
            hidden
          >
            <div
              id="circle-conversation-message-list"
              class="circle-conversation-thread__messages"
              aria-live="polite"
            ></div>

            <form
              id="circle-conversation-composer"
              class="circle-conversation-composer"
            >
              <label
                class="sr-only"
                for="circle-conversation-input"
              >
                Type a message
              </label>

              <textarea
                id="circle-conversation-input"
                rows="1"
                maxlength="4000"
                placeholder="Type a message..."
              ></textarea>

              <button
                id="circle-conversation-send"
                class="circle-button circle-button--primary circle-button--small"
                type="submit"
              >
                Send
              </button>
            </form>
          </section>
        </div>
      `;

      document.body.appendChild(
        dialog
      );

      this.injectStyles();
    }

    this.dom.dialog =
      dialog;

    this.dom.eyebrow =
      dialog.querySelector(
        "#circle-conversation-eyebrow"
      );

    this.dom.title =
      dialog.querySelector(
        "#circle-conversation-title"
      );

    this.dom.subtitle =
      dialog.querySelector(
        "#circle-conversation-subtitle"
      );

    this.dom.backButton =
      dialog.querySelector(
        "#circle-conversation-back"
      );

    this.dom.closeButton =
      dialog.querySelector(
        "#circle-conversation-close"
      );

    this.dom.inbox =
      dialog.querySelector(
        "#circle-conversation-inbox"
      );

    this.dom.inboxList =
      dialog.querySelector(
        "#circle-conversation-inbox-list"
      );

    this.dom.thread =
      dialog.querySelector(
        "#circle-conversation-thread"
      );

    this.dom.messageList =
      dialog.querySelector(
        "#circle-conversation-message-list"
      );

    this.dom.status =
      dialog.querySelector(
        "#circle-conversation-status"
      );

    this.dom.composer =
      dialog.querySelector(
        "#circle-conversation-composer"
      );

    this.dom.input =
      dialog.querySelector(
        "#circle-conversation-input"
      );

    this.dom.sendButton =
      dialog.querySelector(
        "#circle-conversation-send"
      );
  },

  injectStyles() {
    if (
      document.getElementById(
        "circle-conversation-view-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "circle-conversation-view-styles";

    style.textContent = `
      .circle-conversation-view {
        box-sizing: border-box;
      }

      .circle-conversation-view__panel {
        box-sizing: border-box;
        width: min(100%, 760px);
        height: min(calc(100dvh - 24px), 900px);
        max-height: min(calc(100dvh - 24px), 900px);
        min-height: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .circle-conversation-view__header {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        padding-bottom: 12px;
      }

      .circle-conversation-view__heading {
        min-width: 0;
      }

      .circle-conversation-view__heading h2 {
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .circle-conversation-view__subtitle {
        margin: 3px 0 0;
        opacity: 0.7;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.8rem;
      }

      .circle-conversation-view__status {
        min-height: 20px;
        margin: 0 0 8px;
      }

      .circle-conversation-inbox,
      .circle-conversation-thread {
        min-height: 0;
        flex: 1 1 auto;
        overflow: hidden;
      }

      .circle-conversation-inbox__list {
        height: 100%;
        overflow-y: auto;
        overscroll-behavior: contain;
      }

      .circle-conversation-inbox__empty {
        padding: 34px 8px;
        text-align: center;
        opacity: 0.7;
      }

      .circle-conversation-inbox-item {
        width: 100%;
        display: grid;
        grid-template-columns: 52px minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        padding: 14px 2px;
        border: 0;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        background: transparent;
        color: inherit;
        text-align: left;
        cursor: pointer;
      }

      .circle-conversation-inbox-item__avatar,
      .circle-conversation-inbox-item__fallback {
        width: 52px;
        height: 52px;
        border-radius: 50%;
      }

      .circle-conversation-inbox-item__avatar {
        object-fit: cover;
      }

      .circle-conversation-inbox-item__fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(104,231,255,0.4);
        background: rgba(7,24,35,0.92);
        font-family: "Orbitron", sans-serif;
        font-weight: 700;
      }

      .circle-conversation-inbox-item__body {
        min-width: 0;
      }

      .circle-conversation-inbox-item__name {
        display: block;
        font-weight: 700;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .circle-conversation-inbox-item__handle {
        display: block;
        margin-top: 2px;
        opacity: 0.62;
        font-size: 0.78rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .circle-conversation-inbox-item__meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
        min-width: 42px;
        font-size: 0.72rem;
        opacity: 0.72;
      }

      .circle-conversation-inbox-item__badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        border-radius: 999px;
        background: rgba(104,231,255,0.18);
        opacity: 1;
      }

      .circle-conversation-thread {
        display: flex;
        flex-direction: column;
      }

      .circle-conversation-thread__messages {
        flex: 1 1 0;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        padding: 6px 2px 14px;
      }

      .circle-conversation-thread__empty {
        padding: 34px 8px;
        text-align: center;
        opacity: 0.68;
      }

      .circle-message-row {
        display: flex;
        margin: 8px 0;
      }

      .circle-message-row--mine {
        justify-content: flex-end;
      }

      .circle-message-row--theirs {
        justify-content: flex-start;
      }

      .circle-message-bubble {
        max-width: min(78%, 540px);
        padding: 10px 12px 8px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.055);
      }

      .circle-message-row--mine .circle-message-bubble {
        border-color: rgba(104,231,255,0.26);
        background: rgba(104,231,255,0.10);
      }

      .circle-message-bubble__text {
        margin: 0;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      .circle-message-bubble__meta {
        display: block;
        margin-top: 5px;
        font-size: 0.66rem;
        opacity: 0.56;
        text-align: right;
      }

      .circle-conversation-composer {
        position: relative;
        z-index: 4;
        flex: 0 0 auto;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        align-items: end;
        margin: 0;
        padding: 10px 0 0;
        border-top: 1px solid rgba(255,255,255,0.08);
        background: inherit;
      }

      .circle-conversation-composer textarea {
        display: block;
        width: 100%;
        min-width: 0;
        min-height: 48px;
        max-height: 132px;
        margin: 0;
        resize: none;
        border-radius: 14px;
        box-sizing: border-box;
      }

      .circle-conversation-composer button {
        min-height: 48px;
        margin: 0;
        align-self: end;
      }

      @media (max-width: 520px) {
        .circle-conversation-view {
          position: fixed;
          inset: 0;
          box-sizing: border-box;
          width: 100vw;
          max-width: none;
          height: 100svh;
          max-height: 100svh;
          margin: 0;
          padding: 0;
          border: 0;
          overflow: hidden;
          background: transparent;
        }

        .circle-conversation-view__panel {
          box-sizing: border-box;
          width: 100%;
          max-width: none;
          height: 100svh;
          max-height: 100svh;
          min-height: 0;
          margin: 0;
          overflow: hidden;
          border-radius: 0;
          padding-top: max(12px, env(safe-area-inset-top));
          padding-right: max(14px, env(safe-area-inset-right));
          padding-bottom: max(12px, env(safe-area-inset-bottom));
          padding-left: max(14px, env(safe-area-inset-left));
        }

        .circle-conversation-view__header {
          flex: 0 0 auto;
        }

        .circle-conversation-view__status {
          flex: 0 0 auto;
        }

        .circle-conversation-thread {
          min-height: 0;
          overflow: hidden;
        }

        .circle-conversation-thread__messages {
          min-height: 0;
          padding-bottom: 12px;
        }

        .circle-conversation-composer {
          position: sticky;
          bottom: 0;
          z-index: 10;
          flex: 0 0 auto;
          padding-top: 10px;
          padding-bottom: max(2px, env(safe-area-inset-bottom));
          background: inherit;
        }

        .circle-conversation-composer textarea {
          min-height: 50px;
          font-size: 16px;
        }

        .circle-conversation-composer button {
          min-height: 50px;
        }

        .circle-message-bubble {
          max-width: 84%;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  },

  bindEvents() {
    this.state.unsubscribers.push(
      CircleEvents.on(
        "circle:conversation-opened",
        payload => {
          const detail =
            payload?.detail ||
            {};

          this.openThread(
            detail.conversation
          );
        }
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        "circle:inbox-opened",
        payload => {
          const detail =
            payload?.detail ||
            {};

          this.openInbox(
            detail.conversations
          );
        }
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        "circle:conversation-messages-changed",
        payload => {
          const detail =
            payload?.detail ||
            {};

          const conversationId =
            normalizeId(
              detail.conversationId
            );

          if (
            conversationId &&
            conversationId ===
              this.state
                .activeConversationId
          ) {
            this.renderMessages(
              detail.messages
            );
          }
        }
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        "circle:conversation-reconciled",
        payload => {
          const detail =
            payload?.detail ||
            {};

          const conversation =
            detail.conversation;

          if (conversation) {
            this.state.activeConversation =
              conversation;

            this.state.activeConversationId =
              normalizeId(
                conversation.id
              );

            this.renderThreadHeader(
              conversation
            );

            this.updateComposerState();
          }
        }
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        "circle:message-persisted",
        payload => {
          const detail =
            payload?.detail ||
            {};

          this.reconcilePersistedMessage({
            localMessageId:
              detail.localMessageId,

            message:
              detail.message
          });
        }
      )
    );
  },

  bindDom() {
    this.dom.closeButton
      ?.addEventListener(
        "click",
        () =>
          this.close()
      );

    this.dom.backButton
      ?.addEventListener(
        "click",
        () =>
          this.showInbox()
      );

    this.dom.inboxList
      ?.addEventListener(
        "click",
        event => {
          const button =
            event.target.closest(
              "[data-conversation-id]"
            );

          const conversationId =
            normalizeId(
              button?.dataset
                ?.conversationId
            );

          if (!conversationId) {
            return;
          }

          Conversations.openConversation(
            conversationId
          );
        }
      );

    this.dom.composer
      ?.addEventListener(
        "submit",
        event => {
          event.preventDefault();
          this.sendCurrentMessage();
        }
      );

    this.dom.input
      ?.addEventListener(
        "input",
        () => {
          this.autoResizeInput();
          this.updateComposerState();
        }
      );

    this.dom.input
      ?.addEventListener(
        "keydown",
        event => {
          if (
            event.key === "Enter" &&
            !event.shiftKey
          ) {
            event.preventDefault();

            if (
              !this.dom.sendButton
                ?.disabled
            ) {
              this.sendCurrentMessage();
            }
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

  ensureOpen() {
    if (
      !this.dom.dialog ||
      typeof this.dom.dialog
        .showModal !== "function"
    ) {
      CircleEvents.showToast(
        "Messages could not be opened."
      );

      return false;
    }

    if (
      !this.dom.dialog.open
    ) {
      this.dom.dialog.showModal();
    }

    return true;
  },

  openInbox(
    conversations = null
  ) {
    if (!this.ensureOpen()) {
      return false;
    }

    this.state.mode =
      "inbox";

    this.state.activeConversationId =
      null;

    this.state.activeConversation =
      null;

    this.setStatus(
      ""
    );

    this.showInbox(
      conversations
    );

    return true;
  },

  showInbox(
    conversations = null
  ) {
    this.state.mode =
      "inbox";

    this.dom.backButton.hidden =
      true;

    this.dom.inbox.hidden =
      false;

    this.dom.thread.hidden =
      true;

    this.dom.eyebrow.textContent =
      "ARI CIRCLE";

    this.dom.title.textContent =
      "Messages";

    this.dom.subtitle.hidden =
      true;

    this.dom.subtitle.textContent =
      "";

    const list =
      Array.isArray(
        conversations
      )
        ? conversations
        : Conversations
            .getConversations();

    this.renderInbox(
      list
    );

    return true;
  },

  async openThread(
    conversation
  ) {
    if (
      !conversation ||
      !normalizeId(
        conversation.id
      )
    ) {
      return false;
    }

    if (!this.ensureOpen()) {
      return false;
    }

    this.state.mode =
      "thread";

    this.state.activeConversation =
      conversation;

    this.state.activeConversationId =
      normalizeId(
        conversation.id
      );

    this.dom.backButton.hidden =
      false;

    this.dom.inbox.hidden =
      true;

    this.dom.thread.hidden =
      false;

    this.renderThreadHeader(
      conversation
    );

    this.updateComposerState();

    const id =
      this.state
        .activeConversationId;

    if (
      isLocalConversationId(id) ||
      conversation
        ?.pendingPersistence
    ) {
      this.setStatus(
        "Preparing conversation..."
      );

      this.renderMessages(
        Conversations.getMessages(
          id
        )
      );

      return true;
    }

    await this.loadMessages(
      id
    );

    this.dom.input
      ?.focus();

    return true;
  },

  renderThreadHeader(
    conversation
  ) {
    const member =
      getOtherMember(
        conversation
      );

    this.dom.eyebrow.textContent =
      "DIRECT MESSAGE";

    this.dom.title.textContent =
      getMemberName(
        member
      );

    const handle =
      getMemberHandle(
        member
      );

    this.dom.subtitle.textContent =
      handle;

    this.dom.subtitle.hidden =
      !handle;
  },

  async loadMessages(
    conversationId
  ) {
    const id =
      normalizeId(
        conversationId
      );

    if (
      !id ||
      isLocalConversationId(id)
    ) {
      return [];
    }

    if (
      this.state.loadingMessages
    ) {
      return Conversations
        .getMessages(id);
    }

    this.state.loadingMessages =
      true;

    this.setStatus(
      "Loading messages..."
    );

    try {
      const messages =
        await CircleApi.getMessages({
          conversationId:
            id,

          limit:
            100
        });

      Conversations.setMessages(
        id,
        messages
      );

      if (
        this.state
          .activeConversationId === id
      ) {
        this.renderMessages(
          Conversations
            .getMessages(id)
        );
      }

      try {
        await CircleApi
          .markConversationRead(
            id
          );
      } catch (error) {
        console.warn(
          "ARI Circle conversation read state could not be persisted.",
          error
        );
      }

      this.setStatus(
        ""
      );

      return messages;
    } catch (error) {
      console.error(
        "ARI Circle messages failed to load.",
        error
      );

      this.setStatus(
        "Messages could not be loaded."
      );

      CircleEvents.reportError?.(
        error,
        {
          message:
            "Messages could not be loaded."
        }
      );

      return [];
    } finally {
      this.state.loadingMessages =
        false;

      this.updateComposerState();
    }
  },

  renderInbox(
    conversations
  ) {
    if (!this.dom.inboxList) {
      return;
    }

    const rows =
      Array.isArray(
        conversations
      )
        ? conversations
        : [];

    if (!rows.length) {
      this.dom.inboxList.innerHTML = `
        <div class="circle-conversation-inbox__empty">
          <p>No conversations yet.</p>
        </div>
      `;

      return;
    }

    const sorted =
      [
        ...rows
      ].sort(
        (a, b) => {
          const aTime =
            new Date(
              a?.lastMessageAt ||
              a?.updatedAt ||
              a?.createdAt ||
              0
            ).getTime();

          const bTime =
            new Date(
              b?.lastMessageAt ||
              b?.updatedAt ||
              b?.createdAt ||
              0
            ).getTime();

          return bTime - aTime;
        }
      );

    this.dom.inboxList.innerHTML =
      sorted
        .map(
          conversation => {
            const member =
              getOtherMember(
                conversation
              );

            const name =
              getMemberName(
                member
              );

            const handle =
              getMemberHandle(
                member
              );

            const avatar =
              getMemberAvatar(
                member
              );

            const initial =
              getInitial(
                member
              );

            const unread =
              Math.max(
                0,
                Number(
                  conversation
                    ?.unreadCount
                ) || 0
              );

            const time =
              formatConversationTime(
                conversation
                  ?.lastMessageAt ||
                conversation
                  ?.updatedAt ||
                conversation
                  ?.createdAt
              );

            const avatarMarkup =
              avatar
                ? `
                  <img
                    class="circle-conversation-inbox-item__avatar"
                    src="${escapeHtml(avatar)}"
                    alt="${escapeHtml(name)}"
                  />
                `
                : `
                  <span
                    class="circle-conversation-inbox-item__fallback"
                    aria-hidden="true"
                  >
                    ${escapeHtml(initial)}
                  </span>
                `;

            return `
              <button
                class="circle-conversation-inbox-item"
                type="button"
                data-conversation-id="${escapeHtml(conversation.id)}"
              >
                ${avatarMarkup}

                <span class="circle-conversation-inbox-item__body">
                  <span class="circle-conversation-inbox-item__name">
                    ${escapeHtml(name)}
                  </span>

                  ${
                    handle
                      ? `
                        <span class="circle-conversation-inbox-item__handle">
                          ${escapeHtml(handle)}
                        </span>
                      `
                      : ""
                  }
                </span>

                <span class="circle-conversation-inbox-item__meta">
                  ${
                    time
                      ? `
                        <span>
                          ${escapeHtml(time)}
                        </span>
                      `
                      : ""
                  }

                  ${
                    unread > 0
                      ? `
                        <span class="circle-conversation-inbox-item__badge">
                          ${escapeHtml(
                            unread > 99
                              ? "99+"
                              : unread
                          )}
                        </span>
                      `
                      : ""
                  }
                </span>
              </button>
            `;
          }
        )
        .join("");
  },

  renderMessages(
    messages
  ) {
    if (!this.dom.messageList) {
      return;
    }

    const rows =
      Array.isArray(
        messages
      )
        ? messages
        : [];

    if (!rows.length) {
      this.dom.messageList.innerHTML = `
        <div class="circle-conversation-thread__empty">
          <p>No messages yet. Say hello.</p>
        </div>
      `;

      return;
    }

    const viewerUserId =
      getViewerUserId();

    this.dom.messageList.innerHTML =
      rows
        .map(
          message => {
            const mine =
              normalizeId(
                message
                  ?.senderUserId ||
                message
                  ?.sender_user_id
              ) ===
              viewerUserId;

            const body =
              normalizeString(
                message?.body
              ) ||
              "";

            const time =
              formatMessageTime(
                message
                  ?.createdAt ||
                message
                  ?.created_at
              );

            const status =
              normalizeString(
                message?.status
              );

            return `
              <div
                class="circle-message-row ${
                  mine
                    ? "circle-message-row--mine"
                    : "circle-message-row--theirs"
                }"
              >
                <div class="circle-message-bubble">
                  <p class="circle-message-bubble__text">${escapeHtml(body)}</p>

                  <span class="circle-message-bubble__meta">
                    ${escapeHtml(time)}
                    ${
                      mine &&
                      status === "sending"
                        ? " Â· Sending"
                        : ""
                    }
                  </span>
                </div>
              </div>
            `;
          }
        )
        .join("");

    requestAnimationFrame(
      () => {
        if (
          this.dom.messageList
        ) {
          this.dom.messageList.scrollTop =
            this.dom.messageList
              .scrollHeight;
        }
      }
    );
  },

  async sendCurrentMessage() {
    if (
      this.state.sending
    ) {
      return false;
    }

    const id =
      normalizeId(
        this.state
          .activeConversationId
      );

    const body =
      normalizeString(
        this.dom.input?.value
      );

    if (
      !id ||
      !body
    ) {
      return false;
    }

    if (
      isLocalConversationId(id) ||
      this.state
        .activeConversation
        ?.pendingPersistence
    ) {
      this.setStatus(
        "Preparing conversation..."
      );

      return false;
    }

    this.state.sending =
      true;

    this.updateComposerState();

    try {
      const message =
        await Conversations
          .sendMessage({
            conversationId:
              id,

            body
          });

      if (!message) {
        return false;
      }

      if (
        this.dom.input
      ) {
        this.dom.input.value =
          "";

        this.autoResizeInput();
      }

      this.setStatus(
        ""
      );

      return true;
    } catch (error) {
      console.error(
        "ARI Circle message send failed.",
        error
      );

      this.setStatus(
        "Message could not be sent."
      );

      CircleEvents.reportError?.(
        error,
        {
          message:
            "Message could not be sent."
        }
      );

      return false;
    } finally {
      this.state.sending =
        false;

      this.updateComposerState();
    }
  },

  reconcilePersistedMessage({
    localMessageId,
    message
  } = {}) {
    const localId =
      normalizeId(
        localMessageId
      );

    const conversationId =
      normalizeId(
        message?.conversation_id ||
        message?.conversationId
      );

    if (
      !conversationId ||
      !message
    ) {
      return false;
    }

    const current =
      Conversations
        .getMessages(
          conversationId
        );

    const next =
      [
        ...current.filter(
          item =>
            normalizeId(
              item?.id
            ) !==
            localId
        ),

        message
      ];

    Conversations.setMessages(
      conversationId,
      next
    );

    if (
      this.state
        .activeConversationId ===
      conversationId
    ) {
      this.renderMessages(
        Conversations
          .getMessages(
            conversationId
          )
      );
    }

    return true;
  },

  updateComposerState() {
    const id =
      normalizeId(
        this.state
          .activeConversationId
      );

    const hasText =
      Boolean(
        normalizeString(
          this.dom.input?.value
        )
      );

    const preparing =
      Boolean(
        !id ||
        isLocalConversationId(id) ||
        this.state
          .activeConversation
          ?.pendingPersistence
      );

    if (
      this.dom.input
    ) {
      this.dom.input.disabled =
        preparing ||
        this.state.sending ||
        this.state.loadingMessages;

      this.dom.input.placeholder =
        preparing
          ? "Preparing conversation..."
          : "Type a message...";
    }

    if (
      this.dom.sendButton
    ) {
      this.dom.sendButton.disabled =
        preparing ||
        this.state.sending ||
        this.state.loadingMessages ||
        !hasText;

      this.dom.sendButton.textContent =
        this.state.sending
          ? "Sending..."
          : "Send";
    }
  },

  autoResizeInput() {
    const input =
      this.dom.input;

    if (!input) {
      return;
    }

    input.style.height =
      "auto";

    input.style.height =
      `${Math.min(
        input.scrollHeight,
        132
      )}px`;
  },

  setStatus(text) {
    if (
      this.dom.status
    ) {
      this.dom.status.textContent =
        text || "";
    }
  },

  close() {
    if (
      this.dom.dialog?.open
    ) {
      this.dom.dialog.close();
    }

    Conversations
      .closeConversation?.();

    this.state.mode =
      "inbox";

    this.state.activeConversationId =
      null;

    this.state.activeConversation =
      null;

    return true;
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
          "ARI Circle conversation view unsubscribe failed.",
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
        "circle-conversation-view-styles"
      )
      ?.remove();

    this.state.initialized =
      false;

    this.state.activeConversationId =
      null;

    this.state.activeConversation =
      null;

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

      mode:
        this.state.mode,

      activeConversationId:
        this.state
          .activeConversationId,

      loadingMessages:
        this.state
          .loadingMessages,

      sending:
        this.state.sending
    };
  }
};

export {
  ConversationView
};

export default ConversationView;
