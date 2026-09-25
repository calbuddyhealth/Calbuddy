// ARI Signals — unified Home inbox + native iOS push bridge v1.0.0
(() => {
  "use strict";

  const VERSION = "1.2.0";
  const API = "/api/ari-signals";
  const APP_ID = "com.arixp.app";
  let signals = [];
  let preferences = null;
  let initialized = false;
  let nativeListenersInstalled = false;
  let pendingDeepLinkSignalId = "";
  let activeDetailSignalId = "";

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
        <section class="ari-signal-detail" id="ariSignalDetail" hidden aria-hidden="true" aria-labelledby="ariSignalDetailTitle">
          <header class="ari-signal-detail-head">
            <button type="button" class="ari-signal-detail-back" id="ariSignalDetailBack" aria-label="Back to Ari Signals">BACK</button>
            <div class="ari-signal-detail-head-copy">
              <p class="ari-signal-detail-kicker" id="ariSignalDetailKicker">ARI SIGNAL</p>
              <h3 class="ari-signal-detail-title" id="ariSignalDetailTitle">Signal details</h3>
            </div>
            <button type="button" class="ari-signal-detail-close" id="ariSignalDetailClose" aria-label="Close Ari Signals">CLOSE</button>
          </header>
          <div class="ari-signal-detail-scroll" id="ariSignalDetailBody"></div>
          <footer class="ari-signal-detail-actions">
            <button type="button" class="ari-signal-detail-action is-primary" id="ariSignalAskAri">ASK ARI</button>
            <button type="button" class="ari-signal-detail-action" id="ariSignalCopyChatGPT">COPY FOR CHATGPT</button>
            <button type="button" class="ari-signal-detail-action is-quiet" id="ariSignalDetailDismiss">DISMISS</button>
          </footer>
          <p class="ari-signal-detail-status" id="ariSignalDetailStatus" role="status" aria-live="polite"></p>
        </section>
      </section>`;
    backdrop.addEventListener("click", (event) => { if (event.target === backdrop) closePanel(); });
    document.body.appendChild(backdrop);
    document.getElementById("ariSignalsClose")?.addEventListener("click", closePanel);
    document.getElementById("ariSignalDetailBack")?.addEventListener("click", closeSignalDetail);
    document.getElementById("ariSignalDetailClose")?.addEventListener("click", closePanel);
    document.getElementById("ariSignalAskAri")?.addEventListener("click", async () => {
      if (activeDetailSignalId) await engageSignal(activeDetailSignalId);
    });
    document.getElementById("ariSignalCopyChatGPT")?.addEventListener("click", async () => {
      if (activeDetailSignalId) await copySignalForChatGPT(activeDetailSignalId);
    });
    document.getElementById("ariSignalDetailDismiss")?.addEventListener("click", async () => {
      const id = activeDetailSignalId;
      if (!id) return;
      await dismissSignal(id);
      closeSignalDetail();
    });
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
    closeSignalDetail();
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
        <button type="button" class="ari-signal-item ${signal.unread ? "is-unread" : ""}" data-signal-id="${escapeHtml(signal.id)}" data-priority="${escapeHtml(signal.priority)}" aria-label="${escapeHtml(`View details: ${signal.message}`)}">
          <span class="ari-signal-meta"><span class="ari-signal-priority"></span>${escapeHtml(label(signal.category))}</span>
          <p class="ari-signal-message">${escapeHtml(signal.message)}</p>
          <span class="ari-signal-foot"><span class="ari-signal-time">${escapeHtml(relativeTime(signal.surfacedAt))}</span><span class="ari-signal-view">View details <span aria-hidden="true">→</span></span></span>
          <span class="ari-signal-dismiss" data-dismiss-signal="${escapeHtml(signal.id)}" role="button" aria-label="Dismiss signal">×</span>
        </button>`).join("") : '<div class="ari-signals-empty">Nothing needs your attention right now. Ari can still adapt silently in the background.</div>';
      list.querySelectorAll("[data-signal-id]").forEach((node) => node.addEventListener("click", async (event) => {
        const dismissId = event.target?.closest?.("[data-dismiss-signal]")?.getAttribute("data-dismiss-signal");
        if (dismissId) { event.preventDefault(); event.stopPropagation(); await dismissSignal(dismissId); return; }
        openSignalDetail(node.getAttribute("data-signal-id"));
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
        openPanel();
        openSignalDetail(id);
      }
      return data;
    } catch (error) {
      setStatus(error?.message || "Ari Signals are temporarily unavailable.", true);
      return null;
    }
  }

  function openSignalDetail(id) {
    const signal = signals.find((item) => item.id === id);
    if (!signal) return;
    activeDetailSignalId = id;
    renderSignalDetail(signal);
    const detail = document.getElementById("ariSignalDetail");
    if (detail) detail.hidden = false;
    detail?.classList.add("is-open");
    detail?.setAttribute("aria-hidden", "false");
    document.getElementById("ariSignalDetailBack")?.focus?.({ preventScroll: true });
  }

  function closeSignalDetail() {
    activeDetailSignalId = "";
    const detail = document.getElementById("ariSignalDetail");
    detail?.classList.remove("is-open");
    detail?.setAttribute("aria-hidden", "true");
    if (detail) detail.hidden = true;
    const status = document.getElementById("ariSignalDetailStatus");
    if (status) status.textContent = "";
  }

  function renderSignalDetail(signal) {
    const detail = signal?.detail && typeof signal.detail === "object" ? signal.detail : {};
    const kicker = document.getElementById("ariSignalDetailKicker");
    const title = document.getElementById("ariSignalDetailTitle");
    const body = document.getElementById("ariSignalDetailBody");
    if (kicker) kicker.textContent = label(signal?.category);
    if (title) title.textContent = clean(signal?.message) || "Signal details";
    if (!body) return;

    const sections = [
      detailSection("WHAT I MEAN", detail.whatItMeans),
      detailSection("WHY I SENT THIS", detail.whySent || signal?.whyNow),
      detailSection("RELATED GOAL", detail.relatedGoal),
      predictionReviewSection(detail.reviewPacket),
      detailSection("CURRENT STATE", detail.currentState),
      detailSection("WHAT I NEED FROM JOSE", detail.requestFromJose),
      detailSection("WHAT I NEED FROM CHATGPT", detail.requestFromChatGPT),
      evidenceSection(detail.evidence),
      detailSection("SUGGESTED NEXT STEP", detail.suggestedNextStep)
    ].filter(Boolean);

    body.innerHTML = `
      <div class="ari-signal-detail-summary">
        <span class="ari-signal-detail-priority" data-priority="${escapeHtml(signal?.priority)}">${escapeHtml(priorityLabel(signal?.priority))}</span>
        <span>${escapeHtml(relativeTime(signal?.surfacedAt))}</span>
      </div>
      ${sections.join("") || detailSection("WHAT I MEAN", signal?.context || signal?.followUpPrompt || signal?.message)}
    `;
  }

  function detailSection(title, value) {
    const textValue = clean(value);
    if (!textValue) return "";
    return `<section class="ari-signal-detail-section"><h4>${escapeHtml(title)}</h4><p>${escapeHtml(textValue)}</p></section>`;
  }

  function predictionReviewSection(review) {
    if (!review || typeof review !== "object") return "";
    const windowText = formatObservationWindow(review.observationWindow);
    const baselineItems = [
      ...(Array.isArray(review?.baseline?.metrics) ? review.baseline.metrics : []),
      ...(Array.isArray(review?.baseline?.supportingEvidence)
        ? review.baseline.supportingEvidence.map((item) => `Original support — ${item}`)
        : [])
    ].map(clean).filter(Boolean).slice(0, 6);
    const evidenceItems = (Array.isArray(review.currentEvidence) ? review.currentEvidence : [])
      .map((item) => clean(item?.label))
      .filter(Boolean)
      .slice(0, 8);
    const quality = clean(review?.evidenceQuality?.label);
    const qualityNote = clean(review?.evidenceQuality?.note);
    const verdict = clean(review.preliminaryVerdict).replace(/_/g, " ");
    const rationale = clean(review.preliminaryRationale);

    const rows = [
      review.originalPrediction ? reviewRow("ORIGINAL PREDICTION", review.originalPrediction) : "",
      review.successCriteria ? reviewRow("WOULD SUPPORT IT IF", review.successCriteria) : "",
      review.disconfirmingCriteria ? reviewRow("WOULD WEAKEN IT IF", review.disconfirmingCriteria) : "",
      windowText ? reviewRow("OBSERVATION WINDOW", windowText) : "",
      baselineItems.length ? reviewListRow("BASELINE", baselineItems) : "",
      evidenceItems.length ? reviewListRow("NEW EVIDENCE", evidenceItems) : "",
      quality ? reviewRow("EVIDENCE QUALITY", [quality.toUpperCase(), qualityNote].filter(Boolean).join(" — ")) : "",
      verdict ? reviewVerdictRow(verdict, rationale, review.finalVerdictRequired !== false) : ""
    ].filter(Boolean).join("");

    return rows
      ? `<section class="ari-signal-review-card"><p class="ari-signal-review-kicker">PREDICTION REVIEW</p>${rows}</section>`
      : "";
  }

  function reviewRow(labelText, value) {
    const textValue = clean(value);
    if (!textValue) return "";
    return `<div class="ari-signal-review-row"><span>${escapeHtml(labelText)}</span><p>${escapeHtml(textValue)}</p></div>`;
  }

  function reviewListRow(labelText, items) {
    const rows = (Array.isArray(items) ? items : []).map(clean).filter(Boolean);
    if (!rows.length) return "";
    return `<div class="ari-signal-review-row"><span>${escapeHtml(labelText)}</span><ul>${rows.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`;
  }

  function reviewVerdictRow(verdict, rationale, finalRequired) {
    const status = clean(verdict) || "pending review";
    return `<div class="ari-signal-review-verdict"><div><span>PRELIMINARY COMPARISON</span><strong>${escapeHtml(status.toUpperCase())}</strong></div>${rationale ? `<p>${escapeHtml(rationale)}</p>` : ""}${finalRequired ? '<small>Not final until the evidence is explicitly reviewed.</small>' : ""}</div>`;
  }

  function formatObservationWindow(value) {
    if (!value || typeof value !== "object") return "";
    const start = formatDate(value.startAt);
    const end = formatDate(value.reviewAt);
    const days = Number(value.horizonDays);
    if (start && end) return `${start} → ${end}${Number.isFinite(days) ? ` · ${days} days` : ""}`;
    if (end) return `Review due ${end}`;
    return Number.isFinite(days) ? `${days}-day observation window` : "";
  }

  function formatDate(value) {
    const timestamp = Date.parse(String(value || ""));
    if (!Number.isFinite(timestamp)) return "";
    try {
      return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(timestamp));
    } catch {
      return String(value || "").slice(0, 10);
    }
  }

  function evidenceSection(items) {
    const evidence = Array.isArray(items) ? items.filter(Boolean).slice(0, 6) : [];
    if (!evidence.length) return "";
    const rows = evidence.map((item) => {
      const labelText = clean(item?.label) || "Evidence";
      const statusText = clean(item?.status);
      const href = safeHref(item?.url);
      const labelHtml = href
        ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(labelText)}</a>`
        : `<span>${escapeHtml(labelText)}</span>`;
      return `<li>${labelHtml}${statusText ? `<small>${escapeHtml(statusText.replace(/_/g, " "))}</small>` : ""}</li>`;
    }).join("");
    return `<section class="ari-signal-detail-section"><h4>EVIDENCE / RELATED WORK</h4><ul class="ari-signal-evidence">${rows}</ul></section>`;
  }

  function priorityLabel(value) {
    const priority = clean(value).toLowerCase();
    if (priority === "high") return "HIGH PRIORITY";
    if (priority === "positive") return "POSITIVE";
    if (priority === "low") return "LOW PRIORITY";
    return "REVIEW";
  }

  function safeHref(value) {
    try {
      const url = new URL(clean(value));
      return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  async function copySignalForChatGPT(id) {
    const signal = signals.find((item) => item.id === id);
    if (!signal) return;
    const detail = signal.detail || {};
    const review = detail.reviewPacket && typeof detail.reviewPacket === "object" ? detail.reviewPacket : null;
    const reviewLines = review ? [
      review.originalPrediction ? `Original prediction: ${review.originalPrediction}` : "",
      review.successCriteria ? `Would support it if: ${review.successCriteria}` : "",
      review.disconfirmingCriteria ? `Would weaken it if: ${review.disconfirmingCriteria}` : "",
      formatObservationWindow(review.observationWindow) ? `Observation window: ${formatObservationWindow(review.observationWindow)}` : "",
      Array.isArray(review?.baseline?.metrics) && review.baseline.metrics.length
        ? `Baseline: ${review.baseline.metrics.join("; ")}`
        : "",
      Array.isArray(review.currentEvidence) && review.currentEvidence.length
        ? `New evidence: ${review.currentEvidence.map((item) => clean(item?.label)).filter(Boolean).join("; ")}`
        : "",
      review?.evidenceQuality?.label
        ? `Evidence quality: ${review.evidenceQuality.label}${review.evidenceQuality.note ? ` — ${review.evidenceQuality.note}` : ""}`
        : "",
      review.preliminaryVerdict
        ? `Preliminary comparison: ${review.preliminaryVerdict} — ${clean(review.preliminaryRationale)}`
        : "",
      review.finalVerdictRequired !== false
        ? "Final review required: compare the evidence before resolving the prediction."
        : ""
    ].filter(Boolean) : [];
    const lines = [
      "ARI Signal",
      signal.message,
      detail.relatedGoal ? `Related goal: ${detail.relatedGoal}` : "",
      detail.whatItMeans ? `What Ari means: ${detail.whatItMeans}` : "",
      detail.whySent ? `Why Ari sent it: ${detail.whySent}` : "",
      detail.currentState ? `Current state: ${detail.currentState}` : "",
      detail.requestFromJose ? `What Ari needs from Jose: ${detail.requestFromJose}` : "",
      detail.requestFromChatGPT ? `What Ari needs from ChatGPT: ${detail.requestFromChatGPT}` : "",
      ...reviewLines,
      detail.suggestedNextStep ? `Suggested next step: ${detail.suggestedNextStep}` : "",
      Array.isArray(detail.evidence) && detail.evidence.length
        ? `Evidence: ${detail.evidence.map((item) => [clean(item?.label), clean(item?.url)].filter(Boolean).join(" — ")).filter(Boolean).join("; ")}`
        : ""
    ].filter(Boolean);
    const packet = lines.join("\n\n");
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(packet);
      } else {
        const area = document.createElement("textarea");
        area.value = packet;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      setDetailStatus("Copied a grounded Ari Signal briefing for ChatGPT.");
    } catch {
      setDetailStatus("Copy failed. You can still ask Ari directly from this signal.", true);
    }
  }

  function setDetailStatus(message, error = false) {
    const node = document.getElementById("ariSignalDetailStatus");
    if (!node) return;
    node.textContent = clean(message);
    node.classList.toggle("is-error", Boolean(error));
  }

  async function engageSignal(id) {
    const signal = signals.find((item) => item.id === id);
    if (!signal) return;
    try { await api({ action: "engage", signalId: id }); } catch {}
    signal.status = "engaged";
    signal.unread = false;
    render();
    closePanel();
    const initiative = {
      id: signal.id,
      initiativeKey: signal.initiativeKey,
      reasonId: signal.reasonId,
      priority: signal.priority,
      opener: signal.message,
      followUpPrompt: signal.followUpPrompt,
      action: signal.action,
      context: signal.context,
      domain: signal.domain,
      reviewPacket: signal?.detail?.reviewPacket || null
    };
    window.Ari?.Runtime?.stageInitiativeContext?.(initiative);
    window.dispatchEvent(new CustomEvent("ari:vnextInitiative", {
      detail: {
        success: true,
        shouldInitiate: true,
        fromSignal: true,
        initiative
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
      else {
        openPanel();
        openSignalDetail(signalId);
      }
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
    openSignal: openSignalDetail,
    engage: engageSignal,
    dismiss: dismissSignal,
    enablePush: () => document.getElementById("ariSignalsPushToggle")?.click()
  };

  window.addEventListener("ari:vnextInitiative", () => window.setTimeout(refresh, 250));
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") void refresh(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => void init(), { once: true });
  else void init();
})();
