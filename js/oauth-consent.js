(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(window.location.search);
  const authorizationId = String(params.get("authorization_id") || "").trim();
  const client = window.calbuddySupabase || window.supabaseClient;

  function message(text, isError = false) {
    $("oauthMessage").textContent = text;
    $("oauthMessage").dataset.type = isError ? "error" : "success";
    $("oauthMessageCard").hidden = false;
  }

  function showSignIn() {
    $("oauthSignInCard").hidden = false;
    $("oauthConsentCard").hidden = true;
    message("Sign in with the ARI XP owner account to review this connection.");
  }

  async function ownerSession() {
    const sessionResult = await client?.auth?.getSession?.();
    const session = sessionResult?.data?.session;
    if (!session?.access_token) return null;

    const response = await fetch("/api/ari-owner-intelligence-controls", {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        Accept: "application/json"
      }
    });

    if (!response.ok) return null;
    return session;
  }

  async function loadAuthorization() {
    if (!client?.auth?.oauth) {
      message("This ARI XP build does not yet support OAuth authorization.", true);
      return;
    }
    if (!authorizationId) {
      message("The authorization request is missing its authorization ID.", true);
      return;
    }

    const session = await ownerSession();
    if (!session) {
      showSignIn();
      return;
    }

    $("oauthSignInCard").hidden = true;
    message("Loading connection details…");

    const { data, error } = await client.auth.oauth.getAuthorizationDetails(authorizationId);
    if (error || !data) {
      message(error?.message || "This authorization request is invalid or expired.", true);
      return;
    }

    if (!("authorization_id" in data)) {
      window.location.replace(data.redirect_url);
      return;
    }

    const clientInfo = data.client || {};
    $("oauthClientName").textContent =
      clientInfo.name || clientInfo.client_name || data.client_name || "AI client";
    $("oauthScopes").textContent = data.scope || "No additional profile scopes requested.";

    const redirectUri =
      data.redirect_uri || clientInfo.redirect_uri || clientInfo.redirect_uris?.[0] || "";
    $("oauthClientDetails").textContent = redirectUri
      ? `The client will receive the authorization result at: ${redirectUri}`
      : "Review the requesting client before approving.";

    $("oauthConsentCard").hidden = false;
    $("oauthMessageCard").hidden = true;
  }

  async function decide(decision) {
    $("oauthApprove").disabled = true;
    $("oauthDeny").disabled = true;
    message(decision === "approve" ? "Approving connection…" : "Denying connection…");

    const method =
      decision === "approve"
        ? client.auth.oauth.approveAuthorization.bind(client.auth.oauth)
        : client.auth.oauth.denyAuthorization.bind(client.auth.oauth);

    const { data, error } = await method(authorizationId);
    if (error || !data?.redirect_url) {
      $("oauthApprove").disabled = false;
      $("oauthDeny").disabled = false;
      message(error?.message || "ARI XP could not complete the authorization decision.", true);
      return;
    }

    window.location.replace(data.redirect_url);
  }

  window.addEventListener("DOMContentLoaded", () => {
    $("oauthSignIn").addEventListener("click", async () => {
      const email = $("oauthEmail").value.trim();
      const password = $("oauthPassword").value;
      if (!email || !password) {
        message("Enter your owner email and password.", true);
        return;
      }

      $("oauthSignIn").disabled = true;
      message("Signing in securely…");
      const { error } = await client.auth.signInWithPassword({ email, password });
      $("oauthPassword").value = "";
      $("oauthSignIn").disabled = false;

      if (error) {
        message(error.message || "Sign-in failed.", true);
        return;
      }
      await loadAuthorization();
    });

    $("oauthApprove").addEventListener("click", () => decide("approve"));
    $("oauthDeny").addEventListener("click", () => decide("deny"));

    loadAuthorization().catch(() => {
      message("ARI XP could not load this authorization request.", true);
    });
  }, { once: true });
})();
