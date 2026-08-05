// js/ari-circle/connections/top-circle.js
// ARI Circle
// V1.0.0
//
// Purpose:
// - Own the Top Circle feature.
// - Render the selected Top 4 / Top 6 around the profile owner.
// - Build the owner-only Top Circle editor.
// - Let the owner select and reorder featured Circle connections.
// - Write Top Circle state into CircleStore.
// - Emit TOP_CIRCLE_CHANGED for the future persistence layer.
//
// This module does NOT:
// - Query Supabase.
// - Load the user's full Circle.
// - Own connection request behavior.
// - Own online presence subscriptions.
//
// Future data flow:
//   circle-api.js loads:
//      full Circle connections
//      saved Top Circle selection/order
//
//   top-circle.js:
//      receives available members
//      renders the orbit/editor
//      updates CircleStore
//      emits TOP_CIRCLE_CHANGED
//
// Canonical Top Circle sizes:
//   4 or 6

import CircleStore from "../core/circle-store.js";
import CircleEvents, {
  EVENT_NAMES
} from "../core/circle-events.js";

const VERSION = "1.0.0";
const SOURCE = "ari-circle/connections/top-circle";

const TOP_CIRCLE_LIMITS =
  Object.freeze([
    4,
    6
  ]);

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

function normalizeLimit(value) {
  return Number(value) === 4
    ? 4
    : 6;
}

function normalizePresence(value) {
  const normalized =
    normalizeString(value)
      ?.toLowerCase();

  if (
    normalized === "online" ||
    normalized === "away" ||
    normalized === "offline"
  ) {
    return normalized;
  }

  return "offline";
}

function normalizeMember(member) {
  if (
    !member ||
    typeof member !== "object"
  ) {
    return null;
  }

  const userId =
    normalizeString(
      member.user_id ||
      member.userId ||
      member.id
    );

  if (!userId) {
    return null;
  }

  const displayName =
    normalizeString(
      member.display_name ||
      member.displayName ||
      member.name
    ) ||
    "ARI User";

  return Object.freeze({
    userId,

    displayName,

    handle:
      normalizeHandle(
        member.handle ||
        member.username
      ),

    avatarUrl:
      normalizeString(
        member.avatar_url ||
        member.avatarUrl ||
        member.photo_url ||
        member.photoUrl
      ),

    presence:
      normalizePresence(
        member.presence ||
        member.presence_status ||
        member.presenceStatus
      ),

    position:
      Number.isFinite(
        Number(
          member.position
        )
      )
        ? Number(
            member.position
          )
        : null
  });
}

function normalizeMembers(members) {
  if (!Array.isArray(members)) {
    return [];
  }

  const seen =
    new Set();

  return members
    .map(normalizeMember)
    .filter(Boolean)
    .filter(member => {
      if (
        seen.has(
          member.userId
        )
      ) {
        return false;
      }

      seen.add(
        member.userId
      );

      return true;
    });
}

function sortMembersByPosition(members) {
  return [...members]
    .sort((a, b) => {
      const aPosition =
        Number.isFinite(
          a.position
        )
          ? a.position
          : Number.MAX_SAFE_INTEGER;

      const bPosition =
        Number.isFinite(
          b.position
        )
          ? b.position
          : Number.MAX_SAFE_INTEGER;

      return (
        aPosition -
        bPosition
      );
    });
}

function getInitials(value) {
  const normalized =
    normalizeString(value);

  if (!normalized) {
    return "A";
  }

  const parts =
    normalized
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 1)
      .toUpperCase();
  }

  return (
    parts[0].slice(0, 1) +
    parts[
      parts.length - 1
    ].slice(0, 1)
  ).toUpperCase();
}

const TopCircle = {
  version:
    VERSION,

  source:
    SOURCE,

  state: {
    initialized:
      false,

    availableMembers:
      [],

    draftLimit:
      6,

    draftMemberIds:
      [],

    unsubscribers:
      []
  },

  dom: {
    orbit:
      null,

    members:
      null,

    empty:
      null,

    count:
      null,

    template:
      null,

    editButton:
      null,

    editor:
      null,

    editorList:
      null,

    saveButton:
      null,

    viewAllButton:
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
    this.bindEditorInputs();

    this.render(
      CircleStore.get(
        "topCircle"
      )
    );

    this.state.initialized =
      true;

    return this.getDiagnostics();
  },

  cacheDom() {
    this.dom.orbit =
      document.getElementById(
        "circle-top-orbit"
      );

    this.dom.members =
      document.getElementById(
        "circle-top-members"
      );

    this.dom.empty =
      document.getElementById(
        "circle-top-empty"
      );

    this.dom.count =
      document.getElementById(
        "circle-top-count"
      );

    this.dom.template =
      document.getElementById(
        "circle-top-member-template"
      );

    this.dom.editButton =
      document.getElementById(
        "circle-edit-top-button"
      );

    this.dom.editor =
      document.getElementById(
        "circle-top-editor"
      );

    this.dom.editorList =
      document.getElementById(
        "circle-top-editor-list"
      );

    this.dom.saveButton =
      document.getElementById(
        "circle-top-save-button"
      );

    this.dom.viewAllButton =
      document.getElementById(
        "circle-view-all-button"
      );
  },

  bindActions() {
    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "edit-top-circle",
        () =>
          this.openEditor()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "close-top-editor",
        () =>
          this.closeEditor()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "save-top-circle",
        () =>
          this.saveDraft()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "view-entire-circle",
        () =>
          this.openEntireCircle()
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
              "topCircle"
            )
          ) {
            this.render(
              state.topCircle
            );
          }
        }
      );

    this.state.unsubscribers.push(
      unsubscribe
    );
  },

  bindEditorInputs() {
    this.dom.editor
      ?.addEventListener(
        "change",
        event => {
          const input =
            event.target;

          if (
            input?.name ===
            "circleTopCount"
          ) {
            this.setDraftLimit(
              input.value
            );

            return;
          }

          if (
            input?.matches?.(
              "[data-top-circle-member]"
            )
          ) {
            this.toggleDraftMember(
              input.dataset
                .userId,
              input.checked
            );
          }
        }
      );

    this.dom.editorList
      ?.addEventListener(
        "click",
        event => {
          const moveButton =
            event.target
              ?.closest?.(
                "[data-top-circle-move]"
              );

          if (!moveButton) {
            return;
          }

          const userId =
            normalizeString(
              moveButton.dataset
                .userId
            );

          const direction =
            moveButton.dataset
              .topCircleMove;

          if (!userId) {
            return;
          }

          if (
            direction === "up"
          ) {
            this.moveDraftMember(
              userId,
              -1
            );
          }

          if (
            direction === "down"
          ) {
            this.moveDraftMember(
              userId,
              1
            );
          }
        }
      );
  },

  setAvailableMembers(members = []) {
    this.state.availableMembers =
      normalizeMembers(
        members
      );

    if (
      this.dom.editor?.open
    ) {
      this.renderEditor();
    }

    return this.getAvailableMembers();
  },

  getAvailableMembers() {
    return this.state.availableMembers
      .map(member => ({
        ...member
      }));
  },

  setTopCircle({
    limit,
    members
  } = {}) {
    const normalizedLimit =
      normalizeLimit(
        limit
      );

    const normalizedMembers =
      sortMembersByPosition(
        normalizeMembers(
          members
        )
      )
        .slice(
          0,
          normalizedLimit
        )
        .map(
          (member, index) => ({
            ...member,
            position:
              index
          })
        );

    CircleStore.setTopCircle({
      limit:
        normalizedLimit,

      members:
        normalizedMembers
    });

    return CircleStore.get(
      "topCircle"
    );
  },

  render(topCircle) {
    const limit =
      normalizeLimit(
        topCircle?.limit
      );

    const members =
      sortMembersByPosition(
        normalizeMembers(
          topCircle?.members
        )
      )
        .slice(
          0,
          limit
        );

    if (
      this.dom.count
    ) {
      this.dom.count.textContent =
        members.length
          ? ` Â· ${members.length}`
          : "";
    }

    if (
      this.dom.orbit
    ) {
      this.dom.orbit.dataset
        .topCircleLimit =
        String(limit);

      this.dom.orbit.classList
        .toggle(
          "circle-top__orbit--four",
          limit === 4
        );

      this.dom.orbit.classList
        .toggle(
          "circle-top__orbit--six",
          limit === 6
        );
    }

    if (
      this.dom.members
    ) {
      this.dom.members
        .replaceChildren();

      members.forEach(
        (member, index) => {
          this.dom.members.append(
            this.createMemberNode(
              member,
              index,
              limit
            )
          );
        }
      );
    }

    if (
      this.dom.empty
    ) {
      this.dom.empty.hidden =
        members.length > 0;
    }

    if (
      this.dom.orbit
    ) {
      this.dom.orbit.hidden =
        members.length === 0;
    }
  },

  createMemberNode(
    member,
    index,
    limit
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
          "button"
        );

      node.type =
        "button";

      node.className =
        "circle-top-member";

      node.dataset.circleAction =
        "open-profile";

      node.innerHTML = `
        <span class="circle-top-member__avatar-wrap">
          <img
            class="circle-top-member__avatar"
            src=""
            alt=""
          />
          <span
            class="circle-top-member__presence circle-presence-dot"
            aria-hidden="true"
            hidden
          ></span>
        </span>
        <span class="circle-top-member__name"></span>
      `;
    }

    node.dataset.userId =
      member.userId;

    if (member.handle) {
      node.dataset.handle =
        member.handle;
    } else {
      delete node.dataset.handle;
    }

    node.dataset.position =
      String(index);

    node.dataset.orbitSlot =
      String(index + 1);

    node.dataset.orbitSize =
      String(limit);

    node.setAttribute(
      "aria-label",
      `Open ${member.displayName}'s ARI Circle`
    );

    const avatar =
      node.querySelector(
        ".circle-top-member__avatar"
      );

    const name =
      node.querySelector(
        ".circle-top-member__name"
      );

    const presence =
      node.querySelector(
        ".circle-top-member__presence"
      );

    if (name) {
      name.textContent =
        member.displayName;
    }

    if (avatar) {
      if (member.avatarUrl) {
        avatar.src =
          member.avatarUrl;

        avatar.alt =
          `${member.displayName} profile photo`;

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

        node.dataset.initials =
          getInitials(
            member.displayName
          );
      }
    }

    if (presence) {
      presence.hidden =
        false;

      presence.dataset.status =
        member.presence;

      presence.classList
        .toggle(
          "circle-presence-dot--online",
          member.presence ===
            "online"
        );

      presence.classList
        .toggle(
          "circle-presence-dot--away",
          member.presence ===
            "away"
        );

      presence.classList
        .toggle(
          "circle-presence-dot--offline",
          member.presence ===
            "offline"
        );
    }

    return node;
  },

  openEditor() {
    const context =
      CircleStore.get(
        "context"
      );

    if (!context?.isOwner) {
      CircleEvents.showToast(
        "You can only edit your own Top Circle."
      );

      return false;
    }

    if (
      !this.dom.editor ||
      typeof this.dom.editor
        .showModal !== "function"
    ) {
      return false;
    }

    this.prepareDraft();
    this.renderEditor();

    if (
      !this.dom.editor.open
    ) {
      this.dom.editor.showModal();
    }

    return true;
  },

  closeEditor() {
    if (
      this.dom.editor?.open
    ) {
      this.dom.editor.close();
    }

    return true;
  },

  prepareDraft() {
    const topCircle =
      CircleStore.get(
        "topCircle"
      ) || {};

    const limit =
      normalizeLimit(
        topCircle.limit
      );

    const members =
      sortMembersByPosition(
        normalizeMembers(
          topCircle.members
        )
      );

    this.state.draftLimit =
      limit;

    this.state.draftMemberIds =
      members
        .slice(
          0,
          limit
        )
        .map(
          member =>
            member.userId
        );

    this.syncLimitRadio();
  },

  syncLimitRadio() {
    const input =
      document.querySelector(
        `input[name="circleTopCount"][value="${this.state.draftLimit}"]`
      );

    if (input) {
      input.checked =
        true;
    }
  },

  setDraftLimit(value) {
    const limit =
      normalizeLimit(
        value
      );

    this.state.draftLimit =
      limit;

    if (
      this.state
        .draftMemberIds
        .length >
      limit
    ) {
      this.state.draftMemberIds =
        this.state
          .draftMemberIds
          .slice(
            0,
            limit
          );

      CircleEvents.showToast(
        `Top Circle changed to Top ${limit}.`
      );
    }

    this.renderEditor();
  },

  toggleDraftMember(
    userId,
    selected
  ) {
    const id =
      normalizeString(
        userId
      );

    if (!id) {
      return false;
    }

    const existingIndex =
      this.state
        .draftMemberIds
        .indexOf(id);

    if (selected) {
      if (
        existingIndex !== -1
      ) {
        return true;
      }

      if (
        this.state
          .draftMemberIds
          .length >=
        this.state.draftLimit
      ) {
        CircleEvents.showToast(
          `You can feature up to ${this.state.draftLimit} people.`
        );

        this.renderEditor();

        return false;
      }

      this.state.draftMemberIds.push(
        id
      );
    } else if (
      existingIndex !== -1
    ) {
      this.state.draftMemberIds.splice(
        existingIndex,
        1
      );
    }

    this.renderEditor();

    return true;
  },

  moveDraftMember(
    userId,
    offset
  ) {
    const id =
      normalizeString(
        userId
      );

    if (!id) {
      return false;
    }

    const currentIndex =
      this.state
        .draftMemberIds
        .indexOf(id);

    if (
      currentIndex === -1
    ) {
      return false;
    }

    const nextIndex =
      currentIndex +
      Number(offset);

    if (
      nextIndex < 0 ||
      nextIndex >=
        this.state
          .draftMemberIds
          .length
    ) {
      return false;
    }

    const ids =
      [
        ...this.state
          .draftMemberIds
      ];

    [
      ids[currentIndex],
      ids[nextIndex]
    ] = [
      ids[nextIndex],
      ids[currentIndex]
    ];

    this.state.draftMemberIds =
      ids;

    this.renderEditor();

    return true;
  },

  renderEditor() {
    if (
      !this.dom.editorList
    ) {
      return;
    }

    this.syncLimitRadio();

    this.dom.editorList
      .replaceChildren();

    if (
      !this.state
        .availableMembers
        .length
    ) {
      const empty =
        document.createElement(
          "p"
        );

      empty.className =
        "circle-empty-state";

      empty.textContent =
        "Your Circle connections will appear here.";

      this.dom.editorList.append(
        empty
      );

      return;
    }

    const selectedSet =
      new Set(
        this.state
          .draftMemberIds
      );

    const orderedSelected =
      this.state
        .draftMemberIds
        .map(
          id =>
            this.state
              .availableMembers
              .find(
                member =>
                  member.userId === id
              )
        )
        .filter(Boolean);

    const unselected =
      this.state
        .availableMembers
        .filter(
          member =>
            !selectedSet.has(
              member.userId
            )
        );

    if (
      orderedSelected.length
    ) {
      this.dom.editorList.append(
        this.createEditorHeading(
          "Featured"
        )
      );

      orderedSelected.forEach(
        (member, index) => {
          this.dom.editorList.append(
            this.createEditorMemberRow({
              member,
              selected:
                true,

              selectedIndex:
                index,

              selectedCount:
                orderedSelected.length
            })
          );
        }
      );
    }

    if (
      unselected.length
    ) {
      this.dom.editorList.append(
        this.createEditorHeading(
          "Your Circle"
        )
      );

      unselected.forEach(
        member => {
          this.dom.editorList.append(
            this.createEditorMemberRow({
              member,
              selected:
                false,

              selectedIndex:
                -1,

              selectedCount:
                orderedSelected.length
            })
          );
        }
      );
    }
  },

  createEditorHeading(text) {
    const heading =
      document.createElement(
        "h3"
      );

    heading.className =
      "circle-top-editor__heading";

    heading.textContent =
      text;

    return heading;
  },

  createEditorMemberRow({
    member,
    selected,
    selectedIndex,
    selectedCount
  }) {
    const row =
      document.createElement(
        "div"
      );

    row.className =
      "circle-top-editor__member";

    row.dataset.userId =
      member.userId;

    const label =
      document.createElement(
        "label"
      );

    label.className =
      "circle-top-editor__member-select";

    const checkbox =
      document.createElement(
        "input"
      );

    checkbox.type =
      "checkbox";

    checkbox.checked =
      Boolean(selected);

    checkbox.dataset.topCircleMember =
      "true";

    checkbox.dataset.userId =
      member.userId;

    const avatar =
      document.createElement(
        member.avatarUrl
          ? "img"
          : "span"
      );

    avatar.className =
      "circle-top-editor__avatar";

    if (member.avatarUrl) {
      avatar.src =
        member.avatarUrl;

      avatar.alt =
        "";
    } else {
      avatar.textContent =
        getInitials(
          member.displayName
        );

      avatar.setAttribute(
        "aria-hidden",
        "true"
      );
    }

    const identity =
      document.createElement(
        "span"
      );

    identity.className =
      "circle-top-editor__identity";

    const name =
      document.createElement(
        "strong"
      );

    name.textContent =
      member.displayName;

    identity.append(
      name
    );

    if (member.handle) {
      const handle =
        document.createElement(
          "small"
        );

      handle.textContent =
        `@${member.handle}`;

      identity.append(
        handle
      );
    }

    label.append(
      checkbox,
      avatar,
      identity
    );

    row.append(
      label
    );

    if (selected) {
      const controls =
        document.createElement(
          "div"
        );

      controls.className =
        "circle-top-editor__order";

      const position =
        document.createElement(
          "span"
        );

      position.className =
        "circle-top-editor__position";

      position.textContent =
        `#${selectedIndex + 1}`;

      const up =
        document.createElement(
          "button"
        );

      up.type =
        "button";

      up.textContent =
        "â";

      up.dataset.topCircleMove =
        "up";

      up.dataset.userId =
        member.userId;

      up.setAttribute(
        "aria-label",
        `Move ${member.displayName} up`
      );

      up.disabled =
        selectedIndex === 0;

      const down =
        document.createElement(
          "button"
        );

      down.type =
        "button";

      down.textContent =
        "â";

      down.dataset.topCircleMove =
        "down";

      down.dataset.userId =
        member.userId;

      down.setAttribute(
        "aria-label",
        `Move ${member.displayName} down`
      );

      down.disabled =
        selectedIndex ===
        selectedCount - 1;

      controls.append(
        position,
        up,
        down
      );

      row.append(
        controls
      );
    }

    return row;
  },

  saveDraft() {
    const context =
      CircleStore.get(
        "context"
      );

    if (!context?.isOwner) {
      return false;
    }

    const selectedMembers =
      this.state
        .draftMemberIds
        .slice(
          0,
          this.state
            .draftLimit
        )
        .map(
          (userId, index) => {
            const member =
              this.state
                .availableMembers
                .find(
                  item =>
                    item.userId ===
                    userId
                );

            if (!member) {
              return null;
            }

            return {
              ...member,
              position:
                index
            };
          }
        )
        .filter(Boolean);

    const nextTopCircle = {
      limit:
        this.state
          .draftLimit,

      members:
        selectedMembers
    };

    CircleStore.setTopCircle(
      nextTopCircle
    );

    CircleEvents.emit(
      EVENT_NAMES.TOP_CIRCLE_CHANGED,
      {
        topCircle:
          nextTopCircle,

        persist:
          true
      }
    );

    this.closeEditor();

    CircleEvents.showToast(
      selectedMembers.length
        ? "Top Circle updated."
        : "Top Circle cleared."
    );

    return true;
  },

  openEntireCircle() {
    const profile =
      CircleStore.get(
        "profile"
      ) || {};

    const userId =
      normalizeString(
        profile.user_id ||
        profile.userId ||
        profile.id
      );

    const handle =
      normalizeHandle(
        profile.handle ||
        profile.username
      );

    CircleEvents.emit(
      "circle:open-entire-circle",
      {
        userId,
        handle,
        profile
      }
    );
  },

  updateMemberPresence(
    userId,
    presence
  ) {
    const id =
      normalizeString(
        userId
      );

    if (!id) {
      return false;
    }

    const normalizedPresence =
      normalizePresence(
        presence
      );

    const topCircle =
      CircleStore.get(
        "topCircle"
      ) || {};

    const members =
      normalizeMembers(
        topCircle.members
      );

    let changed =
      false;

    const nextMembers =
      members.map(
        member => {
          if (
            member.userId !== id
          ) {
            return member;
          }

          changed =
            true;

          return {
            ...member,
            presence:
              normalizedPresence
          };
        }
      );

    if (!changed) {
      return false;
    }

    CircleStore.setTopCircle({
      limit:
        normalizeLimit(
          topCircle.limit
        ),

      members:
        nextMembers
    });

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
          "ARI Circle Top Circle unsubscribe failed",
          error
        );
      }
    }

    this.state.unsubscribers =
      [];

    this.state.availableMembers =
      [];

    this.state.draftMemberIds =
      [];

    this.state.initialized =
      false;
  },

  getDiagnostics() {
    const topCircle =
      CircleStore.get(
        "topCircle"
      ) || {};

    return {
      ready:
        this.state.initialized,

      source:
        this.source,

      version:
        this.version,

      limit:
        normalizeLimit(
          topCircle.limit
        ),

      featuredCount:
        Array.isArray(
          topCircle.members
        )
          ? topCircle
              .members
              .length
          : 0,

      availableCount:
        this.state
          .availableMembers
          .length,

      editorFound:
        Boolean(
          this.dom.editor
        ),

      orbitFound:
        Boolean(
          this.dom.orbit
        )
    };
  }
};

export {
  TopCircle,
  TOP_CIRCLE_LIMITS,
  normalizeMember
};

export default TopCircle;
