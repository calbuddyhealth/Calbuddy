/* ARI XP — public support destinations */
window.ARI_SUPPORT_CONFIG = Object.freeze({
  enabled: true,
  cashApp: Object.freeze({
    handle: "$arixp1",
    url: "https://cash.app/$arixp1"
  }),
  venmo: Object.freeze({
    handle: "@Ari-Xp",
    url: "https://venmo.com/u/Ari-Xp"
  }),

  // Backward-compatible fields used by the existing Account page.
  donationUrl: "https://cash.app/$arixp1",
  providerName: "Cash App"
});
