/* ARI Circle Meetup Room — Meeting Point Disclosure V2 */
(() => {
  "use strict";

  const disclosure = document.getElementById("meetingPointDisclosure");
  const summary = document.getElementById("meetingPointSummary");
  const edit = document.getElementById("editMeetingPoint");
  const cancel = document.getElementById("cancelMeetingPoint");
  const form = document.getElementById("meetingPointForm");

  if (!disclosure || !summary || !edit || !cancel || !form) return;

  let syncing = false;

  function sync() {
    if (syncing) return;
    syncing = true;

    const hostCanEdit = !edit.hidden;
    const expanded = hostCanEdit && !form.hidden;

    disclosure.classList.toggle("is-host", hostCanEdit);
    summary.setAttribute("aria-expanded", String(expanded));

    if (!hostCanEdit) {
      summary.setAttribute("aria-disabled", "true");
      summary.tabIndex = -1;
    } else {
      summary.removeAttribute("aria-disabled");
      summary.tabIndex = 0;
    }

    if (disclosure.open !== expanded) disclosure.open = expanded;
    syncing = false;
  }

  summary.addEventListener("click", (event) => {
    const hostCanEdit = !edit.hidden;

    if (!hostCanEdit) {
      event.preventDefault();
      return;
    }

    if (event.target.closest("#editMeetingPoint")) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    event.preventDefault();
    if (form.hidden) edit.click();
    else cancel.click();
  });

  disclosure.addEventListener("toggle", () => {
    if (syncing) return;
    if (edit.hidden && disclosure.open) disclosure.open = false;
  });

  const observer = new MutationObserver(sync);
  observer.observe(edit, { attributes: true, attributeFilter: ["hidden", "aria-expanded"] });
  observer.observe(form, { attributes: true, attributeFilter: ["hidden"] });

  sync();
})();
