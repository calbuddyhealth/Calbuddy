// api/ari-create-knowledge-node.js
// Purpose: Create Ari knowledge node, then auto-embed it.
// V0.1.0 — Create + Embed Pipeline / Fetch Only

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const body = req.body || {};

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: "Missing Supabase env vars." });
    }

    const headers = {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    };

    const nodePayload = {
      domain: body.domain || "ari",
      subdomain: body.subdomain || null,
      topic: body.topic,
      summary: body.summary || null,
      definition: body.definition || null,
      purpose: body.purpose || null,
      importance: body.importance || null,
      how_it_works: body.how_it_works || null,
      deep_understanding: body.deep_understanding || null,
      universal_principle: body.universal_principle || null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      core_concepts: Array.isArray(body.core_concepts) ? body.core_concepts : [],
      confidence: body.confidence ?? 0.9,
      is_volatile: body.is_volatile ?? false,
      knowledge_id: body.knowledge_id || null,
      knowledge_path: body.knowledge_path || null,
      knowledge_type: body.knowledge_type || "knowledge_node"
    };

    if (!nodePayload.topic) {
      return res.status(400).json({ error: "Missing topic." });
    }

    const createResponse = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/ari_knowledge_nodes`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(nodePayload)
      }
    );

    const created = await createResponse.json();

    if (!createResponse.ok) {
      return res.status(createResponse.status).json({
        success: false,
        stage: "create_node",
        error: created
      });
    }

    const node = created?.[0];

    if (!node?.id) {
      return res.status(500).json({
        success: false,
        error: "Node created but no id returned."
      });
    }

    const baseUrl =
      req.headers.host?.includes("localhost")
        ? `http://${req.headers.host}`
        : `https://${req.headers.host}`;

    const embedResponse = await fetch(
      `${baseUrl}/api/ari-embed-knowledge?id=${encodeURIComponent(node.id)}`,
      {
        method: "GET"
      }
    );

    const embedResult = await embedResponse.json();

    return res.status(200).json({
      success: true,
      node,
      embedding: embedResult
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error?.message || String(error)
    });
  }
}