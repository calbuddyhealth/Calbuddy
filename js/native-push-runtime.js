// ARI XP — shared native push runtime v1.0.0
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const API = "/api/ari-signals";
  const APP_ID = "com.arixp.app";
  let actionListenerInstalled = false;
  let foregroundListenerInstalled = false;

  const clean = (value, max = 2000) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  function plugin() {
    return window.Capacitor?.Plugins?.PushNotifications || null;
  }

  async function currentSession(timeout = 8000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      try {
        if (typeof window.getCurrentSession === "function") {
          const session = await window.getCurrentSession();
          if (session?.access_token) return session;
        }
        if (typeof window.CalBuddy?.getCurrentSession === "function") {
          const session = await window.CalBuddy.getCurrentSession();
          if (session?.access_token) return session;
        }
        const client = window.calbuddySupabase || window.CalBuddy?.supabase || window.supabaseClient;
        if (client?.auth?.getSession) {
          const { data } = await client.auth.getSession();
          if (data?.session?.access_token) return data.session;
        }
      } catch {}
      await sleep(80);
    }
    return null;
  }

  async function api(body = null) {
    const session = await currentSession();
    const token = clean(session?.access_token, 7000);
    if (!token) throw new Error("A signed-in ARI session is required.");
    const response = await fetch(API, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) {
      throw new Error(data?.error || data?.code || "Native notification request failed.");
    }
    return data;
  }

  function safeDeepLink(value) {
    const raw = clean(value, 1000);
    if (!raw || raw.includes("://") || raw.startsWith("//") || raw.includes("..")) return "";
    if (!/^[a-z0-9][a-z0-9._/-]*\.html(?:[?#].*)?$/i.test(raw)) return "";
    return raw;
  }

  function routeNotificationData(data = {}) {
    const direct = safeDeepLink(data?.deepLink);
    if (!direct) return false;
    window.location.assign(direct);
    return true;
  }

  async function installRoutingListeners() {
    const push = plugin();
    if (!push) return false;

    if (!actionListenerInstalled) {
      actionListenerInstalled = true;
      await push.addListener("pushNotificationActionPerformed", (event) => {
        const data = event?.notification?.data || {};
        routeNotificationData(data);
      });
    }

    if (!foregroundListenerInstalled) {
      foregroundListenerInstalled = true;
      await push.addListener("pushNotificationReceived", (notification) => {
        window.dispatchEvent(new CustomEvent("ari:nativePushReceived", {
          detail: notification?.data || {}
        }));
      });
    }
    return true;
  }

  async function permissionState() {
    const push = plugin();
    if (!push) return "unavailable";
    const result = await push.checkPermissions();
    return clean(result?.receive, 40) || "prompt";
  }

  async function requestPermission() {
    const push = plugin();
    if (!push) return "unavailable";
    let receive = await permissionState();
    if (receive === "prompt" || receive === "prompt-with-rationale") {
      receive = clean((await push.requestPermissions())?.receive, 40);
    }
    return receive;
  }

  async function registerToken() {
    const push = plugin();
    if (!push) throw new Error("Native push is unavailable on this device.");
    await installRoutingListeners();

    return await new Promise(async (resolve, reject) => {
      let finished = false;
      let registrationHandle = null;
      let errorHandle = null;
      const finish = async (error, token = "") => {
        if (finished) return;
        finished = true;
        window.clearTimeout(timer);
        try { await registrationHandle?.remove?.(); } catch {}
        try { await errorHandle?.remove?.(); } catch {}
        if (error) reject(error);
        else resolve(token);
      };

      const timer = window.setTimeout(() => {
        void finish(new Error("iPhone push registration timed out."));
      }, 12000);

      try {
        registrationHandle = await push.addListener("registration", (token) => {
          const value = clean(token?.value, 1000).replace(/[^a-fA-F0-9]/g, "").toLowerCase();
          if (!value) return;
          void finish(null, value);
        });
        errorHandle = await push.addListener("registrationError", (error) => {
          void finish(new Error(clean(error?.error || error?.message, 300) || "iPhone push registration failed."));
        });
        await push.register();
      } catch (error) {
        await finish(error instanceof Error ? error : new Error("iPhone push registration failed."));
      }
    });
  }

  async function status() {
    const push = plugin();
    if (!push) return { available: false, permission: "unavailable", enabled: false, serverConfigured: false };
    await installRoutingListeners().catch(() => false);
    const [permission, data] = await Promise.all([
      permissionState().catch(() => "unknown"),
      api().catch(() => null)
    ]);
    return {
      available: true,
      permission,
      enabled: data?.preferences?.pushEnabled === true,
      serverConfigured: data?.nativePush?.serverConfigured === true
    };
  }

  async function enable() {
    const push = plugin();
    if (!push) throw new Error("Phone notifications are available in the native ARI XP app.");
    const permission = await requestPermission();
    if (permission !== "granted") throw new Error("iPhone notification permission was not granted.");

    const token = await registerToken();
    await api({ action: "register-device", token, platform: "ios", appId: APP_ID });
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles";
    const result = await api({ action: "preferences", preferences: { pushEnabled: true, timezone } });
    return { success: true, tokenRegistered: true, preferences: result?.preferences || null };
  }

  async function disable() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles";
    const result = await api({ action: "preferences", preferences: { pushEnabled: false, timezone } });
    return { success: true, preferences: result?.preferences || null };
  }

  async function init() {
    if (!window.ARI_XP_NATIVE) return;
    await installRoutingListeners().catch(() => false);
  }

  window.AriNativePush = Object.freeze({
    version: VERSION,
    status,
    enable,
    disable,
    routeNotificationData
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => void init(), { once: true });
  else void init();
})();
