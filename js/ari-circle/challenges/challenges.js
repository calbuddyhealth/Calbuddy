/* ARI CIRCLE — CHALLENGES v1.0.0 */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const $ = (id) => document.getElementById(id);

  const FLAIR = Object.freeze({
    challenge_creator: {
      title: "Challenge Maker",
      copy: "Created a challenge for the Circle.",
      asset: "assets/ari-circle/rewards/challenge-maker.svg"
    },
    challenge_joiner: {
      title: "Game On",
      copy: "Joined an ARI Circle challenge.",
      asset: "assets/ari-circle/rewards/game-on.svg"
    },
    challenge_finisher: {
      title: "Challenge Complete",
      copy: "Finished an ARI Circle challenge.",
      asset: "assets/ari-circle/rewards/challenge-complete.svg"
    }
  });

  const METRIC_LABELS = Object.freeze({
    workouts: "Workouts",
    training_days: "Training days",
    miles: "Miles",
    minutes: "Minutes",
    custom: "Custom"
  });

  const state = {
    client: null,
    user: null,
    age: null,
    challenges: [],
    rewards: [],
    activeChallenge: null,
    busy: false,
    toastTimer: null
  };

  function clean(value) {
    return String(value ?? "").trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showToast(message, duration = 3200) {
    const toast = $("challengeToast");
    if (!toast) return;
    window.clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    state.toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, duration);
  }

  function openDialog(id) {
    const dialog = $(id);
    if (dialog && typeof dialog.showModal === "function" && !dialog.open) {
      dialog.showModal();
    }
  }

  function closeDialog(id) {
    const dialog = $(id);
    if (dialog?.open) dialog.close();
  }

  async function rpc(name, params = {}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  async function requireUser() {
    const { data, error } = await state.client.auth.getUser();
    if (error) throw error;
    const user = data?.user || null;
    if (!user) {
      window.location.replace("signin.html");
      return null;
    }
    state.user = user;
    return user;
  }

  async function loadAge() {
    state.age = await rpc("ari_circle_my_age_state");
    return state.age;
  }

  async function verifyAge(event) {
    event.preventDefault();
    const value = clean($("ageDateInput").value);
    if (!value) return showToast("Enter your date of birth to continue.");

    state.busy = true;
    try {
      state.age = await rpc("ari_circle_verify_my_age", {
        requested_date_of_birth: value
      });
      closeDialog("ageDialog");
      showToast("Age verified. Your birthday stays private.");
      await refreshAll();
    } catch (error) {
      console.error("Challenge age verification failed:", error);
      showToast(error.message || "Could not verify age.", 4500);
    } finally {
      state.busy = false;
    }
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function daysLeft(value) {
    const end = new Date(value).getTime();
    if (!Number.isFinite(end)) return 0;
    return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
  }

  function initialFor(name) {
    const value = clean(name);
    return value ? value.charAt(0).toUpperCase() : "A";
  }

  async function loadRewards() {
    try {
      const data = await rpc("ari_circle_my_feed_rewards");
      state.rewards = Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn("Challenge flair unavailable:", error);
      state.rewards = [];
    }
    renderFlair();
  }

  function renderFlair() {
    const host = $("challengeFlairGrid");
    const unlocked = new Set(state.rewards.map((item) => item.reward_key));
    host.replaceChildren();

    Object.entries(FLAIR).forEach(([key, meta]) => {
      const card = document.createElement("article");
      card.className = "challenge-flair-card";
      if (!unlocked.has(key)) card.classList.add("is-locked");
      card.innerHTML = `
        <img src="${escapeHtml(meta.asset)}" alt="" />
        <strong>${escapeHtml(meta.title)}</strong>
        <small>${escapeHtml(unlocked.has(key) ? meta.copy : `Locked · ${meta.copy}`)}</small>
      `;
      host.append(card);
    });
  }

  async function loadChallenges() {
    const status = $("challengeStatus");
    status.textContent = "Loading challenges…";

    try {
      const data = await rpc("ari_circle_challenge_list", { result_limit: 40 });
      state.challenges = Array.isArray(data) ? data : [];
      renderChallenges();
    } catch (error) {
      console.error("Challenge loading failed:", error);
      state.challenges = [];
      renderChallenges();
      status.textContent = error.message || "Challenges unavailable right now.";
    }
  }

  function renderChallenges() {
    const host = $("challengeList");
    const empty = $("challengeEmpty");
    const status = $("challengeStatus");
    host.replaceChildren();

    if (!state.challenges.length) {
      empty.hidden = false;
      status.textContent = "No active challenges in your Circle yet.";
      return;
    }

    empty.hidden = true;
    status.textContent = `${state.challenges.length} active ${state.challenges.length === 1 ? "challenge" : "challenges"}`;
    state.challenges.forEach((challenge) => host.append(createChallengeCard(challenge)));
  }

  function createChallengeCard(challenge) {
    const card = document.createElement("article");
    card.className = "challenge-card";

    const handle = clean(challenge.creator_handle)
      ? `@${clean(challenge.creator_handle).replace(/^@+/, "")}`
      : "ARI Circle";
    const avatar = clean(challenge.creator_avatar_url)
      ? `<img src="${escapeHtml(challenge.creator_avatar_url)}" alt="" />`
      : `<span>${escapeHtml(initialFor(challenge.creator_display_name))}</span>`;
    const progress = Number(challenge.viewer_progress) || 0;
    const goal = Number(challenge.goal_value) || 1;
    const percent = Math.max(0, Math.min(100, (progress / goal) * 100));
    const joined = Boolean(challenge.viewer_joined);
    const complete = Boolean(challenge.viewer_completed_at) || progress >= goal;

    card.innerHTML = `
      <div class="challenge-card__top">
        <a class="challenge-avatar" href="ari-circle.html?user=${encodeURIComponent(challenge.creator_user_id)}">${avatar}</a>
        <a class="challenge-card__identity" href="ari-circle.html?user=${encodeURIComponent(challenge.creator_user_id)}">
          <strong>${escapeHtml(challenge.creator_display_name || "ARI User")}</strong>
          <span>${escapeHtml(handle)} · ${escapeHtml(formatDate(challenge.ends_at))} end</span>
        </a>
        <span class="challenge-badge">${escapeHtml(METRIC_LABELS[challenge.metric] || "Challenge")}</span>
      </div>
      <div class="challenge-card__body">
        <h3>${escapeHtml(challenge.title || "Challenge")}</h3>
        ${challenge.description ? `<p>${escapeHtml(challenge.description)}</p>` : ""}
        <div class="challenge-meta">
          <span>Goal · ${escapeHtml(String(goal))} ${escapeHtml(challenge.unit_label)}</span>
          <span>${Number(challenge.member_count) || 0} joined</span>
          <span>${daysLeft(challenge.ends_at)}d left</span>
        </div>
        ${joined ? `
          <div class="challenge-progress">
            <div class="challenge-progress__line">
              <span>${complete ? "Complete" : "Your progress"}</span>
              <span>${escapeHtml(String(progress))} / ${escapeHtml(String(goal))} ${escapeHtml(challenge.unit_label)}</span>
            </div>
            <div class="challenge-progress__track"><div class="challenge-progress__fill" style="width:${percent}%"></div></div>
          </div>
        ` : ""}
      </div>
      <div class="challenge-card__actions">
        <button type="button" data-board>Leaderboard</button>
        <button type="button" class="is-primary" data-action>${complete ? "Completed ✓" : joined ? "Add progress" : "Join challenge"}</button>
      </div>
    `;

    card.querySelector("[data-board]")?.addEventListener("click", () => openLeaderboard(challenge));
    card.querySelector("[data-action]")?.addEventListener("click", () => {
      if (complete) return showToast("You already completed this challenge.");
      if (joined) return openProgress(challenge);
      joinChallenge(challenge);
    });

    return card;
  }

  function openCreate() {
    if (!state.age?.verified) return openDialog("ageDialog");
    openDialog("createChallengeDialog");
  }

  function syncMetricUnit() {
    const metric = clean($("challengeMetric").value);
    const defaults = {
      workouts: "workouts",
      training_days: "days",
      miles: "miles",
      minutes: "minutes",
      custom: "points"
    };
    $("challengeUnit").value = defaults[metric] || "points";
  }

  async function createChallenge(event) {
    event.preventDefault();
    if (state.busy) return;

    const payload = {
      requested_title: clean($("challengeName").value),
      requested_description: clean($("challengeDescription").value) || null,
      requested_metric: clean($("challengeMetric").value),
      requested_goal_value: Number($("challengeGoal").value),
      requested_unit_label: clean($("challengeUnit").value),
      requested_days: Number($("challengeDays").value)
    };

    state.busy = true;
    try {
      await rpc("ari_circle_challenge_create", payload);
      closeDialog("createChallengeDialog");
      $("createChallengeForm").reset();
      $("challengeGoal").value = "7";
      $("challengeDays").value = "14";
      $("challengeMetric").value = "workouts";
      syncMetricUnit();
      showToast("Challenge launched.");
      await refreshAll();
    } catch (error) {
      console.error("Challenge creation failed:", error);
      showToast(error.message || "Could not create challenge.", 4500);
    } finally {
      state.busy = false;
    }
  }

  async function joinChallenge(challenge) {
    if (state.busy) return;
    state.busy = true;
    try {
      await rpc("ari_circle_challenge_join", { requested_challenge_id: challenge.challenge_id });
      showToast("You’re in. Game on.");
      await refreshAll();
    } catch (error) {
      console.error("Challenge join failed:", error);
      showToast(error.message || "Could not join challenge.", 4500);
    } finally {
      state.busy = false;
    }
  }

  function openProgress(challenge) {
    state.activeChallenge = challenge;
    $("progressChallengeTitle").textContent = challenge.title || "Add progress";
    $("progressChallengeCopy").textContent = `You’re at ${Number(challenge.viewer_progress) || 0} of ${Number(challenge.goal_value) || 0} ${challenge.unit_label}.`;
    $("progressAmountLabel").textContent = `Add ${challenge.unit_label}`;
    $("progressAmount").value = "1";
    openDialog("progressDialog");
  }

  async function addProgress(event) {
    event.preventDefault();
    const challenge = state.activeChallenge;
    if (!challenge || state.busy) return;

    const amount = Number($("progressAmount").value);
    state.busy = true;
    try {
      const result = await rpc("ari_circle_challenge_add_progress", {
        requested_challenge_id: challenge.challenge_id,
        requested_amount: amount
      });
      closeDialog("progressDialog");
      state.activeChallenge = null;
      showToast(result?.completed_now ? "Challenge complete. Flair unlocked ✦" : "Progress added.");
      await refreshAll();
    } catch (error) {
      console.error("Challenge progress failed:", error);
      showToast(error.message || "Could not add progress.", 4500);
    } finally {
      state.busy = false;
    }
  }

  async function openLeaderboard(challenge) {
    $("leaderboardTitle").textContent = challenge.title || "Challenge board";
    $("leaderboardList").innerHTML = `<p class="challenge-status">Loading leaderboard…</p>`;
    openDialog("leaderboardDialog");

    try {
      const data = await rpc("ari_circle_challenge_leaderboard", {
        requested_challenge_id: challenge.challenge_id,
        result_limit: 30
      });
      renderLeaderboard(Array.isArray(data) ? data : [], challenge);
    } catch (error) {
      console.error("Challenge leaderboard failed:", error);
      $("leaderboardList").innerHTML = `<p class="challenge-status">${escapeHtml(error.message || "Leaderboard unavailable.")}</p>`;
    }
  }

  function renderLeaderboard(rows, challenge) {
    const host = $("leaderboardList");
    host.replaceChildren();

    if (!rows.length) {
      host.innerHTML = `<p class="challenge-status">Nobody has joined yet.</p>`;
      return;
    }

    rows.forEach((row) => {
      const item = document.createElement("article");
      item.className = "challenge-rank";
      const avatar = clean(row.avatar_url)
        ? `<img src="${escapeHtml(row.avatar_url)}" alt="" />`
        : `<span>${escapeHtml(initialFor(row.display_name))}</span>`;
      const handle = clean(row.handle) ? `@${clean(row.handle).replace(/^@+/, "")}` : "ARI Circle";
      item.innerHTML = `
        <div class="challenge-rank__number">${escapeHtml(String(row.rank_number || ""))}</div>
        <a class="challenge-avatar" href="ari-circle.html?user=${encodeURIComponent(row.user_id)}">${avatar}</a>
        <a class="challenge-rank__name" href="ari-circle.html?user=${encodeURIComponent(row.user_id)}">
          <strong>${escapeHtml(row.display_name || "ARI User")}</strong>
          <span>${escapeHtml(handle)}</span>
        </a>
        <div class="challenge-rank__score">${escapeHtml(String(Number(row.progress) || 0))}<br>${escapeHtml(challenge.unit_label)}</div>
      `;
      host.append(item);
    });
  }

  async function refreshAll() {
    if (!state.age?.verified) return;
    await Promise.all([loadChallenges(), loadRewards()]);
  }

  function bindUi() {
    [$("openCreateChallenge"), $("emptyCreateChallenge")]
      .filter(Boolean)
      .forEach((button) => button.addEventListener("click", openCreate));

    $("refreshChallenges")?.addEventListener("click", loadChallenges);
    $("createChallengeForm")?.addEventListener("submit", createChallenge);
    $("progressForm")?.addEventListener("submit", addProgress);
    $("ageForm")?.addEventListener("submit", verifyAge);
    $("challengeMetric")?.addEventListener("change", syncMetricUnit);

    document.addEventListener("click", (event) => {
      const close = event.target.closest("[data-close-dialog]");
      if (close) closeDialog(close.dataset.closeDialog);
    });
  }

  async function init() {
    try {
      state.client = window.calbuddySupabase || window.supabaseClient || null;
      if (!state.client) throw new Error("Supabase is unavailable.");

      const user = await requireUser();
      if (!user) return;

      bindUi();
      syncMetricUnit();
      await loadAge();

      $("challengePage").hidden = false;
      $("challengeLoading").hidden = true;

      if (!state.age?.verified) {
        $("challengeStatus").textContent = "Verify your age to open Challenges.";
        renderFlair();
        openDialog("ageDialog");
        return;
      }

      await refreshAll();
    } catch (error) {
      console.error("ARI Circle Challenges failed to start:", error);
      $("challengeLoading").innerHTML = `
        <strong>Challenges couldn’t open.</strong>
        <span>${escapeHtml(error.message || "Please try again.")}</span>
        <a class="challenge-secondary" href="ari-circle.html">Back to ARI Circle</a>
      `;
    }
  }

  window.AriCircleChallenges = Object.freeze({ version: VERSION, refresh: refreshAll });
  document.addEventListener("DOMContentLoaded", init);
})();