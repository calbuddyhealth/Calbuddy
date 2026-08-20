// ARI Signals — unified Home inbox + native iOS push bridge v1.0.0
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const API = "/api/ari-signals";
  const APP_ID = "com.arixp.app";
  let signals = [];
  let preferences = null;
  let initialized = false;
  let nativeListenersInstalled = false;
  let pendingDeepLinkSignalId = "";

  function clean(value = "") { return String(value || "").trim(); }
  function escapeHtml(value = "") {
    return String(value || "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }
  function session() { return window.getCurrentSession?.() || window.CalBuddy?.getCurrentSession?.() || Promise.resolve(null); }
  async function accessToken() { return clean((await session())?.access_token); }

  async function api(body = null) {
    const token = await accessToken();
    if (!token) throw new Error("A signed-in ARI session is required.");
    const response = await fetch(API, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) throw new Error(data?.error || data?.code || "Ari Signals request failed.");
    return data;
  }

  function ensureUi() {
    if (document.getElementById("ariSignalsTrigger")) return;
    const trigger = document.createElement("button");
    trigger.id = "ariSignalsTrigger";
    trigger.className = "ari-signals-trigger";
    trigger.type = "button";
    trigger.hidden = true;
    trigger.setAttribute("aria-label", "Open Ari Signals");
    trigger.innerHTML = '<span class="ari-signals-dot" aria-hidden="true"></span><span>ARI SIGNALS</span><span class="ari-signals-count" id="ariSignalsCount">0</span>';
    trigger.addEventListener("click", openPanel);
    document.body.appendChild(trigger);

    const backdrop = document.createElement("div");
    backdrop.id = "ariSignalsBackdrop";
    backdrop.className = "ari-signals-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    backdrop.innerHTML = `
      <section class="ari-signals-panel" role="dialog" aria-modal="true" aria-labelledby="ariSignalsTitle">
        <header class="ari-signals-head">
          <div><p class="ari-signals-kicker">ARI CAN REACH ME</p><h2 class="ari-signals-title" id="ariSignalsTitle">Ari Signals</h2></div>
          <button type="button" class="ari-signals-close" id="ariSignalsClose" aria-label="Close Ari Signals">CLOSE</button>
        </header>
        <div class="ari-signals-scroll">
          <div id="ariSignalsList"></div>
          <section class="ari-signals-settings" aria-label="Ari Signal settings">
            <h3 class="ari-signals-settings-title">HOW ARI REACHES YOU</h3>
            <label class="ari-signals-setting-row"><span>Phone notifications</span><input id="ariSignalsPushToggle" class="ari-signals-toggle" type="checkbox"></label>
            <label class="ari-signals-setting-row"><span>Quiet hours</span><input id="ariSignalsQuietToggle" class="ari-signals-toggle" type="checkbox"></label>
            <div class="ari-signals-setting-row"><span>Quiet window</span><span class="ari-signals-times"><input id="ariSignalsQuietStart" class="ari-signals-time-input" type="time"><span>to</span><input id="ariSignalsQuietEnd" class="ari-signals-time-input" type="time"></span></div>
            <p class="ari-signals-status" id="ariSignalsStatus">Important signals stay here even when phone push is off.</p>
          </section>
        </div>
      </section>`;
    backdrop.addEventListener("click", (event) => { if (event.target === backdrop) closePanel(); });
    document.body.appendChild(backdrop);
    document.getElementById("ariSignalsClose")?.addEventListener("click", closePanel);
    document.getElementById("ariSignalsPushToggle")?.addEventListener("change", onPushToggle);
    document.getElementById("ariSignalsQuietToggle")?.addEventListener("change", savePreferencesFromUi);
    document.getElementById("ariSignalsQuietStart")?.addEventListener("change", savePreferencesFromUi);
    document.getElementById("ariSignalsQuietEnd")?.addEventListener("change", savePreferencesFromUi);
  }

  function openPanel() {
    ensureUi();
    const backdrop = document.getElementById("ariSignalsBackdrop");
    backdrop?.classList.add("is-open");
    backdrop?.setAttribute("aria-hidden", "false");
    render();
  }
  function closePanel() {
    const backdrop = document.getElementById("ariSignalsBackdrop");
    backdrop?.classList.remove("is-open");
    backdrop?.setAttribute("aria-hidden", "true");
  }

  function render() {
    ensureUi();
    const visible = signals.filter((signal) => signal.status !== "dismissed");
    const unread = visible.filter((signal) => signal.unread).length;
    const trigger = document.getElementById("ariSignalsTrigger");
    const count = document.getElementById("ariSignalsCount");
    if (trigger) trigger.hidden = !visible.length;
    if (count) count.textContent = String(unread || visible.length);

    const list = document.getElementById("ariSignalsList");
    if (list) {
      list.innerHTML = visible.length ? visible.map((signal) => `
        <button type="button" class="ari-signal-item ${signal.unread ? "is-unread" : ""}" data-signal-id="${escapeHtml(signal.id)}" data-priority="${escapeHtml(signal.priority)}">
          <span class="ari-signal-meta"><span class="ari-signal-priority"></span>${escapeHtml(label(signal.category))}</span>
          <p class="ari-signal-message">${escapeHtml(signal.message)}</p>
          <span class="ari-signal-time">${escapeHtml(relativeTime(signal.surfacedAt))}</span>
          <span class="ari-signal-dismiss" data-dismiss-signal="${escapeHtml(signal.id)}" role="button" aria-label="Dismiss signal">×</span>
        </button>`).join("") : '<div class="ari-signals-empty">Nothing needs your attention right now. Ari can still adapt silently in the background.</div>';
      list.querySelectorAll("[data-signal-id]").forEach((node) => node.addEventListener("click", async (event) => {
        const dismissId = event.target?.closest?.("[data-dismiss-signal]")?.getAttribute("data-dismiss-signal");
        if (dismissId) { event.preventDefault(); event.stopPropagation(); await dismissSignal(dismissId); return; }
        await engageSignal(node.getAttribute("data-signal-id"));
      }));
    }

    const push = document.getElementById("ariSignalsPushToggle");
    const quiet = document.getElementById("ariSignalsQuietToggle");
    const start = document.getElementById("ariSignalsQuietStart");
    const end = document.getElementById("ariSignalsQuietEnd");
    if (push && preferences) push.checked = preferences.pushEnabled === true;
    if (quiet && preferences) quiet.checked = preferences.quietHoursEnabled !== false;
    if (start && preferences) start.value = preferences.quietStart || "22:00";
    if (end && preferences) end.value = preferences.quietEnd || "07:00";
  }

  async function refresh() {
    try {
      const data = await api();
      signals = Array.isArray(data.signals) ? data.signals : [];
      preferences = data.preferences || preferences;
      window.AriSignals.state = { signals, preferences, unreadCount: Number(data.unreadCount || 0), nativePush: data.nativePush || null };
      render();
      if (pendingDeepLinkSignalId) {
        const id = pendingDeepLinkSignalId;
        pendingDeepLinkSignalId = "";
        await engageSignal(id);
      }
      return data;
    } catch (error) {
      setStatus(error?.message || "Ari Signals are temporarily unavailable.", true);
      return null;
    }
  }

  async function engageSignal(id) {
    const signal = signals.find((item) => item.id === id);
    if (!signal) return;
    try { await api({ action: "engage", signalId: id }); } catch {}
    signal.status = "engaged";
    signal.unread = false;
    render();
    closePanel();
    window.dispatchEvent(new CustomEvent("ari:vnextInitiative", {
      detail: {
        success: true,
        shouldInitiate: true,
        fromSignal: true,
        initiative: {
          id: signal.id,
          initiativeKey: signal.initiativeKey,
          reasonId: signal.reasonId,
          priority: signal.priority,
          opener: signal.message,
          followUpPrompt: signal.followUpPrompt,
          action: signal.action,
          context: signal.context,
          domain: signal.domain
        }
      }
    }));
    const url = new URL(window.location.href);
    if (url.searchParams.has("ariSignal")) {
      url.searchParams.delete("ariSignal");
      history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }

  async function dismissSignal(id) {
    try { await api({ action: "dismiss", signalId: id }); } catch {}
    signals = signals.map((signal) => signal.id === id ? { ...signal, status: "dismissed", unread: false } : signal);
    render();
  }

  async function savePreferencesFromUi() {
    if (!preferences) return;
    const next = {
      ...preferences,
      pushEnabled: document.getElementById("ariSignalsPushToggle")?.checked === true,
      quietHoursEnabled: document.getElementById("ariSignalsQuietToggle")?.checked === true,
      quietStart: document.getElementById("ariSignalsQuietStart")?.value || "22:00",
      quietEnd: document.getElementById("ariSignalsQuietEnd")?.value || "07:00",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || preferences.timezone || "America/Los_Angeles"
    };
    try {
      const data = await api({ action: "preferences", preferences: next });
      preferences = data.preferences || next;
      setStatus(preferences.pushEnabled ? "Ari may send important Signals to this phone." : "Signals stay in the app; phone push is off.");
      render();
    } catch (error) {
      setStatus(error?.message || "Could not save Ari Signal settings.", true);
    }
  }

  async function onPushToggle(event) {
    if (!event.target.checked) { await savePreferencesFromUi(); return; }
    const plugin = pushPlugin();
    if (!plugin) {
      event.target.checked = false;
      setStatus("Phone push becomes available in the native iOS app after the Push Notifications plugin is synced into the Xcode build.", true);
      return;
    }
    try {
      const permission = await plugin.checkPermissions();
      let receive = permission?.receive;
      if (receive === "prompt" || receive === "prompt-with-rationale") receive = (await plugin.requestPermissions())?.receive;
      if (receive !== "granted") {
        event.target.checked = false;
        setStatus("iPhone notification permission was not granted.", true);
        return;
      }
      await installNativePushListeners();
      await plugin.register();
      await savePreferencesFromUi();
    } catch (error) {
      event.target.checked = false;
      setStatus(error?.message || "Could not enable phone notifications.", true);
    }
  }

  function pushPlugin() { return window.Capacitor?.Plugins?.PushNotifications || null; }

  async function installNativePushListeners() {
    const plugin = pushPlugin();
    if (!plugin || nativeListenersInstalled) return false;
    nativeListenersInstalled = true;
    await plugin.addListener("registration", async (token) => {
      const value = clean(token?.value);
      if (!value) return;
      try {
        await api({ action: "register-device", token: value, platform: "ios", appId: APP_ID });
        setStatus("This iPhone is connected to Ari Signals.");
      } catch (error) {
        setStatus(error?.message || "Could not register this iPhone for Ari Signals.", true);
      }
    });
    await plugin.addListener("registrationError", (error) => setStatus(clean(error?.error || error?.message) || "iPhone push registration failed.", true));
    await plugin.addListener("pushNotificationActionPerformed", async (event) => {
      const data = event?.notification?.data || {};
      const signalId = clean(data.ariSignalId || data.signalId);
      if (!signalId) return;
      if (!signals.length) pendingDeepLinkSignalId = signalId;
      else await engageSignal(signalId);
    });
    return true;
  }

  function setStatus(message, error = false) {
    const node = document.getElementById("ariSignalsStatus");
    if (!node) return;
    node.textContent = clean(message);
    node.classList.toggle("is-error", Boolean(error));
  }
  function label(category) {
    return ({ insight: "INSIGHT", question: "QUESTION", experiment_result: "EXPERIMENT RESULT", change: "SOMETHING CHANGED", approval: "APPROVAL NEEDED" })[category] || "ARI SIGNAL";
  }
  function relativeTime(value) {
    const then = Date.parse(String(value || ""));
    if (!Number.isFinite(then)) return "Recently";
    const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
    if (minutes < 2) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  async function init() {
    if (initialized) return;
    initialized = true;
    ensureUi();
    const deepLinkId = clean(new URLSearchParams(window.location.search).get("ariSignal"));
    if (deepLinkId) pendingDeepLinkSignalId = deepLinkId;
    await installNativePushListeners().catch(() => false);
    await refresh();
  }

  window.AriSignals = {
    version: VERSION,
    state: { signals: [], preferences: null, unreadCount: 0 },
    refresh,
    open: openPanel,
    close: closePanel,
    engage: engageSignal,
    dismiss: dismissSignal,
    enablePush: () => document.getElementById("ariSignalsPushToggle")?.click()
  };

  window.addEventListener("ari:vnextInitiative", () => window.setTimeout(refresh, 250));
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") void refresh(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => void init(), { once: true });
  else void init();
})();
