// =====================================================
// ARI REBIRTH
// File: AriFoodTopBrandsBatch7.js
// Version: 1.0.0
//
// Purpose:
//   Add 25 de-duplicated high-frequency breakfast and plant-protein foods.
//
// Data policy:
//   - Exact branded product, never a generic estimate.
//   - Current official Kellanova SmartLabel nutrition is authoritative.
//   - Exact labeled serving is retained in metadata.labelNutrition.
//   - Canonical nutrition is normalized mathematically to 100 g.
//   - Product formulations can change; newer package labels supersede
//     this offline snapshot.
// =====================================================

(function initializeAriFoodTopBrandsBatch7(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodTopBrandsBatch7";
  const VERIFIED_AT = "2026-08-30";

  const LABEL_RECORDS = [
    {
      id: "grain-brand-eggo-buttermilk-waffles",
      name: "Buttermilk Waffles",
      displayName: "Eggo Buttermilk Waffles",
      brand: "Eggo",
      category: "grain",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Eggo buttermilk", "Eggo buttermilk waffles"],
      tags: ["waffle", "breakfast"],
      labelNutrition: {
        servingLabel: "2 waffles (70 g)", servingGrams: 70, calories: 180,
        protein: 4, carbs: 30, fat: 5, fiber: 0.5, sugar: 3,
        saturatedFat: 1.5, transFat: 0, cholesterol: 0, sodium: 300, potassium: 50
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/038000403101"
    },
    {
      id: "grain-brand-eggo-chocolatey-chip-pancakes",
      name: "Chocolatey Chip Pancakes",
      displayName: "Eggo Chocolatey Chip Pancakes",
      brand: "Eggo",
      category: "grain",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Eggo chocolate chip pancakes", "Eggo chocolatey chip pancakes"],
      tags: ["pancake", "breakfast", "chocolate"],
      labelNutrition: {
        servingLabel: "3 pancakes (105 g)", servingGrams: 105, calories: 260,
        protein: 5, carbs: 44, fat: 8, fiber: 1, sugar: 12,
        saturatedFat: 1.5, transFat: 0, cholesterol: 0, sodium: 480, potassium: 60
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/038000396724"
    },
    {
      id: "grain-brand-eggo-protein-vanilla-pancakes",
      name: "Protein Vanilla Pancakes",
      displayName: "Eggo Protein Vanilla Pancakes",
      brand: "Eggo",
      category: "grain",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Eggo protein pancakes vanilla", "Eggo vanilla protein pancakes"],
      tags: ["pancake", "breakfast", "high-protein"],
      labelNutrition: {
        servingLabel: "3 pancakes (105 g)", servingGrams: 105, calories: 250,
        protein: 13, carbs: 31, fat: 9, fiber: 0.5, sugar: 9,
        saturatedFat: 1.5, transFat: 0, cholesterol: 10, sodium: 420, potassium: 90
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/00038000305894"
    },
    {
      id: "grain-brand-eggo-chocolatey-chip-waffles",
      name: "Chocolatey Chip Waffles",
      displayName: "Eggo Chocolatey Chip Waffles",
      brand: "Eggo",
      category: "grain",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Eggo chocolate chip waffles", "Eggo chocolatey chip waffles"],
      tags: ["waffle", "breakfast", "chocolate"],
      labelNutrition: {
        servingLabel: "2 waffles (70 g)", servingGrams: 70, calories: 200,
        protein: 3, carbs: 32, fat: 7, fiber: 0.5, sugar: 9,
        saturatedFat: 2.5, transFat: 0, cholesterol: 0, sodium: 320, potassium: 50
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/038000405006"
    },
    {
      id: "grain-brand-eggo-thick-fluffy-cinnamon-brown-sugar-waffles",
      name: "Thick & Fluffy Cinnamon Brown Sugar Waffles",
      displayName: "Eggo Thick & Fluffy Cinnamon Brown Sugar Waffles",
      brand: "Eggo",
      category: "grain",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Eggo thick fluffy cinnamon waffles", "Eggo cinnamon brown sugar waffles"],
      tags: ["waffle", "breakfast", "cinnamon"],
      labelNutrition: {
        servingLabel: "1 waffle (55 g)", servingGrams: 55, calories: 160,
        protein: 2, carbs: 25, fat: 6, fiber: 0.5, sugar: 9,
        saturatedFat: 1.5, transFat: 0, cholesterol: 0, sodium: 240, potassium: 30
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/038000492747"
    },
    {
      id: "grain-brand-eggo-protein-strawberry-delight-waffles",
      name: "Protein Strawberry Delight Waffles",
      displayName: "Eggo Protein Strawberry Delight Waffles",
      brand: "Eggo",
      category: "grain",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Eggo protein strawberry waffles", "Eggo strawberry protein waffles"],
      tags: ["waffle", "breakfast", "high-protein", "strawberry"],
      labelNutrition: {
        servingLabel: "2 waffles (70 g)", servingGrams: 70, calories: 190,
        protein: 10, carbs: 23, fat: 6, fiber: 0.5, sugar: 7,
        saturatedFat: 2, transFat: 0, cholesterol: 10, sodium: 290, potassium: 50
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/00038000293061"
    },
    {
      id: "grain-brand-eggo-protein-blueberry-pancakes",
      name: "Protein Blueberry Pancakes",
      displayName: "Eggo Protein Blueberry Pancakes",
      brand: "Eggo",
      category: "grain",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Eggo protein blueberry pancakes", "Eggo blueberry protein pancakes"],
      tags: ["pancake", "breakfast", "high-protein", "blueberry"],
      labelNutrition: {
        servingLabel: "3 pancakes (105 g)", servingGrams: 105, calories: 260,
        protein: 13, carbs: 31, fat: 9, fiber: 0.5, sugar: 8,
        saturatedFat: 1.5, transFat: 0, cholesterol: 10, sodium: 420, potassium: 80
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/00038000305924"
    },
    {
      id: "grain-brand-eggo-minis-french-toast-chocolate-chip",
      name: "Minis French Toast Chocolate Chip",
      displayName: "Eggo Minis French Toast Chocolate Chip",
      brand: "Eggo",
      category: "grain",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Eggo minis french toast chocolate chip", "Eggo chocolate chip french toast minis"],
      tags: ["french-toast", "breakfast", "chocolate"],
      labelNutrition: {
        servingLabel: "1 pouch (86 g)", servingGrams: 86, calories: 190,
        protein: 4, carbs: 37, fat: 5, fiber: 6, sugar: 11,
        saturatedFat: 1.5, transFat: 0, cholesterol: 0, sodium: 210, potassium: 190
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/00038000808012"
    },
    {
      id: "grain-brand-eggo-cinnamon-roll-waffles",
      name: "Cinnamon Roll Waffles",
      displayName: "Eggo Cinnamon Roll Waffles",
      brand: "Eggo",
      category: "grain",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Eggo cinnamon roll", "Eggo cinnamon waffles"],
      tags: ["waffle", "breakfast", "cinnamon"],
      labelNutrition: {
        servingLabel: "2 waffles (70 g)", servingGrams: 70, calories: 190,
        protein: 3, carbs: 30, fat: 7, fiber: 0.5, sugar: 9,
        saturatedFat: 2.5, transFat: 0, cholesterol: 0, sodium: 280, potassium: 40
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/00038000330476"
    },
    {
      id: "grain-brand-eggo-minis-pancakes",
      name: "Minis Pancakes",
      displayName: "Eggo Minis Pancakes",
      brand: "Eggo",
      category: "grain",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Eggo mini pancakes", "Eggo minis pancakes"],
      tags: ["pancake", "breakfast"],
      labelNutrition: {
        servingLabel: "11 pancakes (110 g)", servingGrams: 110, calories: 270,
        protein: 6, carbs: 44, fat: 8, fiber: 1, sugar: 11,
        saturatedFat: 1.5, transFat: 0, cholesterol: 0, sodium: 560, potassium: 50
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/038000260650"
    },
    {
      id: "grain-brand-eggo-minis-berry-blast-toast-waffles",
      name: "Minis Berry Blast Toast Waffles",
      displayName: "Eggo Minis Berry Blast Toast Waffles",
      brand: "Eggo",
      category: "grain",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Eggo berry blast minis", "Eggo mini berry waffles"],
      tags: ["waffle", "breakfast", "berry"],
      labelNutrition: {
        servingLabel: "3 sets of 4 waffles (92 g)", servingGrams: 92, calories: 260,
        protein: 5, carbs: 43, fat: 8, fiber: 1, sugar: 8,
        saturatedFat: 2, transFat: 0, cholesterol: 0, sodium: 470, potassium: 50
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/00038000280016"
    },
    {
      id: "grain-brand-eggo-buttermilk-pancakes",
      name: "Buttermilk Pancakes",
      displayName: "Eggo Buttermilk Pancakes",
      brand: "Eggo",
      category: "grain",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Eggo buttermilk pancakes", "Eggo pancakes"],
      tags: ["pancake", "breakfast"],
      labelNutrition: {
        servingLabel: "3 pancakes (105 g)", servingGrams: 105, calories: 250,
        protein: 5, carbs: 40, fat: 8, fiber: 0.5, sugar: 10,
        saturatedFat: 1, transFat: 0, cholesterol: 0, sodium: 520, potassium: 50
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/00038000249051"
    },
    {
      id: "grain-brand-eggo-blueberry-waffles",
      name: "Blueberry Waffles",
      displayName: "Eggo Blueberry Waffles",
      brand: "Eggo",
      category: "grain",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Eggo blueberry", "Eggo blueberry waffles"],
      tags: ["waffle", "breakfast", "blueberry"],
      labelNutrition: {
        servingLabel: "2 waffles (70 g)", servingGrams: 70, calories: 180,
        protein: 3, carbs: 30, fat: 6, fiber: 0.5, sugar: 6,
        saturatedFat: 1.5, transFat: 0, cholesterol: 0, sodium: 360, potassium: 30
      },
      sourceUrl: "https://smartlabel.kelloggs.com/en_US/Product/Index/00038000333606"
    },
    {
      id: "grain-brand-eggo-strawberry-waffles",
      name: "Strawberry Waffles",
      displayName: "Eggo Strawberry Waffles",
      brand: "Eggo",
      category: "grain",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Eggo strawberry", "Eggo strawberry waffles"],
      tags: ["waffle", "breakfast", "strawberry"],
      labelNutrition: {
        servingLabel: "2 waffles (70 g)", servingGrams: 70, calories: 180,
        protein: 3, carbs: 30, fat: 6, fiber: 0.5, sugar: 6,
        saturatedFat: 1.5, transFat: 0, cholesterol: 0, sodium: 350, potassium: 30
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/038000403408"
    },
    {
      id: "grain-brand-eggo-thick-fluffy-original-waffles",
      name: "Thick & Fluffy Original Waffles",
      displayName: "Eggo Thick & Fluffy Original Waffles",
      brand: "Eggo",
      category: "grain",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Eggo thick and fluffy original", "Eggo thick fluffy waffles"],
      tags: ["waffle", "breakfast"],
      labelNutrition: {
        servingLabel: "1 waffle (55 g)", servingGrams: 55, calories: 160,
        protein: 3, carbs: 23, fat: 7, fiber: 0.5, sugar: 6,
        saturatedFat: 2, transFat: 0, cholesterol: 0, sodium: 260, potassium: 30
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/00038000578731"
    },
    {
      id: "grain-brand-eggo-protein-blueberry-waffles",
      name: "Protein Blueberry Waffles",
      displayName: "Eggo Protein Blueberry Waffles",
      brand: "Eggo",
      category: "grain",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Eggo protein blueberry waffles", "Eggo blueberry protein waffles"],
      tags: ["waffle", "breakfast", "high-protein", "blueberry"],
      labelNutrition: {
        servingLabel: "2 waffles (70 g)", servingGrams: 70, calories: 180,
        protein: 10, carbs: 23, fat: 5, fiber: 1, sugar: 7,
        saturatedFat: 1.5, transFat: 0, cholesterol: 10, sodium: 290, potassium: 60
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/00038000313271"
    },
    {
      id: "grain-brand-eggo-protein-buttermilk-vanilla-waffles",
      name: "Protein Buttermilk Vanilla Waffles",
      displayName: "Eggo Protein Buttermilk Vanilla Waffles",
      brand: "Eggo",
      category: "grain",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Eggo protein vanilla waffles", "Eggo buttermilk vanilla protein waffles"],
      tags: ["waffle", "breakfast", "high-protein", "vanilla"],
      labelNutrition: {
        servingLabel: "2 waffles (70 g)", servingGrams: 70, calories: 180,
        protein: 10, carbs: 26, fat: 4.5, fiber: 0.5, sugar: 11,
        saturatedFat: 1.5, transFat: 0, cholesterol: 10, sodium: 290, potassium: 60
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/00038000309403"
    },
    {
      id: "grain-brand-eggo-thick-fluffy-blueberry-waffles",
      name: "Thick & Fluffy Blueberry Waffles",
      displayName: "Eggo Thick & Fluffy Blueberry Waffles",
      brand: "Eggo",
      category: "grain",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Eggo thick fluffy blueberry", "Eggo thick blueberry waffles"],
      tags: ["waffle", "breakfast", "blueberry"],
      labelNutrition: {
        servingLabel: "1 waffle (55 g)", servingGrams: 55, calories: 160,
        protein: 2, carbs: 25, fat: 6, fiber: 0.5, sugar: 8,
        saturatedFat: 2, transFat: 0, cholesterol: 0, sodium: 240, potassium: 20
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/00038000131929"
    },
    {
      id: "grain-brand-eggo-vanilla-bean-belgian-street-waffles",
      name: "Vanilla Bean Belgian Style Street Waffles",
      displayName: "Eggo Vanilla Bean Belgian Style Street Waffles",
      brand: "Eggo",
      category: "grain",
      state: "frozen",
      preparation: "ready-to-eat-or-heat",
      aliases: ["Eggo Belgian street waffle vanilla", "Eggo vanilla bean street waffle"],
      tags: ["waffle", "breakfast", "belgian", "vanilla"],
      labelNutrition: {
        servingLabel: "1 waffle (55 g)", servingGrams: 55, calories: 230,
        protein: 5, carbs: 29, fat: 10, fiber: 0.5, sugar: 12,
        saturatedFat: 6, transFat: 0, cholesterol: 60, sodium: 200, potassium: 70
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/00038000279553"
    },
    {
      id: "protein-brand-morningstar-garden-veggie-burgers",
      name: "Garden Veggie Burgers",
      displayName: "MorningStar Farms Garden Veggie Burgers",
      brand: "MorningStar Farms",
      category: "protein",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["MorningStar veggie burger", "MorningStar garden veggie burger"],
      tags: ["plant-based", "veggie-burger", "burger"],
      labelNutrition: {
        servingLabel: "1 burger (67 g)", servingGrams: 67, calories: 100,
        protein: 10, carbs: 10, fat: 3, fiber: 5, sugar: 2,
        saturatedFat: 0, transFat: 0, cholesterol: 0, sodium: 280, potassium: 250
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/00028989100689"
    },
    {
      id: "protein-brand-morningstar-steakhouse-style-burgers",
      name: "Steakhouse Style Burgers",
      displayName: "MorningStar Farms Steakhouse Style Burgers",
      brand: "MorningStar Farms",
      category: "protein",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["MorningStar steakhouse burger", "MorningStar plant burger"],
      tags: ["plant-based", "veggie-burger", "burger"],
      labelNutrition: {
        servingLabel: "1 burger (113 g)", servingGrams: 113, calories: 220,
        protein: 20, carbs: 12, fat: 14, fiber: 6, sugar: 0.5,
        saturatedFat: 2, transFat: 0, cholesterol: 0, sodium: 470, potassium: 710
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/00028989105660"
    },
    {
      id: "protein-brand-morningstar-veggie-dogs",
      name: "Veggie Dogs",
      displayName: "MorningStar Farms Veggie Dogs",
      brand: "MorningStar Farms",
      category: "protein",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["MorningStar veggie hot dogs", "MorningStar veggie dogs"],
      tags: ["plant-based", "veggie-dog", "hot-dog"],
      labelNutrition: {
        servingLabel: "1 link (40 g)", servingGrams: 40, calories: 60,
        protein: 9, carbs: 5, fat: 0.5, fiber: 0, sugar: 2,
        saturatedFat: 0, transFat: 0, cholesterol: 0, sodium: 370, potassium: 30
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/00028989577993"
    },
    {
      id: "protein-brand-morningstar-sausage-links",
      name: "Sausage Links",
      displayName: "MorningStar Farms Sausage Links",
      brand: "MorningStar Farms",
      category: "protein",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["MorningStar sausage links", "MorningStar veggie sausage links"],
      tags: ["plant-based", "breakfast", "sausage"],
      labelNutrition: {
        servingLabel: "2 links (45 g)", servingGrams: 45, calories: 70,
        protein: 8, carbs: 3, fat: 3.5, fiber: 0.5, sugar: 0,
        saturatedFat: 0, transFat: 0, cholesterol: 0, sodium: 330, potassium: 50
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/00028989971104"
    },
    {
      id: "protein-brand-morningstar-original-chik-patties",
      name: "Original Chik Patties",
      displayName: "MorningStar Farms Original Chik Patties",
      brand: "MorningStar Farms",
      category: "protein",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["MorningStar chik patty", "MorningStar chicken patty vegetarian"],
      tags: ["plant-based", "chik-patty", "breaded"],
      labelNutrition: {
        servingLabel: "1 patty (71 g)", servingGrams: 71, calories: 160,
        protein: 9, carbs: 18, fat: 7, fiber: 2, sugar: 2,
        saturatedFat: 1, transFat: 0, cholesterol: 0, sodium: 410, potassium: 350
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/028989102027"
    },
    {
      id: "protein-brand-morningstar-grillers-original-burgers",
      name: "Grillers Original Burgers",
      displayName: "MorningStar Farms Grillers Original Burgers",
      brand: "MorningStar Farms",
      category: "protein",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["MorningStar Grillers Original", "MorningStar veggie burger original"],
      tags: ["plant-based", "veggie-burger", "burger"],
      labelNutrition: {
        servingLabel: "1 burger (64 g)", servingGrams: 64, calories: 150,
        protein: 16, carbs: 8, fat: 7, fiber: 4, sugar: 0.5,
        saturatedFat: 1, transFat: 0, cholesterol: 0, sodium: 280, potassium: 240
      },
      sourceUrl: "https://smartlabel.kelloggs.com/Product/Index/028989100825"
    }
  ];

  function round(value) {
    return Math.round(Number(value) * 1000) / 1000;
  }

  function normalizeRecord(record) {
    const serving = record.labelNutrition;
    const servingGrams = Number(serving.servingGrams);
    const factor = 100 / servingGrams;
    const nutrition = {};

    for (const key of ["calories", "protein", "carbs", "fat", "fiber", "sugar", "saturatedFat", "transFat", "cholesterol", "sodium", "potassium"]) {
      if (Number.isFinite(Number(serving[key]))) nutrition[key] = round(Number(serving[key]) * factor);
    }

    return {
      id: record.id,
      name: record.name,
      displayName: record.displayName,
      brand: record.brand,
      category: record.category,
      state: record.state || "frozen",
      preparation: record.preparation || "packaged",
      aliases: record.aliases || [record.displayName],
      tags: Array.from(new Set([record.category, "branded", "packaged", ...(record.tags || [])])),
      popularity: 100,
      nutritionBasis: { type: "weight", amount: 100, unit: "g", grams: 100 },
      nutrition,
      servings: [
        { id: "label-serving", label: serving.servingLabel, amount: 1, unit: "serving", grams: servingGrams, isDefault: true },
        { id: "one-ounce", label: "1 oz", amount: 1, unit: "oz", grams: 28.3495, isDefault: false },
        { id: "100-g", label: "100 g", amount: 100, unit: "g", grams: 100, isDefault: false }
      ],
      source: MODULE_NAME,
      verified: true,
      metadata: {
        brandSpecific: true,
        packagedProduct: true,
        dataVerifiedAt: VERIFIED_AT,
        confidence: "high",
        labelNutrition: { ...serving },
        sourceProvenance: {
          provider: `Kellanova / ${record.brand}`,
          sourceType: "current official manufacturer SmartLabel nutrition",
          sourceUrl: record.sourceUrl,
          sourceTier: "manufacturer",
          verifiedAt: VERIFIED_AT
        },
        offlineReference: true,
        normalizationMethod: "Exact manufacturer label serving normalized mathematically to 100 g.",
        notes: "Values labeled <1 g are represented as 0.5 g only where a numeric value is required for normalization. A newer package/manufacturer label supersedes this offline snapshot."
      }
    };
  }

  const FOODS = Object.freeze(LABEL_RECORDS.map(normalizeRecord));
  const registry = global.AriFoodRegistry;

  if (!registry || typeof registry.registerMany !== "function") {
    console.error(`[ARI Nutrition] ${MODULE_NAME} requires AriFoodRegistry.registerMany().`);
    return;
  }

  if (typeof registry.getBySource === "function" && typeof registry.remove === "function") {
    try {
      for (const food of registry.getBySource(MODULE_NAME, { includeDisabled: true }) || []) {
        if (food?.id) registry.remove(food.id);
      }
    } catch (error) {
      console.warn(`[ARI Nutrition] ${MODULE_NAME} could not clear prior records.`, error);
    }
  }

  const registration = registry.registerMany(FOODS, { source: MODULE_NAME });
  if ((registration.rejected || 0) > 0) {
    console.error(`[ARI Nutrition] ${MODULE_NAME}: rejected ${registration.rejected} record(s).`);
  }

  global.AriFoodTopBrandsBatch7 = Object.freeze({
    VERSION,
    MODULE_NAME,
    VERIFIED_AT,
    count: () => FOODS.length,
    getFoodIds: () => FOODS.map((food) => food.id),
    getRecord(foodId) {
      const found = FOODS.find((food) => food.id === foodId);
      return found ? JSON.parse(JSON.stringify(found)) : null;
    }
  });
})(window);
