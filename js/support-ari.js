/* ARI XP — Support ARI v3.1.1 */

(() => {
  "use strict";

  const state = {
    bridge: null,
    config: null,
    products: new Map(),
    purchasingProductId: null,
    loadTimer: null
  };

  const $ = (id) => document.getElementById(id);

  function clean(value = "") {
    return String(value ?? "").trim();
  }

  function connectSupportMethod(id, provider = {}) {
    const link = $(id);
    if (!link) return;

    const url = clean(provider.url);
    const handle = clean(provider.handle);

    if (!/^https:\/\//i.test(url)) {
      link.hidden = true;
      return;
    }

    link.href = url;

    if (provider.external === true) {
      link.target = "_blank";
      link.rel = "noopener noreferrer external";
      link.addEventListener("click", (event) => {
        event.stopPropagation();
      });
    }

    link.hidden = false;

    const handleNode = link.querySelector("[data-support-handle]");
    if (handleNode && handle) handleNode.textContent = handle;
  }

  function resolveNativeBridge() {
    const handlerName =
      clean(state.config?.nativeStoreKit?.handlerName) ||
      "ariStoreKit";

    const webKitHandler =
      window.webkit?.messageHandlers?.[handlerName];

    if (webKitHandler && typeof webKitHandler.postMessage === "function") {
      return {
        kind: "webkit",
        post(payload) {
          webKitHandler.postMessage(payload);
        }
      };
    }

    const injectedBridge = window.ARI_NATIVE_STOREKIT;

    if (injectedBridge && typeof injectedBridge.postMessage === "function") {
      return {
        kind: "injected",
        post(payload) {
          injectedBridge.postMessage(payload);
        }
      };
    }

    return null;
  }

  function isInstalledNativeApp() {
    const capacitor = window.Capacitor;
    if (!capacitor) return false;

    try {
      if (typeof capacitor.isNativePlatform === "function") {
        return capacitor.isNativePlatform() === true;
      }

      if (typeof capacitor.getPlatform === "function") {
        return ["ios", "android"].includes(clean(capacitor.getPlatform()).toLowerCase());
      }
    } catch (error) {
      console.warn("ARI XP could not determine the native platform:", error);
    }

    return false;
  }

  function allConfiguredProductIds() {
    const ids = state.config?.nativeStoreKit?.allProductIds;
    return Array.isArray(ids)
      ? ids.map(clean).filter(Boolean)
      : [];
  }

  function setTipStatus(message = "", type = "") {
    const status = $("tipPurchaseStatus");
    if (!status) return;

    status.textContent = message;
    status.dataset.state = type;
    status.hidden = !message;
  }

  function setTipButtonsDisabled(disabled) {
    document.querySelectorAll("[data-ari-tip-product]").forEach((button) => {
      button.disabled = Boolean(disabled);
    });

    const other = $("otherTipButton");
    if (other) other.disabled = Boolean(disabled);
  }

  function requestNativeProducts() {
    if (!state.bridge) return;

    const productIds = allConfiguredProductIds();
    if (!productIds.length) {
      showNativeUnavailable("Apple tip products have not been configured yet.");
      return;
    }

    state.bridge.post({
      action: "load_tip_products",
      productIds
    });

    window.clearTimeout(state.loadTimer);
    state.loadTimer = window.setTimeout(() => {
      if (!state.products.size) {
        showNativeUnavailable("Apple tip options are temporarily unavailable.");
      }
    }, 6000);
  }

  function normalizeNativeProduct(product = {}) {
    const id = clean(product.id || product.productId);
    const displayPrice = clean(
      product.displayPrice ||
      product.localizedPrice ||
      product.priceLabel
    );

    if (!id || !displayPrice) return null;

    return {
      id,
      displayPrice,
      available: product.available !== false
    };
  }

  function renderTipGroup(containerId, configuredIds = []) {
    const container = $(containerId);
    if (!container) return 0;

    container.innerHTML = "";

    let count = 0;

    for (const productId of configuredIds) {
      const product = state.products.get(productId);
      if (!product?.available) continue;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "ari-tip-button";
      button.dataset.ariTipProduct = product.id;
      button.setAttribute("aria-label", `Support ARI XP with ${product.displayPrice}`);

      const price = document.createElement("strong");
      price.textContent = product.displayPrice;

      const label = document.createElement("span");
      label.textContent = "TIP";

      button.append(price, label);
      button.addEventListener("click", () => purchaseTip(product.id));
      container.appendChild(button);
      count += 1;
    }

    return count;
  }

  function renderNativeProducts(products = []) {
    state.products.clear();

    for (const rawProduct of Array.isArray(products) ? products : []) {
      const product = normalizeNativeProduct(rawProduct);
      if (product) state.products.set(product.id, product);
    }

    window.clearTimeout(state.loadTimer);

    const featuredIds = Array.isArray(state.config?.nativeStoreKit?.featuredProductIds)
      ? state.config.nativeStoreKit.featuredProductIds
      : [];

    const additionalIds = Array.isArray(state.config?.nativeStoreKit?.additionalProductIds)
      ? state.config.nativeStoreKit.additionalProductIds
      : [];

    const featuredCount = renderTipGroup("featuredTipGrid", featuredIds);
    const additionalCount = renderTipGroup("additionalTipGrid", additionalIds);

    const loading = $("nativeTipLoading");
    const featuredGrid = $("featuredTipGrid");
    const otherButton = $("otherTipButton");

    if (loading) loading.hidden = featuredCount > 0;
    if (featuredGrid) featuredGrid.hidden = featuredCount === 0;
    if (otherButton) otherButton.hidden = additionalCount === 0;

    if (!featuredCount && !additionalCount) {
      showNativeUnavailable("Apple tip options are temporarily unavailable.");
      return;
    }

    setTipStatus("");
  }

  function showNativeUnavailable(message) {
    const loading = $("nativeTipLoading");
    const featuredGrid = $("featuredTipGrid");
    const otherButton = $("otherTipButton");
    const additionalPanel = $("additionalTipPanel");

    if (loading) {
      loading.hidden = false;
      loading.textContent = message;
    }

    if (featuredGrid) featuredGrid.hidden = true;
    if (otherButton) otherButton.hidden = true;
    if (additionalPanel) additionalPanel.hidden = true;
  }

  function toggleAdditionalTips() {
    const button = $("otherTipButton");
    const panel = $("additionalTipPanel");
    if (!button || !panel) return;

    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    button.textContent = expanded ? "Other amount" : "Hide other amounts";
    panel.hidden = expanded;
  }

  function purchaseTip(productId) {
    const id = clean(productId);
    if (!id || !state.bridge || state.purchasingProductId) return;

    const product = state.products.get(id);
    if (!product?.available) return;

    state.purchasingProductId = id;
    setTipButtonsDisabled(true);
    setTipStatus(`Starting ${product.displayPrice} Apple tip…`, "working");

    state.bridge.post({
      action: "purchase_tip",
      productId: id
    });
  }

  function handlePurchaseFinished(result = {}) {
    const productId = clean(result.productId || state.purchasingProductId);
    const status = clean(result.status).toLowerCase();
    const product = state.products.get(productId);
    const price = product?.displayPrice || "your";

    state.purchasingProductId = null;
    setTipButtonsDisabled(false);

    if (status === "success" || result.success === true) {
      setTipStatus(`Thank you for supporting ARI XP with ${price} tip.`, "success");
      return;
    }

    if (status === "cancelled" || status === "canceled") {
      setTipStatus("Tip canceled. Nothing was charged.", "neutral");
      return;
    }

    if (status === "pending") {
      setTipStatus("Apple is still processing this tip.", "working");
      return;
    }

    setTipStatus(
      clean(result.message) || "The Apple tip could not be completed.",
      "error"
    );
  }

  function initializeWebSupport() {
    connectSupportMethod("cashAppSupportButton", state.config?.cashApp);
    connectSupportMethod("venmoSupportButton", state.config?.venmo);

    const methods = $("supportMethods");
    const unavailable = $("supportUnavailable");
    const visibleMethods = methods
      ? [...methods.querySelectorAll(".ari-support-method")].filter((item) => !item.hidden)
      : [];

    if (methods) methods.hidden = visibleMethods.length === 0;
    if (unavailable) unavailable.hidden = visibleMethods.length > 0;
  }

  function initializeMode() {
    const nativePanel = $("nativeTipPanel");
    const nativeUnavailablePanel = $("nativeSupportUnavailablePanel");
    const webPanel = $("webSupportPanel");

    state.bridge = resolveNativeBridge();

    if (state.bridge) {
      if (nativePanel) nativePanel.hidden = false;
      if (nativeUnavailablePanel) nativeUnavailablePanel.hidden = true;
      if (webPanel) webPanel.hidden = true;
      requestNativeProducts();
      return;
    }

    if (isInstalledNativeApp()) {
      if (nativePanel) nativePanel.hidden = true;
      if (nativeUnavailablePanel) nativeUnavailablePanel.hidden = false;
      if (webPanel) webPanel.hidden = true;
      return;
    }

    if (nativePanel) nativePanel.hidden = true;
    if (nativeUnavailablePanel) nativeUnavailablePanel.hidden = true;
    if (webPanel) webPanel.hidden = false;
    initializeWebSupport();
  }

  function init() {
    state.config = window.ARI_SUPPORT_CONFIG || {};

    $("otherTipButton")?.addEventListener("click", toggleAdditionalTips);

    initializeMode();
  }

  window.AriSupportStoreKit = Object.freeze({
    version: "3.1.1",

    productsLoaded(products) {
      renderNativeProducts(products);
    },

    purchaseFinished(result) {
      handlePurchaseFinished(result);
    },

    refreshProducts() {
      requestNativeProducts();
    },

    isNativeStoreKitAvailable() {
      return Boolean(state.bridge);
    }
  });

  document.addEventListener("DOMContentLoaded", init);
})();
