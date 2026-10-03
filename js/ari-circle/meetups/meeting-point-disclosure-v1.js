/* ARI Circle Meetup Room — Meeting Point Disclosure V1 */
(() => {
  "use strict";

  const summary = document.querySelector(".meetup-room-point-summary");
  const section = document.querySelector(".meetup-room-point");
  const edit = document.getElementById("editMeetingPoint");
  const cancel = document.getElementById("cancelMeetingPoint");
  const form = document.getElementById("meetingPointForm");

  if (!summary || !section || !edit || !cancel || !form) return;

  function sync() {
    const hostCanEdit = !edit.hidden;
    const expanded = hostCanEdit && !form.hidden;

    section.classList.toggle("is-host", hostCanEdit);
    section.classList.toggle("is-expanded", expanded);
    summary.setAttribute("aria-expanded", String(expanded));
    summary.setAttribute("aria-controls", "meetingPointForm");

    if (hostCanEdit) {
      summary.setAttribute("role", "button");
      summary.setAttribute("tabindex", "0");
      summary.setAttribute("aria-label", expanded ? "Collapse meeting point editor" : "Edit meeting point");
    } else {
      summary.removeAttribute("role");
      summary.removeAttribute("tabindex");
      summary.removeAttribute("aria-label");
    }
  }

  function toggleFromSummary(event) {
    if (event.target.closest("#editMeetingPoint")) return;
    if (edit.hidden) return;

    if (form.hidden) edit.click();
    else cancel.click();
  }

  summary.addEventListener("click", toggleFromSummary);
  summary.addEventListener("keydown", (event) => {
    if (edit.hidden || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    toggleFromSummary(event);
  });

  const observer = new MutationObserver(sync);
  observer.observe(edit, { attributes: true, attributeFilter: ["hidden", "aria-expanded"] });
  observer.observe(form, { attributes: true, attributeFilter: ["hidden"] });

  sync();
})();
