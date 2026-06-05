export default async function handler(req, res) {
if (req.method !== "POST") {
return res.status(405).json({ error: "Method not allowed" });
}

try {
const {
imageBase64,
imageUrl,
prompt = "",
analysisType = "general",
user_id = null
} = req.body;

if (!process.env.OPENAI_API_KEY) {
return res.status(500).json({ error: "Missing OPENAI_API_KEY." });
}

if (!imageBase64 && !imageUrl) {
return res.status(400).json({
error: "Missing imageBase64 or imageUrl."
});
}

const imageContent = imageUrl
? { type: "image_url", image_url: { url: imageUrl } }
: {
type: "image_url",
image_url: {
url: `data:image/jpeg;base64,${imageBase64}`
}
};

const systemPrompt = `
You are CalBuddy Vision.

You analyze images for a wellness and nutrition app.

You can inspect:
- food photos
- drinks
- nutrition labels
- restaurant menu screenshots
- grocery items
- barcode/package photos
- progress-related photos
- regular non-food images

Be practical, clear, and careful.

If the image is food:
- Identify visible foods.
- Estimate calories as a range and a midpoint.
- Estimate protein, carbs, and fat if possible.
- Mention uncertainty.
- Ask if the user wants to log it.
- Never claim it was logged.

If the image is a nutrition label:
- Extract calories, serving size, protein, carbs, fat, sugar, sodium if visible.
- Ask if the user wants to log it.

If the image is a restaurant/menu screenshot:
- Identify visible items.
- Estimate calories if possible.
- Suggest a reasonable log entry.

If the image is not nutrition-related:
- Describe what you see.
- Answer the user's prompt normally.
- Do not force nutrition into it.

Return only valid JSON.
No markdown.
No backticks.

JSON shape:
{
"reply": "string",
"analysis_type": "food" | "nutrition_label" | "menu" | "barcode_package" | "progress" | "general",
"detected_items": [],
"estimated_calories_low": number,
"estimated_calories_high": number,
"estimated_calories_midpoint": number,
"protein_g": number,
"carbs_g": number,
"fat_g": number,
"confidence_score": number,
"pendingAction": null or {
"action_type": "log_meal",
"confirmation_text": "string",
"payload": {
"name": "string",
"calories": number,
"category": "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Drink" | "Meal",
"protein_g": number,
"carbs_g": number,
"fat_g": number,
"serving_size": "string",
"multiplier": number
}
}
}
`;

const userPrompt = `
Analysis type requested: ${analysisType}

User prompt:
${prompt || "Analyze this image."}
`;

const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
method: "POST",
headers: {
"Content-Type": "application/json",
Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
},
body: JSON.stringify({
model: "gpt-4o-mini",
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
temperature: 0.35,
max_tokens: 800,
response_format: { type: "json_object" }
})
});

const openAiData = await openAiResponse.json();

if (!openAiResponse.ok) {
return res.status(openAiResponse.status).json({
error: openAiData.error?.message || "OpenAI image analysis failed."
});
}

const rawContent = openAiData.choices?.[0]?.message?.content || "{}";

let parsed;
try {
parsed = JSON.parse(rawContent);
} catch {
parsed = {
reply: rawContent || "I had trouble analyzing that image.",
analysis_type: analysisType,
detected_items: [],
estimated_calories_low: 0,
estimated_calories_high: 0,
estimated_calories_midpoint: 0,
protein_g: 0,
carbs_g: 0,
fat_g: 0,
confidence_score: 0.5,
pendingAction: null
};
}

if (
user_id &&
process.env.SUPABASE_URL &&
process.env.SUPABASE_SERVICE_ROLE_KEY
) {
try {
const headers = {
apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
"Content-Type": "application/json"
};

await fetch(`${process.env.SUPABASE_URL}/rest/v1/food_recognition_history`, {
method: "POST",
headers,
body: JSON.stringify({
user_id,
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
console.log("Image history save failed:", saveError.message);
}
}

return res.status(200).json({
success: true,
...parsed
});

} catch (error) {
return res.status(500).json({
error: error.message || "Image analysis failed."
});
}
}
