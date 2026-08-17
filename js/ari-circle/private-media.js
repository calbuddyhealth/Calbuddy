/* =============================================================
   ARI CIRCLE — PRIVATE MEDIA RESOLVER
   Version: 1.0.0

   Canonical private media references are stored as:
     ari-private://<bucket>/<storage-path>

   This module converts those references into short-lived Supabase signed
   URLs for authenticated viewers. It also patches RPC responses and repairs
   media elements that receive a canonical reference directly.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const PREFIX = "ari-private://";
  const DEFAULT_TTL_SECONDS = 600;
  const REFRESH_SKEW_MS = 90 * 1000;
  const cache = new Map();
  let rpcPatched = false;
  let patchAttempts = 0;
  let observer = null;

  function clean(value) {
    return String(value ?? "").trim();
  }

  function resolveClient() {
    return (
      window.calbuddySupabase ||
      window.supabaseClient ||
      window.CalBuddy?.supabase ||
      null
    );
  }

  function isPrivateRef(value) {
    return typeof value === "string" && value.startsWith(PREFIX);
  }

  function parseRef(value) {
    const ref = clean(value);
    if (!isPrivateRef(ref)) return null;

    const remainder = ref.slice(PREFIX.length);
    const slashIndex = remainder.indexOf("/");
    if (slashIndex <= 0 || slashIndex >= remainder.length - 1) return null;

    const bucket = remainder.slice(0, slashIndex);
    const path = remainder.slice(slashIndex + 1);
    if (!bucket || !path) return null;

    return { ref, bucket, path };
  }

  function createRef(bucket, path) {
    const safeBucket = clean(bucket).replace(/^\/+|\/+$/g, "");
    const safePath = clean(path).replace(/^\/+/, "");
    if (!safeBucket || !safePath) return "";
    return `${PREFIX}${safeBucket}/${safePath}`;
  }

  async function resolve(value, ttlSeconds = DEFAULT_TTL_SECONDS) {
    const parsed = parseRef(value);
    if (!parsed) return value;

    const now = Date.now();
    const cached = cache.get(parsed.ref);
    if (cached?.url && Number(cached.expiresAt || 0) - REFRESH_SKEW_MS > now) {
      return cached.url;
    }

    const client = resolveClient();
    if (!client?.storage?.from) {
      throw new Error("ARI Circle private media is unavailable.");
    }

    const safeTtl = Math.min(3600, Math.max(120, Number(ttlSeconds) || DEFAULT_TTL_SECONDS));
    const { data, error } = await client.storage
      .from(parsed.bucket)
      .createSignedUrl(parsed.path, safeTtl);

    if (error || !data?.signedUrl) {
      throw new Error(error?.message || "ARI Circle could not open private media.");
    }

    cache.set(parsed.ref, {
      url: data.signedUrl,
      expiresAt: now + safeTtl * 1000
    });

    return data.signedUrl;
  }

  async function resolveDeep(value, seen = new WeakSet()) {
    if (isPrivateRef(value)) {
      try {
        return await resolve(value);
      } catch (error) {
        console.warn("ARI Circle private media signing failed:", error?.message || error);
        return value;
      }
    }

    if (!value || typeof value !== "object") return value;
    if (value instanceof Blob || value instanceof File || value instanceof Date) return value;
    if (seen.has(value)) return value;
    seen.add(value);

    if (Array.isArray(value)) {
      await Promise.all(value.map(async (item, index) => {
        value[index] = await resolveDeep(item, seen);
      }));
      return value;
    }

    await Promise.all(Object.keys(value).map(async (key) => {
      value[key] = await resolveDeep(value[key], seen);
    }));
    return value;
  }

  async function resolveElement(element) {
    if (!(element instanceof Element)) return;

    const attributes = [];
    if (element instanceof HTMLImageElement) attributes.push("src");
    if (element instanceof HTMLVideoElement) attributes.push("src", "poster");
    if (element instanceof HTMLSourceElement) attributes.push("src");

    for (const attribute of attributes) {
      const current = element.getAttribute(attribute);
      if (!isPrivateRef(current)) continue;
      try {
        const signed = await resolve(current);
        if (signed && signed !== current && element.getAttribute(attribute) === current) {
          element.setAttribute(attribute, signed);
        }
      } catch (error) {
        console.warn("ARI Circle could not resolve private media element:", error?.message || error);
      }
    }

    const style = element.getAttribute("style");
    if (style && style.includes(PREFIX)) {
      const refs = [...new Set(style.match(/ari-private:\/\/[^\s)'\"]+/g) || [])];
      let nextStyle = style;
      for (const ref of refs) {
        try {
          const signed = await resolve(ref);
          nextStyle = nextStyle.split(ref).join(signed);
        } catch (error) {
          console.warn("ARI Circle could not resolve private background media:", error?.message || error);
        }
      }
      if (nextStyle !== style) element.setAttribute("style", nextStyle);
    }
  }

  function scan(root = document) {
    const elements = [];
    if (root instanceof Element) elements.push(root);
    if (root?.querySelectorAll) {
      elements.push(...root.querySelectorAll("img,video,source,[style*='ari-private://']"));
    }
    elements.forEach((element) => { void resolveElement(element); });
  }

  function patchRpc() {
    if (rpcPatched) return true;
    const client = resolveClient();
    if (!client || typeof client.rpc !== "function") return false;
    if (client.rpc.__ariPrivateMediaWrapped) {
      rpcPatched = true;
      return true;
    }

    const originalRpc = client.rpc.bind(client);
    const wrappedRpc = async function ariPrivateMediaRpc(name, params, options) {
      const result = await originalRpc(name, params, options);
      if (result && result.data !== undefined && result.data !== null) {
        result.data = await resolveDeep(result.data);
      }
      return result;
    };

    wrappedRpc.__ariPrivateMediaWrapped = true;
    wrappedRpc.__ariPrivateMediaOriginal = originalRpc;
    client.rpc = wrappedRpc;
    rpcPatched = true;
    return true;
  }

  function watchDom() {
    if (observer || !document.documentElement) return;
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes") {
          void resolveElement(mutation.target);
          continue;
        }
        for (const node of mutation.addedNodes || []) {
          if (node instanceof Element) scan(node);
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "poster", "style"]
    });
  }

  function init() {
    patchAttempts += 1;
    if (!patchRpc() && patchAttempts < 80) {
      window.setTimeout(init, 50);
    }
    scan(document);
    watchDom();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.AriCirclePrivateMedia = Object.freeze({
    version: VERSION,
    prefix: PREFIX,
    isPrivateRef,
    parseRef,
    createRef,
    resolve,
    resolveDeep,
    refresh() {
      rpcPatched = false;
      patchAttempts = 0;
      init();
    }
  });
})();
