export default async function handler(req, res) {
if (req.method !== "POST") {
return res.status(405).json({ error: "Method not allowed" });
}

try {
const { action, user_id, updates = {} } = req.body;

if (!user_id) return res.status(400).json({ error: "Missing user_id." });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
return res.status(500).json({ error: "Missing Supabase environment variables." });
}

const headers = {
apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
"Content-Type": "application/json"
};

if (action === "get_profile") {
const response = await fetch(
`${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}&limit=1`,
{ headers }
);

const data = await response.json();

return res.status(200).json({
success: true,
profile: data?.[0] || null
});
}

if (action === "update_profile") {
const response = await fetch(
`${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}`,
{
method: "PATCH",
headers: {
...headers,
Prefer: "return=representation"
},
body: JSON.stringify({
...updates,
updated_at: new Date().toISOString()
})
}
);

const data = await response.json();

if (!response.ok) {
return res.status(response.status).json({ error: data });
}

return res.status(200).json({
success: true,
profile: data?.[0] || null
});
}

return res.status(400).json({ error: "Unknown profile action." });

} catch (error) {
return res.status(500).json({
error: error.message || "Profile API failed."
});
}
}
