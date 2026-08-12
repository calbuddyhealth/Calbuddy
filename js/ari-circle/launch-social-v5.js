/* =============================================================
   ARI CIRCLE — LAUNCH SOCIAL V5
   Version: 5.0.0

   Launch model:
   - Feed/Moments = friends + self.
   - Buddies = discovery + direct messaging.
   - Challenges = participation/discovery surface.
   - Profile = identity + simple relationship/safety controls.
   - Mute and Block are intentionally separate actions.
   - Mobile form fields remain >=16px to prevent iOS Safari focus zoom.
============================================================= */
(() => {
  "use strict";

  const VERSION = "5.0.0";
  const STYLE_ID = "ari-circle-launch-social-v5-style";
  const $ = (id) => document.getElementById(id);
  const clean = (v) => String(v ?? "").trim();
  const state = { client:null, targetUserId:null, muted:false, started:false };

  function client() {
    if (state.client) return state.client;
    state.client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
    return state.client;
  }

  async function rpc(name, params={}) {
    const c = client();
    if (!c) throw new Error("ARI Circle data is unavailable.");
    const { data, error } = await c.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function toast(message) {
    let host = $("circleLaunchSocialToast") || $("feedToast") || $("challengeToast") || $("messagesToast");
    if (!host) {
      host = document.createElement("div");
      host.id = "circleLaunchSocialToast";
      host.className = "circle-launch-social-toast";
      host.setAttribute("role","status");
      host.setAttribute("aria-live","polite");
      document.body.append(host);
    }
    host.textContent = message;
    host.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { host.hidden = true; }, 3000);
  }

  function ensureStyle() {
    if ($(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @media (max-width: 900px) {
        body input:not([type="range"]):not([type="checkbox"]):not([type="radio"]),
        body textarea,
        body select {
          font-size: 16px !important;
        }
      }

      .circle-profile__body { position: relative; }
      .circle-launch-user-menu {
        position: absolute;
        top: 14px;
        right: 14px;
        z-index: 8;
        width: 40px;
        height: 40px;
        display: grid;
        place-items: center;
        border: 1px solid rgba(38,74,165,.10);
        border-radius: 14px;
        color: #203358;
        background: rgba(255,255,255,.88);
        box-shadow: 0 10px 28px rgba(34,62,130,.08);
        -webkit-backdrop-filter: blur(14px);
        backdrop-filter: blur(14px);
        font: 800 1rem/1 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      }

      .circle-launch-safety-dialog {
        width: min(calc(100vw - 24px), 420px);
        padding: 0;
        border: 0;
        border-radius: 26px;
        background: transparent;
      }
      .circle-launch-safety-dialog::backdrop {
        background: rgba(8,14,29,.32);
        -webkit-backdrop-filter: blur(7px);
        backdrop-filter: blur(7px);
      }
      .circle-launch-safety-card {
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.9);
        border-radius: 26px;
        background: #fbfcff;
        box-shadow: 0 30px 90px rgba(20,37,85,.22);
      }
      .circle-launch-safety-head { padding: 20px 20px 13px; }
      .circle-launch-safety-head strong { display:block; color:#101c35; font-size:1.04rem; }
      .circle-launch-safety-head span { display:block; margin-top:4px; color:#7c8799; font-size:.76rem; }
      .circle-launch-safety-action {
        width: 100%; min-height: 54px; padding: 0 20px;
        display:flex; align-items:center; justify-content:space-between;
        border:0; border-top:1px solid rgba(34,70,150,.08);
        color:#1d3158; background:#fff; font:700 .88rem/1 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
        text-align:left;
      }
      .circle-launch-safety-action small { color:#8c96a8; font-weight:600; }
      .circle-launch-safety-action.is-danger { color:#d83452; }
      .circle-launch-safety-cancel { color:#4666a8; justify-content:center; }

      .circle-launch-social-toast {
        position: fixed; z-index: 99999; left: 50%; bottom: calc(28px + env(safe-area-inset-bottom));
        transform: translateX(-50%); max-width: min(90vw,420px); padding: 11px 16px;
        border-radius: 999px; color:#fff; background:rgba(12,24,50,.92);
        box-shadow:0 18px 46px rgba(12,24,50,.22); font:700 .78rem/1.25 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      }

      /* Challenges are ARI Circle's discovery/participation surface. Entries
         become a swipe-friendly full-screen viewer instead of a cramped card. */
      #entriesDialog.challenge-entries-dialog[open] {
        width: 100vw !important; max-width:none !important; height:100dvh !important;
        max-height:100dvh !important; margin:0 !important; padding:0 !important;
        border:0 !important; border-radius:0 !important; background:#f8faff !important;
      }
      #entriesDialog .challenge-entries-card {
        width:100% !important; max-width:none !important; min-height:100dvh !important;
        max-height:100dvh !important; border-radius:0 !important; padding-top:calc(18px + env(safe-area-inset-top)) !important;
        overflow:hidden !important; box-shadow:none !important;
      }
      #entriesDialog .challenge-close {
        position:fixed !important; z-index:40 !important; top:calc(12px + env(safe-area-inset-top)) !important; right:14px !important;
        width:44px !important; height:44px !important; border-radius:50% !important;
        background:rgba(255,255,255,.92) !important; box-shadow:0 10px 30px rgba(20,38,80,.14) !important;
        -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px);
      }
      #challengeEntryList {
        max-height:calc(100dvh - 145px) !important; overflow-y:auto !important;
        overscroll-behavior-y:contain; scroll-snap-type:y mandatory; padding-bottom:calc(24px + env(safe-area-inset-bottom));
        -webkit-overflow-scrolling:touch;
      }
      #challengeEntryList > * { scroll-snap-align:start; scroll-snap-stop:normal; }
      #entriesDialog .challenge-entry-status::after {
        content:"  ·  Swipe through entries"; color:#8b96aa; font-weight:600;
      }
    `;
    document.head.append(style);
  }

  function blurActiveField() {
    const active = document.activeElement;
    if (active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)) active.blur();
  }

  function bindFocusRecovery() {
    document.addEventListener("close", blurActiveField, true);
    document.addEventListener("click", (event) => {
      if (event.target.closest?.("[data-close-dialog], .feed-close, .challenge-close, .buddy-inline-close")) {
        setTimeout(blurActiveField, 0);
      }
    }, true);
    window.addEventListener("pageshow", () => setTimeout(blurActiveField, 0));
  }

  function privacyCopy() {
    const line = document.querySelector(".feed-composer__privacy");
    if (line) line.textContent = "Friends only · kept inside your verified age space.";
    const stream = $("streamTitle");
    if (stream && document.querySelector(".feed-page")) stream.textContent = "Your Feed";
  }

  function targetFromRoute() {
    if (!document.body.classList.contains("ari-circle-page")) return null;
    const params = new URLSearchParams(location.search);
    return clean(params.get("user")) || null;
  }

  function safetyDialog() {
    let dialog = $("circleLaunchProfileSafety");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "circleLaunchProfileSafety";
    dialog.className = "circle-launch-safety-dialog";
    dialog.innerHTML = `
      <div class="circle-launch-safety-card">
        <div class="circle-launch-safety-head"><strong>Profile options</strong><span>Control what you see and who can reach you.</span></div>
        <button class="circle-launch-safety-action" id="circleLaunchMute" type="button"><span>Mute</span><small>Hide their Feed + Moments</small></button>
        <button class="circle-launch-safety-action is-danger" id="circleLaunchBlock" type="button"><span>Block</span><small>Stop interaction</small></button>
        <button class="circle-launch-safety-action" id="circleLaunchReport" type="button"><span>Report</span><small>Safety</small></button>
        <button class="circle-launch-safety-action circle-launch-safety-cancel" type="button" id="circleLaunchSafetyCancel">Cancel</button>
      </div>`;
    document.body.append(dialog);
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
    $("circleLaunchSafetyCancel")?.addEventListener("click", () => dialog.close());
    $("circleLaunchMute")?.addEventListener("click", toggleMute);
    $("circleLaunchBlock")?.addEventListener("click", blockUser);
    $("circleLaunchReport")?.addEventListener("click", () => {
      const id = state.targetUserId;
      dialog.close();
      location.href = `help-safety.html?target_type=profile&reported_user_id=${encodeURIComponent(id || "")}`;
    });
    return dialog;
  }

  async function openProfileSafety() {
    state.targetUserId = targetFromRoute();
    if (!state.targetUserId) return;
    const dialog = safetyDialog();
    const mute = $("circleLaunchMute");
    if (mute) mute.disabled = true;
    try {
      const value = await rpc("ari_circle_mute_state", { target_user_id: state.targetUserId });
      state.muted = Boolean(value);
    } catch { state.muted = false; }
    if (mute) {
      mute.disabled = false;
      mute.querySelector("span").textContent = state.muted ? "Unmute" : "Mute";
      mute.querySelector("small").textContent = state.muted ? "Show their Feed + Moments" : "Hide their Feed + Moments";
    }
    if (!dialog.open) dialog.showModal();
  }

  async function toggleMute() {
    const id = state.targetUserId;
    if (!id) return;
    const next = !state.muted;
    try {
      await rpc("ari_circle_set_mute", { target_user_id:id, should_mute:next });
      state.muted = next;
      $("circleLaunchProfileSafety")?.close?.();
      toast(next ? "Muted. Their Feed posts and Moments are hidden." : "Unmuted.");
    } catch (error) { toast(error.message || "Could not update mute."); }
  }

  async function blockUser() {
    const id = state.targetUserId;
    if (!id) return;
    const ok = window.confirm("Block this person? They will no longer be able to interact with you in ARI Circle.");
    if (!ok) return;
    try {
      await rpc("ari_circle_block_user", { target_user_id:id });
      $("circleLaunchProfileSafety")?.close?.();
      toast("Blocked.");
      setTimeout(() => location.replace("ari-circle-feed.html"), 450);
    } catch (error) { toast(error.message || "Could not block this profile."); }
  }

  function ensureVisitorProfileMenu() {
    const target = targetFromRoute();
    if (!target) return;
    state.targetUserId = target;
    const body = document.querySelector(".circle-profile__body");
    if (!body || $("circleLaunchUserMenu")) return;
    const button = document.createElement("button");
    button.id = "circleLaunchUserMenu";
    button.className = "circle-launch-user-menu";
    button.type = "button";
    button.setAttribute("aria-label","Mute, block or report this profile");
    button.textContent = "•••";
    button.addEventListener("click", openProfileSafety);
    body.append(button);
  }

  function simplifyChallengeLanguage() {
    const title = $("challengeStreamTitle");
    if (title) title.textContent = "Happening now";
    const copy = $("challengeStreamCopy");
    if (copy) copy.textContent = "Jump into what people are doing right now.";
  }

  function run() {
    ensureStyle();
    privacyCopy();
    ensureVisitorProfileMenu();
    simplifyChallengeLanguage();
  }

  function start() {
    if (state.started) return;
    state.started = true;
    client();
    ensureStyle();
    bindFocusRecovery();
    run();
    const observer = new MutationObserver(() => run());
    observer.observe(document.documentElement, { childList:true, subtree:true });
    document.addEventListener("circle:app-ready", run);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();

  window.AriCircleLaunchSocialV5 = Object.freeze({ version:VERSION, refresh:run });
})();
