/* ARI Circle V5.2.3 — live Meet Up discovery rail for the existing Feed. */
(() => {
  "use strict";
  const VERSION = "5.2.3";
  const clean = (value) => String(value ?? "").trim();
  const escapeHtml = (value) => String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const ACTIVITY = { walking:"Walking",gym:"Gym",running:"Running",hiking:"Hiking",sports:"Sports",cycling:"Cycling",yoga:"Yoga",coffee:"Coffee",food:"Food",community:"Community",volunteer:"Volunteer",other:"Meetup" };

  function client() { return window.calbuddySupabase || window.CalBuddy?.supabase || window.supabaseClient || null; }
  async function waitClient() {
    for (let i=0;i<120;i+=1) { const c=client(); if (c?.rpc) return c; await new Promise((r)=>setTimeout(r,60)); }
    return null;
  }
  function dateTime(value) {
    const d=new Date(value); if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined,{weekday:"short",hour:"numeric",minute:"2-digit"});
  }
  function ensureSection() {
    let section=document.getElementById("circleV5Happening");
    if (section) return section;
    section=document.createElement("section");
    section.id="circleV5Happening";
    section.className="circle-v5-happening";
    section.hidden=true;
    section.innerHTML=`<div class="circle-v5-section-heading"><div><p>HAPPENING</p><h2>Do something in real life</h2></div></div><div class="circle-v5-happening__rail" id="circleV5HappeningRail"></div>`;
    const composer=document.querySelector(".feed-composer");
    const moments=document.getElementById("momentsSection");
    if (composer?.parentNode) {
      if (moments && moments.parentNode===composer.parentNode) {
        composer.parentNode.insertBefore(moments,composer);
        moments.insertAdjacentElement("afterend",section);
      } else composer.parentNode.insertBefore(section,composer);
    }
    return section;
  }
  function card(row) {
    const a=document.createElement("a");
    a.className="circle-v5-happening-card";
    a.href=`ari-circle-meetup.html?meetup=${encodeURIComponent(row.meetup_id)}`;
    const count=Number(row.participant_count)||0;
    a.innerHTML=`<span class="circle-v5-happening-card__eyebrow">${escapeHtml(ACTIVITY[row.activity]||"Meet Up")}</span><h3>${escapeHtml(row.title||"Meetup")}</h3><p>${escapeHtml(row.area||"General area")} · ${escapeHtml(dateTime(row.starts_at))}</p><div class="circle-v5-happening-card__footer"><span>${count}/${Number(row.max_participants)||0} going</span><span class="circle-v5-xp-chip">+${Number(row.participant_xp)||0} XP</span></div>`;
    return a;
  }
  async function load() {
    const c=await waitClient(); if (!c) return;
    const section=ensureSection(); const rail=section.querySelector("#circleV5HappeningRail");
    if (!rail) return;
    try {
      const {data,error}=await c.rpc("ari_circle_list_meetups",{requested_activity:null,requested_window:"upcoming",result_limit:6});
      if (error) throw error;
      const rows=(Array.isArray(data)?data:[]).filter((row)=>new Date(row.ends_at).getTime()>Date.now()).slice(0,6);
      rail.replaceChildren();
      if (!rows.length) {
        section.hidden=true;
        return;
      }
      section.hidden=false;
      rows.forEach((row)=>rail.append(card(row)));
    } catch (error) {
      console.warn("ARI Circle Happening rail unavailable:",error);
      section.hidden=true;
    }
  }
  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded",load,{once:true}); else load();
  document.addEventListener("ari-circle:v5-real-world-ready",()=>ensureSection());
  window.AriCircleHappeningV5=Object.freeze({version:VERSION,refresh:load});
})();
