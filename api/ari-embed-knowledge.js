// api/ari-embed-knowledge.js
// Purpose: Generate embeddings for Ari knowledge nodes and save them to Supabase.
// V0.2.0 — No Package Imports / Fetch Only / Server-Side Only

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
  return res.status(405).json({ error: "Method not allowed." });
}

try {
  const body =
    req.method === "POST"
      ? req.body || {}
      : {
          id: req.query.id,
          limit: Number(req.query.limit || 10)
        };

  const { id, limit = 10 } = body;
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY." });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        error: "Missing Supabase server environment variables."
      });
    }

    const headers = {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    const selectUrl = id
      ? `${process.env.SUPABASE_URL}/rest/v1/ari_knowledge_nodes?select=*&id=eq.${encodeURIComponent(id)}&limit=1`
      : `${process.env.SUPABASE_URL}/rest/v1/ari_knowledge_nodes?select=*&embedding=is.null&limit=${Number(limit) || 10}`;

    const fetchResponse = await fetch(selectUrl, {
      method: "GET",
      headers
    });

    const nodes = await fetchResponse.json();

    if (!fetchResponse.ok) {
      return res.status(fetchResponse.status).json({
        success: false,
        error: nodes
      });
    }

    if (!Array.isArray(nodes) || nodes.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No knowledge nodes need embedding.",
        embedded: 0
      });
    }

    const results = [];

    for (const node of nodes) {
      const text = buildEmbeddingText(node);

      if (!text.trim()) {
        results.push({
          id: node.id,
          topic: node.topic,
          success: false,
          reason: "No usable text."
        });
        continue;
      }

      const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: text
        })
      });

      const embeddingData = await embeddingResponse.json();

      if (!embeddingResponse.ok) {
        results.push({
          id: node.id,
          topic: node.topic,
          success: false,
          reason: embeddingData?.error?.message || "OpenAI embedding failed."
        });
        continue;
      }

      const embedding = embeddingData?.data?.[0]?.embedding;

      if (!Array.isArray(embedding)) {
        results.push({
          id: node.id,
          topic: node.topic,
          success: false,
          reason: "No embedding returned."
        });
        continue;
      }

      const updateResponse = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/ari_knowledge_nodes?id=eq.${encodeURIComponent(node.id)}`,
        {
          method: "PATCH",
          headers: {
            ...headers,
            Prefer: "return=minimal"
          },
          body: JSON.stringify({
            embedding,
            updated_at: new Date().toISOString()
          })
        }
      );

      if (!updateResponse.ok) {
        const updateError = await updateResponse.json().catch(() => ({}));
        results.push({
          id: node.id,
          topic: node.topic,
          success: false,
          reason: updateError
        });
        continue;
      }

      results.push({
        id: node.id,
        topic: node.topic,
        success: true
      });
    }

    return res.status(200).json({
      success: true,
      embedded: results.filter(item => item.success).length,
      results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error?.message || String(error)
    });
  }
}

function buildEmbeddingText(node = {}) {
  return [
    node.domain ? `Domain: ${node.domain}` : null,
    node.subdomain ? `Subdomain: ${node.subdomain}` : null,
    node.topic ? `Topic: ${node.topic}` : null,
    node.definition ? `Definition: ${node.definition}` : null,
    node.summary ? `Summary: ${node.summary}` : null,
    node.purpose ? `Purpose: ${node.purpose}` : null,
    node.importance ? `Importance: ${node.importance}` : null,
    node.how_it_works ? `How it works: ${node.how_it_works}` : null,
    node.deep_understanding ? `Deep understanding: ${node.deep_understanding}` : null,
    node.universal_principle ? `Universal principle: ${node.universal_principle}` : null,
    Array.isArray(node.core_concepts) && node.core_concepts.length
      ? `Core concepts: ${node.core_concepts.join(", ")}`
      : null,
    Array.isArray(node.tags) && node.tags.length
      ? `Tags: ${node.tags.join(", ")}`
      : null
  ]
    .filter(Boolean)
    .join("\n");
}