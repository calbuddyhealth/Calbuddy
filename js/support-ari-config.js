/* ARI XP — Support configuration v3.1.0 */
window.ARI_SUPPORT_CONFIG = Object.freeze({
  enabled: true,

  nativeStoreKit: Object.freeze({
    handlerName: "ariStoreKit",

    featuredProductIds: Object.freeze([
      "com.arixp.support.tip.1",
      "com.arixp.support.tip.3",
      "com.arixp.support.tip.5",
      "com.arixp.support.tip.10",
      "com.arixp.support.tip.20",
      "com.arixp.support.tip.50"
    ]),

    additionalProductIds: Object.freeze([
      "com.arixp.support.tip.2",
      "com.arixp.support.tip.4",
      "com.arixp.support.tip.7",
      "com.arixp.support.tip.15",
      "com.arixp.support.tip.25",
      "com.arixp.support.tip.100"
    ]),

    allProductIds: Object.freeze([
      "com.arixp.support.tip.1",
      "com.arixp.support.tip.2",
      "com.arixp.support.tip.3",
      "com.arixp.support.tip.4",
      "com.arixp.support.tip.5",
      "com.arixp.support.tip.7",
      "com.arixp.support.tip.10",
      "com.arixp.support.tip.15",
      "com.arixp.support.tip.20",
      "com.arixp.support.tip.25",
      "com.arixp.support.tip.50",
      "com.arixp.support.tip.100"
    ])
  }),

  webSupport: Object.freeze({
    enabled: true
  }),

  cashApp: Object.freeze({
    handle: "$arixp1",
    url: "https://cash.app/$arixp1"
  }),

  venmo: Object.freeze({
    handle: "@Ari-Xp",
    url: "https://venmo.com/u/Ari-Xp"
  }),

  supportUrl: "support-ari.html"
});
