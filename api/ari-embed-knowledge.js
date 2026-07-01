// api/ari-embed-knowledge.js
// Purpose: Generate embeddings for Ari knowledge nodes and save them to Supabase.
// V0.1.0 — Manual Node Embedding / Server-Side Only

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY 
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { id, limit = 10 } = req.body || {};

    let query = supabase
      .from("ari_knowledge_nodes")
      .select("*")
      .is("embedding", null)
      .limit(limit);

    if (id) {
      query = supabase
        .from("ari_knowledge_nodes")
        .select("*")
        .eq("id", id)
        .limit(1);
    }

    const { data: nodes, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    if (!nodes?.length) {
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

      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text
      });

      const embedding = embeddingResponse.data?.[0]?.embedding;

      if (!embedding) {
        results.push({
          id: node.id,
          topic: node.topic,
          success: false,
          reason: "Embedding generation failed."
        });
        continue;
      }

      const { error: updateError } = await supabase
        .from("ari_knowledge_nodes")
        .update({
          embedding,
          updated_at: new Date().toISOString()
        })
        .eq("id", node.id);

      if (updateError) throw updateError;

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
    console.error("ARI EMBED KNOWLEDGE ERROR:", error);

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