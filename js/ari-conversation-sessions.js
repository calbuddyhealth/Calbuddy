// ARI XP — persistent home conversation sessions
(() => {
  "use strict";

  const ACTIVE_KEY = "arixp_active_conversation_v2";
  const INACTIVITY_MS = 15 * 60 * 1000;
  const MAX_HISTORY = 25;
  let archiveTimer = null;

  const clean = (v = "") => String(v || "").trim();
  const nowIso = () => new Date().toISOString();
  const newId = () => window.crypto?.randomUUID?.() || `ari-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function readActive() {
    try { return JSON.parse(localStorage.getItem(ACTIVE_KEY) || "null"); }
    catch { return null; }
  }

  function writeActive(value) {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(value));
    scheduleArchive(value);
    return value;
  }

  function clearActive() {
    localStorage.removeItem(ACTIVE_KEY);
    clearTimeout(archiveTimer);
  }

  function isStale(session) {
    if (!session?.lastActivityAt) return false;
    return Date.now() - new Date(session.lastActivityAt).getTime() >= INACTIVITY_MS;
  }

  function makeTitle(message) {
    const words = clean(message)
      .replace(/^[\s"'`]+|[\s"'`]+$/g, "")
      .replace(/\s+/g, " ")
      .split(" ")
      .filter(Boolean)
      .slice(0, 7);
    let title = words.join(" ") || "Conversation";
    if (title.length > 52) title = `${title.slice(0, 49).trim()}…`;
    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  async function clientAndUser() {
    const client = window.calbuddySupabase || window.CalBuddy?.supabase;
    const session = await window.CalBuddy?.getCurrentSession?.();
    return { client, user: session?.user || null };
  }

  async function ensureSessionRow(active, turn = {}) {
    const { client, user } = await clientAndUser();
    if (!client || !user?.id || !active?.id) return false;

    const title = active.title || makeTitle(turn.message);
    const preview = clean(turn.reply || turn.message).slice(0, 150);
    const stamp = nowIso();

    const { error } = await client.from("ari_chat_sessions").upsert({
      id: active.id,
      user_id: user.id,
      title,
      preview,
      status: "active",
      updated_at: stamp,
      last_message_at: stamp
    }, { onConflict: "id" });

    if (error) {
      console.warn("ARI conversation session save skipped:", error.message);
      return false;
    }

    await client
      .from("ari_conversation_turns")
      .update({ expires_at: "9999-12-31T23:59:59.999Z" })
      .eq("user_id", user.id)
      .eq("conversation_id", active.id);

    active.title = title;
    active.lastActivityAt = stamp;
    writeActive(active);
    return true;
  }

  async function archiveSession(active, { resetHome = false } = {}) {
    if (!active?.id) return;
    const { client, user } = await clientAndUser();
    if (client && user?.id) {
      await client
        .from("ari_chat_sessions")
        .update({ status: "archived", updated_at: nowIso() })
        .eq("id", active.id)
        .eq("user_id", user.id);
    }
    const latest = readActive();
    if (latest?.id === active.id) clearActive();

    if (resetHome && location.pathname.endsWith("home.html")) {
      location.replace("home.html");
    }
  }

  function scheduleArchive(active) {
    clearTimeout(archiveTimer);
    if (!active?.lastActivityAt) return;
    const remaining = Math.max(0, INACTIVITY_MS - (Date.now() - new Date(active.lastActivityAt).getTime()));
    archiveTimer = setTimeout(() => void archiveSession(readActive(), { resetHome: document.visibilityState === "visible" }), remaining + 250);
  }

  function getOrCreateActive() {
    let active = readActive();
    if (active && isStale(active)) {
      void archiveSession(active);
      active = null;
    }
    if (!active?.id) {
      active = { id: newId(), lastActivityAt: nowIso(), title: "" };
      writeActive(active);
    }
    return active;
  }

  async function reopenFromQuery() {
    const id = new URLSearchParams(location.search).get("conversation");
    if (!id) return null;
    const { client, user } = await clientAndUser();
    if (!client || !user?.id) return null;

    const { data, error } = await client
      .from("ari_chat_sessions")
      .select("id,title,last_message_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) return null;
    const active = writeActive({ id: data.id, title: data.title || "", lastActivityAt: nowIso() });
    await client.from("ari_chat_sessions").update({ status: "active", updated_at: nowIso() }).eq("id", id).eq("user_id", user.id);
    history.replaceState({}, "", "home.html");
    return active;
  }

  async function loadTurns(conversationId) {
    const { client, user } = await clientAndUser();
    if (!client || !user?.id || !conversationId) return [];
    const { data, error } = await client
      .from("ari_conversation_turns")
      .select("user_message,assistant_message,created_at")
      .eq("user_id", user.id)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(250);
    return error ? [] : (data || []);
  }

  async function restoreVisibleThread(active) {
    if (!active?.id || typeof window.addAriMessage !== "function") return;
    const turns = await loadTurns(active.id);
    if (!turns.length) return;
    const thread = document.getElementById("ariMessages");
    if (!thread || thread.children.length) return;

    window.enterAriConversationMode?.();
    turns.forEach((turn) => {
      if (clean(turn.user_message)) window.addAriMessage(turn.user_message, "user");
      if (clean(turn.assistant_message)) window.addAriMessage(turn.assistant_message, "ari");
    });
  }

  async function recentHistoryForActive() {
    const active = readActive();
    if (!active?.id) return [];
    const turns = await loadTurns(active.id);
    return turns.flatMap((turn) => [
      clean(turn.user_message) ? { role: "user", content: clean(turn.user_message) } : null,
      clean(turn.assistant_message) ? { role: "assistant", content: clean(turn.assistant_message) } : null
    ].filter(Boolean)).slice(-20);
  }

  function installCalBuddyHooks() {
    if (!window.CalBuddy) return;

    window.CalBuddy.getConversationId = () => getOrCreateActive().id;

    if (typeof window.CalBuddy.loadRecentConversationHistory === "function") {
      window.CalBuddy.loadRecentConversationHistory = recentHistoryForActive;
    }

    if (typeof window.CalBuddy.saveConversationTurn === "function" && !window.CalBuddy.__ariSessionWrapped) {
      const original = window.CalBuddy.saveConversationTurn.bind(window.CalBuddy);
      window.CalBuddy.saveConversationTurn = async (turn = {}) => {
        const active = getOrCreateActive();
        const saved = await original(turn);
        if (saved) await ensureSessionRow(active, turn);
        return saved;
      };
      window.CalBuddy.__ariSessionWrapped = true;
    }
  }

  function installMenu() {
    const container = document.querySelector(".ari-menu-content");
    if (!container) return;

    let conversations = container.querySelector(".ari-nav-conversations");
    if (!conversations) {
      conversations = document.createElement("a");
      conversations.href = "conversation-history.html";
      conversations.className = "ari-nav-link ari-nav-conversations";
      conversations.innerHTML = '<span class="ari-nav-copy"><span class="ari-nav-title">CONVERSATIONS</span><span class="ari-nav-description">RETURN TO SAVED ARI THREADS</span></span><span class="ari-nav-dot" aria-hidden="true"></span>';
    }

    const circle = container.querySelector(".nav-circle");
    const goals = container.querySelector(".nav-goals");
    const support = container.querySelector(".ari-nav-support");
    const preferences = container.querySelector(".nav-preferences");
    const account = container.querySelector(".nav-account");

    [circle, goals, conversations, support, preferences, account].filter(Boolean).forEach((node) => container.appendChild(node));
  }

  async function startNewConversation() {
    const current = readActive();
    if (current?.id) await archiveSession(current);
    clearActive();
    location.href = "home.html";
  }

  async function initialize() {
    installCalBuddyHooks();
    installMenu();

    let active = await reopenFromQuery();
    if (!active) active = readActive();

    if (active && isStale(active)) {
      await archiveSession(active);
      active = null;
    }

    if (active) {
      scheduleArchive(active);
      await restoreVisibleThread(active);
    }
  }

  window.AriConversationSessions = {
    inactivityMinutes: 15,
    maxHistory: MAX_HISTORY,
    maxPins: 5,
    readActive,
    archiveCurrent: () => archiveSession(readActive()),
    startNewConversation
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    const active = readActive();
    if (active && isStale(active)) void archiveSession(active, { resetHome: true });
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else void initialize();
})();
