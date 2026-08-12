// ARI Circle V3 profile layer loader.
// Loaded only by the ARI Circle module graph.

const STYLE_ID = "ari-circle-profile-v3-style";

const themeMeta = document.querySelector('meta[name="theme-color"]');
if (themeMeta) {
  themeMeta.setAttribute("content", "#f8faff");
}

if (!document.getElementById(STYLE_ID)) {
  const link = document.createElement("link");
  link.id = STYLE_ID;
  link.rel = "stylesheet";
  link.href = "assets/css/ari-circle-profile-v3.css?v=1.0.1";
  document.head.append(link);
}

import("./profile-v3.js?v=1.0.0").catch((error) => {
  console.error("ARI Circle V3 profile layer failed to load:", error);
});
