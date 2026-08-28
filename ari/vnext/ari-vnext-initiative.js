// ARI vNext — browser initiative client.
// Checks deterministic server-side initiative state without invoking a language
// model, then emits an event the host UI can render as an Ari-started message.

window.Ari = window.Ari || {};

window.AriVNextInitiative = {
  version: "1.0.0",
  source: "ari-vnext-initiative-client",

  async check(options = {}) {
    const bridge = window.AriVNextBridge;
    if (!bridge?.getSession || !bridge?.buildContext) throw new Error("Ari vNext bridge is not available.");

    const session = await bridge.getSession();
    const accessToken = String(session?.access_token || "").trim();
    if (!accessToken) throw new Error("A signed-in ARI session is required.");

    // This message is used only to make the existing context builder load the
    // canonical training/goal history. It is never sent to an LLM.
    const context = await bridge.buildContext({
      ...options,
      message: "Review recent training goals weight trend adherence experiments and recovery for meaningful changes",
      history: []
    });
    const surface = options?.page || options?.surface || window.location.pathname || "app_open";

    const response = await fetch("/api/ari-vnext-initiative", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action: "check", surface, context }),
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || "Ari initiative check failed.");

    if (data?.shouldInitiate && data?.initiative) {
      window.dispatchEvent(new CustomEvent("ari:vnextInitiative", { detail: data }));
    } else {
      window.dispatchEvent(new CustomEvent("ari:vnextInitiativeQuiet", { detail: data }));
    }
    return data;
  },

  async engage(initiative) {
    return this.updateStatus(initiative, "engage");
  },

  async dismiss(initiative) {
    return this.updateStatus(initiative, "dismiss");
  },

  async updateStatus(initiative, action) {
    const bridge = window.AriVNextBridge;
    const session = await bridge?.getSession?.();
    const accessToken = String(session?.access_token || "").trim();
    const initiativeId = String(initiative?.id || "").trim();
    if (!accessToken) throw new Error("A signed-in ARI session is required.");
    if (!initiativeId) throw new Error("Ari initiative identity is missing.");

    const response = await fetch("/api/ari-vnext-initiative", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action, initiativeId }),
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) throw new Error(data?.error || data?.code || "Ari initiative update failed.");
    window.dispatchEvent(new CustomEvent(action === "engage" ? "ari:vnextInitiativeEngaged" : "ari:vnextInitiativeDismissed", { detail: data }));
    return data;
  }
};
