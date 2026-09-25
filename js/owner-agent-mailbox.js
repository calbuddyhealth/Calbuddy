/* ARI Rebirth — Owner Agent Mailbox v1.0.0 */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  let session = null;
  let loadedMessages = [];

  function setStatus(message = "", type = "") {
    window.AriSettings.setStatus($("mailboxStatus"), message, type);
  }

  function escapeHtml(value = "") {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(value) {
    if (!value) return "Unknown";
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value));
    } catch {
      return String(value);
    }
  }

  function titleCase(value = "") {
    return String(value || "")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  async function api(path = "") {
    const token = String(session?.access_token || "").trim();
    if (!token) throw new Error("Owner session is unavailable.");

    const response = await fetch(`/api/ari-agent-mailbox${path}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data?.error || data?.message || "Agent mailbox is unavailable.");
      error.status = response.status;
      error.code = data?.code || "";
      throw error;
    }
    return data;
  }

  function compactContent(message = {}) {
    const content = message?.payload?.content;
    if (typeof content === "string" && content.trim()) {
      return content.trim().slice(0, 260);
    }
    try {
      return JSON.stringify(message?.payload || {}).slice(0, 260);
    } catch {
      return "";
    }
  }

  function renderMessages(messages = []) {
    loadedMessages = messages;
    $("mailboxCount").textContent = String(messages.length);
    const list = $("mailboxList");

    if (!messages.length) {
      list.innerHTML = '<div class="mailbox-empty">No messages match the current audit filters.</div>';
      $("mailboxDetail").innerHTML = '<div class="mailbox-detail-empty">No message selected.</div>';
      return;
    }

    list.innerHTML = messages.map((message, index) => `
      <button class="mailbox-message-card" type="button" data-mailbox-index="${index}">
        <span class="mailbox-message-top">
          <strong>${escapeHtml(message.subject || titleCase(message.kind) || "Agent message")}</strong>
          <span class="mailbox-kind">${escapeHtml(titleCase(message.kind))}</span>
        </span>
        <span class="mailbox-route">${escapeHtml(message.sender)} → ${escapeHtml(message.recipient)}</span>
        <span class="mailbox-preview">${escapeHtml(compactContent(message) || "No content preview")}</span>
        <span class="mailbox-meta">${escapeHtml(formatDate(message.createdAt))} · ${escapeHtml(message.messageId || "")}</span>
      </button>
    `).join("");

    list.querySelectorAll("[data-mailbox-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.mailboxIndex);
        selectMessage(index, button);
      });
    });

    selectMessage(0, list.querySelector("[data-mailbox-index='0']"));
  }

  async function selectMessage(index, button) {
    const message = loadedMessages[index];
    if (!message) return;

    document.querySelectorAll(".mailbox-message-card").forEach((item) =>
      item.classList.toggle("is-active", item === button)
    );

    setStatus("Loading message detail…", "working");
    try {
      const data = await api(`?action=read&path=${encodeURIComponent(message.path || "")}`);
      const detail = data?.message || message;
      $("mailboxDetail").innerHTML = `
        <div class="mailbox-detail-header">
          <span class="mailbox-kind">${escapeHtml(titleCase(detail.kind))}</span>
          <strong>${escapeHtml(detail.subject || "Agent message")}</strong>
          <span>${escapeHtml(detail.sender)} → ${escapeHtml(detail.recipient)}</span>
          <span>${escapeHtml(formatDate(detail.createdAt))}</span>
        </div>
        <dl class="mailbox-detail-grid">
          <div><dt>Message ID</dt><dd>${escapeHtml(detail.messageId || "—")}</dd></div>
          <div><dt>Thread ID</dt><dd>${escapeHtml(detail.threadId || "—")}</dd></div>
          <div><dt>Reply to</dt><dd>${escapeHtml(detail.replyTo || "—")}</dd></div>
          <div><dt>Path</dt><dd>${escapeHtml(message.path || data?.path || "—")}</dd></div>
        </dl>
        <h3>Stored JSON</h3>
        <pre class="mailbox-json">${escapeHtml(JSON.stringify(detail, null, 2))}</pre>
      `;
      setStatus("");
    } catch (error) {
      setStatus(error?.message || "Message detail could not be loaded.", "error");
    }
  }

  async function loadMessages() {
    setStatus("Loading Artifactory mailbox…", "working");
    const query = new URLSearchParams();
    const recipient = $("mailboxRecipient").value.trim();
    const sender = $("mailboxSender").value.trim();
    const kind = $("mailboxKind").value;
    const limit = $("mailboxLimit").value || "50";
    if (recipient) query.set("recipient", recipient);
    if (sender) query.set("sender", sender);
    if (kind) query.set("kind", kind);
    query.set("limit", limit);

    try {
      const data = await api(`?${query.toString()}`);
      renderMessages(Array.isArray(data?.messages) ? data.messages : []);
      setStatus("");
    } catch (error) {
      renderMessages([]);
      setStatus(error?.message || "Artifactory mailbox could not be loaded.", "error");
    }
  }

  async function init() {
    session = await window.AriSettings.requireSession();
    if (!session) return;

    setStatus("Verifying owner mailbox configuration…", "working");

    try {
      const status = await api("?action=status");
      if (!status?.configured) {
        $("mailboxWorkspace").hidden = false;
        $("mailboxProvider").textContent = status?.provider || "JFrog Artifactory";
        $("mailboxRepository").textContent = status?.repository || "Not configured";
        $("mailboxPrefix").textContent = status?.prefix || "Not configured";
        setStatus("Artifactory mailbox code is installed, but the server environment is not configured yet.", "info");
        return;
      }

      $("mailboxProvider").textContent = status.provider || "JFrog Artifactory";
      $("mailboxRepository").textContent = status.repository || "—";
      $("mailboxPrefix").textContent = status.prefix || "—";
      $("mailboxWorkspace").hidden = false;

      $("mailboxRefresh").addEventListener("click", loadMessages);
      for (const id of ["mailboxKind", "mailboxLimit"]) {
        $(id).addEventListener("change", loadMessages);
      }
      for (const id of ["mailboxRecipient", "mailboxSender"]) {
        $(id).addEventListener("keydown", (event) => {
          if (event.key === "Enter") loadMessages();
        });
      }

      await loadMessages();
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        setStatus("Owner access required.", "error");
        setTimeout(() => window.location.replace("account.html"), 900);
        return;
      }
      $("mailboxWorkspace").hidden = false;
      setStatus(error?.message || "Agent mailbox could not be initialized.", "error");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
