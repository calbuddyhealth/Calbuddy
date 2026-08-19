/* =====================================================
   ARI Nutrition Barcode Scan
   Version: 1.0.0
   - Barcode scan is the default camera path.
   - Nutrition Facts vision only appears after an uncertain/missing barcode.
   - Vision results require user confirmation before meal save/evidence storage.
===================================================== */

(() => {
  "use strict";

  const state = {
    controls: null,
    codeReader: null,
    lookupBusy: false,
    barcode: "",
    lookupStatus: "",
    fallbackReason: "",
    match: null,
    resultKind: null,
    quantity: 1,
    labelResult: null,
    formContext: null,
    pendingEvidence: null
  };

  const $ = (id) => document.getElementById(id);
  const number = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };
  const round = (value, decimals = 1) => {
    const factor = 10 ** decimals;
    return Math.round((number(value) + Number.EPSILON) * factor) / factor;
  };
  const escapeText = (value) => String(value ?? "").trim();

  function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function localTimeString(date = new Date()) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  async function session() {
    const client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase;
    if (!client?.auth?.getSession) return null;
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data?.session || null;
  }

  function setStatus(message) {
    const node = $("nutritionScanStatus");
    if (node) node.textContent = message || "";
  }

  function setSheetOpen(open) {
    const sheet = $("nutritionScanSheet");
    if (!sheet) return;
    sheet.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
  }

  function resetResultUi() {
    state.lookupStatus = "";
    state.fallbackReason = "";
    state.match = null;
    state.resultKind = null;
    state.quantity = 1;
    state.labelResult = null;
    $("nutritionScanResult")?.setAttribute("hidden", "");
    $("nutritionLabelFallback")?.setAttribute("hidden", "");
    const input = $("nutritionLabelImageInput");
    if (input) input.value = "";
  }

  async function openScanner() {
    resetResultUi();
    state.barcode = "";
    setSheetOpen(true);
    setStatus("Point the camera at the product barcode.");

    // Native iOS bridge can replace the web decoder without changing Nutrition UI.
    const nativeScanner = window.webkit?.messageHandlers?.ariBarcodeScanner;
    if (nativeScanner?.postMessage) {
      try {
        nativeScanner.postMessage({ action: "scan", source: "nutrition" });
        setStatus("Scanner ready.");
        return;
      } catch (error) {
        console.warn("[ARI Nutrition Native Scanner]", error);
      }
    }

    await startWebScanner();
  }

  async function startWebScanner() {
    stopCamera();
    const video = $("nutritionBarcodeVideo");
    if (!video || !window.ZXingBrowser?.BrowserMultiFormatReader) {
      setStatus("Camera barcode scanning is not available here. Enter the barcode below.");
      return;
    }

    try {
      state.codeReader = new window.ZXingBrowser.BrowserMultiFormatReader();
      state.controls = await state.codeReader.decodeFromVideoDevice(
        undefined,
        video,
        (result) => {
          if (!result || state.lookupBusy) return;
          const text = escapeText(result.getText?.() || result.text || "");
          if (!/^\d{8,14}$/.test(text)) return;
          stopCamera();
          lookupBarcode(text);
        }
      );
    } catch (error) {
      console.warn("[ARI Nutrition Barcode Camera]", error);
      setStatus("Camera access was unavailable. You can enter the barcode below.");
    }
  }

  function stopCamera() {
    try { state.controls?.stop?.(); } catch {}
    state.controls = null;
    const video = $("nutritionBarcodeVideo");
    const stream = video?.srcObject;
    if (stream?.getTracks) stream.getTracks().forEach((track) => track.stop());
    if (video) video.srcObject = null;
  }

  function closeScanner() {
    stopCamera();
    setSheetOpen(false);
  }

  async function lookupBarcode(rawBarcode) {
    const barcode = escapeText(rawBarcode).replace(/\D/g, "");
    if (barcode.length < 8 || barcode.length > 14 || state.lookupBusy) {
      if (!state.lookupBusy) setStatus("Enter a valid 8–14 digit UPC/EAN barcode.");
      return;
    }

    state.lookupBusy = true;
    state.barcode = barcode;
    resetResultUi();
    setStatus("Looking up this product…");

    try {
      const auth = await session();
      if (!auth?.access_token) throw new Error("Sign in to use barcode lookup.");

      const response = await fetch("/api/ari-food-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.access_token}`
        },
        body: JSON.stringify({ mode: "barcode", barcode })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Barcode lookup failed.");

      state.lookupStatus = data.lookupStatus || "not_found";
      state.fallbackReason = data.fallbackReason || "barcode_not_found";
      state.match = data.match || null;

      if (data.match && data.lookupStatus === "matched") {
        state.resultKind = "barcode";
        state.quantity = 1;
        renderResult(data.match, { sourceLabel: "Barcode match", canAdd: true });
        setStatus("Product found. Confirm the serving and add it.");
      } else {
        if (data.match) {
          renderResult(data.match, { sourceLabel: "Possible match", canAdd: false });
          setStatus("I found the product, but the nutrition data needs verification.");
        } else {
          setStatus("I couldn't verify this barcode.");
        }
        await revealLabelFallback();
      }
    } catch (error) {
      console.error("[ARI Nutrition Barcode Lookup]", error);
      setStatus(error?.message || "Barcode lookup failed.");
    } finally {
      state.lookupBusy = false;
    }
  }

  function labelNutritionFromMatch(match) {
    const label = match?.metadata?.labelNutrition || {};
    return {
      servingLabel: escapeText(label.servingLabel || match?.servings?.find?.((item) => item?.isDefault)?.label || "1 serving"),
      servingGrams: number(label.servingGrams, 0),
      calories: number(label.calories, 0),
      protein: number(label.protein, 0),
      carbs: number(label.carbs, 0),
      fat: number(label.fat, 0),
      sugar: number(label.sugar, 0),
      sodiumMg: number(label.sodiumMg, 0)
    };
  }

  function currentNutrition() {
    if (state.resultKind === "label" && state.labelResult) {
      return {
        servingLabel: escapeText(state.labelResult.serving_label || state.labelResult.serving_size || "1 serving"),
        servingGrams: number(state.labelResult.serving_grams, 0),
        calories: number(state.labelResult.calories_per_serving, 0),
        protein: number(state.labelResult.protein_g, 0),
        carbs: number(state.labelResult.carbs_g, 0),
        fat: number(state.labelResult.fat_g, 0),
        sugar: number(state.labelResult.sugar_g, 0),
        sodiumMg: number(state.labelResult.sodium_mg, 0)
      };
    }
    return labelNutritionFromMatch(state.match);
  }

  function renderResult(match, options = {}) {
    const container = $("nutritionScanResult");
    if (!container) return;
    container.hidden = false;
    $("nutritionResultSource").textContent = options.sourceLabel || "Product";
    $("nutritionResultName").textContent = match?.displayName || match?.name || "Packaged food";
    $("nutritionResultServing").textContent = labelNutritionFromMatch(match).servingLabel;
    const add = $("nutritionResultAdd");
    if (add) add.hidden = options.canAdd !== true;
    renderMetrics();
  }

  function renderMetrics() {
    const nutrition = currentNutrition();
    const q = state.quantity;
    $("nutritionResultCalories").textContent = `${Math.round(nutrition.calories * q)}`;
    $("nutritionResultProtein").textContent = `${round(nutrition.protein * q, 1)}g`;
    $("nutritionResultCarbs").textContent = `${round(nutrition.carbs * q, 1)}g`;
    $("nutritionResultFat").textContent = `${round(nutrition.fat * q, 1)}g`;
    $("nutritionServingValue").textContent = q === 1 ? "1 serving" : `${round(q, 2)} servings`;
  }

  function changeQuantity(delta) {
    state.quantity = Math.max(0.25, Math.min(20, round(state.quantity + delta, 2)));
    renderMetrics();
  }

  async function revealLabelFallback() {
    const block = $("nutritionLabelFallback");
    if (!block) return;
    block.hidden = false;
    const remaining = await getRemainingLabelScans();
    const label = $("nutritionLabelLimit");
    if (label) {
      label.textContent = remaining === null
        ? "Up to 3 Nutrition Facts scans per day"
        : `${remaining} of 3 Nutrition Facts scans remaining today`;
    }
  }

  async function getRemainingLabelScans() {
    try {
      const auth = await session();
      const client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase;
      if (!auth?.user?.id || !client?.from) return null;
      const utcDay = new Date().toISOString().slice(0, 10);
      const { data, error } = await client
        .from("ari_nutrition_vision_usage")
        .select("used_count")
        .eq("user_id", auth.user.id)
        .eq("nutrition_day", utcDay)
        .maybeSingle();
      if (error) return null;
      return Math.max(0, 3 - number(data?.used_count, 0));
    } catch {
      return null;
    }
  }

  function requestLabelPhoto() {
    if (window.AriAIConsent && !window.AriAIConsent.isAllowed()) {
      window.AriAIConsent.show?.();
      setStatus("Allow AI processing, then tap Scan Nutrition Facts again.");
      return;
    }
    $("nutritionLabelImageInput")?.click?.();
  }

  async function handleLabelPhoto(file) {
    if (!file) return;
    const button = $("nutritionLabelScanBtn");
    if (button) button.disabled = true;
    setStatus("Reading the Nutrition Facts label…");

    try {
      const auth = await session();
      if (!auth?.access_token) throw new Error("Sign in to scan a Nutrition Facts label.");
      const imageBase64 = await compressImage(file);

      const response = await fetch("/api/image-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.access_token}`
        },
        body: JSON.stringify({
          imageBase64,
          analysisType: "nutrition_label",
          fallbackReason: state.fallbackReason || "barcode_not_found",
          barcodeContext: { barcode: state.barcode || null }
        })
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 403 && data.code === "AI_PROCESSING_CONSENT_REQUIRED") {
        window.AriAIConsent?.show?.();
        throw new Error("Allow AI processing, then try the label scan again.");
      }
      if (!response.ok) throw new Error(data.error || "Nutrition Facts scan failed.");

      state.resultKind = "label";
      state.labelResult = data;
      state.quantity = 1;
      renderLabelResult(data);
      const limit = $("nutritionLabelLimit");
      if (limit) limit.textContent = `${number(data.scansRemaining, 0)} of 3 Nutrition Facts scans remaining today`;
      setStatus("Check the values against the label, then add the meal.");
    } catch (error) {
      console.error("[ARI Nutrition Label Scan]", error);
      setStatus(error?.message || "Nutrition Facts scan failed.");
    } finally {
      if (button) button.disabled = false;
    }
  }

  function renderLabelResult(data) {
    const container = $("nutritionScanResult");
    if (!container) return;
    container.hidden = false;
    $("nutritionResultSource").textContent = "Nutrition Facts · confirm values";
    const suggestedName = escapeText(data.product_name || state.match?.displayName || state.match?.name || "");
    $("nutritionResultName").textContent = suggestedName || "Scanned packaged food";
    $("nutritionResultServing").textContent = escapeText(data.serving_label || data.serving_size || "1 serving");
    const nameInput = $("nutritionLabelProductName");
    if (nameInput) {
      nameInput.hidden = false;
      nameInput.value = suggestedName;
      nameInput.placeholder = "Product name";
    }
    const add = $("nutritionResultAdd");
    if (add) add.hidden = false;
    renderMetrics();
  }

  async function compressImage(file) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("Could not read image."));
      reader.readAsDataURL(file);
    });

    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not open image."));
      img.src = dataUrl;
    });

    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
    const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
    const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.drawImage(image, 0, 0, width, height);
    const compressed = canvas.toDataURL("image/jpeg", 0.8);
    return compressed.replace(/^data:image\/jpeg;base64,/, "");
  }

  function inferMealType(match) {
    const text = `${match?.category || ""} ${(match?.tags || []).join(" ")}`.toLowerCase();
    if (/drink|beverage|soda|juice|water|coffee|tea/.test(text)) return "Drink";
    if (/snack|chip|cracker|cookie|candy/.test(text)) return "Snack";
    return "Meal";
  }

  async function addResultToToday() {
    const nutrition = currentNutrition();
    if (!Number.isFinite(nutrition.calories) || nutrition.calories < 0) {
      setStatus("The calories could not be verified. Use manual entry instead.");
      return;
    }

    const isLabel = state.resultKind === "label";
    let name = isLabel
      ? escapeText($("nutritionLabelProductName")?.value || state.labelResult?.product_name || state.match?.displayName || "")
      : escapeText(state.match?.displayName || state.match?.name || "");
    if (!name) {
      setStatus("Enter the product name before adding this label.");
      $("nutritionLabelProductName")?.focus?.();
      return;
    }

    const clear = $("clearSelectedFoodBtn");
    if (clear && !$("mealFoodSelection")?.hidden) clear.click();
    await Promise.resolve();

    const q = state.quantity;
    const values = {
      mealName: name,
      mealCalories: Math.round(nutrition.calories * q),
      mealProtein: round(nutrition.protein * q, 1),
      mealCarbs: round(nutrition.carbs * q, 1),
      mealFat: round(nutrition.fat * q, 1)
    };

    for (const [id, value] of Object.entries(values)) {
      const input = $(id);
      if (input) {
        input.readOnly = false;
        input.removeAttribute("aria-readonly");
        input.value = String(value);
      }
    }

    const type = $("mealType");
    if (type) type.value = inferMealType(state.match);
    const date = $("mealDate");
    const time = $("mealTime");
    if (date && !date.value) date.value = localDateString();
    if (time && !time.value) time.value = localTimeString();

    state.formContext = {
      servingSize: q === 1 ? nutrition.servingLabel : `${round(q, 2)} × ${nutrition.servingLabel}`,
      multiplier: q,
      source: isLabel ? "nutrition_label_scan" : "barcode_lookup",
      barcode: state.barcode || null
    };

    if (isLabel) {
      state.pendingEvidence = {
        barcode: state.barcode || null,
        productName: name,
        brand: escapeText(state.labelResult?.brand || state.match?.brand || ""),
        servingLabel: nutrition.servingLabel,
        servingGrams: nutrition.servingGrams || null,
        servingsPerContainer: number(state.labelResult?.servings_per_container, 0) || null,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        sugar: nutrition.sugar,
        sodiumMg: nutrition.sodiumMg,
        confidence: number(state.labelResult?.confidence_score, 0.5),
        raw: {
          serving_size: state.labelResult?.serving_size || null,
          servings_per_container: state.labelResult?.servings_per_container || null,
          scans_remaining: state.labelResult?.scansRemaining ?? null
        }
      };
    }

    closeScanner();
    $("saveMealBtn")?.click?.();
  }

  async function onMealSaved() {
    const evidence = state.pendingEvidence;
    state.formContext = null;
    state.pendingEvidence = null;
    if (!evidence) return;

    try {
      const auth = await session();
      const client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase;
      if (!auth?.user?.id || !client?.from) return;

      const { error } = await client.from("nutrition_label_evidence").insert({
        user_id: auth.user.id,
        barcode: evidence.barcode,
        product_name: evidence.productName,
        brand: evidence.brand || null,
        serving_label: evidence.servingLabel || null,
        serving_grams: evidence.servingGrams,
        servings_per_container: evidence.servingsPerContainer,
        calories_per_serving: evidence.calories,
        protein_g_per_serving: evidence.protein,
        carbs_g_per_serving: evidence.carbs,
        fat_g_per_serving: evidence.fat,
        sugar_g_per_serving: evidence.sugar,
        sodium_mg_per_serving: evidence.sodiumMg,
        confidence: evidence.confidence,
        user_confirmed: true,
        scan_day: localDateString(),
        source: "nutrition_label_scan",
        status: "evidence",
        raw_result: evidence.raw || {}
      });
      if (error) console.warn("[ARI Nutrition Evidence Save]", error.message);
    } catch (error) {
      console.warn("[ARI Nutrition Evidence Save]", error?.message || error);
    }
  }

  function bind() {
    $("scanBarcodeBtn")?.addEventListener("click", openScanner);
    $("nutritionScanClose")?.addEventListener("click", closeScanner);
    $("nutritionManualBarcodeBtn")?.addEventListener("click", () => lookupBarcode($("nutritionManualBarcode")?.value));
    $("nutritionManualBarcode")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") lookupBarcode(event.currentTarget.value);
    });
    $("nutritionServingMinus")?.addEventListener("click", () => changeQuantity(-0.25));
    $("nutritionServingPlus")?.addEventListener("click", () => changeQuantity(0.25));
    $("nutritionResultAdd")?.addEventListener("click", addResultToToday);
    $("nutritionLabelScanBtn")?.addEventListener("click", requestLabelPhoto);
    $("nutritionLabelImageInput")?.addEventListener("change", (event) => handleLabelPhoto(event.currentTarget.files?.[0]));
    $("nutritionScanSheet")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closeScanner();
    });
  }

  window.AriNutritionScanBridge = Object.freeze({
    version: "1.0.0",
    getFormContext: () => state.formContext,
    onMealSaved,
    open: openScanner,
    receiveNativeBarcode: (barcode) => {
      stopCamera();
      setSheetOpen(true);
      lookupBarcode(barcode);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind, { once: true });
  } else {
    bind();
  }
})();
