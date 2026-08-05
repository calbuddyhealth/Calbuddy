// js/ari-circle/core/circle-context.js
// ARI Circle
// V1.0.0
//
// Purpose:
// - Resolve who is viewing ARI Circle.
// - Resolve which profile the page is trying to display.
// - Decide owner / visitor / guest mode.
// - Keep URL interpretation out of profile, messaging, and connection modules.
//
// This module does NOT:
// - Query Supabase.
// - Load profile data.
// - Mutate the DOM.
// - Persist anything.
// - Guess authentication state.
//
// Authentication identity is injected by the caller once our auth/data
// layer is connected.

const VERSION = "1.0.0";
const SOURCE = "ari-circle/core/circle-context";

const VALID_PROFILE_REF_TYPES = new Set([
  "user",
  "handle"
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

function sameValue(a, b) {
  const left =
    normalizeString(a);

  const right =
    normalizeString(b);

  if (!left || !right) {
    return false;
  }

  return left === right;
}

function getUrlProfileReference(url) {
  const userId =
    normalizeString(
      url.searchParams.get("user")
    );

  if (userId) {
    return {
      type: "user",
      value: userId
    };
  }

  const handle =
    normalizeHandle(
      url.searchParams.get("handle")
    );

  if (handle) {
    return {
      type: "handle",
      value: handle
    };
  }

  return {
    type: null,
    value: null
  };
}

function resolveMode({
  isAuthenticated,
  isOwner,
  hasExplicitProfileTarget
}) {
  if (!isAuthenticated) {
    return hasExplicitProfileTarget
      ? "guest"
      : "unauthenticated";
  }

  if (isOwner) {
    return "owner";
  }

  return "visitor";
}

const CircleContext = {
  version:
    VERSION,

  source:
    SOURCE,

  current:
    null,

  /**
   * Resolve the current ARI Circle page context.
   *
   * @param {Object} options
   * @param {string|null} options.viewerUserId
   *   Authenticated ARI user id. Injected by the caller.
   *
   * @param {string|null} options.viewerHandle
   *   Optional authenticated user's handle.
   *
   * @param {string|null} options.resolvedProfileUserId
   *   Optional profile user id if another layer already resolved
   *   ?handle= into a concrete user id.
   *
   * @param {string|null} options.resolvedProfileHandle
   *   Optional canonical handle for the viewed profile.
   *
   * @param {string|URL|null} options.url
   *   Optional URL override for testing.
   *
   * @returns {Object}
   */
  resolve(options = {}) {
    const url =
      this.#resolveUrl(
        options.url
      );

    const viewerUserId =
      normalizeString(
        options.viewerUserId
      );

    const viewerHandle =
      normalizeHandle(
        options.viewerHandle
      );

    const explicitRef =
      getUrlProfileReference(url);

    const hasExplicitProfileTarget =
      Boolean(
        explicitRef.type &&
        explicitRef.value
      );

    let profileUserId =
      normalizeString(
        options.resolvedProfileUserId
      );

    let profileHandle =
      normalizeHandle(
        options.resolvedProfileHandle
      );

    /*
     * No ?user= or ?handle= means:
     * "Open my own ARI Circle."
     *
     * If authenticated, the current viewer becomes the profile owner.
     * If unauthenticated, the page remains unresolved until auth is known.
     */
    if (!hasExplicitProfileTarget) {
      profileUserId =
        profileUserId ||
        viewerUserId;

      profileHandle =
        profileHandle ||
        viewerHandle;
    }

    /*
     * A ?user= URL already gives us a concrete profile id.
     */
    if (
      explicitRef.type === "user"
    ) {
      profileUserId =
        explicitRef.value;
    }

    /*
     * A ?handle= URL deliberately does NOT invent a user id.
     * circle-api.js will eventually resolve the handle to a profile.
     */
    if (
      explicitRef.type === "handle"
    ) {
      profileHandle =
        explicitRef.value;
    }

    const isAuthenticated =
      Boolean(viewerUserId);

    const isOwnerById =
      sameValue(
        viewerUserId,
        profileUserId
      );

    const isOwnerByHandle =
      !profileUserId &&
      viewerHandle &&
      profileHandle &&
      viewerHandle ===
        profileHandle;

    const isOwner =
      Boolean(
        isAuthenticated &&
        (
          isOwnerById ||
          isOwnerByHandle
        )
      );

    const mode =
      resolveMode({
        isAuthenticated,
        isOwner,
        hasExplicitProfileTarget
      });

    const context = Object.freeze({
      source:
        this.source,

      version:
        this.version,

      viewerUserId,
      viewerHandle,

      profileUserId,
      profileHandle,

      profileReference:
        Object.freeze({
          type:
            explicitRef.type,

          value:
            explicitRef.value
        }),

      hasExplicitProfileTarget,
      isAuthenticated,
      isOwner,
      isVisitor:
        mode === "visitor",

      isGuest:
        mode === "guest",

      mode,

      url:
        url.href
    });

    this.current =
      context;

    return context;
  },

  getCurrent() {
    return this.current;
  },

  requireCurrent() {
    if (!this.current) {
      throw new Error(
        "ARI Circle context has not been resolved yet."
      );
    }

    return this.current;
  },

  clear() {
    this.current =
      null;
  },

  isValidProfileReferenceType(type) {
    return VALID_PROFILE_REF_TYPES.has(
      type
    );
  },

  getDiagnostics() {
    return {
      ready:
        Boolean(this.current),

      source:
        this.source,

      version:
        this.version,

      context:
        this.current
    };
  },

  #resolveUrl(value) {
    if (value instanceof URL) {
      return new URL(
        value.href
      );
    }

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return new URL(
        value,
        window.location.origin
      );
    }

    return new URL(
      window.location.href
    );
  }
};

export {
  CircleContext
};

export default CircleContext;
