// ARI XP — Conversations library
(() => {
  "use strict";

  const ACTIVE_KEY = "arixp_active_conversation_v2";
  const list = () => document.getElementById("conversationHistoryList");
  const clean = (v = "") => String(v || "").trim();

  async function context() {
    const client = window.calbuddySupabase || window.CalBuddy?.supabase;
    const session = await window.CalBuddy?.getCurrentSession?.();
    return { client, user: session?.user || null };
  }

  function relativeGroup(dateValue) {
    const date = new Date(dateValue);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const days = Math.round((today - target) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days <= 7) return "Previous 7 Days";
    return "Older";
  }

  function card(session) {
    const article = document.createElement("article");
    article.className = `ari-history-card${session.pinned ? " is-pinned" : ""}`;

    const open = document.createElement("button");
    open.className = "ari-history-open";
    open.type = "button";
    open.innerHTML = `
      <span class="ari-history-card-top"><strong>${escapeHtml(session.title || "Conversation")}</strong><span>${session.pinned ? "PINNED" : ""}</span></span>
      <span class="ari-history-preview">${escapeHtml(session.preview || "Continue your conversation with ARI.")}</span>
      <span class="ari-history-date">${new Date(session.last_message_at || session.updated_at).toLocaleString()}</span>`;
    open.addEventListener("click", () => openConversation(session.id));

    const actions = document.createElement("div");
    actions.className = "ari-history-actions";

    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "ari-history-action";
    pin.textContent = session.pinned ? "UNPIN" : "PIN";
    pin.addEventListener("click", () => togglePin(session));

    const del = document.createElement("button");
    del.type = "button";
    del.className = "ari-history-action danger";
    del.textContent = "DELETE";
    del.addEventListener("click", () => deleteConversation(session));

    actions.append(pin, del);
    article.append(open, actions);
    return article;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  async function loadConversationHistory() {
    const target = list();
    if (!target) return;
    const { client, user } = await context();
    if (!client || !user?.id) {
      target.innerHTML = '<p class="window-note">Sign in to view your saved conversations.</p>';
      return;
    }

    const { data, error } = await client
      .from("ari_chat_sessions")
      .select("id,title,preview,status,pinned,created_at,updated_at,last_message_at")
      .eq("user_id", user.id)
      .order("pinned", { ascending: false })
      .order("last_message_at", { ascending: false })
      .limit(25);

    if (error) {
      target.innerHTML = '<p class="window-note">Conversations could not be loaded right now.</p>';
      return;
    }

    target.innerHTML = "";
    if (!data?.length) {
      target.innerHTML = '<div class="ari-history-empty"><strong>No saved conversations yet.</strong><p>Start talking with ARI and your inactive threads will appear here automatically.</p></div>';
      return;
    }

    const groups = ["Today", "Yesterday", "Previous 7 Days", "Older"];
    groups.forEach((label) => {
      const items = data.filter((item) => relativeGroup(item.last_message_at || item.updated_at) === label);
      if (!items.length) return;
      const heading = document.createElement("h2");
      heading.className = "ari-history-group-title";
      heading.textContent = label;
      target.appendChild(heading);
      items.forEach((item) => target.appendChild(card(item)));
    });
  }

  async function togglePin(session) {
    const { client, user } = await context();
    if (!client || !user?.id) return;
    const { error } = await client
      .from("ari_chat_sessions")
      .update({ pinned: !session.pinned, updated_at: new Date().toISOString() })
      .eq("id", session.id)
      .eq("user_id", user.id);
    if (error) {
      alert(error.message?.includes("ARI_PIN_LIMIT_REACHED") ? "You can pin up to 5 conversations. Unpin one first." : "That conversation could not be updated.");
      return;
    }
    await loadConversationHistory();
  }

  async function deleteConversation(session) {
    if (!confirm(`Delete “${session.title || "Conversation"}”? This removes the saved transcript.`)) return;
    const { client, user } = await context();
    if (!client || !user?.id) return;
    await client.from("ari_chat_sessions").delete().eq("id", session.id).eq("user_id", user.id);
    try {
      const active = JSON.parse(localStorage.getItem(ACTIVE_KEY) || "null");
      if (active?.id === session.id) localStorage.removeItem(ACTIVE_KEY);
    } catch {}
    await loadConversationHistory();
  }

  function openConversation(id) {
    location.href = `home.html?conversation=${encodeURIComponent(id)}`;
  }

  async function startNewConversation() {
    const { client, user } = await context();
    try {
      const active = JSON.parse(localStorage.getItem(ACTIVE_KEY) || "null");
      if (active?.id && client && user?.id) {
        await client.from("ari_chat_sessions").update({ status: "archived", updated_at: new Date().toISOString() }).eq("id", active.id).eq("user_id", user.id);
      }
    } catch {}
    localStorage.removeItem(ACTIVE_KEY);
    location.href = "home.html";
  }

  async function deleteAll() {
    if (!confirm("Delete all saved ARI conversations? Pinned conversations will also be deleted.")) return;
    const { client, user } = await context();
    if (!client || !user?.id) return;
    await client.from("ari_chat_sessions").delete().eq("user_id", user.id);
    localStorage.removeItem(ACTIVE_KEY);
    await loadConversationHistory();
  }

  function goBack() {
    if (history.length > 1) history.back();
    else location.href = "home.html";
  }

  window.goBack = goBack;
  window.startNewConversation = startNewConversation;
  window.loadConversationHistory = loadConversationHistory;

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("deleteAllBtn")?.addEventListener("click", deleteAll);
    void loadConversationHistory();
  });
})();
