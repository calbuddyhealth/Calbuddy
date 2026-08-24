/* =============================================================
   ARI CIRCLE V5 — QUESTS
   Safe cooperative objectives with verified, capped XP.
============================================================= */
(() => {
  "use strict";

  const VERSION = "5.0.0";
  const $ = (id) => document.getElementById(id);
  const CATEGORY = Object.freeze({
    activity: ["Activity", "✦"], walking: ["Walking", "🚶"], fitness: ["Fitness", "⚡"],
    community: ["Community", "◎"], volunteer: ["Volunteer", "🤝"], wellness: ["Wellness", "◌"], other: ["Quest", "◇"]
  });
  const TIER = Object.freeze({
    new_host: "New Host", organizer: "Organizer", active_host: "Active Host",
    community_leader: "Community Leader", community_builder: "Community Builder"
  });

  const state = { client: null, user: null, rows: [], filter: "all", canCreateXp: false, busy: false, toastTimer: 0 };
  const clean = (value) => String(value ?? "").trim();
  const escapeHtml = (value) => String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");

  function getClient() { return window.calbuddySupabase || window.CalBuddy?.supabase || window.supabaseClient || null; }
  async function waitForClient(timeout = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const client = getClient();
      if (client?.auth && client?.rpc) return client;
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    throw new Error("ARI Circle could not connect right now.");
  }

  function toast(message, duration = 3600) {
    const el = $("questToast"); if (!el) return;
    clearTimeout(state.toastTimer); el.textContent = clean(message); el.hidden = false;
    state.toastTimer = setTimeout(() => { el.hidden = true; }, duration);
  }

  async function rpc(name, params = {}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  async function requireUser() {
    const { data, error } = await state.client.auth.getUser();
    if (error) throw error;
    state.user = data?.user || null;
    if (!state.user) { location.replace("signin.html"); return null; }
    return state.user;
  }

  function dateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString(undefined, { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" });
  }

  function timeLeft(value) {
    const ms = new Date(value).getTime() - Date.now();
    if (!Number.isFinite(ms) || ms <= 0) return "Ended";
    const hours = Math.ceil(ms / 3600000);
    return hours < 24 ? `${hours}h left` : `${Math.ceil(hours / 24)}d left`;
  }

  function categoryMeta(key) { return CATEGORY[key] || CATEGORY.other; }

  async function resolveXpCreatorAccess() {
    try {
      state.canCreateXp = Boolean(await rpc("ari_circle_can_create_xp_quest", { target_user_id: state.user.id }));
    } catch {
      state.canCreateXp = false;
    }
    syncXpControls();
  }

  function syncXpControls() {
    const select = $("questFormXp");
    if (!select) return;
    [...select.options].forEach((option) => {
      if (Number(option.value) > 0) option.disabled = !state.canCreateXp;
    });
    if (!state.canCreateXp && Number(select.value) > 0) select.value = "0";
    const note = $("questLeaderNote");
    if (note) note.textContent = state.canCreateXp
      ? "Your Community Leadership status can create verified XP Quests. Keep rewards conservative: 1-3 XP, always verified by another person."
      : "XP-bearing Community Quests unlock for established Community Leaders. Everyone can create a 0-XP Quest.";
  }

  async function loadQuests() {
    const status = $("questStatus");
    if (status) status.textContent = "Loading Quests…";
    try {
      const rows = await rpc("ari_circle_list_quests", { result_limit: 40 });
      state.rows = Array.isArray(rows) ? rows : [];
      renderQuests();
    } catch (error) {
      console.error("Quest loading failed:", error);
      state.rows = [];
      renderQuests();
      if (status) status.textContent = error.message || "Quests are unavailable right now.";
    }
  }

  function filteredRows() {
    return state.filter === "all" ? state.rows : state.rows.filter((row) => row.category === state.filter);
  }

  function renderQuests() {
    const list = $("questList");
    const empty = $("questEmpty");
    const status = $("questStatus");
    list.replaceChildren();
    const rows = filteredRows();
    if (!rows.length) {
      empty.hidden = false;
      status.textContent = "";
      return;
    }
    empty.hidden = true;
    status.textContent = `${rows.length} active Quest${rows.length === 1 ? "" : "s"}.`;
    rows.forEach((row) => list.append(createCard(row)));
  }

  function createCard(row) {
    const article = document.createElement("article");
    article.className = "circle-v5-quest-card";
    const [categoryLabel, icon] = categoryMeta(row.category);
    const tier = TIER[row.creator_leadership_tier] || "Member";
    const isCreator = row.creator_user_id === state.user.id;
    const status = clean(row.viewer_status);
    let action = "join";
    let label = "Join Quest";
    if (status === "joined") { action = "complete"; label = "Complete Quest"; }
    else if (status === "submitted") { action = "waiting"; label = "Awaiting Verification"; }
    else if (status === "verified") { action = "verified"; label = "Verified Complete"; }
    const reward = Number(row.xp_reward) || 0;

    article.innerHTML = `
      <div class="circle-v5-card-top">
        <a class="circle-v5-avatar" href="ari-circle.html?user=${encodeURIComponent(row.creator_user_id)}"><span>${escapeHtml(clean(row.creator_display_name).charAt(0).toUpperCase() || "A")}</span></a>
        <div class="circle-v5-card-identity"><strong>${escapeHtml(row.creator_display_name || "ARI User")}</strong><span>${escapeHtml(clean(row.creator_handle) ? `@${clean(row.creator_handle).replace(/^@+/,"")}` : "ARI Circle")} · ${escapeHtml(tier)}</span></div>
        <span class="circle-v5-host-badge">${escapeHtml(row.scope || "community")}</span>
      </div>
      <h3>${escapeHtml(icon)} ${escapeHtml(row.title)}</h3>
      ${clean(row.description) ? `<p class="circle-v5-quest-card__copy">${escapeHtml(row.description)}</p>` : ""}
      <div class="circle-v5-meta">
        <span>${escapeHtml(categoryLabel)}</span>
        <span>◷ ${escapeHtml(timeLeft(row.ends_at))}</span>
        <span>👥 ${Number(row.member_count) || 0}</span>
        <span>${escapeHtml(row.verification_mode === "self" ? "Self complete" : `${row.verification_mode} verified`)}</span>
      </div>
      <div class="circle-v5-card-actions">
        <button class="circle-v5-button-primary" data-quest-action="${action}" type="button" ${["waiting","verified"].includes(action) ? 'data-permanent-disabled="true" disabled' : ""}>${escapeHtml(label)}</button>
        ${isCreator ? '<button class="circle-v5-button" data-quest-action="review" type="button">Review</button>' : ""}
        ${reward > 0 ? `<span class="circle-v5-xp-chip">+${reward} XP</span>` : '<span class="circle-v5-xp-chip">No XP</span>'}
      </div>
      <p class="circle-v5-completion-note">${reward > 0 ? "XP is released only after another eligible person verifies completion, then daily/weekly caps apply." : "This Quest is for participation and community—not engagement farming."}</p>
    `;

    article.querySelectorAll("[data-quest-action]").forEach((button) => {
      if (button.dataset.permanentDisabled === "true") return;
      button.addEventListener("click", () => handleAction(row, button.dataset.questAction));
    });
    return article;
  }

  async function handleAction(row, action) {
    if (state.busy) return;
    state.busy = true;
    try {
      if (action === "join") {
        await rpc("ari_circle_join_quest", { requested_quest_id: row.quest_id });
        toast("Quest joined. Joining earns 0 XP.");
        await loadQuests();
      } else if (action === "complete") {
        $("questCompletionId").value = row.quest_id;
        $("questCompletionTitle").textContent = row.title || "Submit completion";
        $("questCompletionNote").value = "";
        $("questCompletionDialog")?.showModal?.();
      } else if (action === "review") {
        await openReview(row);
      }
    } catch (error) {
      console.error(`Quest ${action} failed:`, error);
      toast(error.message || "That Quest action could not be completed.", 4600);
    } finally {
      state.busy = false;
    }
  }

  function setDefaultEnd() {
    const input = $("questFormEnds");
    if (!input) return;
    const date = new Date(Date.now() + 7 * 86400000);
    input.value = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,16);
    const minDate = new Date(Date.now() + 60 * 60000);
    input.min = new Date(minDate.getTime() - minDate.getTimezoneOffset() * 60000).toISOString().slice(0,16);
  }

  function openCreate() {
    setDefaultEnd();
    syncXpControls();
    $("createQuestDialog")?.showModal?.();
  }

  async function createQuest(event) {
    event.preventDefault();
    if (state.busy) return;
    const end = new Date(clean($("questFormEnds")?.value));
    if (Number.isNaN(end.getTime())) { toast("Choose a valid Quest end time."); return; }
    let reward = Number($("questFormXp")?.value) || 0;
    const scope = clean($("questFormScope")?.value) || "community";
    if (!state.canCreateXp || scope === "personal") reward = 0;
    state.busy = true;
    try {
      await rpc("ari_circle_create_quest", {
        requested_title: clean($("questFormTitle")?.value),
        requested_description: clean($("questFormDescription")?.value) || null,
        requested_scope: scope,
        requested_category: clean($("questFormCategory")?.value) || "activity",
        requested_verification_mode: reward > 0 ? clean($("questFormVerification")?.value) || "organizer" : clean($("questFormVerification")?.value) || "self",
        requested_xp_reward: reward,
        requested_ends_at: end.toISOString(),
        requested_max_participants: null
      });
      $("createQuestDialog")?.close();
      $("createQuestForm")?.reset();
      setDefaultEnd();
      syncXpControls();
      toast(reward > 0 ? `Quest published with ${reward} verified XP.` : "Quest published. Creating it earns 0 XP.");
      await loadQuests();
    } catch (error) {
      console.error("Quest creation failed:", error);
      toast(error.message || "Could not create the Quest.", 4600);
    } finally {
      state.busy = false;
    }
  }

  async function submitCompletion(event) {
    event.preventDefault();
    const questId = clean($("questCompletionId")?.value);
    if (!questId || state.busy) return;
    state.busy = true;
    try {
      const result = await rpc("ari_circle_submit_quest_completion", {
        requested_quest_id: questId,
        requested_note: clean($("questCompletionNote")?.value) || null
      });
      $("questCompletionDialog")?.close();
      toast(result?.needs_verification ? "Completion submitted for verification." : "Quest complete.");
      await loadQuests();
    } catch (error) {
      console.error("Quest completion failed:", error);
      toast(error.message || "Could not submit completion.", 4600);
    } finally {
      state.busy = false;
    }
  }

  async function openReview(row) {
    const list = $("questReviewList");
    list.innerHTML = '<div class="circle-v5-empty"><span>Loading submissions…</span></div>';
    $("questReviewDialog")?.showModal?.();
    try {
      const rows = await rpc("ari_circle_quest_submissions", { requested_quest_id: row.quest_id });
      renderReview(row, Array.isArray(rows) ? rows : []);
    } catch (error) {
      list.innerHTML = `<div class="circle-v5-empty"><strong>Review unavailable.</strong><span>${escapeHtml(error.message || "Try again later.")}</span></div>`;
    }
  }

  function renderReview(quest, rows) {
    const list = $("questReviewList");
    list.replaceChildren();
    if (!rows.length) {
      list.innerHTML = '<div class="circle-v5-empty"><strong>No submitted completions.</strong><span>When participants submit, they will appear here.</span></div>';
      return;
    }
    rows.forEach((row) => {
      const item = document.createElement("article");
      item.className = "circle-v5-activity-row";
      const own = row.user_id === state.user.id;
      const verified = row.member_status === "verified";
      item.innerHTML = `
        <span class="circle-v5-activity-icon">${verified ? "✓" : "?"}</span>
        <span class="circle-v5-activity-row__copy"><strong>${escapeHtml(row.display_name || "ARI User")}</strong><small>${escapeHtml(row.proof_note || (verified ? "Verified completion" : "Completion submitted"))}</small></span>
        ${verified ? '<span class="circle-v5-activity-xp">Verified</span>' : own ? '<span class="circle-v5-activity-xp">Needs another verifier</span>' : `<button class="circle-v5-button" type="button" data-verify-user="${escapeHtml(row.user_id)}">Verify</button>`}
      `;
      item.querySelector("[data-verify-user]")?.addEventListener("click", async (event) => {
        const button = event.currentTarget;
        button.disabled = true;
        try {
          const result = await rpc("ari_circle_verify_quest_completion", { requested_quest_id: quest.quest_id, target_user_id: row.user_id });
          toast(`Completion verified${Number(result?.xp_awarded) ? ` · +${Number(result.xp_awarded)} XP` : ""}.`);
          await openReview(quest);
          await loadQuests();
        } catch (error) {
          toast(error.message || "Could not verify completion.", 4600);
          button.disabled = false;
        }
      });
      list.append(item);
    });
  }

  function bind() {
    $("createQuestButton")?.addEventListener("click", openCreate);
    $("createQuestForm")?.addEventListener("submit", createQuest);
    $("questCompletionForm")?.addEventListener("submit", submitCompletion);
    $("refreshQuests")?.addEventListener("click", loadQuests);
    document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => $(button.dataset.close)?.close()));
    $("questFilters")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-quest-filter]");
      if (!button) return;
      state.filter = button.dataset.questFilter || "all";
      document.querySelectorAll("[data-quest-filter]").forEach((node) => node.classList.toggle("is-active", node === button));
      renderQuests();
    });
    $("questFormScope")?.addEventListener("change", () => {
      if ($("questFormScope").value === "personal") $("questFormXp").value = "0";
      syncXpControls();
    });
  }

  async function init() {
    try {
      state.client = await waitForClient();
      if (!await requireUser()) return;
      bind();
      setDefaultEnd();
      $("questPage").hidden = false;
      await Promise.all([resolveXpCreatorAccess(), loadQuests()]);
      window.AriCircleV5RealWorld?.refresh?.();
    } catch (error) {
      console.error("Quest initialization failed:", error);
      $("questPage").hidden = false;
      $("questStatus").textContent = error.message || "Quests could not open.";
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once:true });
  else init();

  window.AriCircleQuestsV5 = Object.freeze({ version: VERSION, refresh: loadQuests });
})();
