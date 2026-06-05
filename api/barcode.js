export default async function handler(req, res) {
if (req.method !== "GET" && req.method !== "POST") {
return res.status(405).json({ error: "Method not allowed" });
}

try {
const barcode =
req.method === "GET"
? req.query.barcode
: req.body?.barcode;

if (!barcode) {
return res.status(400).json({ error: "Missing barcode." });
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

const cachedResponse = await fetch(
`${process.env.SUPABASE_URL}/rest/v1/barcode_cache?barcode=eq.${encodeURIComponent(barcode)}&limit=1`,
{
method: "GET",
headers
}
);

const cachedData = await cachedResponse.json();

if (cachedResponse.ok && cachedData?.length) {
const cached = cachedData[0];

await fetch(
`${process.env.SUPABASE_URL}/rest/v1/barcode_cache?id=eq.${cached.id}`,
{
method: "PATCH",
headers,
body: JSON.stringify({
times_scanned: Number(cached.times_scanned || 0) + 1,
updated_at: new Date().toISOString()
})
}
);

return res.status(200).json({
success: true,
source: "barcode_cache",
product: cached
});
}

const offUrl =
`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;

const offResponse = await fetch(offUrl, {
headers: {
"User-Agent": "CalBuddyHealth/1.0 (calbuddyhealth.com)"
}
});

const offData = await offResponse.json();

if (!offResponse.ok || offData.status !== 1 || !offData.product) {
return res.status(404).json({
success: false,
error: "Product not found in Open Food Facts."
});
}

const product = offData.product;
const nutriments = product.nutriments || {};

const calories =
nutriments["energy-kcal_serving"] ??
nutriments["energy-kcal_100g"] ??
0;

const protein =
nutriments["proteins_serving"] ??
nutriments["proteins_100g"] ??
0;

const carbs =
nutriments["carbohydrates_serving"] ??
nutriments["carbohydrates_100g"] ??
0;

const fat =
nutriments["fat_serving"] ??
nutriments["fat_100g"] ??
0;

const productToSave = {
barcode,
product_name: product.product_name || product.generic_name || "Unknown product",
brand: product.brands || "",
serving_size: product.serving_size || "Serving size unknown",
calories: Math.round(Number(calories || 0)),
protein_g: Number(protein || 0),
carbs_g: Number(carbs || 0),
fat_g: Number(fat || 0),
ingredients: product.ingredients_text || "",
image_url: product.image_url || "",
source: "open_food_facts",
raw_data: offData,
times_scanned: 1,
updated_at: new Date().toISOString()
};

const saveResponse = await fetch(
`${process.env.SUPABASE_URL}/rest/v1/barcode_cache`,
{
method: "POST",
headers: {
...headers,
Prefer: "return=representation"
},
body: JSON.stringify(productToSave)
}
);

const savedData = await saveResponse.json();

if (!saveResponse.ok) {
return res.status(200).json({
success: true,
source: "open_food_facts_unsaved",
product: productToSave,
saveError: savedData
});
}

return res.status(200).json({
success: true,
source: "open_food_facts",
product: savedData?.[0] || productToSave
});

} catch (error) {
return res.status(500).json({
error: error.message || "Barcode lookup failed."
});
}
}
