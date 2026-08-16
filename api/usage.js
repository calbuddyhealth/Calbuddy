// ARI XP Usage API
// V3.1.0 — user quota + provider metering + owner cost intelligence.

import knowledgeHandler from "./knowledge.js";
import { recordOpenAIUsage } from "./_lib/ai-provider-usage.js";

const MAX_OWNER_ROWS = 10000;

export default async function handler(req, res) {
  if (String(req?.query?.mode || "") === "knowledge") return await handleMeteredKnowledge(req, res);
  if (req.method === "GET" && String(req?.query?.action || "") === "owner_costs") return await handleOwnerCosts(req, res);
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { user_id, action = "check", message = "", usage_type = "chat", model = "gpt-4o-mini" } = req.body || {};
    if (!user_id) return res.status(400).json({ error: "Missing user_id." });
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: "Missing Supabase environment variables." });
    const headers = serverHeaders();
    const profileRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user_id)}&select=is_admin,ai_unlimited,subscription_status,ai_daily_limit,ai_trial_ends_at`, { headers });
    const profiles = await profileRes.json().catch(() => []);
    const profile = Array.isArray(profiles) ? profiles[0] : null;
    const unlimited = Boolean(profile && (profile.is_admin || profile.ai_unlimited || profile.subscription_status === "active" || (profile.ai_trial_ends_at && new Date(profile.ai_trial_ends_at) > new Date())));
    const today = new Date().toISOString().split("T")[0];
    const usageRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/ai_usage_logs?user_id=eq.${encodeURIComponent(user_id)}&created_at=gte.${today}T00:00:00.000Z&usage_type=eq.${encodeURIComponent(usage_type)}`, { headers });
    const usageLogs = await usageRes.json().catch(() => []);
    const usedToday = Array.isArray(usageLogs) ? usageLogs.length : 0;
    const dailyLimit = Number(profile?.ai_daily_limit || 25);
    if (!unlimited && usedToday >= dailyLimit) return res.status(200).json({ allowed:false, unlimited:false, usedToday, dailyLimit, message:"You’ve reached today’s free AI limit." });
    if (action === "log") await fetch(`${process.env.SUPABASE_URL}/rest/v1/ai_usage_logs`, { method:"POST", headers, body:JSON.stringify({ user_id, message, model, usage_type, tokens_used:0, cost_estimate:0 }) });
    return res.status(200).json({ allowed:true, unlimited, usedToday:action === "log" ? usedToday + 1 : usedToday, dailyLimit, profileReady:Boolean(profile) });
  } catch (error) { return res.status(500).json({ error:error.message || "Usage API failed." }); }
}

async function handleMeteredKnowledge(req, res) {
  let recorded = false;
  const requestCategory = resolveRequestCategory(req?.body);
  const userId = await resolveAuthenticatedUserId(req);
  let facade;
  facade = new Proxy(res, { get(target, property) {
    if (property === "status") return (code) => { target.status(code); return facade; };
    if (property === "json") return async (payload) => {
      if (!recorded && payload?.success === true && payload?.modelInvocation?.usage) {
        recorded = true;
        await recordOpenAIUsage({ userId, endpoint:"/api/knowledge", usageType:"reasoning", requestCategory,
          model:payload?.modelInvocation?.model || payload?.modelInvocation?.configuredModel || process.env.OPENAI_REASONING_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini",
          responseData:{ model:payload?.modelInvocation?.model, usage:payload?.modelInvocation?.usage },
          metadata:{ finish_reason:payload?.modelInvocation?.finishReason || null, developer_reasoning:payload?.modelInvocation?.isDeveloperReasoning === true, max_output_tokens:Number(payload?.modelInvocation?.maxOutputTokens || 0), output_characters:Number(payload?.modelInvocation?.outputCharacters || 0), timing_ms:Number(payload?.timing?.totalMs || 0) }
        });
      }
      return target.json(payload);
    };
    const value = Reflect.get(target, property, target); return typeof value === "function" ? value.bind(target) : value;
  }});
  return await knowledgeHandler(req, facade);
}

async function handleOwnerCosts(req, res) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0"); res.setHeader("Pragma", "no-cache");
  try {
    const user = await getAuthenticatedUser(req);
    if (!user?.id) return res.status(401).json({ error:"A signed-in ARI XP session is required." });
    if (!(await isAppAdmin(user.id))) return res.status(403).json({ error:"Owner access required." });
    const rows = await loadProviderRows();
    const now = Date.now(), day = 86400000, start30 = now - 30 * day;
    const userIds = [...new Set(rows.map(r => clean(r.user_id,100)).filter(Boolean))];
    const identities = await loadUserIdentities(userIds);
    return res.status(200).json({ success:true, generatedAt:new Date(now).toISOString(), telemetryOnly:true,
      windows:{ last24h:aggregate(rows,now-day), last7d:aggregate(rows,now-7*day), last30d:aggregate(rows,start30) },
      models:breakdown(rows,"model",start30), endpoints:breakdown(rows,"endpoint",start30), usageTypes:breakdown(rows,"usage_type",start30),
      users:userBreakdown(rows,start30,identities), unattributed:aggregate(rows.filter(r=>!r.user_id),start30)
    });
  } catch (error) { console.error("[ARI Owner AI Costs]",error); return res.status(500).json({ error:error?.message || "Could not load AI cost telemetry." }); }
}

function resolveRequestCategory(body={}) { const p=body?.cognitivePacket||{}; const d=clean(p?.situation?.domain||p?.request?.domain||p?.classification?.domain||p?.domain||"",80); const m=clean(p?.request?.mode||p?.classification?.intent||p?.intent||"",80); return d&&m?`${d}:${m}`.slice(0,120):(d||m||"cognitive_reasoning").slice(0,120); }
async function resolveAuthenticatedUserId(req){ const u=await getAuthenticatedUser(req).catch(()=>null); return clean(u?.id,100)||null; }
async function getAuthenticatedUser(req){ const authorization=clean(req?.headers?.authorization,5000); if(!/^Bearer\s+/i.test(authorization)||!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return null; const response=await fetch(`${String(process.env.SUPABASE_URL).replace(/\/+$/,'')}/auth/v1/user`,{headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:authorization,Accept:"application/json"}}); if(!response.ok)return null; const data=await response.json().catch(()=>({})); return data?.id?data:data?.user||null; }
async function isAppAdmin(userId){ const params=new URLSearchParams({select:"user_id",user_id:`eq.${userId}`,limit:"1"}); const response=await fetch(`${String(process.env.SUPABASE_URL).replace(/\/+$/,'')}/rest/v1/ari_app_admins?${params}`,{headers:serverHeaders()}); if(!response.ok)return false; const data=await response.json().catch(()=>[]); return Array.isArray(data)&&data.length>0; }
async function loadProviderRows(){ const since=new Date(Date.now()-30*86400000).toISOString(); const params=new URLSearchParams({select:"user_id,endpoint,usage_type,request_category,model,input_tokens,cached_input_tokens,output_tokens,total_tokens,estimated_cost_usd,created_at",created_at:`gte.${since}`,order:"created_at.desc",limit:String(MAX_OWNER_ROWS)}); const response=await fetch(`${String(process.env.SUPABASE_URL).replace(/\/+$/,'')}/rest/v1/ai_provider_usage_logs?${params}`,{headers:serverHeaders()}); const data=await response.json().catch(()=>[]); if(!response.ok)throw new Error(data?.message||data?.error||"Provider usage query failed."); return Array.isArray(data)?data:[]; }
async function loadUserIdentities(ids){ const map=new Map(); if(!ids.length)return map; for(let i=0;i<ids.length;i+=100){ const batch=ids.slice(i,i+100); const params=new URLSearchParams({select:"id,email,full_name,display_name,username",id:`in.(${batch.join(',')})`}); const response=await fetch(`${String(process.env.SUPABASE_URL).replace(/\/+$/,'')}/rest/v1/profiles?${params}`,{headers:serverHeaders()}); if(!response.ok)continue; const data=await response.json().catch(()=>[]); for(const p of Array.isArray(data)?data:[]){ map.set(String(p.id),{email:clean(p.email,200)||null,name:clean(p.display_name||p.full_name||p.username,200)||null}); }} return map; }
function aggregate(rows,startMs){ const f=rows.filter(r=>new Date(r.created_at).getTime()>=startMs); const requests=f.length, estimatedCostUsd=money(f.reduce((t,r)=>t+number(r.estimated_cost_usd),0)); return {requests,inputTokens:sum(f,"input_tokens"),cachedInputTokens:sum(f,"cached_input_tokens"),outputTokens:sum(f,"output_tokens"),totalTokens:sum(f,"total_tokens"),estimatedCostUsd,averageCostPerRequestUsd:requests?money(estimatedCostUsd/requests):0}; }
function breakdown(rows,key,startMs){ const g=new Map(); for(const r of rows){if(new Date(r.created_at).getTime()<startMs)continue; const n=clean(r?.[key],160)||"unknown"; if(!g.has(n))g.set(n,[]);g.get(n).push(r);} return [...g.entries()].map(([name,rs])=>({name,...aggregate(rs,startMs)})).sort((a,b)=>b.estimatedCostUsd-a.estimatedCostUsd||b.requests-a.requests); }
function userBreakdown(rows,startMs,identities){ const g=new Map(); for(const r of rows){if(new Date(r.created_at).getTime()<startMs||!r.user_id)continue; const id=String(r.user_id);if(!g.has(id))g.set(id,[]);g.get(id).push(r);} return [...g.entries()].map(([userId,rs])=>{const identity=identities.get(userId)||{}; return {userId,email:identity.email||null,name:identity.name||null,...aggregate(rs,startMs)};}).sort((a,b)=>b.estimatedCostUsd-a.estimatedCostUsd||b.requests-a.requests); }
function sum(rows,key){return rows.reduce((t,r)=>t+number(r?.[key]),0);} function number(v){const n=Number(v);return Number.isFinite(n)?n:0;} function money(v){return Number(number(v).toFixed(8));}
function serverHeaders(){return {apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,"Content-Type":"application/json",Accept:"application/json"};} function clean(v="",max=1000){return String(v??"").trim().slice(0,max);}
