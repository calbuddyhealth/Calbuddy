/* =============================================================
   ARI CIRCLE V5 — PROFILE REAL WORLD REPUTATION
   Version: 5.1.0
   Displays earned XP, verified participation, hosting history, and active meetup.
============================================================= */
(() => {
  "use strict";
  const VERSION="5.1.0";
  if(window.AriCircleProfileV5RealWorld?.version===VERSION)return;

  const clean=(value)=>String(value??"").trim();
  const escapeHtml=(value)=>String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const TIER={new_host:"New Host",organizer:"Organizer",active_host:"Active Host",community_leader:"Community Leader",community_builder:"Community Builder"};

  function client(){return window.calbuddySupabase||window.CalBuddy?.supabase||window.supabaseClient||null;}
  async function waitClient(){for(let i=0;i<140;i+=1){const c=client();if(c?.auth&&c?.rpc)return c;await new Promise((r)=>setTimeout(r,60));}return null;}
  async function resolveProfileId(c,viewer){
    const params=new URLSearchParams(location.search);
    const explicit=clean(params.get("user"));
    if(explicit)return explicit;
    const handle=clean(params.get("handle")).replace(/^@+/,"");
    if(handle){
      const {data,error}=await c.from("ari_circle_profiles").select("user_id").eq("handle",handle).maybeSingle();
      if(error)throw error;
      if(data?.user_id)return data.user_id;
    }
    return viewer?.id||null;
  }
  function dateTime(value){const d=new Date(value);if(Number.isNaN(d.getTime()))return"";return d.toLocaleString(undefined,{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});}
  function reasonLabel(reason){const map={verified_meetup_host:"Hosted verified meetup",verified_meetup_participant:"Completed verified meetup",verified_community_quest:"Completed verified Community Quest"};return map[reason]||clean(reason).replaceAll("_"," ")||"Real World XP";}
  function iconFor(type){return type==="meetup"?"◎":type==="quest"?"◇":"✦";}
  function clamp(value,max=100){return Math.max(0,Math.min(max,Number(value)||0));}

  function inject(summary,activity){
    const profile=document.getElementById("circle-profile");
    const body=profile?.querySelector(".circle-profile__body");
    if(!profile||!body)return;
    document.getElementById("circleV5ProfileReputation")?.remove();
    document.getElementById("circleV5HostingCard")?.remove();
    document.getElementById("circleV5ActivityCard")?.remove();

    const total=Math.max(0,Number(summary?.total_xp)||0);
    const level=Math.max(1,Number(summary?.level)||1);
    const progress=clamp(summary?.level_progress_xp);
    const progressMid=clamp(progress*.58);
    const remaining=Math.max(0,100-progress);
    const today=clamp(summary?.today_xp,10);
    const week=clamp(summary?.week_xp,70);
    const tier=TIER[summary?.leadership_tier]||"New Host";
    const verifiedMeetups=Math.max(0,Number(summary?.verified_meetups)||0);
    const successfulHosts=Math.max(0,Number(summary?.successful_hosts)||0);

    const rep=document.createElement("section");
    rep.id="circleV5ProfileReputation";
    rep.className="circle-v5-profile-reputation circle-xp-profile-card";
    rep.setAttribute("aria-label","Real World XP and reputation");
    rep.innerHTML=`
      <div class="circle-xp-profile-top">
        <div class="circle-xp-level-ring" style="--xp-progress:${progress}%;--xp-progress-mid:${progressMid}%" aria-label="Level ${level}, ${progress} percent toward the next level">
          <span class="circle-xp-level-ring__label">LV</span>
          <strong>${level}</strong>
        </div>
        <div class="circle-xp-profile-copy">
          <div class="circle-xp-kicker"><span aria-hidden="true">✦</span> REAL WORLD XP</div>
          <div class="circle-xp-profile-title-row">
            <h2>${total.toLocaleString()} XP</h2>
            <span class="circle-xp-tier" title="${escapeHtml(tier)}">${escapeHtml(tier)}</span>
          </div>
          <div class="circle-xp-level-meta"><span>Level ${level}</span><strong>${progress} / 100 XP</strong></div>
          <div class="circle-xp-level-track" aria-hidden="true"><i style="width:${progress}%"></i></div>
          <p>${remaining} XP to Level ${level+1}</p>
        </div>
      </div>

      <div class="circle-xp-profile-stats" aria-label="Real World reputation stats">
        <div class="circle-xp-profile-stat"><strong>${verifiedMeetups}</strong><span>Verified meetups</span></div>
        <div class="circle-xp-profile-stat"><strong>${successfulHosts}</strong><span>Hosted meetups</span></div>
        <div class="circle-xp-profile-stat"><strong title="${escapeHtml(tier)}">${escapeHtml(tier)}</strong><span>Community status</span></div>
      </div>

      <div class="circle-xp-caps" aria-label="XP earning limits">
        <div class="circle-xp-cap">
          <div class="circle-xp-cap-head"><span>Today</span><strong>${today} / 10 XP</strong></div>
          <div class="circle-xp-cap-track" aria-hidden="true"><i style="width:${today*10}%"></i></div>
        </div>
        <div class="circle-xp-cap">
          <div class="circle-xp-cap-head"><span>This week</span><strong>${week} / 70 XP</strong></div>
          <div class="circle-xp-cap-track" aria-hidden="true"><i style="width:${Math.min(100,(week/70)*100)}%"></i></div>
        </div>
      </div>
    `;
    body.append(rep);

    const meetup=summary?.active_hosted_meetup;
    if(meetup?.id){
      const host=document.createElement("a");
      host.id="circleV5HostingCard";
      host.className="circle-v5-hosting-card";
      host.href=`ari-circle-meetup.html?meetup=${encodeURIComponent(meetup.id)}`;
      host.innerHTML=`<div class="circle-v5-hosting-card__top"><span class="circle-v5-hosting-card__label">HOSTING A MEETUP</span><span class="circle-v5-hosting-pulse" aria-hidden="true"></span></div><h3>${escapeHtml(meetup.title||"Upcoming meetup")}</h3><p>${escapeHtml(dateTime(meetup.starts_at))} · ${escapeHtml(meetup.area||"General area")} · ${Number(meetup.participant_count)||0}/${Number(meetup.max_participants)||0} going</p>`;
      profile.insertAdjacentElement("afterend",host);
      profile.classList.add("circle-v5-profile-is-hosting");
    }else profile.classList.remove("circle-v5-profile-is-hosting");

    if(Array.isArray(activity)&&activity.length){
      const card=document.createElement("section");
      card.id="circleV5ActivityCard";
      card.className="circle-v5-card";
      card.style.padding="16px";
      card.style.margin="12px 0";
      card.innerHTML=`<div class="circle-v5-section-heading"><div><p>REAL WORLD ACTIVITY</p><h2>Verified history</h2></div></div><div class="circle-v5-activity-list"></div>`;
      const list=card.querySelector(".circle-v5-activity-list");
      activity.slice(0,8).forEach((row)=>{
        const item=document.createElement("div");
        item.className="circle-v5-activity-row";
        item.innerHTML=`<span class="circle-v5-activity-icon">${escapeHtml(iconFor(row.source_type))}</span><span class="circle-v5-activity-row__copy"><strong>${escapeHtml(reasonLabel(row.reason))}</strong><small>${escapeHtml(dateTime(row.awarded_at))}</small></span><span class="circle-v5-activity-xp">+${Number(row.xp_amount)||0} XP</span>`;
        list.append(item);
      });
      const anchor=document.getElementById("circleV5HostingCard")||profile;
      anchor.insertAdjacentElement("afterend",card);
    }
  }

  async function load(){
    const c=await waitClient();if(!c)return;
    try{
      const {data:userData,error:userError}=await c.auth.getUser();if(userError)throw userError;
      const viewer=userData?.user;if(!viewer)return;
      const subject=await resolveProfileId(c,viewer);if(!subject)return;
      const [summaryResult,activityResult]=await Promise.all([
        c.rpc("ari_circle_xp_summary",{target_user_id:subject}),
        c.rpc("ari_circle_profile_xp_activity",{target_user_id:subject,result_limit:12})
      ]);
      if(summaryResult.error)throw summaryResult.error;
      inject(summaryResult.data,activityResult.error?[]:activityResult.data);
    }catch(error){console.warn("ARI Circle V5 profile reputation unavailable:",error);}
  }

  window.AriCircleProfileV5RealWorld=Object.freeze({version:VERSION,refresh:load});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(load,120),{once:true});else setTimeout(load,120);
  document.addEventListener("circle:app-ready",()=>setTimeout(load,80));
  document.addEventListener("ari-circle:v5-real-world-ready",()=>setTimeout(load,80));
})();
