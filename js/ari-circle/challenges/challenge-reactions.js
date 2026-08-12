/* =============================================================
   ARI CIRCLE — CHALLENGE SOCIAL REACTIONS
   Version: 1.0.0

   Adds supportive emoji reactions to Challenge entries without changing
   competition rules:
   - Join the Fun / Goal: social reactions only.
   - Most Hype Wins: all reactions are social, only 🔥 Hype scores.
   - Vote challenges: social reactions + one official 🏆 vote.
============================================================= */

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const REACTIONS = Object.freeze([
    { key: "love", emoji: "❤️", label: "Love" },
    { key: "laugh", emoji: "😂", label: "Funny" },
    { key: "cheer", emoji: "🙌", label: "Cheer" },
    { key: "clap", emoji: "👏", label: "Clap" },
    { key: "wow", emoji: "😮", label: "Wow" },
    { key: "hype", emoji: "🔥", label: "Hype" }
  ]);

  const state = {
    challengeId: null,
    summaries: new Map(),
    busyEntries: new Set(),
    client: null,
    observer: null,
    refreshTimer: null
  };

  const $ = (id) => document.getElementById(id);
  const clean = (value) => String(value ?? "").trim();
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function client() {
    if (state.client) return state.client;
    state.client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    return state.client;
  }

  function showToast(message) {
    const host = $("challengeToast");
    if (!host) return;
    host.textContent = message;
    host.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { host.hidden = true; }, 3000);
  }

  async function rpc(name, params = {}) {
    const c = client();
    if (!c) throw new Error("ARI Circle reactions are unavailable.");
    const { data, error } = await c.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function modeFromDialog() {
    const kicker = clean($("entriesKicker")?.textContent).toLowerCase();
    if (kicker.includes("most hype")) return "reaction";
    if (kicker.includes("vote")) return "vote";
    if (kicker.includes("goal")) return "goal";
    return "participate";
  }

  function userIdFromEntryCard(card) {
    const link = card?.querySelector('a[href*="ari-circle.html?user="]');
    if (!link) return "";
    try {
      const url = new URL(link.href, location.href);
      return clean(url.searchParams.get("user"));
    } catch {
      return "";
    }
  }

  function reactionMap(summary) {
    const raw = summary?.reaction_counts;
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try { return JSON.parse(raw); } catch { return {}; }
  }

  function totalFor(summary) {
    const direct = Number(summary?.total_reactions);
    if (Number.isFinite(direct)) return direct;
    return Object.values(reactionMap(summary)).reduce((sum, value) => sum + (Number(value) || 0), 0);
  }

  function chipsMarkup(summary) {
    const counts = reactionMap(summary);
    const active = REACTIONS
      .map((reaction) => ({ ...reaction, count: Number(counts[reaction.key]) || 0 }))
      .filter((reaction) => reaction.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    if (!active.length) {
      return '<span class="challenge-social-empty">Be the first to react</span>';
    }

    return active.map((reaction) => `
      <span class="challenge-social-chip" title="${escapeHtml(reaction.label)}">
        <span>${reaction.emoji}</span><b>${reaction.count}</b>
      </span>`).join("");
  }

  function ensurePicker() {
    let dialog = $("challengeReactionPicker");
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.id = "challengeReactionPicker";
    dialog.className = "challenge-reaction-picker";
    dialog.innerHTML = `
      <div class="challenge-reaction-picker__sheet">
        <div class="challenge-reaction-picker__handle" aria-hidden="true"></div>
        <div class="challenge-reaction-picker__head">
          <div><strong>Send some love</strong><span>Pick a reaction</span></div>
          <button type="button" data-close aria-label="Close">×</button>
        </div>
        <div class="challenge-reaction-picker__grid">
          ${REACTIONS.map((reaction) => `
            <button type="button" data-reaction-key="${reaction.key}">
              <span>${reaction.emoji}</span><small>${escapeHtml(reaction.label)}</small>
            </button>`).join("")}
        </div>
        <p class="challenge-reaction-picker__note" id="challengeReactionNote"></p>
      </div>`;

    document.body.append(dialog);
    dialog.querySelector("[data-close]")?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    dialog.querySelectorAll("[data-reaction-key]").forEach((button) => {
      button.addEventListener("click", () => {
        const entryId = clean(dialog.dataset.entryId);
        const key = clean(button.dataset.reactionKey);
        if (entryId && key) setReaction(entryId, key, dialog);
      });
    });
    return dialog;
  }

  function openPicker(entryId, mode) {
    const dialog = ensurePicker();
    dialog.dataset.entryId = entryId;
    const summary = state.summaries.get(entryId);
    const selected = clean(summary?.viewer_reaction);
    dialog.querySelectorAll("[data-reaction-key]").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.reactionKey === selected);
    });
    const note = $("challengeReactionNote");
    if (note) {
      note.textContent = mode === "reaction"
        ? "All reactions show support. Only 🔥 Hype counts toward Most Hype Wins."
        : mode === "vote"
          ? "Reactions are just for support. Your 🏆 vote is separate."
          : "Reactions are for encouragement — there is no winner attached to them.";
    }
    if (!dialog.open) dialog.showModal();
  }

  async function setReaction(entryId, key, dialog) {
    if (state.busyEntries.has(entryId)) return;
    state.busyEntries.add(entryId);
    dialog?.classList.add("is-busy");
    try {
      const selected = await rpc("ari_circle_challenge_set_reaction", {
        requested_entry_id: entryId,
        requested_reaction_key: key
      });
      if (dialog?.open) dialog.close();
      await refreshSummaries();
      const reaction = REACTIONS.find((item) => item.key === selected);
      if (selected && reaction) showToast(`${reaction.emoji} Reaction sent`);
    } catch (error) {
      console.error("Challenge reaction failed:", error);
      showToast(error.message || "Could not react right now.");
    } finally {
      state.busyEntries.delete(entryId);
      dialog?.classList.remove("is-busy");
    }
  }

  function decorateCards() {
    const host = $("challengeEntryList");
    if (!host || !state.challengeId) return;
    const mode = modeFromDialog();

    host.querySelectorAll(".challenge-entry-item").forEach((card) => {
      const userId = userIdFromEntryCard(card);
      if (!userId) return;
      const summary = [...state.summaries.values()].find((row) => clean(row.user_id) === userId);
      if (!summary) return;
      const entryId = clean(summary.entry_id);
      if (!entryId) return;
      card.dataset.entryId = entryId;

      let social = card.querySelector(".challenge-social-reactions");
      if (!social) {
        social = document.createElement("div");
        social.className = "challenge-social-reactions";
        const actions = card.querySelector(".challenge-entry-item__actions");
        if (actions) card.insertBefore(social, actions);
        else card.append(social);
      }

      const selected = clean(summary.viewer_reaction);
      const total = totalFor(summary);
      social.innerHTML = `
        <div class="challenge-social-reactions__chips">${chipsMarkup(summary)}</div>
        <button type="button" class="challenge-social-react-button ${selected ? "is-active" : ""}" data-social-react>
          <span>${selected ? (REACTIONS.find((r) => r.key === selected)?.emoji || "☺️") : "☺️"}</span>
          <b>${selected ? "Reacted" : "React"}</b>
          ${total ? `<small>${total}</small>` : ""}
        </button>`;

      social.querySelector("[data-social-react]")?.addEventListener("click", () => openPicker(entryId, mode));

      // The old Hype button is replaced by the social reaction control. In a
      // Most Hype challenge, the visible score remains so users know what wins.
      const oldHype = card.querySelector("[data-hype]");
      if (oldHype) {
        if (mode === "reaction") {
          const counts = reactionMap(summary);
          oldHype.textContent = `🔥 Hype score · ${Number(counts.hype) || 0}`;
          oldHype.disabled = true;
          oldHype.classList.add("challenge-hype-score");
        } else {
          oldHype.hidden = true;
        }
      }

      const inertEntry = [...card.querySelectorAll(".challenge-entry-item__actions button")]
        .find((button) => button.disabled && clean(button.textContent).includes("Entry"));
      if (inertEntry) inertEntry.hidden = true;
    });
  }

  async function refreshSummaries() {
    if (!state.challengeId) return;
    try {
      const rows = await rpc("ari_circle_challenge_reaction_summary", {
        requested_challenge_id: state.challengeId
      });
      state.summaries.clear();
      (Array.isArray(rows) ? rows : []).forEach((row) => {
        if (row?.entry_id) state.summaries.set(clean(row.entry_id), row);
      });
      decorateCards();
    } catch (error) {
      console.warn("Challenge reaction summary unavailable:", error);
    }
  }

  function captureChallenge(event) {
    const button = event.target.closest?.("[data-see]");
    if (!button) return;
    const card = button.closest(".challenge-card");
    const id = clean(card?.dataset.challengeId);
    if (!id) return;
    state.challengeId = id;
    state.summaries.clear();
    clearTimeout(state.refreshTimer);
    state.refreshTimer = setTimeout(refreshSummaries, 80);
  }

  function observeEntries() {
    const host = $("challengeEntryList");
    if (!host || state.observer) return;
    state.observer = new MutationObserver(() => {
      if (!state.challengeId) return;
      clearTimeout(state.refreshTimer);
      state.refreshTimer = setTimeout(refreshSummaries, 70);
    });
    state.observer.observe(host, { childList: true });
  }

  function ensureStyles() {
    if ($("challengeSocialReactionStyles")) return;
    const style = document.createElement("style");
    style.id = "challengeSocialReactionStyles";
    style.textContent = `
      .challenge-social-reactions{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-top:1px solid rgba(39,74,145,.08);background:rgba(250,252,255,.82)}
      .challenge-social-reactions__chips{display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden}
      .challenge-social-chip{display:inline-flex;align-items:center;gap:3px;padding:5px 8px;border:1px solid rgba(45,91,210,.09);border-radius:999px;background:#fff;box-shadow:0 4px 12px rgba(33,61,130,.05);font-size:.82rem;white-space:nowrap}
      .challenge-social-chip b{font-size:.7rem;color:#6f7b92}.challenge-social-empty{font-size:.73rem;color:#8b96aa}
      .challenge-social-react-button{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;min-height:38px;padding:7px 12px;border:1px solid rgba(36,88,255,.12);border-radius:999px;background:#fff;color:#26344f;font:inherit;font-weight:760}
      .challenge-social-react-button.is-active{color:#2458ff;background:#f2f6ff;border-color:rgba(36,88,255,.22)}
      .challenge-social-react-button small{display:grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#eef3ff;color:#50617f;font-size:.65rem}
      .challenge-entry-item__actions .challenge-hype-score{opacity:1!important;color:#ff6b32!important;background:#fff8f4!important;cursor:default}
      .challenge-reaction-picker{width:100%;max-width:none;height:auto;max-height:none;margin:auto 0 0;padding:0;border:0;background:transparent;overflow:visible}
      .challenge-reaction-picker::backdrop{background:rgba(7,14,28,.34);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .challenge-reaction-picker__sheet{padding:8px 16px max(20px,env(safe-area-inset-bottom));border-radius:28px 28px 0 0;background:rgba(252,253,255,.99);box-shadow:0 -24px 80px rgba(18,33,72,.18)}
      .challenge-reaction-picker__handle{width:42px;height:5px;margin:2px auto 12px;border-radius:999px;background:#d8deea}
      .challenge-reaction-picker__head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px}
      .challenge-reaction-picker__head strong{display:block;font-size:1.1rem;color:#0b1730}.challenge-reaction-picker__head span{display:block;margin-top:2px;font-size:.75rem;color:#7b879d}
      .challenge-reaction-picker__head button{width:40px;height:40px;border:1px solid rgba(39,74,145,.09);border-radius:14px;background:#fff;color:#69758b;font-size:1.3rem}
      .challenge-reaction-picker__grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px}
      .challenge-reaction-picker__grid button{display:grid;place-items:center;gap:5px;min-width:0;padding:11px 4px 9px;border:1px solid transparent;border-radius:18px;background:#f5f7fc;font:inherit}
      .challenge-reaction-picker__grid button span{font-size:1.65rem;line-height:1}.challenge-reaction-picker__grid button small{font-size:.61rem;font-weight:760;color:#66738b}
      .challenge-reaction-picker__grid button.is-selected{border-color:rgba(36,88,255,.25);background:#eef3ff;box-shadow:0 8px 24px rgba(36,88,255,.10)}
      .challenge-reaction-picker__note{margin:14px 2px 0;color:#748097;font-size:.72rem;line-height:1.45;text-align:center}
      .challenge-reaction-picker.is-busy{pointer-events:none;opacity:.72}
      @media(max-width:430px){.challenge-reaction-picker__grid{gap:4px}.challenge-reaction-picker__grid button{padding-inline:2px}.challenge-reaction-picker__grid button span{font-size:1.5rem}.challenge-social-reactions{padding-inline:12px}}
    `;
    document.head.append(style);
  }

  function init() {
    ensureStyles();
    ensurePicker();
    observeEntries();
    document.addEventListener("click", captureChallenge, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  window.AriCircleChallengeReactions = Object.freeze({ version: VERSION, refresh: refreshSummaries });
})();
