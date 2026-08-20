// ARI XP — authenticated browser/account isolation guard.
// Prevents transient actions and browser-local user state from crossing accounts
// on the same device. Supabase RLS remains the server-side authority.
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const ACTIVE_SESSION_KEY = "arixp_active_user_id_v1";
  const STORAGE_OWNER_KEY = "arixp_browser_state_owner_v1";
  const SCOPED_PREFIX = "arixp:u:";

  const TRANSIENT_LOCAL_KEYS = Object.freeze([
    "calbuddyPendingAction",
    "arixp_pending_ari_turn_v1",
    "ariLastIntentDecision",
    "calbuddyPendingGithubEdit"
  ]);

  const TRANSIENT_SESSION_KEYS = Object.freeze([
    "ari_vnext_pending_action",
    "ari_boot_intro"
  ]);

  // These stores contain user-specific state but historically used one browser
  // key. Preserve each account's copy on account switches while keeping the
  // legacy runtime APIs unchanged.
  const SWITCHED_USER_STATE_KEYS = Object.freeze([
    "ari_training_workout_plan_v3",
    "ari_training_workout_progress_v3",
    "calbuddyMeals",
    "calbuddyResetTime",
    "calbuddyAge",
    "calbuddyCurrentWeight",
    "calbuddyLatestWeight",
    "calbuddyRestingHeartRate",
    "calbuddyConfirmedMaxHeartRate",
    "calbuddyEstimatedMaxHeartRate"
  ]);

  const DERIVED_PREFIXES = Object.freeze([
    "calbuddyCaloriesConsumed_",
    "calbuddyCaloriesBurned_"
  ]);

  let activeUserId = "";
  let patchedCalBuddy = false;
  let patchedVNext = false;
  let patchedAdapter = false;
  let patchTimer = null;
  let authSubscription = null;

  const clean = (value = "") => String(value ?? "").trim();
  const scopedKey = (base, userId = activeUserId) => `${SCOPED_PREFIX}${clean(userId)}:${base}`;

  function currentUserId() {
    return clean(activeUserId || window.ARI_XP_ACTIVE_USER_ID || sessionStorage.getItem(ACTIVE_SESSION_KEY));
  }

  function clearDerivedCaches() {
    try {
      localStorage.removeItem("calbuddyCaloriesConsumed");
      localStorage.removeItem("calbuddyCaloriesBurned");
      localStorage.removeItem("calbuddyActiveNutritionDate");
      for (const key of Object.keys(localStorage)) {
        if (DERIVED_PREFIXES.some((prefix) => key.startsWith(prefix))) localStorage.removeItem(key);
      }
    } catch {}
  }

  function clearTransientState() {
    try {
      for (const key of TRANSIENT_LOCAL_KEYS) localStorage.removeItem(key);
    } catch {}
    try {
      for (const key of TRANSIENT_SESSION_KEYS) sessionStorage.removeItem(key);
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith(`${SCOPED_PREFIX}`) && key.endsWith(":ari_vnext_pending_action")) {
          sessionStorage.removeItem(key);
        }
      }
    } catch {}

    if (window.CalBuddy) window.CalBuddy.pendingAction = null;
    try { window.dispatchEvent(new CustomEvent("calbuddy:pendingActionCleared")); } catch {}
    try { window.dispatchEvent(new CustomEvent("ari:vnextPendingActionCleared")); } catch {}
  }

  function stashUserState(userId) {
    const id = clean(userId);
    if (!id) return;
    try {
      for (const key of SWITCHED_USER_STATE_KEYS) {
        const value = localStorage.getItem(key);
        if (value !== null) localStorage.setItem(scopedKey(key, id), value);
        localStorage.removeItem(key);
      }
    } catch {}
    clearDerivedCaches();
  }

  function restoreUserState(userId) {
    const id = clean(userId);
    if (!id) return;
    try {
      for (const key of SWITCHED_USER_STATE_KEYS) {
        const value = localStorage.getItem(scopedKey(key, id));
        if (value !== null) localStorage.setItem(key, value);
        else localStorage.removeItem(key);
      }
    } catch {}
    clearDerivedCaches();
  }

  function activateUser(userId, { firstLoad = false } = {}) {
    const next = clean(userId);
    if (!next) return deactivateUser();

    const previous = clean(activeUserId || sessionStorage.getItem(ACTIVE_SESSION_KEY));
    const storageOwner = clean(localStorage.getItem(STORAGE_OWNER_KEY));

    if (previous && previous !== next) {
      stashUserState(previous);
      clearTransientState();
      restoreUserState(next);
    } else if (!previous && storageOwner && storageOwner !== next) {
      // A new login entered a browser whose legacy globals belonged to another
      // authenticated account. Move those globals back to that owner first.
      stashUserState(storageOwner);
      clearTransientState();
      restoreUserState(next);
    } else if (!previous && !storageOwner && !firstLoad) {
      // Normal sign-in after a clean sign-out. Restore only this account's
      // previously namespaced state; never inherit anonymous/global leftovers.
      clearTransientState();
      restoreUserState(next);
    } else if (firstLoad) {
      // Pending actions/recovery turns from pre-isolation builds have no
      // trustworthy account binding. Never inherit them.
      clearTransientState();
    }

    activeUserId = next;
    window.ARI_XP_ACTIVE_USER_ID = next;
    try {
      sessionStorage.setItem(ACTIVE_SESSION_KEY, next);
      localStorage.setItem(STORAGE_OWNER_KEY, next);
    } catch {}

    ensurePatches();
    return next;
  }

  function deactivateUser() {
    const previous = clean(activeUserId || sessionStorage.getItem(ACTIVE_SESSION_KEY));
    if (previous) stashUserState(previous);
    clearTransientState();

    activeUserId = "";
    window.ARI_XP_ACTIVE_USER_ID = "";
    try {
      sessionStorage.removeItem(ACTIVE_SESSION_KEY);
      localStorage.removeItem(STORAGE_OWNER_KEY);
      for (const key of SWITCHED_USER_STATE_KEYS) localStorage.removeItem(key);
    } catch {}
    clearDerivedCaches();
    return "";
  }

  async function authenticatedUserId() {
    const user = await window.CalBuddy?.getCurrentUser?.();
    return clean(user?.id);
  }

  function patchCalBuddy() {
    const calBuddy = window.CalBuddy;
    if (!calBuddy || patchedCalBuddy) return Boolean(calBuddy);
    if (
      typeof calBuddy.setPendingAction !== "function" ||
      typeof calBuddy.getPendingAction !== "function" ||
      typeof calBuddy.clearPendingAction !== "function" ||
      typeof calBuddy.confirmPendingAction !== "function"
    ) return false;

    const originalConfirm = calBuddy.confirmPendingAction.bind(calBuddy);
    const originalExecute = typeof calBuddy.executeAction === "function"
      ? calBuddy.executeAction.bind(calBuddy)
      : null;

    calBuddy.setPendingAction = function accountScopedSetPendingAction(action) {
      const userId = currentUserId();
      if (!action || !userId) {
        calBuddy.pendingAction = null;
        return null;
      }
      const claimedUserId = clean(action.user_id || action.owner_user_id || action.ownerUserId);
      if (claimedUserId && claimedUserId !== userId) {
        calBuddy.pendingAction = null;
        clearTransientState();
        return null;
      }
      const scoped = { ...action, user_id: userId, owner_user_id: userId };
      calBuddy.pendingAction = scoped;
      try { localStorage.setItem(scopedKey("calbuddyPendingAction", userId), JSON.stringify(scoped)); } catch {}
      try { localStorage.removeItem("calbuddyPendingAction"); } catch {}
      window.dispatchEvent(new CustomEvent("calbuddy:pendingAction", { detail: { action: scoped } }));
      return scoped;
    };

    calBuddy.getPendingAction = function accountScopedGetPendingAction() {
      const userId = currentUserId();
      if (!userId) return null;
      const inMemory = calBuddy.pendingAction;
      if (inMemory) {
        const owner = clean(inMemory.user_id || inMemory.owner_user_id || inMemory.ownerUserId);
        if (owner === userId) return inMemory;
        calBuddy.pendingAction = null;
      }
      try {
        const raw = localStorage.getItem(scopedKey("calbuddyPendingAction", userId));
        if (!raw) return null;
        const saved = JSON.parse(raw);
        const owner = clean(saved?.user_id || saved?.owner_user_id || saved?.ownerUserId);
        if (owner !== userId) {
          localStorage.removeItem(scopedKey("calbuddyPendingAction", userId));
          return null;
        }
        calBuddy.pendingAction = saved;
        return saved;
      } catch {
        return null;
      }
    };

    calBuddy.clearPendingAction = function accountScopedClearPendingAction() {
      const userId = currentUserId();
      calBuddy.pendingAction = null;
      try {
        if (userId) localStorage.removeItem(scopedKey("calbuddyPendingAction", userId));
        localStorage.removeItem("calbuddyPendingAction");
      } catch {}
      window.dispatchEvent(new CustomEvent("calbuddy:pendingActionCleared"));
    };

    calBuddy.confirmPendingAction = async function accountScopedConfirmPendingAction() {
      const userId = await authenticatedUserId();
      if (!userId || userId !== currentUserId()) {
        calBuddy.clearPendingAction();
        return { success: false, reply: "That pending action belongs to a different signed-in session, so I did not apply it." };
      }
      const action = calBuddy.getPendingAction();
      const owner = clean(action?.user_id || action?.owner_user_id || action?.ownerUserId);
      if (!action || owner !== userId) {
        calBuddy.clearPendingAction();
        return { success: false, reply: "That pending action is not valid for this account, so I did not apply it." };
      }
      return await originalConfirm();
    };

    if (originalExecute) {
      calBuddy.executeAction = async function accountScopedExecuteAction(action = {}) {
        const claimedUserId = clean(action?.user_id || action?.owner_user_id || action?.ownerUserId);
        if (claimedUserId) {
          const userId = await authenticatedUserId();
          if (!userId || claimedUserId !== userId) {
            return { success: false, reply: "I blocked that change because it belongs to a different account." };
          }
        }
        return await originalExecute(action);
      };
    }

    patchedCalBuddy = true;
    return true;
  }

  function patchVNextBridge() {
    const bridge = window.AriVNextBridge;
    if (!bridge || patchedVNext) return Boolean(bridge);

    const baseKey = clean(bridge.pendingStorageKey || "ari_vnext_pending_action");
    const originalAsk = typeof bridge.ask === "function" ? bridge.ask.bind(bridge) : null;

    bridge.getPendingAction = function accountScopedGetVNextPendingAction() {
      const userId = currentUserId();
      if (!userId) return null;
      try {
        const raw = sessionStorage.getItem(scopedKey(baseKey, userId));
        if (!raw) return null;
        const pending = JSON.parse(raw);
        const owner = clean(pending?.ownerUserId || pending?.owner_user_id || pending?.user_id);
        if (owner !== userId) {
          sessionStorage.removeItem(scopedKey(baseKey, userId));
          return null;
        }
        const expiresAt = Date.parse(String(pending?.expiresAt || ""));
        if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
          bridge.clearPendingAction();
          return null;
        }
        return pending;
      } catch {
        return null;
      }
    };

    bridge.setPendingAction = function accountScopedSetVNextPendingAction(action) {
      const userId = currentUserId();
      if (!action || !userId) return bridge.clearPendingAction();
      const claimed = clean(action?.ownerUserId || action?.owner_user_id || action?.user_id);
      if (claimed && claimed !== userId) {
        bridge.clearPendingAction();
        return null;
      }
      const scoped = { ...action, ownerUserId: userId };
      const expiresAt = Date.parse(String(scoped?.expiresAt || ""));
      if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) return bridge.clearPendingAction();
      try {
        sessionStorage.setItem(scopedKey(baseKey, userId), JSON.stringify(scoped));
        sessionStorage.removeItem(baseKey);
      } catch {}
      window.dispatchEvent(new CustomEvent("ari:vnextPendingAction", { detail: { action: scoped } }));
      return scoped;
    };

    bridge.clearPendingAction = function accountScopedClearVNextPendingAction() {
      const userId = currentUserId();
      try {
        if (userId) sessionStorage.removeItem(scopedKey(baseKey, userId));
        sessionStorage.removeItem(baseKey);
      } catch {}
      window.dispatchEvent(new CustomEvent("ari:vnextPendingActionCleared"));
      return null;
    };

    if (originalAsk) {
      bridge.ask = async function accountScopedVNextAsk(...args) {
        const session = await bridge.getSession?.();
        const userId = clean(session?.user?.id);
        if (!userId) throw new Error("A signed-in ARI session is required.");
        if (userId !== currentUserId()) activateUser(userId);
        return await originalAsk(...args);
      };
    }

    patchedVNext = true;
    return true;
  }

  function patchVNextAdapter() {
    const adapter = window.AriVNextActionAdapter;
    if (!adapter || patchedAdapter || typeof adapter.executeConfirmed !== "function") return Boolean(adapter);
    const originalExecuteConfirmed = adapter.executeConfirmed.bind(adapter);

    adapter.executeConfirmed = async function accountScopedExecuteConfirmed(input = {}) {
      const userId = await authenticatedUserId();
      const pending = input?.vnextPendingAction || null;
      const owner = clean(pending?.ownerUserId || pending?.owner_user_id || pending?.user_id);
      if (!userId || !owner || owner !== userId || userId !== currentUserId()) {
        window.AriVNextBridge?.clearPendingAction?.();
        window.CalBuddy?.clearPendingAction?.();
        return {
          success: false,
          code: "pending_action_account_mismatch",
          message: "That pending action belongs to a different account and was blocked."
        };
      }
      return await originalExecuteConfirmed(input);
    };

    patchedAdapter = true;
    return true;
  }

  function ensurePatches() {
    window.clearTimeout(patchTimer);
    const a = patchCalBuddy();
    const b = patchVNextBridge();
    const c = patchVNextAdapter();
    if (!a || !b || !c) patchTimer = window.setTimeout(ensurePatches, 40);
  }

  function patchSignOut() {
    if (typeof window.signOutUser !== "function" || window.signOutUser.__ariAccountIsolationV1) return;
    const original = window.signOutUser.bind(window);
    const wrapped = async function isolatedSignOut(...args) {
      deactivateUser();
      return await original(...args);
    };
    Object.defineProperty(wrapped, "__ariAccountIsolationV1", { value: true });
    window.signOutUser = wrapped;
  }

  function subscribeAuth() {
    const auth = window.calbuddySupabase?.auth;
    if (!auth?.onAuthStateChange || authSubscription) return;
    const { data } = auth.onAuthStateChange((_event, session) => {
      const userId = clean(session?.user?.id);
      if (userId) activateUser(userId);
      else deactivateUser();
    });
    authSubscription = data?.subscription || true;
  }

  async function initialize() {
    clearTransientState();
    try {
      const session = await window.getCurrentSession?.();
      const userId = clean(session?.user?.id);
      if (userId) activateUser(userId, { firstLoad: true });
    } catch {}
    patchSignOut();
    subscribeAuth();
    ensurePatches();
  }

  window.addEventListener("ari:runtimeReady", ensurePatches);
  window.addEventListener("ari:vnextActivityReady", ensurePatches);
  window.addEventListener("load", () => {
    patchSignOut();
    subscribeAuth();
    ensurePatches();
  });

  window.AriAccountIsolation = Object.freeze({
    version: VERSION,
    activateUser,
    deactivateUser,
    currentUserId,
    clearTransientState,
    ensurePatches
  });

  void initialize();
})();
