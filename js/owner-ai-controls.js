/* ARI XP — Owner ARI Intelligence Controls v1.1.0 */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  let accessToken = "";

  function setStatus(message = "", type = "") {
    const node = $("ownerAiStatus");
    if (!node) return;
    node.textContent = message;
    node.dataset.type = type;
  }

  function setAccessStatus(message = "", type = "") {
    const node = $("ownerAiAccessStatus");
    if (!node) return;
    node.textContent = message;
    node.dataset.type = type;
  }

  async function getSession() {
    const client = window.calbuddySupabase || window.supabaseClient;
    if (!client?.auth?.getSession) return null;
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data?.session || null;
  }

  async function api(method = "GET", body = null) {
    const response = await fetch("/api/ari-owner-intelligence-controls", {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body ? { "Content-Type": "application/json" } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data?.error || "Owner intelligence controls are unavailable.");
      error.code = data?.code || "OWNER_AI_CONTROL_FAILED";
      throw error;
    }
    return data;
  }

  function render(data = {}) {
    const controls = data?.controls || {};
    const entitlement = data?.entitlement || {};
    const runtime = data?.runtime || {};
    const advanced = entitlement?.tier === "advanced";

    $("advancedAriToggle").checked = controls?.enabled === true;
    $("reasoningProfileSelect").value = controls?.reasoningProfile || "adaptive";
    $("reasoningProfileSelect").disabled = controls?.enabled !== true;

    $("tierStat").textContent = advanced ? "Advanced" : "Standard";
    $("modelStat").textContent = advanced ? (runtime?.modelFamily || runtime?.advancedModel || "GPT-5.6 Sol") : "Standard policy";
    $("reasoningStat").textContent = entitlement?.reasoningProfile || "standard";
    $("premiumStat").textContent = data?.premiumRolloutEnabled === true ? "Enabled" : "Locked";
    $("effectiveTierTitle").textContent = advanced ? "Advanced Ari is live" : "Standard Ari active";
    $("effectiveTierDescription").textContent = advanced
      ? "Your owner conversations now use the Advanced Conversation Contract and GPT-5.6 Sol reasoning lane. ARI XP actions still pass through the existing trusted validation and confirmation system."
      : "Your account is currently using Standard Ari. Enable Advanced Ari to enter the private GPT-5.6 Sol conversation beta.";
  }

  async function save() {
    const button = $("saveOwnerAiControls");
    button.disabled = true;
    setStatus("Saving owner controls…", "working");

    try {
      const data = await api("POST", {
        enabled: $("advancedAriToggle").checked,
        reasoningProfile: $("reasoningProfileSelect").value
      });
      render(data);
      setStatus(data?.message || "Owner controls saved.", "success");
    } catch (error) {
      setStatus(error?.message || "Could not save owner controls.", "error");
    } finally {
      button.disabled = false;
    }
  }

  async function initialize() {
    try {
      const session = await getSession();
      accessToken = String(session?.access_token || "").trim();
      if (!accessToken) throw new Error("Sign in with the owner account to use this control center.");

      const data = await api("GET");
      render(data);
      $("ownerAiWorkspace").hidden = false;
      setAccessStatus("");
    } catch (error) {
      $("ownerAiWorkspace").hidden = true;
      setAccessStatus(error?.message || "Owner access required.", "error");
    }
  }

  $("advancedAriToggle")?.addEventListener("change", () => {
    $("reasoningProfileSelect").disabled = !$("advancedAriToggle").checked;
  });
  $("saveOwnerAiControls")?.addEventListener("click", save);
  window.addEventListener("DOMContentLoaded", initialize, { once: true });
})();
