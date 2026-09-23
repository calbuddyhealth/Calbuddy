/* ARI Circle Feed activity rail — events first, no XP/progression. */
(() => {
  "use strict";
  const VERSION = "6.0.0";
  const clean = (value) => String(value ?? "").trim();
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const ACTIVITY = {
    walking:["Walking","🚶"], gym:["Gym","🏋️"], running:["Running","🏃"],
    hiking:["Hiking","🥾"], sports:["Sports","🏀"], cycling:["Cycling","🚴"],
    yoga:["Yoga","🧘"], coffee:["Coffee","☕"], food:["Food","🍴"],
    community:["Community","◎"], volunteer:["Volunteer","🤝"], other:["Meetup","✦"]
  };

  function client() {
    return window.calbuddySupabase || window.CalBuddy?.supabase || window.supabaseClient || null;
  }

  async function waitClient() {
    for (let i=0;i<120;i+=1) {
      const c=client();
      if (c?.rpc) return c;
      await new Promise((r)=>setTimeout(r,60));
    }
    return null;
  }

  function dateTime(value) {
    const d=new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined,{weekday:"short",hour:"numeric",minute:"2-digit"});
  }

  function relative(value) {
    const ms=new Date(value).getTime()-Date.now();
    if (!Number.isFinite(ms)) return "";
    if (ms<=0) return "Happening now";
    const mins=Math.ceil(ms/60000);
    if(mins<60) return `Starts in ${mins} min`;
    const hrs=Math.ceil(mins/60);
    if(hrs<24) return `Starts in ${hrs} hr${hrs===1?"":"s"}`;
    return dateTime(value);
  }

  function ensureSection() {
    let section=document.getElementById("circleV5Happening");
    if (section) return section;
    section=document.createElement("section");
    section.id="circleV5Happening";
    section.className="circle-v5-happening feed-next-happening";
    section.innerHTML=`
      <div class="feed-next-section-heading">
        <div><p class="feed-next-eyebrow">HAPPENING</p><h2>Join something</h2></div>
        <a href="ari-circle-meetup.html">See all</a>
      </div>
      <div class="feed-next-event-list" id="circleV5HappeningRail"></div>
    `;
    const composer=document.querySelector(".feed-composer");
    if (composer?.parentNode) composer.insertAdjacentElement("afterend",section);
    return section;
  }

  async function act(row, action, button) {
    const c=client();
    if(!c?.rpc || !row?.meetup_id) return;
    button.disabled=true;
    try {
      const rpcName=action==="request" ? "ari_circle_request_meetup" : "ari_circle_join_meetup";
      const {error}=await c.rpc(rpcName,{requested_meetup_id:row.meetup_id});
      if(error) throw error;
      if(action==="join") {
        location.href=`ari-circle-meetup-room.html?meetup=${encodeURIComponent(row.meetup_id)}`;
        return;
      }
      button.textContent="Requested";
    } catch(error) {
      console.warn("ARI Circle Feed event action failed:",error);
      button.textContent="View";
      button.disabled=false;
      button.onclick=()=>{ location.href=`ari-circle-meetup.html?meetup=${encodeURIComponent(row.meetup_id)}`; };
    }
  }

  function card(row) {
    const article=document.createElement("article");
    article.className="feed-next-event-card";
    const meta=ACTIVITY[row.activity]||ACTIVITY.other;
    const count=Number(row.participant_count)||0;
    const capacity=Number(row.max_participants)||0;
    const full=capacity>0 && count>=capacity;
    const approval=clean(row.join_mode)==="approval";
    const requested=["pending","waitlisted"].includes(clean(row.viewer_request_status));

    let label="Join";
    let action="join";
    let disabled=false;

    if(row.viewer_is_host||row.viewer_joined) {
      label="Open";
      action="room";
    } else if(requested) {
      label=clean(row.viewer_request_status)==="waitlisted"?"Waitlisted":"Requested";
      disabled=true;
    } else if(full && approval) {
      label="Waitlist";
      action="request";
    } else if(full) {
      label="Full";
      disabled=true;
    } else if(approval) {
      label="Request";
      action="request";
    }

    article.innerHTML=`
      <a class="feed-next-event-card__main" href="ari-circle-meetup.html?meetup=${encodeURIComponent(row.meetup_id)}">
        <span class="feed-next-event-icon" aria-hidden="true">${escapeHtml(meta[1])}</span>
        <span class="feed-next-event-copy">
          <small>${escapeHtml(meta[0])} · ${escapeHtml(relative(row.starts_at))}</small>
          <strong>${escapeHtml(row.title||"Meetup")}</strong>
          <span>${escapeHtml(row.area||"General area")} · ${count}/${capacity||"?"} going</span>
        </span>
      </a>
      <button class="feed-next-event-action" type="button" ${disabled?"disabled":""}>${escapeHtml(label)}</button>
    `;

    const button=article.querySelector(".feed-next-event-action");
    if(!disabled) {
      button.addEventListener("click",()=>{
        if(action==="room") {
          location.href=`ari-circle-meetup-room.html?meetup=${encodeURIComponent(row.meetup_id)}`;
        } else {
          act(row,action,button);
        }
      });
    }
    return article;
  }

  async function load() {
    const c=await waitClient();
    if(!c) return;
    const section=ensureSection();
    const rail=section.querySelector("#circleV5HappeningRail");
    if(!rail) return;

    try {
      const {data,error}=await c.rpc("ari_circle_list_meetups",{
        requested_activity:null,
        requested_window:"upcoming",
        result_limit:8
      });
      if(error) throw error;
      const rows=(Array.isArray(data)?data:[])
        .filter((row)=>new Date(row.ends_at).getTime()>Date.now())
        .slice(0,6);

      rail.replaceChildren();
      if(!rows.length) {
        rail.innerHTML=`
          <a class="feed-next-event-empty" href="ari-circle-meetup.html">
            <strong>Nothing planned yet.</strong>
            <span>Open Connect to host something.</span>
          </a>
        `;
        return;
      }
      rows.forEach((row)=>rail.append(card(row)));
    } catch(error) {
      console.warn("ARI Circle Feed events unavailable:",error);
      section.hidden=true;
    }
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",load,{once:true});
  else load();

  document.addEventListener("ari-circle:v5-real-world-ready",()=>ensureSection());
  window.AriCircleHappeningV5=Object.freeze({version:VERSION,refresh:load});
})();
