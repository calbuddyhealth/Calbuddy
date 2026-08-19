/* =====================================================
   ARI Nutrition Scroll Runtime
   Version: 1.0.0
   Prevents Nutrition chat UI from hijacking document momentum on iPhone.
===================================================== */
(() => {
  "use strict";

  if (!document.documentElement.classList.contains("ari-nutrition-html")) return;

  const nativeScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (...args) {
    try {
      if (this?.matches?.("#ariMessages .ari-message")) {
        return;
      }
    } catch {}
    return nativeScrollIntoView.apply(this, args);
  };

  /* nutrition.js refocuses Ask Ari after a response. On iOS that programmatic
     focus can reposition the visual viewport and kill an active inertial flick.
     User taps still focus the textarea normally; only JS .focus() is suppressed. */
  const nativeFocus = HTMLTextAreaElement.prototype.focus;
  HTMLTextAreaElement.prototype.focus = function (...args) {
    if (this?.id === "ariInput") return;
    return nativeFocus.apply(this, args);
  };
})();
