/* =============================================================
   ARI CIRCLE — MESSAGE INBOX RESCUE
   Version: 1.0.0

   Purpose:
   - Keep the Messages inbox populated even when the primary inbox pass
     races auth/session hydration on mobile Safari.
   - Never require visiting a profile to rediscover an existing thread.
   - Preserve the existing thread UI; this only fills an empty inbox.
============================================================= */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const clean = (value) => String(value ?? "").trim();
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const state = {
    rows: [],
    busy: false,
    started: false,
    timer: 0
  };

  function client() {
    return window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
  }

  function relativeTime(value) {
    if (!value) return "";
    const date = new Date(value);
    const diff = Date.now() - date.getTime();
    if (!Number.isFinite(diff)) return "";
    const minutes = Math.max(0, Math.floor(diff / 60000));
    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function initial(name) {
    const text = clean(name);
    return text ? text.charAt(0).toUpperCase() : "A";
  }

  function avatar(row) {
    const url = clean(row.avatar_url);
    const name = clean(row.display_name) || "ARI User";
    return url
      ? `<img src="${escapeHtml(url)}" alt="" loading="lazy" />`
      : escapeHtml(initial(name));
  }

  function render(rows = state.rows) {
    const host = $("conversationList");
    const empty = $("conversationEmpty");
    const status = $("inboxStatus");
    if (!host || !empty || !status) return;

    const query = clean($("messageSearch")?.value).toLowerCase();
    const filtered = query
      ? rows.filter((row) => [row.display_name, row.handle, row.last_message_body]
          .some((value) => clean(value).toLowerCase().includes(query)))
      : rows;

    host.replaceChildren();
    empty.hidden = rows.length > 0;
    status.textContent = query && !filtered.length ? "No matching conversations." : "";

    filtered.forEach((row) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "circle-conversation circle-conversation--rescued";
      const unread = Number(row.unread_count) || 0;
      const preview = clean(row.last_message_body) || (row.handle ? `@${clean(row.handle).replace(/^@+/, "")}` : "Conversation");
      button.innerHTML = `
        <span class="circle-conversation__avatar-wrap">
          <span class="circle-conversation__avatar">${avatar(row)}</span>
        </span>
        <span class="circle-conversation__copy">
          <strong>${escapeHtml(row.display_name || "ARI User")}</strong>
          <span>${escapeHtml(preview)}</span>
        </span>
        <span class="circle-conversation__meta">
          <span>${escapeHtml(relativeTime(row.last_message_at))}</span>
          ${unread > 0 ? `<span class="circle-conversation__unread-count" aria-label="${unread} unread">${unread > 99 ? "99+" : unread}</span>` : ""}
        </span>`;
      button.addEventListener("click", () => {
        const other = clean(row.other_user_id);
        if (other) location.href = `ari-circle-messages.html?user=${encodeURIComponent(other)}`;
      });
      host.append(button);
    });
  }

  async function load() {
    if (state.busy || !$("circleInbox")) return;
    const c = client();
    if (!c) return;
    state.busy = true;
    try {
      const { data, error } = await c.rpc("ari_circle_messages_list", { result_limit: 100 });
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      state.rows = rows;

      // Only take over when the primary controller did not render the inbox.
      const existing = $("conversationList")?.children?.length || 0;
      if (!existing || rows.length) render(rows);
    } catch (error) {
      console.warn("ARI Circle inbox rescue could not load conversations:", error);
    } finally {
      state.busy = false;
    }
  }

  function schedule(delay = 0) {
    clearTimeout(state.timer);
    state.timer = setTimeout(load, delay);
  }

  function start() {
    if (state.started) return;
    state.started = true;

    $("messageSearch")?.addEventListener("input", () => {
      if (state.rows.length) setTimeout(() => render(), 0);
    });

    schedule(180);
    setTimeout(load, 650);
    setTimeout(load, 1600);
    window.addEventListener("focus", () => schedule(120));
    window.addEventListener("pageshow", () => schedule(120));
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) schedule(120);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();