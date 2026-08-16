import { recordOpenAIUsage } from "./_lib/ai-provider-usage.js";

// ARI XP image analysis endpoint
// Dormant for App Store v1.0; retained for the planned Nutrition Facts camera flow.

const AI_CONSENT_KEY = "ari_ai_processing_consent";
const AI_CONSENT_VERSION_KEY = "ari_ai_processing_consent_version";
const REQUIRED_AI_CONSENT_VERSION = "2";

function clean(value, maxLength = 1000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

async function readJson(response) {
  return await response.json().catch(() => ({}));
}

async function getAuthenticatedUser(req) {
  const authorization = clean(req.headers.authorization, 4000);
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase server environment variables.");
  }

  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: authorization
    }
  });

  if (!response.ok) return null;
  const user = await readJson(response);
  return user?.id ? user : null;
}

function hasCurrentAiConsent(user) {
  const metadata = user?.user_metadata || {};
  return (
    metadata[AI_CONSENT_KEY] === true &&
    String(metadata[AI_CONSENT_VERSION_KEY] || "") === REQUIRED_AI_CONSENT_VERSION
  );
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY." });
    }

    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "A valid signed-in session is required." });
    }

    if (!hasCurrentAiConsent(user)) {
      return res.status(403).json({
        error: "AI processing permission is required before analyzing an image.",
        code: "AI_PROCESSING_CONSENT_REQUIRED"
      });
    }

    const {
      imageBase64,
      imageUrl,
      prompt = "",
      analysisType = "general"
    } = req.body || {};

    if (!imageBase64 && !imageUrl) {
      return res.status(400).json({ error: "Missing imageBase64 or imageUrl." });
    }

    const imageContent = imageUrl
      ? { type: "image_url", image_url: { url: imageUrl } }
      : {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
        };

    const systemPrompt = `
You are ARI XP Vision.

You analyze images for a wellness and nutrition app.

You can inspect:
- nutrition labels
- grocery packaging
- food and drinks
- restaurant menu screenshots
- progress-related photos
- regular non-food images

Be practical, clear, and careful.

If the image is a nutrition label:
- Extract serving size, calories, protein, carbs, fat, sugar, and sodium when visible.
- Clearly reflect uncertainty when text is unclear.
- Ask the user to confirm extracted values before anything is saved.
- Never claim information was logged unless the app separately confirms a save.

If the image is food:
- Identify visible foods.
- Estimate calories as a range and midpoint.
- Estimate protein, carbs, and fat when reasonably possible.
- Mention uncertainty.
- Never claim the meal was logged.

If the image is not nutrition-related:
- Describe what is visible and answer the user's prompt normally.

Return only valid JSON.
No markdown.
No backticks.

JSON shape:
{
  "reply": "string",
  "analysis_type": "food" | "nutrition_label" | "menu" | "barcode_package" | "progress" | "general",
  "detected_items": [],
  "serving_size": "string",
  "estimated_calories_low": number,
  "estimated_calories_high": number,
  "estimated_calories_midpoint": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "sugar_g": number,
  "sodium_mg": number,
  "confidence_score": number,
  "pendingAction": null
}
`;

    const userPrompt = `
Analysis type requested: ${clean(analysisType, 80) || "general"}

User prompt:
${clean(prompt, 4000) || "Analyze this image."}
`;

    const requestedModel = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: requestedModel,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              imageContent
            ]
          }
        ],
        temperature: 0.25,
        max_tokens: 800,
        response_format: { type: "json_object" }
      })
    });

    const openAiData = await readJson(openAiResponse);

    if (!openAiResponse.ok) {
      return res.status(openAiResponse.status).json({
        error: openAiData.error?.message || "OpenAI image analysis failed."
      });
    }

    await recordOpenAIUsage({
      userId: user.id,
      endpoint: "/api/image-analyze",
      usageType: "image",
      requestCategory: clean(analysisType, 80) || "general",
      model: openAiData?.model || requestedModel,
      responseData: openAiData,
      providerRequestId: openAiResponse.headers.get("x-request-id") || openAiData?.id || null,
      metadata: {
        source: imageUrl ? "url" : "base64",
        promptCharacters: clean(prompt, 4000).length
      }
    });

    const rawContent = openAiData.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = {
        reply: rawContent || "I had trouble analyzing that image.",
        analysis_type: analysisType,
        detected_items: [],
        serving_size: "",
        estimated_calories_low: 0,
        estimated_calories_high: 0,
        estimated_calories_midpoint: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        sugar_g: 0,
        sodium_mg: 0,
        confidence_score: 0.5,
        pendingAction: null
      };
    }

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await fetch(`${process.env.SUPABASE_URL}/rest/v1/food_recognition_history`, {
          method: "POST",
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: user.id,
            image_url: imageUrl || null,
            detected_items: parsed.detected_items || [],
            estimated_calories: Number(parsed.estimated_calories_midpoint || 0),
            protein_g: Number(parsed.protein_g || 0),
            carbs_g: Number(parsed.carbs_g || 0),
            fat_g: Number(parsed.fat_g || 0),
            confidence_score: Number(parsed.confidence_score || 0.5)
          })
        });
      } catch (saveError) {
        console.warn("Image history save failed:", saveError?.message || saveError);
      }
    }

    return res.status(200).json({ success: true, ...parsed });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Image analysis failed." });
  }
}
