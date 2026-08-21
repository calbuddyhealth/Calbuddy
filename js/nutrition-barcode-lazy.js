/* =====================================================
   ARI Nutrition Barcode Lazy Decoder
   Version: 1.0.0
   Keeps the external ZXing browser bundle off the page's
   startup path. Native iOS scanning is never delayed by it.
===================================================== */

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const ZXING_SRC = "https://unpkg.com/@zxing/browser@0.2.1/umd/zxing-browser.min.js";
  let zxingPromise = null;

  function hasNativeScanner() {
    return Boolean(window.webkit?.messageHandlers?.ariBarcodeScanner?.postMessage);
  }

  function hasWebScanner() {
    return Boolean(window.ZXingBrowser?.BrowserMultiFormatReader);
  }

  function setStatus(message) {
    const node = document.getElementById("nutritionScanStatus");
    if (node) node.textContent = message;
  }

  function ensureZxing() {
    if (hasWebScanner()) return Promise.resolve(true);
    if (zxingPromise) return zxingPromise;

    zxingPromise = new Promise((resolve, reject) => {
      const existing = Array.from(document.scripts).find((script) =>
        (script.getAttribute("src") || "").includes("@zxing/browser@0.2.1")
      );

      if (existing) {
        existing.addEventListener("load", () => resolve(hasWebScanner()), { once: true });
        existing.addEventListener("error", () => reject(new Error("Barcode decoder failed to load.")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = ZXING_SRC;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.ariNutritionLazy = "barcode-decoder";
      script.addEventListener("load", () => resolve(hasWebScanner()), { once: true });
      script.addEventListener("error", () => reject(new Error("Barcode decoder failed to load.")), { once: true });
      document.head.appendChild(script);
    }).catch((error) => {
      zxingPromise = null;
      throw error;
    });

    return zxingPromise;
  }

  async function interceptWebScan(event) {
    const button = event.target?.closest?.("#scanBarcodeBtn");
    if (!button || hasNativeScanner() || hasWebScanner()) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const bridge = window.AriNutritionScanBridge;
    if (!bridge?.open) return;

    // Open the sheet immediately so the tap always feels responsive, then
    // prepare the web-only decoder behind that visible feedback.
    const loading = ensureZxing();
    await bridge.open();
    setStatus("Preparing camera scanner…");

    try {
      const ready = await loading;
      if (!ready) throw new Error("Barcode decoder unavailable.");
      await bridge.open();
    } catch (error) {
      console.warn("[ARI Nutrition Barcode Lazy]", error);
      setStatus("Camera barcode scanning is unavailable. Enter the barcode below.");
    }
  }

  document.addEventListener("click", interceptWebScan, true);

  window.AriNutritionBarcodeLazy = Object.freeze({
    version: VERSION,
    ensureWebDecoder: ensureZxing,
    hasNativeScanner,
    hasWebScanner
  });
})();