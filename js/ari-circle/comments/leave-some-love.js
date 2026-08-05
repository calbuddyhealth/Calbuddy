// js/ari-circle/comments/leave-some-love.js
// ARI Circle
// V1.0.0
//
// Purpose:
// - Own the public "Leave Some Love" profile comments feature.
// - Render comments from CircleStore into ari-circle.html.
// - Handle visitor comment submission.
// - Track character count.
// - Load more / collapse comments locally.
// - Emit create/delete events for the future persistence layer.
//
// This module does NOT:
// - Query or write to Supabase directly.
// - Moderate content.
// - Own blocking rules.
// - Own profile loading.
//
// Future persistence flow:
//   LeaveSomeLove
//        -> CircleStore
//        -> EVENT_NAMES.LOVE_CREATED / LOVE_DELETED
//        -> data/circle-api.js
//
// Canonical behavior:
// - Public profile comments.
// - Separate from private messages.
// - Visitors can post when allowed.
// - Owner can view/manage comments on their own Circle.

import CircleStore from "../core/circle-store.js";
import CircleEvents, {
  EVENT_NAMES
} from "../core/circle-events.js";

const VERSION = "1.0.0";
const SOURCE = "ari-circle/comments/leave-some-love";

const MAX_LENGTH = 280;
const INITIAL_VISIBLE_COUNT = 4;

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

function normalizeHandle(value) {
  const normalized =
    normalizeString(value);

  if (!normalized) {
    return null;
  }

  return normalized
    .replace(/^@+/, "")
    .trim()
    .toLowerCase() || null;
}

function normalizeComment(comment) {
  if (
    !comment ||
    typeof comment !== "object"
  ) {
    return null;
  }

  const text =
    normalizeString(
      comment.text ||
      comment.body ||
      comment.message
    );

  if (!text) {
    return null;
  }

  const author =
    comment.author &&
    typeof comment.author === "object"
      ? comment.author
      : {};

  const authorUserId =
    normalizeString(
      comment.author_user_id ||
      comment.authorUserId ||
      author.user_id ||
      author.userId ||
      author.id
    );

  const displayName =
    normalizeString(
      comment.author_display_name ||
      comment.authorDisplayName ||
      author.display_name ||
      author.displayName ||
      author.name
    ) ||
    "ARI User";

  return Object.freeze({
    id:
      normalizeString(
        comment.id ||
        comment.comment_id ||
        comment.commentId
      ),

    profileUserId:
      normalizeString(
        comment.profile_user_id ||
        comment.profileUserId
      ),

    authorUserId,
    authorDisplayName:
      displayName,

    authorHandle:
      normalizeHandle(
        comment.author_handle ||
        comment.authorHandle ||
        author.handle ||
        author.username
      ),

    authorAvatarUrl:
      normalizeString(
        comment.author_avatar_url ||
        comment.authorAvatarUrl ||
        author.avatar_url ||
        author.avatarUrl ||
        author.photo_url ||
        author.photoUrl
      ),

    text:
      text.slice(
        0,
        MAX_LENGTH
      ),

    createdAt:
      normalizeString(
        comment.created_at ||
        comment.createdAt
      ) ||
      new Date().toISOString(),

    canDelete:
      Boolean(
        comment.canDelete ||
        comment.can_delete
      )
  });
}

function normalizeComments(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map(normalizeComment)
    .filter(Boolean);
}

function formatRelativeTime(value) {
  const date =
    value
      ? new Date(value)
      : null;

  if (
    !date ||
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const diffMs =
    Date.now() -
    date.getTime();

  const diffSeconds =
    Math.max(
      0,
      Math.floor(
        diffMs / 1000
      )
    );

  if (diffSeconds < 60) {
    return "Now";
  }

  const diffMinutes =
    Math.floor(
      diffSeconds / 60
    );

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours =
    Math.floor(
      diffMinutes / 60
    );

  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays =
    Math.floor(
      diffHours / 24
    );

  if (diffDays === 1) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return `${diffDays}d`;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      month: "short",
      day: "numeric"
    }
  ).format(date);
}

function createLocalId() {
  if (
    globalThis.crypto
      ?.randomUUID
  ) {
    return globalThis.crypto
      .randomUUID();
  }

  return (
    "local-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}

const LeaveSomeLove = {
  version:
    VERSION,

  source:
    SOURCE,

  state: {
    initialized:
      false,

    expanded:
      false,

    submitting:
      false,

    unsubscribers:
      []
  },

  dom: {
    form:
      null,

    input:
      null,

    counter:
      null,

    submit:
      null,

    list:
      null,

    empty:
      null,

    more:
      null,

    template:
      null
  },

  init() {
    if (
      this.state.initialized
    ) {
      return this.getDiagnostics();
    }

    this.cacheDom();
    this.bindForm();
    this.bindActions();
    this.bindStore();

    this.updateCounter();
    this.render(
      CircleStore.getState()
    );

    this.state.initialized =
      true;

    return this.getDiagnostics();
  },

  cacheDom() {
    this.dom.form =
      document.getElementById(
        "circle-love-form"
      );

    this.dom.input =
      document.getElementById(
        "circle-love-input"
      );

    this.dom.counter =
      document.getElementById(
        "circle-love-counter"
      );

    this.dom.submit =
      document.getElementById(
        "circle-love-submit"
      );

    this.dom.list =
      document.getElementById(
        "circle-love-list"
      );

    this.dom.empty =
      document.getElementById(
        "circle-love-empty"
      );

    this.dom.more =
      document.getElementById(
        "circle-love-more-button"
      );

    this.dom.template =
      document.getElementById(
        "circle-love-item-template"
      );
  },

  bindForm() {
    this.dom.input
      ?.addEventListener(
        "input",
        () =>
          this.updateCounter()
      );

    this.dom.form
      ?.addEventListener(
        "submit",
        event =>
          this.handleSubmit(event)
      );
  },

  bindActions() {
    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "view-more-love",
        () =>
          this.toggleExpanded()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "love-options",
        payload =>
          this.handleCommentOptions(
            payload
          )
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
            keys.includes("love") ||
            keys.includes("context")
          ) {
            this.render(state);
          }
        }
      );

    this.state.unsubscribers.push(
      unsubscribe
    );
  },

  setComments({
    items,
    total,
    hasMore,
    loading
  } = {}) {
    const current =
      CircleStore.get(
        "love"
      ) || {};

    const normalizedItems =
      items !== undefined
        ? normalizeComments(
            items
          )
        : normalizeComments(
            current.items
          );

    CircleStore.setLoveState({
      items:
        normalizedItems,

      total:
        Number.isFinite(
          Number(total)
        )
          ? Number(total)
          : normalizedItems.length,

      hasMore:
        hasMore !== undefined
          ? Boolean(hasMore)
          : Boolean(
              current.hasMore
            ),

      loading:
        loading !== undefined
          ? Boolean(loading)
          : Boolean(
              current.loading
            )
    });

    return CircleStore.get(
      "love"
    );
  },

  render(state) {
    const love =
      state?.love || {};

    const context =
      state?.context;

    const items =
      normalizeComments(
        love.items
      );

    const visibleItems =
      this.state.expanded
        ? items
        : items.slice(
            0,
            INITIAL_VISIBLE_COUNT
          );

    if (
      this.dom.list
    ) {
      this.dom.list
        .replaceChildren();

      visibleItems.forEach(
        comment => {
          this.dom.list.append(
            this.createCommentNode(
              comment,
              context
            )
          );
        }
      );
    }

    if (
      this.dom.empty
    ) {
      this.dom.empty.hidden =
        items.length > 0 ||
        Boolean(
          love.loading
        );
    }

    if (
      this.dom.more
    ) {
      const hasHiddenLocal =
        items.length >
        INITIAL_VISIBLE_COUNT;

      const shouldShow =
        hasHiddenLocal ||
        Boolean(
          love.hasMore
        );

      this.dom.more.hidden =
        !shouldShow;

      this.dom.more.textContent =
        this.state.expanded
          ? "Show Less â"
          : "View More â";
    }

    if (
      this.dom.form
    ) {
      const canPost =
        Boolean(
          context?.isVisitor &&
          context?.isAuthenticated
        );

      this.dom.form.hidden =
        !canPost;
    }
  },

  createCommentNode(
    comment,
    context
  ) {
    let node =
      null;

    if (
      this.dom.template
        ?.content
    ) {
      node =
        this.dom.template
          .content
          .firstElementChild
          ?.cloneNode(true);
    }

    if (!node) {
      node =
        document.createElement(
          "article"
        );

      node.className =
        "circle-love-item";

      node.innerHTML = `
        <button
          class="circle-love-item__profile"
          type="button"
          data-circle-action="open-profile"
        >
          <img
            class="circle-love-item__avatar"
            src=""
            alt=""
          />
        </button>

        <div class="circle-love-item__body">
          <div class="circle-love-item__meta">
            <button
              class="circle-love-item__name"
              type="button"
              data-circle-action="open-profile"
            ></button>

            <time class="circle-love-item__time"></time>
          </div>

          <p class="circle-love-item__text"></p>
        </div>

        <button
          class="circle-love-item__more"
          type="button"
          aria-label="Comment options"
          data-circle-action="love-options"
        >
          â¢â¢â¢
        </button>
      `;
    }

    node.dataset.commentId =
      comment.id || "";

    const profileButton =
      node.querySelector(
        ".circle-love-item__profile"
      );

    const avatar =
      node.querySelector(
        ".circle-love-item__avatar"
      );

    const name =
      node.querySelector(
        ".circle-love-item__name"
      );

    const time =
      node.querySelector(
        ".circle-love-item__time"
      );

    const text =
      node.querySelector(
        ".circle-love-item__text"
      );

    const more =
      node.querySelector(
        ".circle-love-item__more"
      );

    for (
      const profileTrigger
      of [
        profileButton,
        name
      ]
    ) {
      if (!profileTrigger) {
        continue;
      }

      if (
        comment.authorUserId
      ) {
        profileTrigger.dataset.userId =
          comment.authorUserId;
      }

      if (
        comment.authorHandle
      ) {
        profileTrigger.dataset.handle =
          comment.authorHandle;
      }
    }

    if (avatar) {
      if (
        comment.authorAvatarUrl
      ) {
        avatar.src =
          comment.authorAvatarUrl;

        avatar.alt =
          `${comment.authorDisplayName} profile photo`;

        avatar.hidden =
          false;
      } else {
        avatar.removeAttribute(
          "src"
        );

        avatar.alt =
          "";

        avatar.hidden =
          true;

        profileButton &&
          (
            profileButton.dataset.initials =
              comment.authorDisplayName
                .slice(0, 1)
                .toUpperCase()
          );
      }
    }

    if (name) {
      name.textContent =
        comment.authorDisplayName;
    }

    if (time) {
      time.dateTime =
        comment.createdAt;

      time.textContent =
        formatRelativeTime(
          comment.createdAt
        );
    }

    if (text) {
      text.textContent =
        comment.text;
    }

    if (more) {
      const viewerUserId =
        normalizeString(
          context?.viewerUserId
        );

      const isAuthor =
        Boolean(
          viewerUserId &&
          comment.authorUserId &&
          viewerUserId ===
            comment.authorUserId
        );

      const isOwner =
        Boolean(
          context?.isOwner
        );

      const canManage =
        Boolean(
          comment.canDelete ||
          isAuthor ||
          isOwner
        );

      more.hidden =
        !canManage;

      more.dataset.commentId =
        comment.id || "";
    }

    return node;
  },

  updateCounter() {
    const length =
      this.dom.input
        ?.value
        ?.length ||
      0;

    if (
      this.dom.counter
    ) {
      this.dom.counter.textContent =
        `${length} / ${MAX_LENGTH}`;
    }
  },

  async handleSubmit(event) {
    event.preventDefault();

    if (this.state.submitting) {
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

    if (
      !context?.isAuthenticated
    ) {
      CircleEvents.showToast(
        "Sign in to leave some love."
      );

      return;
    }

    if (!context?.isVisitor) {
      return;
    }

    const text =
      normalizeString(
        this.dom.input
          ?.value
      );

    if (!text) {
      CircleEvents.showToast(
        "Write something first."
      );

      return;
    }

    if (
      text.length >
      MAX_LENGTH
    ) {
      CircleEvents.showToast(
        `Keep it under ${MAX_LENGTH} characters.`
      );

      return;
    }

    this.state.submitting =
      true;

    this.setSubmitState(true);

    try {
      const authorProfile =
        context.viewerProfile ||
        {};

      const comment =
        normalizeComment({
          id:
            createLocalId(),

          profileUserId:
            normalizeString(
              profile?.user_id ||
              profile?.userId ||
              profile?.id
            ),

          authorUserId:
            context.viewerUserId,

          authorDisplayName:
            normalizeString(
              authorProfile.display_name ||
              authorProfile.displayName ||
              authorProfile.name
            ) ||
            "You",

          authorHandle:
            normalizeHandle(
              context.viewerHandle ||
              authorProfile.handle ||
              authorProfile.username
            ),

          authorAvatarUrl:
            normalizeString(
              authorProfile.avatar_url ||
              authorProfile.avatarUrl
            ),

          text,

          createdAt:
            new Date()
              .toISOString(),

          canDelete:
            true
        });

      const love =
        CircleStore.get(
          "love"
        ) || {};

      const currentItems =
        normalizeComments(
          love.items
        );

      const nextItems =
        [
          comment,
          ...currentItems
        ];

      CircleStore.setLoveState({
        items:
          nextItems,

        total:
          Math.max(
            Number(
              love.total
            ) || 0,
            currentItems.length
          ) + 1,

        hasMore:
          Boolean(
            love.hasMore
          ),

        loading:
          false
      });

      CircleEvents.emit(
        EVENT_NAMES.LOVE_CREATED,
        {
          comment,
          persist:
            true
        }
      );

      if (
        this.dom.input
      ) {
        this.dom.input.value =
          "";
      }

      this.updateCounter();

      CircleEvents.showToast(
        "Love posted."
      );
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not post your message."
        }
      );
    } finally {
      this.state.submitting =
        false;

      this.setSubmitState(false);
    }
  },

  handleCommentOptions(payload) {
    const trigger =
      payload?.trigger;

    const commentId =
      normalizeString(
        trigger?.dataset
          ?.commentId ||
        trigger
          ?.closest?.(
            "[data-comment-id]"
          )
          ?.dataset
          ?.commentId
      );

    if (!commentId) {
      return;
    }

    const love =
      CircleStore.get(
        "love"
      ) || {};

    const comment =
      normalizeComments(
        love.items
      )
        .find(
          item =>
            item.id ===
            commentId
        );

    if (!comment) {
      return;
    }

    /*
     * For V1 we keep this simple:
     * managing your own comment or comments on your own profile
     * immediately removes the item locally and emits a delete event.
     *
     * A richer action sheet can be added later if needed.
     */
    this.deleteComment(
      commentId
    );
  },

  deleteComment(commentId) {
    const id =
      normalizeString(
        commentId
      );

    if (!id) {
      return false;
    }

    const love =
      CircleStore.get(
        "love"
      ) || {};

    const items =
      normalizeComments(
        love.items
      );

    const comment =
      items.find(
        item =>
          item.id === id
      );

    if (!comment) {
      return false;
    }

    const context =
      CircleStore.get(
        "context"
      );

    const viewerUserId =
      normalizeString(
        context?.viewerUserId
      );

    const canDelete =
      Boolean(
        context?.isOwner ||
        comment.canDelete ||
        (
          viewerUserId &&
          comment.authorUserId &&
          viewerUserId ===
            comment.authorUserId
        )
      );

    if (!canDelete) {
      CircleEvents.showToast(
        "You cannot remove this message."
      );

      return false;
    }

    const nextItems =
      items.filter(
        item =>
          item.id !== id
      );

    CircleStore.setLoveState({
      items:
        nextItems,

      total:
        Math.max(
          0,
          (
            Number(
              love.total
            ) ||
            items.length
          ) - 1
        ),

      hasMore:
        Boolean(
          love.hasMore
        ),

      loading:
        false
    });

    CircleEvents.emit(
      EVENT_NAMES.LOVE_DELETED,
      {
        comment,
        persist:
          true
      }
    );

    CircleEvents.showToast(
      "Message removed."
    );

    return true;
  },

  toggleExpanded() {
    const love =
      CircleStore.get(
        "love"
      ) || {};

    const items =
      normalizeComments(
        love.items
      );

    /*
     * If local items are already available, simply expand/collapse.
     * If the backend later reports hasMore=true and everything local
     * is already expanded, emit a request for the next page.
     */
    if (
      !this.state.expanded &&
      items.length >
        INITIAL_VISIBLE_COUNT
    ) {
      this.state.expanded =
        true;

      this.render(
        CircleStore.getState()
      );

      return;
    }

    if (
      this.state.expanded
    ) {
      this.state.expanded =
        false;

      this.render(
        CircleStore.getState()
      );

      return;
    }

    if (
      love.hasMore
    ) {
      CircleEvents.emit(
        "circle:love-load-more",
        {
          currentCount:
            items.length
        }
      );
    }
  },

  setSubmitState(isSubmitting) {
    if (
      this.dom.submit
    ) {
      this.dom.submit.disabled =
        Boolean(isSubmitting);

      this.dom.submit.textContent =
        isSubmitting
          ? "Posting..."
          : "Leave Love";
    }

    if (
      this.dom.input
    ) {
      this.dom.input.disabled =
        Boolean(isSubmitting);
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
          "ARI Circle Leave Some Love unsubscribe failed",
          error
        );
      }
    }

    this.state.unsubscribers =
      [];

    this.state.initialized =
      false;

    this.state.expanded =
      false;

    this.state.submitting =
      false;
  },

  getDiagnostics() {
    const love =
      CircleStore.get(
        "love"
      ) || {};

    return {
      ready:
        this.state.initialized,

      source:
        this.source,

      version:
        this.version,

      commentCount:
        Array.isArray(
          love.items
        )
          ? love.items.length
          : 0,

      expanded:
        this.state.expanded,

      submitting:
        this.state.submitting,

      formFound:
        Boolean(
          this.dom.form
        ),

      listFound:
        Boolean(
          this.dom.list
        )
    };
  }
};

export {
  LeaveSomeLove,
  MAX_LENGTH,
  normalizeComment
};

export default LeaveSomeLove;
