/* =============================================================
   ARI CIRCLE — BUDDIES SOCIAL DISCOVERY
   Version: 1.2.0

   V1.2:
   - Friends and Requests open inside Buddies instead of routing to Profile.
   - Friend rows include Message without an extra profile detour.
   - Keeps search, discovery, Add Friend, and activity Buddies together.
============================================================= */

(() => {
  "use strict";

  const VERSION = "1.2.0";
  const DISCOVERY_LIMIT = 8;
  const state = { client:null, user:null, people:[], query:"", loading:false, started:false };
  const $ = (id) => document.getElementById(id);
  const clean = (v) => String(v ?? "").trim();
  const escapeHtml = (v) => String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const initial = (name) => clean(name)?.charAt(0).toUpperCase() || "A";
  const profileUrl = (id) => `ari-circle.html?user=${encodeURIComponent(id)}`;
  const messageUrl = (id) => `ari-circle-messages.html?user=${encodeURIComponent(id)}`;
  const validImageUrl = (v) => /^(https?:|blob:)/i.test(clean(v)) ? clean(v) : "";

  function setStatus(message) { if ($("buddySocialStatus")) $("buddySocialStatus").textContent = message; }

  async function rpc(name, params={}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  async function requireUser() {
    const { data, error } = await state.client.auth.getUser();
    if (error) throw error;
    state.user = data?.user || null;
    return state.user;
  }

  function ensureStyle() {
    if ($("buddy-inline-style")) return;
    const style = document.createElement("style");
    style.id = "buddy-inline-style";
    style.textContent = `
      .buddy-inline-dialog{width:min(calc(100vw - 24px),560px);max-height:82dvh;padding:0;border:0;border-radius:26px;background:transparent}
      .buddy-inline-dialog::backdrop{background:rgba(8,14,29,.30);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .buddy-inline-panel{max-height:82dvh;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,.95);border-radius:26px;background:#fbfcff;box-shadow:0 28px 90px rgba(18,33,72,.18)}
      .buddy-inline-head{display:flex;align-items:center;justify-content:space-between;padding:18px;border-bottom:1px solid rgba(35,75,160,.09)}
      .buddy-inline-head h2{margin:0;color:#0b1730;font-size:1.2rem}.buddy-inline-head p{margin:3px 0 0;color:#7c879a;font-size:.7rem}
      .buddy-inline-close{width:40px;height:40px;border:1px solid rgba(35,75,160,.10);border-radius:14px;background:#fff;font-size:1.35rem}
      .buddy-inline-list{min-height:140px;overflow-y:auto;padding:6px 16px 18px}
      .buddy-inline-row{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:11px;align-items:center;padding:12px 0;border-bottom:1px solid rgba(35,75,160,.075)}
      .buddy-inline-avatar{width:52px;height:52px;display:grid;place-items:center;overflow:hidden;border-radius:50%;color:#2458ff;background:#edf3ff;text-decoration:none;font-weight:800}.buddy-inline-avatar img{width:100%;height:100%;object-fit:cover}
      .buddy-inline-id{min-width:0;color:inherit;text-decoration:none}.buddy-inline-id strong,.buddy-inline-id span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.buddy-inline-id strong{font-size:.86rem}.buddy-inline-id span{margin-top:3px;color:#7c879a;font-size:.7rem}
      .buddy-inline-actions{display:flex;gap:6px}.buddy-inline-actions a,.buddy-inline-actions button{min-height:38px;padding:0 12px;border:1px solid rgba(36,88,255,.13);border-radius:13px;color:#2458ff;background:#f4f7ff;text-decoration:none;display:inline-flex;align-items:center;font:inherit;font-size:.68rem;font-weight:800}.buddy-inline-actions button.is-accept{color:#fff;background:linear-gradient(135deg,#2458ff,#8255ff);border:0}
      .buddy-inline-empty{padding:42px 12px;color:#7c879a;text-align:center}
      @media(max-width:520px){.buddy-inline-dialog{width:100%;max-height:84dvh;margin:auto 0 0;border-radius:0}.buddy-inline-panel{max-height:84dvh;border-radius:28px 28px 0 0}.buddy-inline-row{grid-template-columns:48px minmax(0,1fr) auto}.buddy-inline-avatar{width:48px;height:48px}}
    `;
    document.head.append(style);
  }

  function buildShell() {
    if ($("buddySocial")) return;
    const page = $("partnerPage");
    const tabs = page?.querySelector(".partner-tabs");
    if (!page || !tabs) return;

    const section = document.createElement("section");
    section.id = "buddySocial";
    section.className = "buddy-social";
    section.setAttribute("aria-labelledby","buddySocialTitle");
    section.innerHTML = `
      <form id="buddySocialSearch" class="buddy-social__search" role="search">
        <label class="sr-only" for="buddySocialInput">Search people by name or handle</label>
        <input id="buddySocialInput" type="search" maxlength="80" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Search people by name or @handle" />
        <button type="submit">Search</button>
      </form>
      <div class="buddy-social__quick" aria-label="Friend shortcuts">
        <button type="button" id="buddyFriendsButton"><strong>See Friends</strong><span id="buddyFriendCount">—</span></button>
        <button type="button" id="buddyRequestsButton"><strong>Requests</strong><span id="buddyRequestCount">—</span></button>
      </div>
      <div class="buddy-social__heading"><div><h2 id="buddySocialTitle">People to Discover</h2><p>Meet people in your ARI Circle social space.</p></div><button id="buddySocialMore" class="buddy-social__more" type="button">See More</button></div>
      <p id="buddySocialStatus" class="buddy-social__status" role="status" aria-live="polite">Finding people…</p>
      <div id="buddySocialPeople" class="buddy-people" aria-live="polite"></div>
      <div id="buddySocialEmpty" class="buddy-social__empty" hidden>No people found yet.</div>`;
    tabs.insertAdjacentElement("afterend",section);
    page.querySelector(".partner-hero")?.classList.add("circle-v4-activity-cta");
  }

  function ensureDialog() {
    let dialog = $("buddyInlineDialog");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "buddyInlineDialog";
    dialog.className = "buddy-inline-dialog";
    dialog.innerHTML = `<div class="buddy-inline-panel"><header class="buddy-inline-head"><div><h2 id="buddyInlineTitle">Friends</h2><p id="buddyInlineStatus"></p></div><button class="buddy-inline-close" type="button">×</button></header><div class="buddy-inline-list" id="buddyInlineList"></div></div>`;
    document.body.append(dialog);
    dialog.querySelector(".buddy-inline-close")?.addEventListener("click",()=>dialog.close());
    dialog.addEventListener("click",(e)=>{ if(e.target===dialog) dialog.close(); });
    return dialog;
  }

  function friendRow(person, request=false) {
    const userId = clean(person.user_id);
    const name = clean(person.display_name) || "ARI User";
    const handle = clean(person.handle).replace(/^@+/,"");
    const avatar = validImageUrl(person.avatar_url);
    const row = document.createElement("article");
    row.className = "buddy-inline-row";
    row.innerHTML = `
      <a class="buddy-inline-avatar" href="${profileUrl(userId)}">${avatar?`<img src="${escapeHtml(avatar)}" alt="" loading="lazy" />`:escapeHtml(initial(name))}</a>
      <a class="buddy-inline-id" href="${profileUrl(userId)}"><strong>${escapeHtml(name)}</strong><span>${handle?`@${escapeHtml(handle)}`:"View profile"}</span></a>
      <div class="buddy-inline-actions">${request
        ? `<button class="is-accept" type="button" data-accept="${escapeHtml(person.connection_id)}">Accept</button><button type="button" data-decline="${escapeHtml(person.connection_id)}">Decline</button>`
        : `<a href="${messageUrl(userId)}">Message</a>`}</div>`;
    return row;
  }

  async function openFriends() {
    const dialog = ensureDialog();
    $("buddyInlineTitle").textContent = "Friends";
    $("buddyInlineStatus").textContent = "Loading friends…";
    $("buddyInlineList").replaceChildren();
    if (!dialog.open) dialog.showModal();
    try {
      const rows = await rpc("ari_circle_profile_friends", { requested_user_id: state.user.id, result_limit:150 });
      const friends = Array.isArray(rows)?rows:[];
      $("buddyInlineStatus").textContent = `${friends.length} ${friends.length===1?"friend":"friends"}`;
      if (!friends.length) { $("buddyInlineList").innerHTML='<div class="buddy-inline-empty">No friends yet.</div>'; return; }
      friends.forEach((p)=>$("buddyInlineList").append(friendRow(p,false)));
    } catch(error) {
      console.error("Buddies friends failed:",error);
      $("buddyInlineStatus").textContent="Friends unavailable right now.";
    }
  }

  async function openRequests() {
    const dialog = ensureDialog();
    $("buddyInlineTitle").textContent = "Friend Requests";
    $("buddyInlineStatus").textContent = "Loading requests…";
    $("buddyInlineList").replaceChildren();
    if (!dialog.open) dialog.showModal();
    try {
      const rows = await rpc("ari_circle_friend_requests_list");
      const requests = Array.isArray(rows)?rows:[];
      $("buddyInlineStatus").textContent = `${requests.length} ${requests.length===1?"request":"requests"}`;
      if (!requests.length) { $("buddyInlineList").innerHTML='<div class="buddy-inline-empty">No pending requests.</div>'; return; }
      requests.forEach((p)=>$("buddyInlineList").append(friendRow(p,true)));
    } catch(error) {
      console.error("Buddies requests failed:",error);
      $("buddyInlineStatus").textContent="Requests unavailable right now.";
    }
  }

  async function respondRequest(id, accept) {
    if (!id) return;
    try {
      await rpc("ari_circle_friend_request_respond", { requested_connection_id:id, accept_request:accept });
      await Promise.all([loadCounts(),openRequests()]);
    } catch(error) { setStatus(error.message || "Could not update that request."); }
  }

  async function loadCounts() {
    if (!state.user) return;
    try {
      const [friends,requests] = await Promise.all([
        rpc("ari_circle_profile_friends",{requested_user_id:state.user.id,result_limit:150}),
        rpc("ari_circle_friend_requests_list")
      ]);
      if ($("buddyFriendCount")) $("buddyFriendCount").textContent=String(Array.isArray(friends)?friends.length:0);
      if ($("buddyRequestCount")) $("buddyRequestCount").textContent=String(Array.isArray(requests)?requests.length:0);
    } catch(error) { console.warn("Buddy counts unavailable:",error); }
  }

  async function discover(query="") {
    if(state.loading||!state.client||!state.user)return;
    state.loading=true;state.query=clean(query);setStatus(state.query?`Searching for “${state.query}”…`:"Finding people…");
    const more=$("buddySocialMore");if(more)more.disabled=true;
    try{
      const {data,error}=await state.client.rpc("ari_circle_discover_people",{search_text:state.query||null,result_limit:DISCOVERY_LIMIT});
      if(error)throw error;state.people=Array.isArray(data)?data:[];renderPeople();
      setStatus(!state.people.length?(state.query?"No matching people found.":"No new people are available right now."):(state.query?`${state.people.length} result${state.people.length===1?"":"s"}`:"People you can discover in ARI Circle"));
    }catch(error){console.warn("Friend discovery unavailable:",error);state.people=[];renderPeople();setStatus("Friend discovery is temporarily unavailable.");}
    finally{state.loading=false;if(more)more.disabled=false;}
  }

  function renderPeople(){const host=$("buddySocialPeople"),empty=$("buddySocialEmpty");if(!host)return;host.replaceChildren();if(empty)empty.hidden=state.people.length>0;state.people.forEach((person)=>{const userId=clean(person.user_id||person.id);if(!userId)return;const name=clean(person.display_name||person.name)||"ARI Circle User",handle=clean(person.handle).replace(/^@+/,""),bio=clean(person.bio),imageUrl=validImageUrl(person.avatar_url);const card=document.createElement("article");card.className="buddy-person";const profile=document.createElement("a");profile.className="buddy-person__profile";profile.href=profileUrl(userId);profile.innerHTML=`<span class="buddy-person__avatar">${imageUrl?`<img src="${escapeHtml(imageUrl)}" alt="" loading="lazy" />`:escapeHtml(initial(name))}</span><span class="buddy-person__name"><strong>${escapeHtml(name)}</strong><small>${handle?`@${escapeHtml(handle)}`:"View profile"}</small></span>`;const bioLine=document.createElement("p");bioLine.className="buddy-person__bio";bioLine.textContent=bio||"Open their profile to learn more.";const add=document.createElement("button");add.className="buddy-person__add";add.type="button";add.textContent="Add Friend";add.addEventListener("click",()=>sendFriendRequest(userId,add));card.append(profile,bioLine,add);host.append(card);});}

  async function sendFriendRequest(targetUserId,button){if(!state.user||!targetUserId||button.disabled)return;button.disabled=true;button.textContent="Sending…";try{const{error}=await state.client.from("ari_circle_connections").insert({requester_user_id:state.user.id,addressee_user_id:targetUserId,status:"pending",blocked_by_user_id:null});if(error&&error.code!=="23505")throw error;button.textContent="Requested ✓";button.classList.add("is-requested");await loadCounts();}catch(error){console.error("Friend request failed:",error);button.disabled=false;button.textContent="Add Friend";setStatus(error.message||"Could not send that friend request.");}}

  function bind(){$("buddySocialSearch")?.addEventListener("submit",(e)=>{e.preventDefault();discover($("buddySocialInput")?.value||"");});$("buddySocialMore")?.addEventListener("click",()=>{if($("buddySocialInput"))$("buddySocialInput").value="";discover("");});$("buddyFriendsButton")?.addEventListener("click",openFriends);$("buddyRequestsButton")?.addEventListener("click",openRequests);document.addEventListener("click",(e)=>{const accept=e.target.closest("[data-accept]");if(accept){respondRequest(accept.dataset.accept,true);return;}const decline=e.target.closest("[data-decline]");if(decline)respondRequest(decline.dataset.decline,false);});}

  async function start(){if(state.started||!document.querySelector(".partner-page"))return;state.client=window.calbuddySupabase||window.supabaseClient||null;if(!state.client)return;state.started=true;ensureStyle();buildShell();bind();try{const user=await requireUser();if(!user)return;await Promise.all([loadCounts(),discover("")]);}catch(error){console.warn("Buddies social layer could not start:",error);setStatus("Friend discovery is temporarily unavailable.");}}

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
  window.AriCircleBuddiesSocial=Object.freeze({version:VERSION,refresh:()=>Promise.all([loadCounts(),discover(state.query)])});
})();