export default async function handler(req, res) {
if (req.method !== "POST") {
return res.status(405).json({ error: "Method not allowed" });
}

try {
const { user_id, action = "check", message = "", usage_type = "chat", model = "gpt-4o-mini" } = req.body;

if (!user_id) return res.status(400).json({ error: "Missing user_id." });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
return res.status(500).json({ error: "Missing Supabase environment variables." });
}

const headers = {
apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
"Content-Type": "application/json"
};

const profileRes = await fetch(
`${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}&select=is_admin,ai_unlimited,subscription_status,ai_daily_limit,ai_trial_ends_at`,
{ headers }
);

const profiles = await profileRes.json();
const profile = profiles?.[0];

if (!profile) {
return res.status(404).json({ error: "Profile not found." });
}

const unlimited =
profile.is_admin ||
profile.ai_unlimited ||
profile.subscription_status === "active" ||
(profile.ai_trial_ends_at && new Date(profile.ai_trial_ends_at) > new Date());

const today = new Date().toISOString().split("T")[0];

const usageRes = await fetch(
`${process.env.SUPABASE_URL}/rest/v1/ai_usage_logs?user_id=eq.${user_id}&created_at=gte.${today}T00:00:00.000Z&usage_type=eq.${usage_type}`,
{ headers }
);

const usageLogs = await usageRes.json();
const usedToday = Array.isArray(usageLogs) ? usageLogs.length : 0;
const dailyLimit = Number(profile.ai_daily_limit || 25);

if (!unlimited && usedToday >= dailyLimit) {
return res.status(200).json({
allowed: false,
unlimited: false,
usedToday,
dailyLimit,
message: "You’ve reached today’s free AI limit. Upgrade to Premium for unlimited CalBuddy AI."
});
}

if (action === "log") {
await fetch(`${process.env.SUPABASE_URL}/rest/v1/ai_usage_logs`, {
method: "POST",
headers,
body: JSON.stringify({
user_id,
message,
model,
usage_type,
tokens_used: 0,
cost_estimate: 0
})
});
}

return res.status(200).json({
allowed: true,
unlimited,
usedToday: action === "log" ? usedToday + 1 : usedToday,
dailyLimit
});

} catch (error) {
return res.status(500).json({
error: error.message || "Usage API failed."
});
}
}
