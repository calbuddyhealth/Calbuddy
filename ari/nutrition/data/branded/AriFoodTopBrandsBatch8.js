// =====================================================
// ARI REBIRTH
// File: AriFoodTopBrandsBatch8.js
// Version: 1.0.0
// Purpose: 25 de-duplicated Nature Valley packaged snacks.
// =====================================================
(function initializeAriFoodTopBrandsBatch8(global) {
  "use strict";
  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodTopBrandsBatch8";
  const VERIFIED_AT = "2026-08-30";

  const R = (id,name,grams,cal,p,c,f,fi,su,sat,so,url,aliases=[],tags=[],mass="label") => ({
    id:`snack-brand-nature-valley-${id}`, name, displayName:`Nature Valley ${name}`, brand:"Nature Valley",
    category:"snacks", state:"ready-to-eat", preparation:"packaged-snack",
    aliases:[`Nature Valley ${name}`,...aliases], tags:["snack-bar","nature-valley",...tags],
    labelNutrition:{ servingLabel: name.includes("Crunchy") ? `2 bars (${grams} g)` : `1 bar (${grams} g)`, servingGrams:grams, calories:cal, protein:p, carbs:c, fat:f, fiber:fi, sugar:su, saturatedFat:sat, transFat:0, cholesterol:0, sodium:so },
    sourceUrl:url, massSource:mass
  });

  const LABEL_RECORDS = [
    R("peanut-butter-crunchy","Peanut Butter Crunchy Granola Bars",42,200,4,28,8,2,10,0,160,"https://www.naturevalley.com/products/peanut-butter-crunchy-granola-bars",["Nature Valley peanut butter bars"],["granola-bar","crunchy"]),
    R("peanut-butter-dark-chocolate-crunchy","Peanut Butter Dark Chocolate Crunchy Granola Bars",42,200,4,28,8,2,12,1.5,180,"https://www.naturevalley.com/products/peanut-butter-dark-chocolate-crunchy-granola-bars",[],["granola-bar","crunchy","chocolate"]),
    R("roasted-almond-crunchy","Roasted Almond Crunchy Granola Bars",42,200,4,28,8,3,11,1,140,"https://www.naturevalley.com/products/roasted-almond-crunchy-granola-bars",[],["granola-bar","crunchy","almond"]),
    R("cinnamon-crunchy","Cinnamon Crunchy Granola Bars",42,190,3,29,7,2,11,0.5,150,"https://www.naturevalley.com/products/cinnamon-crunchy-granola-bars",[],["granola-bar","crunchy","cinnamon"]),
    R("pecan-crunchy","Pecan Crunchy Granola Bars",42,200,3,28,8,2,11,1,150,"https://www.naturevalley.com/products/pecan-crunchy-granola-bars",[],["granola-bar","crunchy","pecan"]),
    R("oats-dark-chocolate-crunchy","Oats 'n Dark Chocolate Crunchy Granola Bars",42,200,3,29,8,3,12,1.5,135,"https://www.naturevalley.com/products/oats-n-dark-chocolate-crunchy-granola-bars",["Nature Valley dark chocolate crunchy bars"],["granola-bar","crunchy","chocolate"]),
    R("apple-crisp-crunchy","Apple Crisp Crunchy Granola Bars",42,190,3,28,8,2,10,0,150,"https://www.naturevalley.com/products/apple-crisp-crunchy-granola-bars",[],["granola-bar","crunchy","apple"]),
    R("maple-brown-sugar-crunchy","Maple Brown Sugar Crunchy Granola Bars",42,190,3,29,7,2,12,0.5,150,"https://www.naturevalley.com/products/maple-brown-sugar-crunchy-granola-bars",[],["granola-bar","crunchy","maple"]),

    R("peanut-sweet-salty","Peanut Sweet & Salty Granola Bar",34,160,3,20,8,1,7,2.5,140,"https://www.naturevalley.com/products/peanut-sweet-salty-granola-bars-12ct",[],["granola-bar","sweet-salty","peanut"]),
    R("almond-sweet-salty","Almond Sweet & Salty Granola Bar",34,160,3,21,7,2,8,2,140,"https://www.naturevalley.com/products/almond-sweet-salty-granola-bars",[],["granola-bar","sweet-salty","almond"],"manufacturer-net-weight-cross-check"),
    R("cashew-sweet-salty","Cashew Sweet & Salty Granola Bar",35,160,2,22,6,1,9,2.5,140,"https://www.naturevalley.com/products/cashew-sweet-salty-granola-bars",[],["granola-bar","sweet-salty","cashew"],"manufacturer-net-weight-cross-check"),
    R("roasted-mixed-nut-sweet-salty","Roasted Mixed Nut Sweet & Salty Granola Bar",35,160,3,21,7,1,9,2.5,140,"https://www.naturevalley.com/products/roasted-mixed-nut-sweet-salty-granola-bars",[],["granola-bar","sweet-salty","mixed-nut"],"manufacturer-net-weight-cross-check"),
    R("chocolate-pretzel-sweet-salty","Chocolate Pretzel Nut Sweet & Salty Granola Bar",35,150,2,24,5,2,8,2,110,"https://www.naturevalley.com/products/chocolate-pretzel-nut-sweet-salty-granola-bars",[],["granola-bar","sweet-salty","pretzel","chocolate"],"manufacturer-net-weight-cross-check"),
    R("dark-chocolate-peanut-almond-sweet-salty","Dark Chocolate Peanut & Almond Sweet & Salty Granola Bar",35,160,3,21,7,2,9,3,120,"https://www.naturevalley.com/products/dark-chocolate-peanut-almond-sweet-salty-granola-bars",[],["granola-bar","sweet-salty","chocolate","almond","peanut"],"manufacturer-net-weight-cross-check"),
    R("salted-caramel-chocolate-sweet-salty","Salted Caramel Chocolate Sweet & Salty Granola Bar",35,160,3,21,7,2,10,2.5,140,"https://www.naturevalley.com/products/salted-caramel-chocolate-sweet-salty-granola-bars",[],["granola-bar","sweet-salty","caramel","chocolate"],"manufacturer-net-weight-cross-check"),

    R("peanut-butter-chocolate-wafer","Peanut Butter Chocolate Wafer Bar",37,200,4,19,12,2,8,5,135,"https://www.naturevalley.com/products/peanut-butter-chocolate-wafer-bars",[],["wafer-bar","peanut-butter","chocolate"],"manufacturer-net-weight-cross-check"),
    R("peanut-butter-wafer","Peanut Butter Wafer Bar",37,200,4,18,12,2,8,5,160,"https://www.naturevalley.com/products/peanut-butter-wafer-bars",[],["wafer-bar","peanut-butter"],"manufacturer-net-weight-cross-check"),
    R("pretzel-peanut-butter-wafer","Pretzel Peanut Butter Wafer Bar",37,190,4,20,11,2,9,5,170,"https://www.naturevalley.com/products/pretzel-peanut-butter-wafer-bars",[],["wafer-bar","pretzel","peanut-butter"],"manufacturer-net-weight-cross-check"),
    R("blueberry-wafer","Blueberry Wafer Bar",37,190,2,21,12,2,9,6,80,"https://www.naturevalley.com/products/blueberry-wafer-bar",[],["wafer-bar","blueberry"],"manufacturer-net-weight-cross-check"),
    R("lemon-wafer","Lemon Wafer Bar",37,200,2,21,12,2,9,6,85,"https://www.naturevalley.com/products/lemon-waffer-bar",[],["wafer-bar","lemon"],"manufacturer-net-weight-cross-check"),
    R("honey-vanilla-wafer","Honey Vanilla Wafer Bar",37,200,2,21,12,2,9,6,80,"https://www.naturevalley.com/products/honey-vanilla-wafer-bar",[],["wafer-bar","honey","vanilla"],"manufacturer-net-weight-cross-check"),
    R("strawberry-wafer","Strawberry Wafer Bar",37,200,2,21,12,2,9,6,80,"https://www.naturevalley.com/products/strawberry-wafer-bars",[],["wafer-bar","strawberry"],"manufacturer-net-weight-cross-check"),

    R("peanut-butter-biscuit-sandwich","Peanut Butter Biscuit Sandwich",38,190,4,22,10,3,8,2,160,"https://www.naturevalley.com/products/peanut-butter-biscuit-sandwiches",[],["biscuit-sandwich","peanut-butter"],"manufacturer-net-weight-cross-check"),
    R("chocolate-peanut-butter-biscuit-sandwich","Chocolate Peanut Butter Biscuit Sandwich",38,190,4,22,10,2,9,2.5,160,"https://www.naturevalley.com/products/chocolate-peanut-butter-biscuit-sandwiches",[],["biscuit-sandwich","peanut-butter","chocolate"],"manufacturer-net-weight-cross-check"),
    R("cocoa-almond-butter-biscuit-sandwich","Cocoa Almond Butter Biscuit Sandwich",38,190,4,22,10,3,9,2,150,"https://www.naturevalley.com/products/cocoa-almond-butter-biscuit-sandwiches",[],["biscuit-sandwich","almond","cocoa"],"manufacturer-net-weight-cross-check")
  ];

  function round(v){ return Math.round(Number(v)*1000)/1000; }
  function normalizeRecord(r){
    const s=r.labelNutrition, factor=100/s.servingGrams, nutrition={};
    for(const key of ["calories","protein","carbs","fat","fiber","sugar","saturatedFat","transFat","cholesterol","sodium","potassium"]) if(Number.isFinite(Number(s[key]))) nutrition[key]=round(Number(s[key])*factor);
    return { id:r.id,name:r.name,displayName:r.displayName,brand:r.brand,category:r.category,state:r.state,preparation:r.preparation,
      aliases:r.aliases,tags:Array.from(new Set([r.category,"branded","packaged",...r.tags])),popularity:100,
      nutritionBasis:{type:"weight",amount:100,unit:"g",grams:100},nutrition,
      servings:[{id:"label-serving",label:s.servingLabel,amount:1,unit:"serving",grams:s.servingGrams,isDefault:true},{id:"100-g",label:"100 g",amount:100,unit:"g",grams:100,isDefault:false}],
      source:MODULE_NAME,verified:true,metadata:{brandSpecific:true,packagedProduct:true,dataVerifiedAt:VERIFIED_AT,confidence:r.massSource==="label"?"high":"medium-high",labelNutrition:{...s},sourceProvenance:{provider:"Nature Valley / General Mills",sourceType:r.massSource==="label"?"official manufacturer product nutrition":"official manufacturer nutrition plus net-weight/serving-count mass cross-check",sourceUrl:r.sourceUrl,sourceTier:"manufacturer",verifiedAt:VERIFIED_AT},offlineReference:true,normalizationMethod:"Manufacturer serving normalized mathematically to 100 g.",servingMassSource:r.massSource,notes:r.massSource==="label"?"Current manufacturer product data.":"Nutrition values are manufacturer-published; serving mass is cross-checked from manufacturer net package weight and labeled serving count where the crawl omits parenthetical grams."}}
    };
  }
  const FOODS=Object.freeze(LABEL_RECORDS.map(normalizeRecord));
  const registry=global.AriFoodRegistry;
  if(!registry||typeof registry.registerMany!=="function"){ console.error(`[ARI Nutrition] ${MODULE_NAME} requires AriFoodRegistry.registerMany().`); return; }
  if(typeof registry.getBySource==="function"&&typeof registry.remove==="function") try{ for(const food of registry.getBySource(MODULE_NAME,{includeDisabled:true})||[]) if(food?.id) registry.remove(food.id); }catch(error){ console.warn(`[ARI Nutrition] ${MODULE_NAME} could not clear prior records.`,error); }
  registry.registerMany(FOODS,{source:MODULE_NAME});
  global.AriFoodTopBrandsBatch8=Object.freeze({VERSION,MODULE_NAME,count:()=>FOODS.length,foods:()=>FOODS.slice()});
})(window);
