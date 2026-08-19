import { recordOpenAIUsage } from "./_lib/ai-provider-usage.js";

// ARI XP Nutrition Facts fallback vision.
// Deliberately unavailable as a general-purpose camera endpoint.

const AI_CONSENT_KEY = "ari_ai_processing_consent";
const AI_CONSENT_VERSION_KEY = "ari_ai_processing_consent_version";
const REQUIRED_AI_CONSENT_VERSION = "2";
const DAILY_LABEL_SCAN_LIMIT = 3;
const MAX_IMAGE_BASE64_CHARS = 6_500_000;
const ALLOWED_FALLBACK_REASONS = new Set([
  "barcode_not_found",
  "barcode_incomplete",
  "barcode_low_confidence"
]);

function clean(value, maxLength = 1000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

async function readJson(response) {
  return await response.json().catch(() => ({}));
}

function serverNutritionDay() {
  return new Date().toISOString().slice(0, 10);
}

function serverConfig() {
  return {
    url: clean(process.env.SUPABASE_URL, 1000).replace(/\/+$/, ""),
    serviceRoleKey: clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 5000)
  };
}

async function getAuthenticatedUser(req) {
  const authorization = clean(req.headers.authorization, 5000);
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;

  const config = serverConfig();
  if (!config.url || !config.serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  const response = await fetch(`${config.url}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: authorization,
      Accept: "application/json"
    }
  });

  if (!response.ok) return null;
  const data = await readJson(response);
  const user = data?.user || data;
  return user?.id ? user : null;
}

function hasCurrentAiConsent(user) {
  const metadata = user?.user_metadata || {};
  return metadata[AI_CONSENT_KEY] === true &&
    String(metadata[AI_CONSENT_VERSION_KEY] || "") === REQUIRED_AI_CONSENT_VERSION;
}

async function claimLabelScan(userId, nutritionDay) {
  const config = serverConfig();
  const response = await fetch(`${config.url}/rest/v1/rpc/claim_nutrition_label_scan`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      p_user_id: userId,
      p_nutrition_day: nutritionDay,
      p_limit: DAILY_LABEL_SCAN_LIMIT
    })
  });

  if (!response.ok) {
    throw new Error("Nutrition label scan limit service is unavailable.");
  }

  const rows = await readJson(response);
  const row = Array.isArray(rows) ? rows[0] : rows;
  return {
    allowed: row?.allowed === true,
    used: Number(row?.used_count || 0),
    remaining: Math.max(0, Number(row?.remaining || 0))
  };
}

async function releaseLabelScan(userId, nutritionDay) {
  const config = serverConfig();
  try {
    await fetch(`${config.url}/rest/v1/rpc/release_nutrition_label_scan`, {
      method: "POST",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ p_user_id: userId, p_nutrition_day: nutritionDay })
    });
  } catch (error) {
    console.warn("[ARI Nutrition Vision Release Warning]", error?.message || error);
  }
}

function normalizeParsedLabel(parsed, fallback = {}) {
  const servingSize = clean(parsed?.serving_size || parsed?.serving_label, 160);
  const servingGrams = positiveNumber(parsed?.serving_grams);
  const calories = nonNegativeNumber(
    parsed?.calories_per_serving ??
    parsed?.estimated_calories_midpoint ??
    parsed?.calories
  );

  return {
    reply: clean(parsed?.reply, 1200) || "I read the Nutrition Facts label. Check the values before adding it.",
    analysis_type: "nutrition_label",
    product_name: clean(parsed?.product_name, 220),
    brand: clean(parsed?.brand, 160),
    detected_items: Array.isArray(parsed?.detected_items) ? parsed.detected_items.slice(0, 12) : [],
    serving_size: servingSize,
    serving_label: servingSize,
    serving_grams: servingGrams,
    servings_per_container: positiveNumber(parsed?.servings_per_container),
    calories_per_serving: calories,
    estimated_calories_low: calories,
    estimated_calories_high: calories,
    estimated_calories_midpoint: calories,
    protein_g: nonNegativeNumber(parsed?.protein_g),
    carbs_g: nonNegativeNumber(parsed?.carbs_g),
    fat_g: nonNegativeNumber(parsed?.fat_g),
    sugar_g: nonNegativeNumber(parsed?.sugar_g),
    sodium_mg: nonNegativeNumber(parsed?.sodium_mg),
    confidence_score: clampNumber(parsed?.confidence_score, 0, 1, 0.5),
    barcode: clean(fallback?.barcode, 40) || null,
    pendingAction: null
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let claimed = false;
  let user = null;
  let nutritionDay = serverNutritionDay();

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY." });
    }

    user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "A valid signed-in session is required." });
    }

    if (!hasCurrentAiConsent(user)) {
      return res.status(403).json({
        error: "AI processing permission is required before reading a Nutrition Facts label.",
        code: "AI_PROCESSING_CONSENT_REQUIRED"
      });
    }

    const body = req.body || {};
    const analysisType = clean(body.analysisType, 80).toLowerCase();
    const fallbackReason = clean(body.fallbackReason, 80).toLowerCase();
    const barcodeContext = body.barcodeContext && typeof body.barcodeContext === "object"
      ? body.barcodeContext
      : {};
    const imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64 : "";

    // For now, image AI exists only as the Nutrition barcode fallback.
    if (analysisType !== "nutrition_label") {
      return res.status(403).json({
        error: "Image analysis is only available for Nutrition Facts fallback scans.",
        code: "IMAGE_ANALYSIS_NOT_AVAILABLE"
      });
    }

    if (!ALLOWED_FALLBACK_REASONS.has(fallbackReason)) {
      return res.status(403).json({
        error: "Scan the barcode first. Nutrition Facts scanning only appears when the product cannot be verified.",
        code: "BARCODE_FALLBACK_REQUIRED"
      });
    }

    if (!imageBase64) {
      return res.status(400).json({ error: "A Nutrition Facts photo is required." });
    }

    if (imageBase64.length > MAX_IMAGE_BASE64_CHARS) {
      return res.status(413).json({
        error: "That image is too large. Retake a closer photo of the Nutrition Facts panel.",
        code: "IMAGE_TOO_LARGE"
      });
    }

    const scanClaim = await claimLabelScan(user.id, nutritionDay);
    if (!scanClaim.allowed) {
      return res.status(429).json({
        error: "You have used today's 3 Nutrition Facts scans. Barcode scanning remains unlimited.",
        code: "DAILY_NUTRITION_LABEL_SCAN_LIMIT",
        limit: DAILY_LABEL_SCAN_LIMIT,
        remaining: 0
      });
    }
    claimed = true;

    const barcode = clean(barcodeContext?.barcode, 40);
    const imageContent = {
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "high" }
    };

    const systemPrompt = `
You are ARI XP Nutrition Label Reader.
You are only reading a photographed Nutrition Facts panel.

Extract what is visibly printed on this exact label. Do not use memory to fill missing nutrition values.
If a value is unreadable or absent, use 0 and lower confidence.

Priorities:
1. Product/brand only when visible on the photo.
2. Serving size exactly as printed, including household amount such as "about 12 chips (28 g)".
3. Numeric serving grams when printed.
4. Servings per container when printed.
5. Calories PER SERVING.
6. Protein, total carbohydrate, total fat, total sugars, sodium PER SERVING.

For dual-column labels, use the per-serving column, not per-container, unless only per-container exists; explain that in reply.
Do not estimate food calories from appearance.
Do not claim the meal was saved.
Return only valid JSON with no markdown.

JSON shape:
{
  "reply": "short confirmation instruction",
  "analysis_type": "nutrition_label",
  "product_name": "string",
  "brand": "string",
  "detected_items": [],
  "serving_size": "string",
  "serving_grams": number,
  "servings_per_container": number,
  "calories_per_serving": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "sugar_g": number,
  "sodium_mg": number,
  "confidence_score": number,
  "pendingAction": null
}
`;

    const userPrompt = `Read only the Nutrition Facts values visible in this photo.
Barcode context: ${barcode || "unknown"}.
Fallback reason: ${fallbackReason}.
Return the per-serving values for user confirmation.`;

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
          { role: "user", content: [{ type: "text", text: userPrompt }, imageContent] }
        ],
        temperature: 0.05,
        max_tokens: 450,
        response_format: { type: "json_object" }
      })
    });

    const openAiData = await readJson(openAiResponse);
    if (!openAiResponse.ok) {
      await releaseLabelScan(user.id, nutritionDay);
      claimed = false;
      return res.status(openAiResponse.status).json({
        error: openAiData.error?.message || "Nutrition Facts reading failed. Try another photo."
      });
    }

    const rawContent = openAiData.choices?.[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      await releaseLabelScan(user.id, nutritionDay);
      claimed = false;
      return res.status(502).json({
        error: "ARI could not read that label clearly. Retake a closer photo.",
        code: "LABEL_PARSE_FAILED"
      });
    }

    const normalized = normalizeParsedLabel(parsed, { barcode });

    await recordOpenAIUsage({
      userId: user.id,
      endpoint: "/api/image-analyze",
      usageType: "image",
      requestCategory: `nutrition_label:${nutritionDay}`,
      model: openAiData?.model || requestedModel,
      responseData: openAiData,
      providerRequestId: openAiResponse.headers.get("x-request-id") || openAiData?.id || null,
      metadata: {
        source: "nutrition_barcode_fallback",
        fallbackReason,
        barcode: barcode || null,
        nutritionDay,
        dailyLimit: DAILY_LABEL_SCAN_LIMIT
      }
    });

    return res.status(200).json({
      success: true,
      ...normalized,
      dailyLimit: DAILY_LABEL_SCAN_LIMIT,
      scansRemaining: scanClaim.remaining
    });
  } catch (error) {
    if (claimed && user?.id) {
      await releaseLabelScan(user.id, nutritionDay);
    }
    console.error("[ARI Nutrition Vision Error]", error);
    return res.status(500).json({ error: error?.message || "Nutrition Facts reading failed." });
  }
}

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function nonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}
