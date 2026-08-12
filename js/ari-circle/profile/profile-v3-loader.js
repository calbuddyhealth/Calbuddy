// ARI Circle V3 profile data layer + V4 visual simplification loader.
// Loaded only by the ARI Circle module graph.

const PROFILE_STYLE_ID = "ari-circle-profile-v3-style";
const V4_STYLE_ID = "ari-circle-v4-style";

const themeMeta = document.querySelector('meta[name="theme-color"]');
if (themeMeta) {
  themeMeta.setAttribute("content", "#f8faff");
}

if (!document.getElementById(PROFILE_STYLE_ID)) {
  const link = document.createElement("link");
  link.id = PROFILE_STYLE_ID;
  link.rel = "stylesheet";
  link.href = "assets/css/ari-circle-profile-v3.css?v=1.0.1";
  document.head.append(link);
}

if (!document.getElementById(V4_STYLE_ID)) {
  const link = document.createElement("link");
  link.id = V4_STYLE_ID;
  link.rel = "stylesheet";
  link.href = "assets/css/ari-circle-v4.css?v=4.0.0";
  document.head.append(link);
}

Promise.all([
  import("./profile-v3.js?v=1.0.0"),
  import("../v4-ui.js?v=4.0.0")
]).catch((error) => {
  console.error("ARI Circle profile enhancement failed to load:", error);
});
