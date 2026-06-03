export default async function handler(req, res) {
const query = req.query.query;

if (!query) {
return res.status(400).json({ error: "Missing food search query." });
}

try {
const apiKey = process.env.USDA_API_KEY;

if (!apiKey) {
return res.status(500).json({ error: "USDA API key is missing." });
}

const url =
`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=10&api_key=${apiKey}`;

const response = await fetch(url);
const data = await response.json();

const foods = (data.foods || []).map((food) => {
const caloriesNutrient = food.foodNutrients?.find(
(nutrient) =>
nutrient.nutrientName === "Energy" ||
nutrient.nutrientName === "Energy (Atwater General Factors)"
);

return {
fdcId: food.fdcId,
description: food.description,
brandName: food.brandName || "",
calories: caloriesNutrient?.value || null
};
});

return res.status(200).json({ foods });
} catch (error) {
return res.status(500).json({
error: "Food search failed.",
details: error.message
});
}
}
