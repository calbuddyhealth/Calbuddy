// api/memory.js
// Ari / CalBuddy Memory API
// Purpose: Save and retrieve user-scoped Ari memories.
// V2.0.0 — ari_user_memory schema aligned

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      action,
      user_id,
      memory_type = "general",
      memory_key = null,
      memory_value,
      content,
      topic,
      importance = 5,
      confidence = 0.75,
      tags = []
    } = req.body || {};

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
      const memoryContent = String(content || memory_value || "").trim();

      if (!memoryContent) {
        return res.status(400).json({
          error: "memory_value or content is required."
        });
      }

      const memoryTopic =
        String(topic || memory_key || memory_type || "general").trim() ||
        "general";

      const response = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/ari_user_memory?on_conflict=user_id,content`,
        {
          method: "POST",
          headers: {
            ...headers,
            Prefer: "resolution=merge-duplicates,return=representation"
          },
          body: JSON.stringify({
            user_id,
            memory_type,
            topic: memoryTopic,
            content: memoryContent,
            importance: Number(importance || 5),
            confidence: Number(confidence || 0.75),
            tags: Array.isArray(tags) ? tags : [],
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
        `${process.env.SUPABASE_URL}/rest/v1/ari_user_memory?user_id=eq.${user_id}&order=updated_at.desc&limit=50`,
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