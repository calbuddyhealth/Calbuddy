/* ARI Circle Messages — isolated thread viewport v1.0.0 */
(() => {
  "use strict";

  const root = document.documentElement;
  const page = document.getElementById("messagesPage");
  const thread = document.getElementById("circleThread");
  const messages = document.getElementById("threadMessages");
  const input = document.getElementById("messageInput");
  const viewport = window.visualViewport;

  if (!page || !thread) return;

  let raf = 0;

  function threadIsOpen() {
    return page.classList.contains("has-thread") && !thread.hidden;
  }

  function syncViewport() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const open = threadIsOpen();
      root.classList.toggle("ari-messages-thread-open", open);

      if (!open) {
        root.style.removeProperty("--ari-messages-vvh");
        return;
      }

      const height = viewport?.height || window.innerHeight || document.documentElement.clientHeight;
      root.style.setProperty("--ari-messages-vvh", `${Math.round(height)}px`);

      if (document.activeElement === input && messages) {
        requestAnimationFrame(() => {
          messages.scrollTop = messages.scrollHeight;
        });
      }
    });
  }

  const observer = new MutationObserver(syncViewport);
  observer.observe(page, { attributes: true, attributeFilter: ["class"] });
  observer.observe(thread, { attributes: true, attributeFilter: ["hidden"] });

  viewport?.addEventListener("resize", syncViewport, { passive: true });
  viewport?.addEventListener("scroll", syncViewport, { passive: true });
  window.addEventListener("resize", syncViewport, { passive: true });
  window.addEventListener("orientationchange", syncViewport, { passive: true });

  input?.addEventListener("focus", () => {
    syncViewport();
    setTimeout(syncViewport, 80);
    setTimeout(syncViewport, 260);
  });

  input?.addEventListener("blur", () => {
    setTimeout(syncViewport, 80);
  });

  document.getElementById("threadBack")?.addEventListener("click", () => {
    root.classList.remove("ari-messages-thread-open");
    root.style.removeProperty("--ari-messages-vvh");
  });

  syncViewport();
})();
