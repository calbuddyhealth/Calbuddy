/* ARI XP — Help & Safety v2.0.0 */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  let session = null;
  let reportedUserId = null;
  let targetId = null;

  function setStatus(message = "", type = "") {
    window.AriSettings.setStatus($("reportStatus"), message, type);
  }

  function readContext() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    const display = String(params.get("display") || "").slice(0, 80);
    reportedUserId = params.get("reported_user_id") || null;
    targetId = params.get("target_id") || null;

    if (["user", "content", "safety", "app", "billing", "other"].includes(type)) {
      $("reportTargetType").value = type;
    }

    if (type === "account") {
      $("reportTargetType").value = "app";
      $("reportCategory").value = "account_help";
    }

    if (reportedUserId) {
      $("reportedProfileNotice").hidden = false;
      $("reportedProfileNotice").textContent =
        display
          ? `Reporting ARI Circle profile: ${display}`
          : "An ARI Circle profile is attached to this report.";
      $("reportTargetType").value = "user";
      $("reportCategory").value = "harassment";
    }
  }

  function enterGuestMode() {
    document.querySelectorAll('a[href="account.html"]').forEach((link) => {
      link.href = "/signin.html";
      if (link.classList.contains("ari-header-button")) {
        link.textContent = "Sign in";
      }
    });

    setStatus(
      "You can send a support request without signing in. Add a contact email so ARI XP can follow up.",
      "info"
    );
  }

  async function submitReport(event) {
    event.preventDefault();

    const details = String($("reportDetails").value || "").trim();
    const email = String($("reportEmail").value || "").trim();
    const website = String($("reportWebsite")?.value || "").trim();

    if (details.length < 10) {
      setStatus("Please add at least 10 characters of detail.", "error");
      $("reportDetails").focus();
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus("Enter a valid contact email.", "error");
      $("reportEmail").focus();
      return;
    }

    $("submitReportButton").disabled = true;
    setStatus("Sending your private request…", "working");

    const headers = {
      "Content-Type": "application/json"
    };

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    let response;
    let data;

    try {
      response = await fetch("/api/profile", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "submit_support_request",
          email,
          details,
          website,
          target_type: $("reportTargetType").value,
          category: $("reportCategory").value,
          reported_user_id: reportedUserId,
          target_id: targetId,
          source_page: document.referrer || window.location.pathname,
          submitted_from: window.location.pathname
        })
      });

      data = await response.json().catch(() => ({}));
    } catch (error) {
      $("submitReportButton").disabled = false;
      setStatus("ARI XP support is temporarily unavailable. Please try again.", "error");
      return;
    }

    $("submitReportButton").disabled = false;

    if (!response.ok) {
      setStatus(
        data?.error || "ARI XP could not send your request. Please try again.",
        "error"
      );
      return;
    }

    $("reportForm").reset();
    $("reportEmail").value = email;
    setStatus(
      data?.reference
        ? `Request received. Reference: ${data.reference}`
        : "Request received. ARI XP will review it privately.",
      "success"
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function init() {
    try {
      session = await window.AriSettings.getSession();
    } catch (error) {
      console.error("ARI XP support session check failed:", error);
      session = null;
    }

    readContext();

    if (!session) {
      enterGuestMode();
    } else {
      $("reportEmail").value = session.user?.email || "";
    }

    $("reportForm")?.addEventListener("submit", submitReport);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
