export default async function handler(req, res) {
if (req.method !== "POST") {
return res.status(405).json({ error: "Method not allowed" });
}

try {
const {
action,
user_id,
memory_type,
memory_key,
memory_value,
source = "conversation"
} = req.body;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
return res.status(500).json({
error: "Missing Supabase server environment variables."
});
}

if (!user_id) {
return res.status(400).json({ error: "Missing user_id." });
}

const headers = {
apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
"Content-Type": "application/json"
};

if (action === "save_memory") {
if (!memory_type || !memory_value) {
return res.status(400).json({
error: "memory_type and memory_value are required."
});
}

const response = await fetch(
`${process.env.SUPABASE_URL}/rest/v1/user_memory`,
{
method: "POST",
headers: {
...headers,
Prefer: "return=representation"
},
body: JSON.stringify({
user_id,
memory_type,
memory_key,
memory_value,
source,
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
memory: data?.[0] || null
});
}

if (action === "get_memories") {
const response = await fetch(
`${process.env.SUPABASE_URL}/rest/v1/user_memory?user_id=eq.${user_id}&order=updated_at.desc&limit=30`,
{
method: "GET",
headers
}
);

const data = await response.json();

if (!response.ok) {
return res.status(response.status).json({ error: data });
}

return res.status(200).json({
success: true,
memories: data || []
});
}

return res.status(400).json({
error: "Unknown memory action."
});

} catch (error) {
return res.status(500).json({
error: error.message || "Memory API failed."
});
}
}
