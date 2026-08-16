import knowledgeHandler from "./knowledge.js";
import { recordOpenAIUsage } from "./_lib/ai-provider-usage.js";

// ARI XP — metered facade for the full cognitive reasoning transport.
// Keeps the large reasoning engine untouched while recording the provider
// usage it already returns in modelInvocation. Telemetry failure must never
// block or alter an ARI response.

export default async function handler(req, res) {
  let recorded = false;
  const requestCategory = resolveRequestCategory(req?.body);
  const userId = await resolveAuthenticatedUserId(req);

  let facade;
  facade = new Proxy(res, {
    get(target, property) {
      if (property === "status") {
        return (code) => {
          target.status(code);
          return facade;
        };
      }

      if (property === "json") {
        return async (payload) => {
          if (!recorded && payload?.success === true && payload?.modelInvocation?.usage) {
            recorded = true;

            await recordOpenAIUsage({
              userId,
              endpoint: "/api/knowledge",
              usageType: "reasoning",
              requestCategory,
              model:
                payload?.modelInvocation?.model ||
                payload?.modelInvocation?.configuredModel ||
                process.env.OPENAI_REASONING_MODEL ||
                process.env.OPENAI_MODEL ||
                "gpt-4.1-mini",
              responseData: {
                model: payload?.modelInvocation?.model,
                usage: payload?.modelInvocation?.usage
              },
              metadata: {
                finish_reason: payload?.modelInvocation?.finishReason || null,
                developer_reasoning: payload?.modelInvocation?.isDeveloperReasoning === true,
                max_output_tokens: Number(payload?.modelInvocation?.maxOutputTokens || 0),
                output_characters: Number(payload?.modelInvocation?.outputCharacters || 0),
                timing_ms: Number(payload?.timing?.totalMs || 0)
              }
            });
          }

          return target.json(payload);
        };
      }

      if (property === "end") {
        return (...args) => target.end(...args);
      }

      if (property === "setHeader") {
        return (...args) => target.setHeader(...args);
      }

      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    }
  });

  return await knowledgeHandler(req, facade);
}

function resolveRequestCategory(body = {}) {
  const packet = body?.cognitivePacket || {};
  const domain = clean(
    packet?.situation?.domain ||
    packet?.request?.domain ||
    packet?.classification?.domain ||
    packet?.domain ||
    ""
  );

  const mode = clean(
    packet?.request?.mode ||
    packet?.classification?.intent ||
    packet?.intent ||
    ""
  );

  if (domain && mode) return `${domain}:${mode}`.slice(0, 120);
  return (domain || mode || "cognitive_reasoning").slice(0, 120);
}

async function resolveAuthenticatedUserId(req) {
  try {
    const authorization = clean(req?.headers?.authorization, 5000);
    if (!/^Bearer\s+/i.test(authorization)) return null;

    const supabaseUrl = clean(process.env.SUPABASE_URL, 1000).replace(/\/+$/, "");
    const apiKey = clean(
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      5000
    );

    if (!supabaseUrl || !apiKey) return null;

    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: apiKey,
        Authorization: authorization,
        Accept: "application/json"
      }
    });

    if (!response.ok) return null;
    const data = await response.json().catch(() => ({}));
    return clean(data?.id || data?.user?.id, 100) || null;
  } catch {
    return null;
  }
}

function clean(value = "", max = 300) {
  return String(value ?? "").trim().slice(0, max);
}
