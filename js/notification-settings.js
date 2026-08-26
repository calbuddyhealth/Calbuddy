/* ARI Rebirth — Notification Settings v1.1.0 */

(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let userId = null;
  let phoneBusy = false;

  function setStatus(message = "", type = "") {
    window.AriSettings.setStatus($("notificationStatus"), message, type);
  }

  async function loadCirclePreference() {
    const { data, error } = await window.calbuddySupabase
      .from("ari_notification_preferences")
      .select("circle_activity_enabled")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      setStatus("Run the one-time Supabase setup to activate this preference.", "info");
      return;
    }

    $("circleNotificationToggle").checked = data?.circle_activity_enabled !== false;
    localStorage.setItem(
      "ari_circle_activity_enabled",
      String($("circleNotificationToggle").checked)
    );
  }

  async function saveCirclePreference() {
    const toggle = $("circleNotificationToggle");
    toggle.disabled = true;
    setStatus("Saving…", "working");

    const { error } = await window.calbuddySupabase
      .from("ari_notification_preferences")
      .upsert(
        {
          user_id: userId,
          circle_activity_enabled: toggle.checked,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      );

    toggle.disabled = false;
    if (!error) {
      localStorage.setItem("ari_circle_activity_enabled", String(toggle.checked));
    }
    setStatus(
      error ? error.message : "Notification preference saved.",
      error ? "error" : "success"
    );
  }

  async function loadPhonePreference() {
    const nativePush = window.AriNativePush;
    const card = $("phoneNotificationCard");
    const toggle = $("phoneNotificationToggle");
    if (!nativePush || !window.ARI_XP_NATIVE || !card || !toggle) return;

    card.hidden = false;
    toggle.disabled = true;
    try {
      const state = await nativePush.status();
      toggle.checked = state.enabled === true && state.permission === "granted";
      if (state.permission === "denied") {
        setStatus("iPhone notifications are blocked in iOS Settings for ARI XP.", "info");
      } else if (state.enabled && !state.serverConfigured) {
        setStatus("This iPhone is opted in. ARI server push credentials still need to be configured.", "info");
      }
    } catch (error) {
      setStatus(error?.message || "Could not read phone notification status.", "info");
    } finally {
      toggle.disabled = false;
    }
  }

  async function savePhonePreference() {
    const nativePush = window.AriNativePush;
    const toggle = $("phoneNotificationToggle");
    if (!nativePush || !toggle || phoneBusy) return;

    phoneBusy = true;
    toggle.disabled = true;
    setStatus(toggle.checked ? "Connecting this iPhone…" : "Turning off phone notifications…", "working");
    try {
      if (toggle.checked) await nativePush.enable();
      else await nativePush.disable();

      const state = await nativePush.status();
      toggle.checked = state.enabled === true && state.permission === "granted";
      if (toggle.checked && !state.serverConfigured) {
        setStatus("iPhone permission is ready. ARI server push credentials still need configuration.", "info");
      } else {
        setStatus(toggle.checked ? "Phone notifications are on for this iPhone." : "Phone notifications are off.", "success");
      }
    } catch (error) {
      toggle.checked = false;
      setStatus(error?.message || "Could not update phone notifications.", "error");
    } finally {
      toggle.disabled = false;
      phoneBusy = false;
    }
  }

  async function init() {
    const session = await window.AriSettings.requireSession();
    if (!session) return;
    userId = session.user.id;
    $("circleNotificationToggle")?.addEventListener("change", saveCirclePreference);
    $("phoneNotificationToggle")?.addEventListener("change", savePhonePreference);
    await Promise.all([loadCirclePreference(), loadPhonePreference()]);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
