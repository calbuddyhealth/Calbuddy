xport default async function handler(req, res) {
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
const nutrients = food.foodNutrients || [];

const getNutrient = (names) => {
const found = nutrients.find((nutrient) =>
names.some((name) =>
nutrient.nutrientName?.toLowerCase().includes(name.toLowerCase())
)
);

return found?.value ?? null;
};

const calories =
getNutrient(["Energy"]) ??
getNutrient(["Energy (Atwater General Factors)"]);

const protein = getNutrient(["Protein"]);
const carbs = getNutrient(["Carbohydrate, by difference"]);
const fat = getNutrient(["Total lipid", "Total Fat"]);

const servingSize =
food.servingSize && food.servingSizeUnit
? `${food.servingSize} ${food.servingSizeUnit}`
: food.householdServingFullText || "100 g";

return {
fdcId: food.fdcId,
description: food.description,
brandName: food.brandName || "",
calories: calories !== null ? Math.round(Number(calories)) : null,
protein_g: protein !== null ? Number(protein).toFixed(1) : null,
carbs_g: carbs !== null ? Number(carbs).toFixed(1) : null,
fat_g: fat !== null ? Number(fat).toFixed(1) : null,
serving_size: servingSize
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
