// ARI Circle lightweight V4 profile loader.
// Keeps the legacy profile renderer/controllers while loading only the
// social data the simplified profile actually displays.

const PROFILE_STYLE_ID = "ari-circle-profile-v3-style";
const V4_STYLE_ID = "ari-circle-v4-style";
const V4_POLISH_STYLE_ID = "ari-circle-v4-polish-style";
const MEDIA_STYLE_ID = "ari-circle-media-style";

const themeMeta = document.querySelector('meta[name="theme-color"]');
if (themeMeta) themeMeta.setAttribute("content", "#f8faff");

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

if (!document.getElementById(V4_POLISH_STYLE_ID)) {
  const link = document.createElement("link");
  link.id = V4_POLISH_STYLE_ID;
  link.rel = "stylesheet";
  link.href = "assets/css/ari-circle-v4-polish.css?v=4.1.0";
  document.head.append(link);
}

if (!document.getElementById(MEDIA_STYLE_ID)) {
  const link = document.createElement("link");
  link.id = MEDIA_STYLE_ID;
  link.rel = "stylesheet";
  link.href = "assets/css/ari-circle-media.css?v=1.0.1";
  document.head.append(link);
}

// V4.5: v4-ui owns loading v4-flow-fixes. Importing flow-fixes here too
// created a second copy of the same runtime with duplicate listeners.
Promise.all([
  import("./profile-v4.js?v=4.2.0"),
  import("../v4-ui.js?v=4.5.1")
]).catch((error) => {
  console.error("ARI Circle profile enhancement failed to load:", error);
});
