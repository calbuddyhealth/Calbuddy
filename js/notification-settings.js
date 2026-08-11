/* ARI Rebirth — Notification Settings v1.0.0 */

(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let userId = null;

  function setStatus(message = "", type = "") {
    window.AriSettings.setStatus($("notificationStatus"), message, type);
  }

  async function loadPreference() {
    const { data, error } = await window.calbuddySupabase
      .from("ari_notification_preferences")
      .select("circle_activity_enabled")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      setStatus("Run the one-time Supabase setup to activate this preference.", "info");
      return;
    }

    $("circleNotificationToggle").checked =
      data?.circle_activity_enabled !== false;
    localStorage.setItem(
      "ari_circle_activity_enabled",
      String($("circleNotificationToggle").checked)
    );
  }

  async function savePreference() {
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
      localStorage.setItem(
        "ari_circle_activity_enabled",
        String(toggle.checked)
      );
    }
    setStatus(
      error ? error.message : "Notification preference saved.",
      error ? "error" : "success"
    );
  }

  async function init() {
    const session = await window.AriSettings.requireSession();
    if (!session) return;
    userId = session.user.id;
    $("circleNotificationToggle").addEventListener("change", savePreference);
    await loadPreference();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
