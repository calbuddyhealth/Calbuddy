// js/ari-circle/profile/profile-controller.js
// ARI Circle
// V1.0.1
//
// Purpose:
// - Coordinate profile-level UI behavior.
// - Apply owner / visitor visibility rules from CircleStore context.
// - Handle profile menu, edit-profile, share, and open-profile actions.
// - Avatar file selection is owned exclusively by media/profile-media.js.
// - Provide a clean entry point for profile data loaded by circle-api.js.
//
// This module does NOT:
// - Query Supabase.
// - Render profile fields.
// - Upload images.
// - Own connection logic.
// - Own presence logic.
//
// Profile rendering belongs in:
//   profile/profile-renderer.js
//
// Profile editing belongs in:
//   profile/profile-editor.js
//
// Media uploads belong in:
//   media/profile-media.js

import CircleStore from "../core/circle-store.js";
import CircleEvents, {
  EVENT_NAMES
} from "../core/circle-events.js";

const VERSION = "1.0.1";
const SOURCE = "ari-circle/profile/profile-controller";

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

const ProfileController = {
  version:
    VERSION,

  source:
    SOURCE,

  state: {
    initialized: false,
    unsubscribers: []
  },

  dom: {
    menuButton: null,
    menu: null,

    editor: null,

    avatarButton: null,
    avatarInput: null,

    ownerOnly: [],
    visitorOnly: [],
    connectedOnly: []
  },

  init() {
    if (this.state.initialized) {
      return this.getDiagnostics();
    }

    this.cacheDom();
    this.bindActions();
    this.bindStore();

    this.applyAccessRules(
      CircleStore.get("context")
    );

    this.state.initialized =
      true;

    return this.getDiagnostics();
  },

  cacheDom() {
    this.dom.menuButton =
      document.getElementById(
        "circle-profile-menu-button"
      );

    this.dom.menu =
      document.getElementById(
        "circle-profile-menu"
      );

    this.dom.editor =
      document.getElementById(
        "circle-profile-editor"
      );

    this.refreshScopedElements();
  },

  refreshScopedElements() {
    this.dom.ownerOnly =
      Array.from(
        document.querySelectorAll(
          "[data-owner-only]"
        )
      );

    this.dom.visitorOnly =
      Array.from(
        document.querySelectorAll(
          "[data-visitor-only]"
        )
      );

    this.dom.connectedOnly =
      Array.from(
        document.querySelectorAll(
          "[data-connected-only]"
        )
      );
  },

  bindActions() {
    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "open-profile-menu",
        () =>
          this.toggleProfileMenu()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "edit-profile",
        () =>
          this.openProfileEditor()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "close-profile-editor",
        () =>
          this.closeProfileEditor()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "share-profile",
        () =>
          this.shareProfile()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "open-profile",
        payload =>
          this.handleOpenProfileAction(
            payload
          )
      )
    );

    document.addEventListener(
      "click",
      event =>
        this.handleOutsideMenuClick(
          event
        )
    );

    document.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Escape"
        ) {
          this.closeProfileMenu();
        }
      }
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
            keys.includes("context")
          ) {
            this.applyAccessRules(
              state.context
            );
          }

          if (
            keys.includes("connection")
          ) {
            this.applyConnectionRules(
              state.connection
            );
          }
        }
      );

    this.state.unsubscribers.push(
      unsubscribe
    );
  },

  setProfile(profile, options = {}) {
    const normalizedProfile =
      profile &&
      typeof profile === "object"
        ? profile
        : null;

    CircleStore.setProfile(
      normalizedProfile
    );

    if (
      normalizedProfile &&
      options.emit !== false
    ) {
      CircleEvents.emit(
        EVENT_NAMES.PROFILE_LOADED,
        {
          profile:
            normalizedProfile
        }
      );
    }

    return CircleStore.get(
      "profile"
    );
  },

  updateProfile(profilePatch = {}) {
    const current =
      CircleStore.get(
        "profile"
      ) || {};

    const nextProfile = {
      ...current,
      ...profilePatch
    };

    CircleStore.setProfile(
      nextProfile
    );

    CircleEvents.emit(
      EVENT_NAMES.PROFILE_UPDATED,
      {
        profile:
          nextProfile
      }
    );

    return CircleStore.get(
      "profile"
    );
  },

  getProfile() {
    return CircleStore.get(
      "profile"
    );
  },

  applyAccessRules(context) {
    this.refreshScopedElements();

    const isOwner =
      Boolean(
        context?.isOwner
      );

    const isVisitor =
      Boolean(
        context?.isVisitor ||
        context?.isGuest
      );

    for (
      const element
      of this.dom.ownerOnly
    ) {
      element.hidden =
        !isOwner;
    }

    for (
      const element
      of this.dom.visitorOnly
    ) {
      element.hidden =
        !isVisitor;
    }

    this.applyConnectionRules(
      CircleStore.get(
        "connection"
      )
    );

    if (!isVisitor) {
      this.closeProfileMenu();
    }
  },

  applyConnectionRules(connection) {
    this.refreshScopedElements();

    const status =
      normalizeString(
        connection?.status
      ) || "none";

    const isConnected =
      status === "connected";

    for (
      const element
      of this.dom.connectedOnly
    ) {
      element.hidden =
        !isConnected;
    }
  },

  toggleProfileMenu() {
    if (!this.dom.menu) {
      return;
    }

    const shouldOpen =
      this.dom.menu.hidden;

    if (shouldOpen) {
      this.openProfileMenu();
      return;
    }

    this.closeProfileMenu();
  },

  openProfileMenu() {
    if (!this.dom.menu) {
      return;
    }

    this.dom.menu.hidden =
      false;

    this.dom.menuButton
      ?.setAttribute(
        "aria-expanded",
        "true"
      );
  },

  closeProfileMenu() {
    if (!this.dom.menu) {
      return;
    }

    this.dom.menu.hidden =
      true;

    this.dom.menuButton
      ?.setAttribute(
        "aria-expanded",
        "false"
      );
  },

  handleOutsideMenuClick(event) {
    if (
      !this.dom.menu ||
      this.dom.menu.hidden
    ) {
      return;
    }

    const clickedMenu =
      this.dom.menu.contains(
        event.target
      );

    const clickedButton =
      this.dom.menuButton
        ?.contains(
          event.target
        );

    if (
      !clickedMenu &&
      !clickedButton
    ) {
      this.closeProfileMenu();
    }
  },

  openProfileEditor() {
    const context =
      CircleStore.get(
        "context"
      );

    if (!context?.isOwner) {
      CircleEvents.showToast(
        "You can only edit your own Circle."
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

    this.dom.editor.showModal();

    return true;
  },

  closeProfileEditor() {
    if (
      !this.dom.editor ||
      typeof this.dom.editor
        .close !== "function"
    ) {
      return false;
    }

    if (this.dom.editor.open) {
      this.dom.editor.close();
    }

    return true;
  },

  async shareProfile() {
    this.closeProfileMenu();

    const profile =
      CircleStore.get(
        "profile"
      );

    const url =
      this.buildProfileUrl(
        profile
      );

    const displayName =
      normalizeString(
        profile?.display_name ||
        profile?.displayName
      ) ||
      "ARI Circle profile";

    try {
      if (
        navigator.share
      ) {
        await navigator.share({
          title:
            `${displayName} on ARI Circle`,
          url
        });

        return true;
      }

      if (
        navigator.clipboard
          ?.writeText
      ) {
        await navigator.clipboard
          .writeText(url);

        CircleEvents.showToast(
          "Circle link copied."
        );

        return true;
      }

      throw new Error(
        "Sharing is not supported in this browser."
      );
    } catch (error) {
      if (
        error?.name ===
        "AbortError"
      ) {
        return false;
      }

      CircleEvents.reportError(
        error,
        {
          message:
            "Could not share this Circle."
        }
      );

      return false;
    }
  },

  buildProfileUrl(profile = null) {
    const currentUrl =
      new URL(
        window.location.href
      );

    const handle =
      normalizeHandle(
        profile?.handle ||
        profile?.username
      );

    const userId =
      normalizeString(
        profile?.user_id ||
        profile?.userId ||
        profile?.id
      );

    currentUrl.search =
      "";

    if (handle) {
      currentUrl.searchParams.set(
        "handle",
        handle
      );

      return currentUrl.href;
    }

    if (userId) {
      currentUrl.searchParams.set(
        "user",
        userId
      );

      return currentUrl.href;
    }

    return currentUrl.href;
  },

  handleOpenProfileAction(payload) {
    const trigger =
      payload?.trigger;

    if (!trigger) {
      return false;
    }

    const userId =
      normalizeString(
        trigger.dataset
          .userId
      );

    const handle =
      normalizeHandle(
        trigger.dataset
          .handle
      );

    if (
      !userId &&
      !handle
    ) {
      return false;
    }

    this.openProfile({
      userId,
      handle
    });

    return true;
  },

  openProfile({
    userId = null,
    handle = null
  } = {}) {
    const url =
      new URL(
        "ari-circle.html",
        window.location.href
      );

    const normalizedHandle =
      normalizeHandle(
        handle
      );

    const normalizedUserId =
      normalizeString(
        userId
      );

    if (normalizedHandle) {
      url.searchParams.set(
        "handle",
        normalizedHandle
      );
    } else if (
      normalizedUserId
    ) {
      url.searchParams.set(
        "user",
        normalizedUserId
      );
    } else {
      return false;
    }

    window.location.assign(
      url.href
    );

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
          "ARI Circle profile unsubscribe failed",
          error
        );
      }
    }

    this.state.unsubscribers =
      [];

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

      hasProfile:
        Boolean(
          CircleStore.get(
            "profile"
          )
        ),

      mode:
        CircleStore.get(
          "context.mode"
        ) || null,

      profileMenuFound:
        Boolean(
          this.dom.menu
        ),

      profileEditorFound:
        Boolean(
          this.dom.editor
        )
    };
  }
};

export {
  ProfileController
};

export default ProfileController;
