// =====================================================
// ARI REBIRTH
// File: js/training/ui/training-plan-controls.js
// Version: 1.0.1
// Purpose:
//   Make workout-plan management immediately discoverable from
//   the Training page without changing the workout executor.
// =====================================================

const SELECTED_DATE_KEY = "ari_training_selected_date_v1";
const STYLE_ID = "ariTrainingPlanControlsStyle";
const ENHANCED_FLAG = "ariTrainingPlanControlsEnhanced";

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function selectedDateKey() {
  const dateElement = document.getElementById("todaysTrainingDate");
  const renderedDate = String(dateElement?.dateTime || "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(renderedDate)) return renderedDate;

  try {
    const stored = String(localStorage.getItem(SELECTED_DATE_KEY) || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(stored)) return stored;
  } catch {}

  return localDateKey();
}

function openPlanner(event) {
  event?.preventDefault?.();
  window.location.href = `workout-plans.html?date=${encodeURIComponent(selectedDateKey())}`;
}

function installStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
/* ARI Training Plan Controls v1.0.1 */

.ari-training-menu.ari-plan-control {
  position: relative;
  width: 58px !important;
  height: 58px !important;
  min-height: 58px !important;
  padding: 7px 6px 6px !important;
  display: grid !important;
  grid-template-rows: 1fr auto;
  place-items: center;
  gap: 2px !important;
  overflow: visible;
  border-color: rgba(40, 201, 232, .42) !important;
  background:
    radial-gradient(circle at 50% 15%, rgba(40, 201, 232, .12), transparent 55%),
    linear-gradient(145deg, #fff, #eef8ff) !important;
  box-shadow:
    inset 0 1px 0 #fff,
    0 9px 23px rgba(45, 94, 166, .12),
    0 0 0 1px rgba(63, 124, 255, .04) !important;
}

.ari-training-menu.ari-plan-control::after {
  content: "";
  position: absolute;
  inset: -4px;
  border: 1px solid rgba(40, 201, 232, .20);
  border-radius: 21px;
  pointer-events: none;
  opacity: .75;
}

.ari-training-menu.ari-plan-control[aria-expanded="true"] {
  border-color: rgba(40, 201, 232, .75) !important;
  background: linear-gradient(145deg, #fff, #e9f9ff) !important;
  box-shadow:
    inset 0 1px 0 #fff,
    0 10px 28px rgba(40, 201, 232, .18),
    0 0 22px rgba(63, 124, 255, .10) !important;
}

/* Reset the legacy generic menu span rule before drawing the vertical dots. */
.ari-training-menu.ari-plan-control > .ari-training-menu__dots {
  width: auto !important;
  height: auto !important;
  min-width: 5px;
  min-height: 25px;
  display: grid !important;
  place-items: center;
  gap: 3px;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.ari-training-menu__dots i {
  display: block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: linear-gradient(180deg, #3565ef, #2450c8);
  box-shadow: 0 0 8px rgba(63, 124, 255, .20);
}

.ari-training-menu.ari-plan-control small {
  display: block;
  margin: 0;
  color: #2250c8;
  font-family: "Orbitron", sans-serif;
  font-size: 7px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: .12em;
}

.ari-training-menu.ari-plan-control.is-plan-attention {
  animation: ariPlanControlAttention 1.75s cubic-bezier(.2,.75,.25,1) 1;
}

@keyframes ariPlanControlAttention {
  0%, 100% {
    transform: scale(1);
    box-shadow: inset 0 1px 0 #fff, 0 9px 23px rgba(45,94,166,.12), 0 0 0 0 rgba(40,201,232,0);
  }
  40% {
    transform: scale(1.045);
    box-shadow: inset 0 1px 0 #fff, 0 12px 30px rgba(45,94,166,.18), 0 0 0 7px rgba(40,201,232,.10);
  }
}

.ari-training-menu-panel.ari-plan-menu {
  width: min(calc(100% - 24px), 500px) !important;
  margin-top: 6px !important;
  padding: 12px !important;
  display: grid;
  gap: 6px;
  border-radius: 22px !important;
  border-color: rgba(40, 201, 232, .34) !important;
  background: rgba(255,255,255,.985) !important;
  box-shadow: 0 20px 52px rgba(42,75,118,.16) !important;
}

.ari-plan-menu__heading {
  padding: 3px 5px 7px;
}

.ari-plan-menu__heading strong {
  display: block;
  color: #071326;
  font-family: "Orbitron", sans-serif;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .13em;
  text-transform: uppercase;
}

.ari-plan-menu__heading span {
  display: block;
  margin-top: 4px;
  color: #7b8ba1;
  font-size: 11px;
  line-height: 1.35;
}

.ari-training-menu-panel .ari-plan-menu__primary {
  min-height: 78px !important;
  display: grid !important;
  grid-template-columns: 42px minmax(0,1fr) auto;
  align-items: center;
  gap: 11px;
  padding: 11px 12px !important;
  border: 1px solid rgba(40, 201, 232, .25) !important;
  border-radius: 17px !important;
  color: #102d65 !important;
  background:
    radial-gradient(circle at 8% 50%, rgba(40,201,232,.12), transparent 30%),
    linear-gradient(135deg, #f5fbff 0%, #edf7ff 55%, #f5f1ff 100%) !important;
  box-shadow: inset 0 1px 0 #fff, 0 8px 20px rgba(48,88,143,.08);
}

.ari-training-menu-panel .ari-plan-menu__primary:hover,
.ari-training-menu-panel .ari-plan-menu__primary:focus-visible {
  border-color: rgba(40, 201, 232, .55) !important;
  background: linear-gradient(135deg, #effbff, #edf5ff 55%, #f3efff) !important;
  box-shadow: inset 0 1px 0 #fff, 0 10px 26px rgba(40,201,232,.13);
}

.ari-plan-menu__icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(63,124,255,.16);
  border-radius: 13px;
  background: rgba(255,255,255,.76);
  box-shadow: inset 0 1px 0 #fff;
}

.ari-plan-menu__icon svg {
  width: 24px;
  height: 24px;
  color: #315de8;
}

.ari-plan-menu__copy { min-width: 0; }

.ari-plan-menu__copy strong {
  display: block;
  color: #102d65;
  font-family: "Orbitron", sans-serif;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: .01em;
}

.ari-plan-menu__copy small {
  display: block;
  margin-top: 5px;
  color: #72849c;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.35;
}

.ari-plan-menu__chevron {
  color: #3f7cff;
  font-size: 24px;
  font-weight: 400;
  line-height: 1;
}

.ari-plan-menu__divider {
  height: 1px;
  margin: 3px 4px;
  background: linear-gradient(90deg, transparent, rgba(70,118,178,.14), transparent);
}

.ari-training-menu-panel.ari-plan-menu .ari-plan-menu__utility {
  min-height: 48px !important;
  display: flex !important;
  justify-content: space-between;
  padding: 0 12px !important;
  border-radius: 13px !important;
  color: #172943 !important;
  font-size: 14px;
  font-weight: 700;
}

.ari-plan-menu__utility-arrow {
  color: #91a0b3;
  font-size: 18px;
  font-weight: 400;
}

.ari-selected-day-card__plan { align-items: center !important; }

.ari-planned-workout-controls {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
}

.ari-planned-workout-controls #todaysTrainingType {
  color: #7a879b;
  white-space: nowrap;
}

.ari-change-planned-workout {
  min-height: 34px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid rgba(63,124,255,.18);
  border-radius: 11px;
  color: #2853d8;
  background: linear-gradient(145deg, #fff, #f0f7ff);
  font-family: "Inter", sans-serif;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 5px 13px rgba(49,87,142,.07);
}

.ari-change-planned-workout:hover,
.ari-change-planned-workout:focus-visible {
  border-color: rgba(40,201,232,.48);
  color: #173fba;
  background: #effaff;
}

.ari-change-planned-workout:active { transform: scale(.97); }

.ari-change-planned-workout span {
  font-size: 16px;
  font-weight: 500;
  line-height: 1;
}

@media (max-width: 420px) {
  .ari-training-menu.ari-plan-control {
    width: 56px !important;
    height: 56px !important;
    min-height: 56px !important;
  }

  .ari-plan-menu__copy strong { font-size: 12px; }
  .ari-plan-menu__copy small { font-size: 9.5px; }
  .ari-planned-workout-controls { gap: 6px; }
  .ari-change-planned-workout { padding: 0 8px; }
}

@media (prefers-reduced-motion: reduce) {
  .ari-training-menu.ari-plan-control.is-plan-attention { animation: none !important; }
}
`;

  document.head.appendChild(style);
}

function enhanceMenuButton() {
  const button = document.getElementById("trainingMenuButton");
  if (!button || button.dataset[ENHANCED_FLAG] === "true") return button;

  button.dataset[ENHANCED_FLAG] = "true";
  button.classList.add("ari-plan-control");
  button.setAttribute("aria-label", "Open training plan controls");
  button.innerHTML = `
    <span class="ari-training-menu__dots" aria-hidden="true">
      <i></i><i></i><i></i>
    </span>
    <small aria-hidden="true">PLAN</small>
  `;

  return button;
}

function enhanceMenuPanel() {
  const menu = document.getElementById("trainingMenu");
  if (!menu || menu.dataset[ENHANCED_FLAG] === "true") return;

  menu.dataset[ENHANCED_FLAG] = "true";
  menu.classList.add("ari-plan-menu");

  const performance = menu.querySelector('[data-training-panel="performance"]');
  const history = menu.querySelector('[data-training-panel="history"]');
  const profile = menu.querySelector('[data-training-panel="profile"]');

  menu.replaceChildren();

  const heading = document.createElement("div");
  heading.className = "ari-plan-menu__heading";
  heading.innerHTML = `
    <strong>Training Controls</strong>
    <span>Manage your schedule and training tools</span>
  `;

  const plan = document.createElement("a");
  plan.id = "trainingChangeWorkoutPlan";
  plan.className = "ari-plan-menu__primary";
  plan.href = "workout-plans.html";
  plan.innerHTML = `
    <span class="ari-plan-menu__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M7 3v3M17 3v3M4.5 8.25h15M6.25 5h11.5A1.75 1.75 0 0 1 19.5 6.75v11A1.75 1.75 0 0 1 17.75 19.5H6.25A1.75 1.75 0 0 1 4.5 17.75v-11A1.75 1.75 0 0 1 6.25 5Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M8 13h8M12 10v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
      </svg>
    </span>
    <span class="ari-plan-menu__copy">
      <strong>Change Workout Plan</strong>
      <small>View, replace, or edit scheduled workouts</small>
    </span>
    <span class="ari-plan-menu__chevron" aria-hidden="true">›</span>
  `;
  plan.addEventListener("click", openPlanner);

  const divider = document.createElement("div");
  divider.className = "ari-plan-menu__divider";
  divider.setAttribute("aria-hidden", "true");

  const utilities = [performance, history, profile].filter(Boolean);
  utilities.forEach((button) => {
    button.classList.add("ari-plan-menu__utility");
    const label = button.textContent.trim();
    button.replaceChildren();

    const copy = document.createElement("span");
    copy.textContent = label;

    const arrow = document.createElement("span");
    arrow.className = "ari-plan-menu__utility-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "›";

    button.append(copy, arrow);
  });

  menu.append(heading, plan, divider, ...utilities);
}

function enhancePlannedWorkoutCard() {
  const row = document.querySelector("#todaysTrainingDayView .ari-selected-day-card__plan");
  const type = document.getElementById("todaysTrainingType");
  if (!row || !type || row.querySelector("#changePlannedWorkoutButton")) return;

  const controls = document.createElement("span");
  controls.className = "ari-planned-workout-controls";

  type.replaceWith(controls);
  controls.appendChild(type);

  const change = document.createElement("button");
  change.id = "changePlannedWorkoutButton";
  change.className = "ari-change-planned-workout";
  change.type = "button";
  change.setAttribute("aria-label", "Change the planned workout for this date");
  change.innerHTML = `Change <span aria-hidden="true">›</span>`;
  change.addEventListener("click", openPlanner);
  controls.appendChild(change);
}

function syncAttention() {
  const button = document.getElementById("trainingMenuButton");
  const planned = document.getElementById("todaysTrainingDayView");
  if (!button || !planned || planned.hidden) return;
  if (button.dataset.planAttentionShown === "true") return;

  button.dataset.planAttentionShown = "true";
  button.classList.add("is-plan-attention");
  window.setTimeout(() => button.classList.remove("is-plan-attention"), 1900);
}

function observePlannedState() {
  const planned = document.getElementById("todaysTrainingDayView");
  if (!planned || !("MutationObserver" in window)) return;

  const observer = new MutationObserver(syncAttention);
  observer.observe(planned, { attributes: true, attributeFilter: ["hidden"] });
  syncAttention();
}

function initializePlanControls() {
  if (!document.body?.classList.contains("ari-training-page")) return;

  installStyles();
  enhanceMenuButton();
  enhanceMenuPanel();
  enhancePlannedWorkoutCard();
  observePlannedState();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePlanControls, { once: true });
} else {
  initializePlanControls();
}

export default Object.freeze({
  version: "1.0.1",
  initialize: initializePlanControls,
  openPlanner
});
