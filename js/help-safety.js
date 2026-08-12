/* ARI Rebirth — Help & Safety v1.0.1 */

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

    if (["user", "content", "safety", "app", "other"].includes(type)) {
      $("reportTargetType").value = type;
    }

    if (type === "account") {
      $("reportTargetType").value = "other";
      $("reportCategory").value = "account_help";
    }

    if (reportedUserId) {
      $("reportedProfileNotice").hidden = false;
      $("reportedProfileNotice").textContent =
        display ? `Reporting ARI Circle profile: ${display}` : "An ARI Circle profile is attached to this report.";
      $("reportTargetType").value = "user";
      $("reportCategory").value = "harassment";
    }
  }

  function enterGuestMode() {
    const submitButton = $("submitReportButton");

    document.querySelectorAll('a[href="account.html"]').forEach((link) => {
      link.href = "/signin.html";
      if (link.classList.contains("ari-header-button")) {
        link.textContent = "Sign in";
      }
    });

    if (submitButton) {
      submitButton.type = "button";
      submitButton.textContent = "Sign in to send report";
      submitButton.addEventListener("click", () => {
        window.location.assign("/signin.html");
      });
    }

    setStatus(
      "Safety is available without an account. Sign in if you want to send a private report.",
      "info"
    );
  }

  async function submitReport(event) {
    event.preventDefault();

    if (!session?.user?.id) {
      window.location.assign("/signin.html");
      return;
    }

    const details = String($("reportDetails").value || "").trim();
    const email = String($("reportEmail").value || "").trim();

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
    setStatus("Sending your private report…", "working");

    const { data, error } = await window.calbuddySupabase
      .from("ari_reports")
      .insert({
        reporter_user_id: session.user.id,
        reporter_contact_email: email,
        target_type: $("reportTargetType").value,
        reported_user_id: reportedUserId,
        target_id: targetId,
        category: $("reportCategory").value,
        details,
        evidence: {
          source_page: document.referrer || window.location.pathname,
          submitted_from: window.location.pathname
        },
        status: "pending",
        priority: ["unsafe_content", "privacy_concern"].includes($("reportCategory").value)
          ? "urgent"
          : "normal"
      })
      .select("id")
      .single();

    $("submitReportButton").disabled = false;

    if (error) {
      setStatus(error.message, "error");
      return;
    }

    $("reportForm").reset();
    $("reportEmail").value = email;
    setStatus(`Report received. Reference: ${String(data.id).slice(0, 8).toUpperCase()}`, "success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function init() {
    try {
      session = await window.AriSettings.getSession();
    } catch (error) {
      console.error("ARI safety session check failed:", error);
      session = null;
    }

    readContext();

    if (!session) {
      enterGuestMode();
      return;
    }

    $("reportEmail").value = session.user.email || "";
    $("reportForm").addEventListener("submit", submitReport);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
