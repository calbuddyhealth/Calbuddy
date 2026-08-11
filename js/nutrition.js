// =====================================================
// ARI REBIRTH
// File: nutrition.js
// Version: 4.2.2
// Purpose:
//   Functional controller for the Nutrition page.
//
// Features:
//   - Ask Ari conversation using CalBuddy.askAri()
//   - ARI food database search for manual meal entry
//   - Food autocomplete using AriFoodSearch
//   - Serving/unit selection using AriFoodCalculator
//   - Automatic calorie/macronutrient calculation
//   - Manual/custom-food fallback when no database food is selected
//   - User-selectable meal date and time
//   - Edit existing meals from Today's Meals
//   - Supabase meal saving/updating with local fallback
//   - Today's meals and deletion
//   - Today's calorie, protein, carb, and fat totals
//   - Recent meals
//   - User-configured nutrition reset window
//
// Food architecture:
//
//   ARI Food Data Modules
//          ↓
//   AriFoodRegistry
//          ↓
//   AriFoodSearch
//          ↓
//   AriFoodCalculator
//          ↓
//   nutrition.js
//          ↓
//   Nutrition Manual Entry
//
// Manual-entry modes:
//
//   DATABASE MODE
//     Search → select food → choose amount/serving →
//     calculate nutrition automatically.
//
//   CUSTOM MODE
//     Type any food name and manually enter calories/macros.
//
// Removed by design:
//   - USDA search
//   - Keyword-based meal estimation
//   - Favorites
//   - Repeat meal
//   - Micronutrient summaries
//   - AI-driven automatic meal logging
// =====================================================


// =====================================================
// STATE
// =====================================================

const nutritionState = {
  chatHistory: [],

  mealsToday: [],
  recentMeals: [],

  totals: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  },

  ariBusy: false,
  savingMeal: false,
  editingMeal: null,

  currentUser: null,
  currentWindow: null,

  // -----------------------------------------------------
  // Manual food database state
  // -----------------------------------------------------

  selectedFood: null,
  foodSearchResults: [],
  foodSearchActiveIndex: -1,
  selectedMeasurement: null,
  foodCalculation: null,

  foodSystem: {
    registryReady: false,
    searchReady: false,
    calculatorReady: false,
    foodCount: 0
  }
};


const NUTRITION_LOCAL_MEALS_KEY =
  "calbuddyMeals";

const NUTRITION_CHAT_HISTORY_LIMIT =
  10;

const NUTRITION_RECENT_MEAL_LIMIT =
  12;

const NUTRITION_FOOD_SEARCH_LIMIT =
  8;

const NUTRITION_FOOD_SEARCH_DEBOUNCE_MS =
  120;

let nutritionFoodSearchTimer = null;


// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    try {
      bindNutritionNavigation();
      bindNutritionComposer();
      bindManualMealEntry();

      initializeNutritionFoodSystem();

      setManualMealDateTimeDefaults();

      const authorized =
        await setupNutritionAuth();

      if (!authorized) {
        return;
      }

      nutritionState.currentUser =
        await getNutritionUser();

      nutritionState.currentWindow =
        await getNutritionWindow();

      await refreshNutritionPage();
    } catch (error) {
      console.error(
        "[ARI NUTRITION INIT ERROR]",
        error
      );

      showNutritionNotice(
        error?.message ||
          "The Nutrition page could not finish loading.",
        "error"
      );
    }
  }
);


async function refreshNutritionPage() {
  await loadTodayMeals();
  await loadRecentMeals();
}


// =====================================================
// NAVIGATION
// =====================================================

function bindNutritionNavigation() {
  window.goBack = goBack;
  window.goHome = goHome;
}


function goBack() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.replace(
    "home.html"
  );
}


function goHome() {
  window.location.replace(
    "home.html"
  );
}


// =====================================================
// AUTHENTICATION
// =====================================================

async function setupNutritionAuth() {
  if (
    typeof window.requireAuth ===
    "function"
  ) {
    return Boolean(
      await window.requireAuth()
    );
  }

  if (!window.calbuddySupabase) {
    return false;
  }

  const {
    data,
    error
  } =
    await window
      .calbuddySupabase
      .auth
      .getSession();

  if (error) {
    console.warn(
      "Nutrition auth session lookup failed:",
      error.message
    );

    return false;
  }

  if (!data?.session) {
    window.location.replace(
      "signin.html"
    );

    return false;
  }

  return true;
}


async function getNutritionUser() {
  if (
    typeof window.getCurrentUser ===
    "function"
  ) {
    try {
      return await window.getCurrentUser();
    } catch (error) {
      console.warn(
        "getCurrentUser failed:",
        error.message
      );
    }
  }

  if (!window.calbuddySupabase) {
    return null;
  }

  const {
    data,
    error
  } =
    await window
      .calbuddySupabase
      .auth
      .getSession();

  if (
    error ||
    !data?.session
  ) {
    return null;
  }

  return data.session.user;
}


// =====================================================
// ASK ARI COMPOSER
// =====================================================

function bindNutritionComposer() {
  const input =
    getElement("ariInput");

  const button =
    getElement("ariSendBtn");

  if (
    !input ||
    !button
  ) {
    return;
  }

  button.addEventListener(
    "click",
    sendAriMessage
  );

  input.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        sendAriMessage();
      }
    }
  );

  input.addEventListener(
    "input",
    autoResizeNutritionInput
  );
}


async function sendAriMessage() {
  if (nutritionState.ariBusy) {
    return;
  }

  const input =
    getElement("ariInput");

  if (!input) {
    return;
  }

  const message =
    input.value.trim();

  if (!message) {
    return;
  }

  if (
    typeof window.CalBuddy?.askAri !==
    "function"
  ) {
    addConversationMessage(
      "Ari is not available on this page. Check that calbuddy-core.js and the ARI App Bridge loaded correctly.",
      "ari"
    );

    return;
  }

  input.value = "";

  input.blur();
  dismissNutritionKeyboard();

  autoResizeNutritionInput();

  addConversationMessage(
    message,
    "user"
  );

  nutritionState.chatHistory.push({
    role: "user",
    content: message
  });

  nutritionState.chatHistory =
    nutritionState.chatHistory.slice(
      -NUTRITION_CHAT_HISTORY_LIMIT
    );

  setNutritionComposerBusy(true);

  const thinkingMessage =
    addThinkingMessage();

  try {
    const result =
      await window.CalBuddy.askAri({
        message,

        history:
          nutritionState.chatHistory,

        appContext: {
          page: "nutrition",
          currentPage: "nutrition"
        },

        debugTiming: true
      });

    thinkingMessage?.remove();

    const reply =
      String(
        result?.reply ||
        result?.text ||
        result?.message ||
        "I couldn't generate a complete response."
      ).trim();

    addConversationMessage(
      reply,
      "ari"
    );

    nutritionState.chatHistory.push({
      role: "assistant",
      content: reply
    });

    nutritionState.chatHistory =
      nutritionState.chatHistory.slice(
        -NUTRITION_CHAT_HISTORY_LIMIT
      );
  } catch (error) {
    thinkingMessage?.remove();

    addConversationMessage(
      error?.message ||
        "Something went wrong while Ari was answering.",
      "ari"
    );
  } finally {
    setNutritionComposerBusy(false);
  }
}


function addConversationMessage(
  text,
  sender = "ari"
) {
  const thread =
    getElement("ariMessages");

  if (!thread) {
    return null;
  }

  const message =
    document.createElement(
      "div"
    );

  message.className =
    `ari-message ${
      sender === "user"
        ? "ari-user"
        : "ari-ai"
    }`;

  const label =
    document.createElement(
      "span"
    );

  label.className =
    "ari-message-label";

  label.textContent =
    sender === "user"
      ? "You"
      : "Ari";

  const body =
    document.createElement(
      "p"
    );

  body.textContent =
    String(text || "");

  body.style.whiteSpace =
    "pre-wrap";

  message.append(
    label,
    body
  );

  thread.appendChild(
    message
  );

  requestAnimationFrame(
    () => {
      message.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  );

  return message;
}


function addThinkingMessage() {
  const message =
    addConversationMessage(
      "",
      "ari"
    );

  if (!message) {
    return null;
  }

  const body =
    message.querySelector(
      "p"
    );

  if (body) {
    body.innerHTML = `
      <span
        class="ari-typing-dots"
        aria-label="Ari is thinking"
      >
        <span></span>
        <span></span>
        <span></span>
      </span>
    `;
  }

  return message;
}


function setNutritionComposerBusy(
  isBusy
) {
  nutritionState.ariBusy =
    isBusy;

  const input =
    getElement("ariInput");

  const button =
    getElement("ariSendBtn");

  const shell =
    document.querySelector(
      "#askAriSection .ari-input-shell"
    );

  const sendIcon =
    button?.querySelector(
      ".ari-send-icon"
    );

  const sendLabel =
    button?.querySelector(
      ".ari-send-label"
    );

  const transmissionReady =
    document.querySelector(
      ".ari-transmission-ready"
    );

  const liveIndicator =
    document.querySelector(
      ".ari-live-indicator span:last-child"
    );

  if (input) {
    input.disabled =
      isBusy;

    input.placeholder =
      isBusy
        ? "Ari is thinking..."
        : "Ask Ari anything...";
  }

  if (button) {
    button.disabled =
      isBusy;

    button.setAttribute(
      "aria-busy",
      String(isBusy)
    );

    button.setAttribute(
      "aria-label",
      isBusy
        ? "Ari is thinking"
        : "Send message to Ari"
    );
  }

  if (sendIcon) {
    sendIcon.textContent =
      isBusy
        ? "●"
        : "◈";
  }

  if (sendLabel) {
    sendLabel.textContent =
      isBusy
        ? "Thinking"
        : "Send";
  }

  if (transmissionReady) {
    transmissionReady.textContent =
      isBusy
        ? "SIGNAL ACTIVE"
        : "READY";
  }

  if (liveIndicator) {
    liveIndicator.textContent =
      isBusy
        ? "RECEIVING SIGNAL"
        : "NOW BROADCASTING";
  }

  shell?.classList.toggle(
    "thinking",
    isBusy
  );

  if (!isBusy) {
    input?.focus();
  }
}


function autoResizeNutritionInput() {
  const input =
    getElement("ariInput");

  if (!input) {
    return;
  }

  input.style.height =
    "auto";

  input.style.height =
    `${Math.min(
      input.scrollHeight,
      160
    )}px`;
}


// =====================================================
// ARI FOOD SYSTEM
// =====================================================

function initializeNutritionFoodSystem() {
  refreshNutritionFoodSystemStatus();

  /*
   * The page remains fully usable in custom/manual mode
   * if one of these systems is unavailable.
   */
  if (
    !nutritionState
      .foodSystem
      .searchReady ||
    !nutritionState
      .foodSystem
      .calculatorReady
  ) {
    setManualFoodSystemStatus(
      "MANUAL MODE",
      "offline"
    );

    return;
  }

  if (
    nutritionState
      .foodSystem
      .foodCount <= 0
  ) {
    setManualFoodSystemStatus(
      "DATABASE EMPTY",
      "warning"
    );

    return;
  }

  setManualFoodSystemStatus(
    `${nutritionState.foodSystem.foodCount} FOODS ONLINE`,
    "ready"
  );
}


function refreshNutritionFoodSystemStatus() {
  const registry =
    window.AriFoodRegistry;

  const search =
    window.AriFoodSearch;

  const calculator =
    window.AriFoodCalculator;

  nutritionState.foodSystem = {
    registryReady:
      Boolean(
        registry &&
        typeof registry.getById ===
          "function"
      ),

    searchReady:
      Boolean(
        search &&
        typeof search.suggest ===
          "function"
      ),

    calculatorReady:
      Boolean(
        calculator &&
        typeof calculator.calculate ===
          "function" &&
        typeof calculator.calculateServing ===
          "function"
      ),

    foodCount:
      typeof registry?.count ===
      "function"
        ? registry.count()
        : 0
  };

  return {
    ...nutritionState.foodSystem
  };
}


function setManualFoodSystemStatus(
  text,
  stateName = "ready"
) {
  const container =
    getElement(
      "manualFoodSystemStatus"
    );

  const textElement =
    getElement(
      "manualFoodSystemStatusText"
    );

  if (textElement) {
    textElement.textContent =
      String(text || "");
  } else if (container) {
    const spans =
      container.querySelectorAll(
        "span"
      );

    if (spans.length > 1) {
      spans[
        spans.length - 1
      ].textContent =
        String(text || "");
    }
  }

  if (container) {
    container.dataset.state =
      stateName;
  }
}


// =====================================================
// MANUAL MEAL ENTRY — BINDING
// =====================================================

function bindManualMealEntry() {
  const button =
    getElement("saveMealBtn");

  const nameInput =
    getElement("mealName");

  const quantityInput =
    getElement(
      "mealQuantity"
    );

  const unitSelect =
    getElement("mealUnit");

  const clearButton =
    getElement(
      "clearSelectedFoodBtn"
    );

  if (button) {
    button.addEventListener(
      "click",
      saveManualMeal
    );
  }

  if (nameInput) {
    nameInput.addEventListener(
      "input",
      handleManualFoodSearchInput
    );

    nameInput.addEventListener(
      "keydown",
      handleManualFoodSearchKeydown
    );

    nameInput.addEventListener(
      "focus",
      () => {
        if (
          nameInput.value.trim() &&
          !nutritionState.selectedFood
        ) {
          scheduleManualFoodSearch();
        }
      }
    );
  }

  if (quantityInput) {
    quantityInput.addEventListener(
      "input",
      calculateSelectedFoodNutrition
    );

    quantityInput.addEventListener(
      "change",
      calculateSelectedFoodNutrition
    );
  }

  if (unitSelect) {
    unitSelect.addEventListener(
      "change",
      () => {
        nutritionState.selectedMeasurement =
          unitSelect.value ||
          null;

        calculateSelectedFoodNutrition();
      }
    );
  }

  if (clearButton) {
    clearButton.addEventListener(
      "click",
      () => {
        clearSelectedDatabaseFood({
          keepName: false,
          focusName: true
        });
      }
    );
  }

  document.addEventListener(
    "pointerdown",
    handleFoodSearchOutsidePointer
  );
}


// =====================================================
// MANUAL FOOD SEARCH
// =====================================================

function handleManualFoodSearchInput() {
  const input =
    getElement("mealName");

  if (!input) {
    return;
  }

  /*
   * If the user edits the text after selecting a database
   * food, return to custom/search mode. This prevents stale
   * database nutrition from remaining attached to a new name.
   */
  if (nutritionState.selectedFood) {
    const selectedName =
      cleanNutritionDisplayText(
        nutritionState
          .selectedFood
          .displayName ||
        nutritionState
          .selectedFood
          .name ||
        ""
      );

    if (
      input.value.trim() !==
      selectedName
    ) {
      clearSelectedDatabaseFood({
        keepName: true,
        focusName: false
      });
    }
  }

  scheduleManualFoodSearch();
}


function scheduleManualFoodSearch() {
  window.clearTimeout(
    nutritionFoodSearchTimer
  );

  nutritionFoodSearchTimer =
    window.setTimeout(
      runManualFoodSearch,
      NUTRITION_FOOD_SEARCH_DEBOUNCE_MS
    );
}


function runManualFoodSearch() {
  const input =
    getElement("mealName");

  if (!input) {
    return;
  }

  const query =
    input.value.trim();

  if (
    !query ||
    nutritionState.selectedFood
  ) {
    closeManualFoodSearchResults();
    return;
  }

  refreshNutritionFoodSystemStatus();

  if (
    !nutritionState
      .foodSystem
      .searchReady
  ) {
    closeManualFoodSearchResults();
    return;
  }

  let results = [];

  try {
    results =
      window.AriFoodSearch.suggest(
        query,
        {
          limit:
            NUTRITION_FOOD_SEARCH_LIMIT
        }
      );
  } catch (error) {
    console.warn(
      "[ARI NUTRITION FOOD SEARCH ERROR]",
      error
    );

    closeManualFoodSearchResults();

    return;
  }

  nutritionState.foodSearchResults =
    Array.isArray(results)
      ? results
      : [];

  nutritionState.foodSearchActiveIndex =
    -1;

  renderManualFoodSearchResults();
}


function renderManualFoodSearchResults() {
  const container =
    getElement(
      "mealFoodResults"
    );

  const input =
    getElement("mealName");

  if (
    !container ||
    !input
  ) {
    return;
  }

  container.replaceChildren();

  const results =
    nutritionState
      .foodSearchResults;

  if (!results.length) {
    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "ari-food-search-empty";

    empty.textContent =
      "No database match. You can still enter this food manually.";

    container.appendChild(
      empty
    );

    container.hidden =
      false;

    input.setAttribute(
      "aria-expanded",
      "true"
    );

    return;
  }

  results.forEach(
    (food, index) => {
      const option =
        document.createElement(
          "button"
        );

      option.type =
        "button";

      option.className =
        "ari-food-search-result";

      option.id =
        `mealFoodResult-${index}`;

      option.setAttribute(
        "role",
        "option"
      );

      option.setAttribute(
        "aria-selected",
        "false"
      );

      option.dataset.index =
        String(index);

      const primary =
        document.createElement(
          "strong"
        );

      primary.className =
        "ari-food-search-result-name";

      primary.textContent =
        cleanNutritionDisplayText(
          food.displayName ||
          food.name ||
          "Food"
        );

      const secondary =
        document.createElement(
          "span"
        );

      secondary.className =
        "ari-food-search-result-meta";

      secondary.textContent =
        cleanNutritionDisplayText(
          buildFoodSearchResultMeta(
            food
          )
        );

      option.append(
        primary,
        secondary
      );

      option.addEventListener(
        "click",
        () => {
          selectManualDatabaseFood(
            food
          );
        }
      );

      option.addEventListener(
        "pointerenter",
        () => {
          setFoodSearchActiveIndex(
            index
          );
        }
      );

      container.appendChild(
        option
      );
    }
  );

  container.hidden = false;

  input.setAttribute(
    "aria-expanded",
    "true"
  );
}


function buildFoodSearchResultMeta(
  food
) {
  const parts = [];

  if (food.brand) {
    parts.push(
      food.brand
    );
  } else if (food.restaurant) {
    parts.push(
      food.restaurant
    );
  }

  if (food.category) {
    parts.push(
      formatFoodToken(
        food.category
      )
    );
  }

  if (food.preparation) {
    parts.push(
      formatFoodToken(
        food.preparation
      )
    );
  }

  return parts.join(
    " • "
  );
}


function handleManualFoodSearchKeydown(
  event
) {
  const results =
    nutritionState
      .foodSearchResults;

  const container =
    getElement(
      "mealFoodResults"
    );

  const isOpen =
    Boolean(
      container &&
      !container.hidden
    );

  if (
    event.key === "Escape"
  ) {
    closeManualFoodSearchResults();
    return;
  }

  if (
    !isOpen ||
    !results.length
  ) {
    return;
  }

  if (
    event.key === "ArrowDown"
  ) {
    event.preventDefault();

    const next =
      nutritionState
        .foodSearchActiveIndex + 1;

    setFoodSearchActiveIndex(
      next >= results.length
        ? 0
        : next
    );

    return;
  }

  if (
    event.key === "ArrowUp"
  ) {
    event.preventDefault();

    const previous =
      nutritionState
        .foodSearchActiveIndex - 1;

    setFoodSearchActiveIndex(
      previous < 0
        ? results.length - 1
        : previous
    );

    return;
  }

  if (
    event.key === "Enter" &&
    nutritionState
      .foodSearchActiveIndex >= 0
  ) {
    event.preventDefault();

    const selected =
      results[
        nutritionState
          .foodSearchActiveIndex
      ];

    if (selected) {
      selectManualDatabaseFood(
        selected
      );
    }
  }
}


function setFoodSearchActiveIndex(
  index
) {
  const container =
    getElement(
      "mealFoodResults"
    );

  const input =
    getElement("mealName");

  const results =
    nutritionState
      .foodSearchResults;

  if (
    !container ||
    !results.length
  ) {
    nutritionState.foodSearchActiveIndex =
      -1;

    return;
  }

  const normalizedIndex =
    Math.max(
      0,
      Math.min(
        results.length - 1,
        Number(index) || 0
      )
    );

  nutritionState.foodSearchActiveIndex =
    normalizedIndex;

  const options =
    container.querySelectorAll(
      '[role="option"]'
    );

  options.forEach(
    (option, optionIndex) => {
      const active =
        optionIndex ===
        normalizedIndex;

      option.classList.toggle(
        "active",
        active
      );

      option.setAttribute(
        "aria-selected",
        String(active)
      );

      if (active) {
        input?.setAttribute(
          "aria-activedescendant",
          option.id
        );

        option.scrollIntoView({
          block: "nearest"
        });
      }
    }
  );
}


function handleFoodSearchOutsidePointer(
  event
) {
  const shell =
    getElement(
      "mealFoodSearchShell"
    );

  if (!shell) {
    return;
  }

  if (
    !shell.contains(
      event.target
    )
  ) {
    closeManualFoodSearchResults();
  }
}


function closeManualFoodSearchResults() {
  const container =
    getElement(
      "mealFoodResults"
    );

  const input =
    getElement("mealName");

  if (container) {
    container.hidden =
      true;

    container.replaceChildren();
  }

  if (input) {
    input.setAttribute(
      "aria-expanded",
      "false"
    );

    input.removeAttribute(
      "aria-activedescendant"
    );
  }

  nutritionState.foodSearchResults =
    [];

  nutritionState.foodSearchActiveIndex =
    -1;
}


// =====================================================
// DATABASE FOOD SELECTION
// =====================================================

function selectManualDatabaseFood(
  food
) {
  if (!food?.id) {
    return;
  }

  const registry =
    window.AriFoodRegistry;

  /*
   * Re-hydrate from Registry so the selected object is the
   * canonical calculator-ready food record.
   */
  const canonicalFood =
    typeof registry?.getById ===
    "function"
      ? registry.getById(
          food.id
        )
      : food;

  if (!canonicalFood) {
    showNutritionNotice(
      "That food could not be loaded from the ARI food registry.",
      "error"
    );

    return;
  }

  nutritionState.selectedFood =
    canonicalFood;

  nutritionState.foodCalculation =
    null;

  nutritionState.selectedMeasurement =
    null;

  const nameInput =
    getElement("mealName");

  if (nameInput) {
    nameInput.value =
      cleanNutritionDisplayText(
        canonicalFood.displayName ||
        canonicalFood.name ||
        ""
      );
  }

  nameInput?.blur();
  dismissNutritionKeyboard();

  closeManualFoodSearchResults();

  renderSelectedDatabaseFood();
  populateManualMeasurementOptions();
  setDatabaseNutritionFieldsLocked(true);

  calculateSelectedFoodNutrition();
}


function renderSelectedDatabaseFood() {
  const selected =
    nutritionState
      .selectedFood;

  const container =
    getElement(
      "mealFoodSelection"
    );

  const name =
    getElement(
      "mealSelectedFoodName"
    );

  const meta =
    getElement(
      "mealSelectedFoodMeta"
    );

  const measurementControls =
    getElement(
      "mealMeasurementControls"
    );

  if (!selected) {
    if (container) {
      container.hidden =
        true;
    }

    if (measurementControls) {
      measurementControls.hidden =
        true;
    }

    return;
  }

  if (name) {
    name.textContent =
      cleanNutritionDisplayText(
        selected.displayName ||
        selected.name ||
        "Selected food"
      );
  }

  if (meta) {
    const parts = [];

    if (selected.brand) {
      parts.push(
        selected.brand
      );
    } else if (
      selected.restaurant
    ) {
      parts.push(
        selected.restaurant
      );
    }

    if (selected.category) {
      parts.push(
        formatFoodToken(
          selected.category
        )
      );
    }

    if (selected.verified) {
      parts.push(
        "Verified"
      );
    }

    meta.textContent =
      cleanNutritionDisplayText(
        parts.join(
          " • "
        )
      );
  }

  if (container) {
    container.hidden =
      false;
  }

  if (measurementControls) {
    measurementControls.hidden =
      false;
  }
}


function clearSelectedDatabaseFood(
  options = {}
) {
  const keepName =
    options.keepName === true;

  const focusName =
    options.focusName === true;

  nutritionState.selectedFood =
    null;

  nutritionState.selectedMeasurement =
    null;

  nutritionState.foodCalculation =
    null;

  nutritionState.foodSearchResults =
    [];

  nutritionState.foodSearchActiveIndex =
    -1;

  const nameInput =
    getElement("mealName");

  const quantityInput =
    getElement(
      "mealQuantity"
    );

  const unitSelect =
    getElement("mealUnit");

  const selectedContainer =
    getElement(
      "mealFoodSelection"
    );

  const measurementControls =
    getElement(
      "mealMeasurementControls"
    );

  if (
    nameInput &&
    !keepName
  ) {
    nameInput.value =
      "";
  }

  if (quantityInput) {
    quantityInput.value =
      "1";
  }

  if (unitSelect) {
    unitSelect.replaceChildren();
  }

  if (selectedContainer) {
    selectedContainer.hidden =
      true;
  }

  if (measurementControls) {
    measurementControls.hidden =
      true;
  }

  closeManualFoodSearchResults();

  clearMealCalculationStatus();
  setDatabaseNutritionFieldsLocked(false);

  /*
   * When explicitly clearing a database selection, clear
   * its calculated nutrition so stale values are not saved
   * as a custom entry by accident.
   */
  clearNutritionValueFields();

  if (focusName) {
    window.setTimeout(
      () => {
        nameInput?.focus();
      },
      0
    );
  }
}


// =====================================================
// SERVING / UNIT OPTIONS
// =====================================================

function populateManualMeasurementOptions() {
  const food =
    nutritionState
      .selectedFood;

  const select =
    getElement("mealUnit");

  if (
    !food ||
    !select
  ) {
    return;
  }

  select.replaceChildren();

  const calculator =
    window.AriFoodCalculator;

  const servings =
    typeof calculator
      ?.getAvailableServings ===
      "function"
      ? calculator
          .getAvailableServings(
            food.id
          )
      : [];

  const units =
    typeof calculator
      ?.getAvailableUnits ===
      "function"
      ? calculator
          .getAvailableUnits(
            food.id
          )
      : [];

  const normalizedServings =
    Array.isArray(servings)
      ? servings
      : [];

  const normalizedUnits =
    Array.isArray(units)
      ? units
      : [];

  let defaultValue = "";

  // -----------------------------------------------------
  // Convenience servings
  // -----------------------------------------------------

  if (
    normalizedServings.length
  ) {
    const servingGroup =
      document.createElement(
        "optgroup"
      );

    servingGroup.label =
      "Common Servings";

    normalizedServings
      .forEach(
        (serving) => {
          if (!serving?.id) {
            return;
          }

          const option =
            document.createElement(
              "option"
            );

          option.value =
            `serving:${serving.id}`;

          option.textContent =
            cleanNutritionDisplayText(
              serving.label ||
              `${serving.amount || 1} ${serving.unit || "serving"}`
            );

          servingGroup.appendChild(
            option
          );

          if (
            !defaultValue ||
            serving.isDefault === true
          ) {
            if (
              serving.isDefault ===
              true
            ) {
              defaultValue =
                option.value;
            } else if (
              !defaultValue
            ) {
              defaultValue =
                option.value;
            }
          }
        }
      );

    if (
      servingGroup.children.length
    ) {
      select.appendChild(
        servingGroup
      );
    }
  }

  // -----------------------------------------------------
  // Direct measurement units
  // -----------------------------------------------------

  const directUnits =
    normalizedUnits.filter(
      Boolean
    );

  if (directUnits.length) {
    const unitGroup =
      document.createElement(
        "optgroup"
      );

    unitGroup.label =
      "Measure By";

    directUnits.forEach(
      (unit) => {
        const option =
          document.createElement(
            "option"
          );

        option.value =
          `unit:${unit}`;

        option.textContent =
          formatMeasurementUnit(
            unit
          );

        unitGroup.appendChild(
          option
        );

        if (!defaultValue) {
          defaultValue =
            option.value;
        }
      }
    );

    select.appendChild(
      unitGroup
    );
  }

  if (!select.options.length) {
    const option =
      document.createElement(
        "option"
      );

    option.value = "";

    option.textContent =
      "No supported serving";

    option.disabled = true;

    option.selected = true;

    select.appendChild(
      option
    );

    nutritionState.selectedMeasurement =
      null;

    return;
  }

  select.value =
    defaultValue ||
    select.options[0].value;

  nutritionState.selectedMeasurement =
    select.value;
}


function parseMeasurementSelection(
  value
) {
  const raw =
    String(value || "");

  const separatorIndex =
    raw.indexOf(":");

  if (separatorIndex === -1) {
    return {
      type: null,
      value: ""
    };
  }

  return {
    type:
      raw.slice(
        0,
        separatorIndex
      ),

    value:
      raw.slice(
        separatorIndex + 1
      )
  };
}


function formatMeasurementUnit(
  unit
) {
  const labels = {
    g: "grams (g)",
    kg: "kilograms (kg)",
    oz: "ounces (oz)",
    lb: "pounds (lb)",

    ml: "milliliters (mL)",
    l: "liters (L)",
    tsp: "teaspoons (tsp)",
    tbsp: "tablespoons (tbsp)",
    "fl-oz": "fluid ounces (fl oz)",
    cup: "cups",
    pint: "pints",
    quart: "quarts",
    gallon: "gallons",

    serving: "servings"
  };

  return (
    labels[unit] ||
    formatFoodToken(unit)
  );
}


// =====================================================
// FOOD CALCULATION
// =====================================================

function calculateSelectedFoodNutrition() {
  const food =
    nutritionState
      .selectedFood;

  if (!food) {
    return null;
  }

  const calculator =
    window.AriFoodCalculator;

  if (
    !calculator ||
    typeof calculator.calculate !==
      "function"
  ) {
    setMealCalculationStatus(
      "ARI food calculator is unavailable. You can clear the database selection and enter nutrition manually.",
      "error"
    );

    nutritionState.foodCalculation =
      null;

    return null;
  }

  const quantityInput =
    getElement(
      "mealQuantity"
    );

  const unitSelect =
    getElement("mealUnit");

  const quantity =
    Number(
      quantityInput?.value
    );

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    nutritionState.foodCalculation =
      null;

    clearNutritionValueFields();

    setMealCalculationStatus(
      "Enter an amount greater than zero.",
      "error"
    );

    return null;
  }

  const selection =
    parseMeasurementSelection(
      unitSelect?.value ||
      nutritionState
        .selectedMeasurement
    );

  if (
    !selection.type ||
    !selection.value
  ) {
    nutritionState.foodCalculation =
      null;

    clearNutritionValueFields();

    setMealCalculationStatus(
      "Choose a valid serving or measurement unit.",
      "error"
    );

    return null;
  }

  let result = null;

  try {
    if (
      selection.type ===
      "serving"
    ) {
      result =
        calculator.calculateServing(
          food.id,
          selection.value,
          quantity
        );
    } else if (
      selection.type ===
      "unit"
    ) {
      result =
        calculator.calculate(
          food.id,
          quantity,
          selection.value
        );
    }
  } catch (error) {
    console.error(
      "[ARI NUTRITION CALCULATION ERROR]",
      error
    );

    result = {
      ok: false,

      error: {
        code:
          "calculation_exception",

        message:
          error?.message ||
          "Nutrition calculation failed."
      }
    };
  }

  nutritionState.foodCalculation =
    result;

  nutritionState.selectedMeasurement =
    unitSelect?.value ||
    null;

  if (!result?.ok) {
    clearNutritionValueFields();

    setMealCalculationStatus(
      result?.error?.message ||
        "This serving could not be calculated.",
      "error"
    );

    return result;
  }

  applyFoodCalculationToForm(
    result
  );

  setMealCalculationStatus(
    buildFoodCalculationStatus(
      result
    ),
    "success"
  );

  return result;
}


function applyFoodCalculationToForm(
  result
) {
  const nutrition =
    result?.nutrition;

  if (!nutrition) {
    return;
  }

  setInputValue(
    "mealCalories",
    roundDisplayCalories(
      nutrition.calories
    )
  );

  setInputValue(
    "mealProtein",
    roundMacro(
      nutrition.protein
    )
  );

  setInputValue(
    "mealCarbs",
    roundMacro(
      nutrition.carbs
    )
  );

  setInputValue(
    "mealFat",
    roundMacro(
      nutrition.fat
    )
  );
}


function buildFoodCalculationStatus(
  result
) {
  const pieces = [];

  if (
    result?.resolved?.grams !==
      null &&
    result?.resolved?.grams !==
      undefined
  ) {
    pieces.push(
      `${result.resolved.grams} g`
    );
  }

  if (
    result?.resolved?.milliliters !==
      null &&
    result?.resolved?.milliliters !==
      undefined
  ) {
    pieces.push(
      `${result.resolved.milliliters} mL`
    );
  }

  pieces.push(
    `${roundDisplayCalories(
      result?.nutrition?.calories
    )} kcal`
  );

  pieces.push(
    `${roundMacro(
      result?.nutrition?.protein
    )}g protein`
  );

  pieces.push(
    `${roundMacro(
      result?.nutrition?.carbs
    )}g carbs`
  );

  pieces.push(
    `${roundMacro(
      result?.nutrition?.fat
    )}g fat`
  );

  return pieces.join(
    " • "
  );
}


function setMealCalculationStatus(
  message,
  type = "info"
) {
  const status =
    getElement(
      "mealCalculationStatus"
    );

  if (!status) {
    return;
  }

  status.textContent =
    String(message || "");

  status.dataset.type =
    type;

  status.hidden =
    !message;
}


function clearMealCalculationStatus() {
  const status =
    getElement(
      "mealCalculationStatus"
    );

  if (!status) {
    return;
  }

  status.textContent = "";
  status.hidden = true;

  delete status.dataset.type;
}


function setDatabaseNutritionFieldsLocked(
  locked
) {
  [
    "mealCalories",
    "mealProtein",
    "mealCarbs",
    "mealFat"
  ].forEach(
    (id) => {
      const input =
        getElement(id);

      if (!input) {
        return;
      }

      input.readOnly =
        locked === true;

      input.classList.toggle(
        "ari-database-calculated-field",
        locked === true
      );

      input.setAttribute(
        "aria-readonly",
        String(
          locked === true
        )
      );
    }
  );
}


function clearNutritionValueFields() {
  [
    "mealCalories",
    "mealProtein",
    "mealCarbs",
    "mealFat"
  ].forEach(
    (id) => {
      const input =
        getElement(id);

      if (input) {
        input.value = "";
      }
    }
  );
}


// =====================================================
// MANUAL MEAL DATE / TIME
// =====================================================

function setManualMealDateTimeDefaults(
  date = new Date()
) {
  const dateInput =
    getElement("mealDate");

  const timeInput =
    getElement("mealTime");

  if (
    dateInput &&
    !dateInput.value
  ) {
    dateInput.value =
      formatLocalDate(date);
  }

  if (
    timeInput &&
    !timeInput.value
  ) {
    timeInput.value =
      formatLocalTimeInput(date);
  }
}


// =====================================================
// SAVE MANUAL MEAL
// =====================================================

async function saveManualMeal() {
  if (
    nutritionState.savingMeal
  ) {
    return;
  }

  /*
   * Recalculate immediately before save so the persisted
   * nutrition always reflects the current amount/unit.
   */
  if (
    nutritionState.selectedFood
  ) {
    const calculation =
      calculateSelectedFoodNutrition();

    if (!calculation?.ok) {
      showNutritionNotice(
        calculation?.error?.message ||
          "Select a valid serving before saving this food.",
        "error"
      );

      return;
    }
  }

  const meal =
    readManualMealForm();

  const validationError =
    validateManualMeal(meal);

  if (validationError) {
    showNutritionNotice(
      validationError,
      "error"
    );

    return;
  }

  nutritionState.savingMeal =
    true;

  setManualSaveBusy(true);

  const editingMeal =
    nutritionState.editingMeal;

  try {
    nutritionState.currentUser =
      nutritionState.currentUser ||
      await getNutritionUser();

    nutritionState.currentWindow =
      nutritionState.currentWindow ||
      await getNutritionWindow();

    const record =
      buildMealRecord(meal);

    let saveResult;

    if (editingMeal) {
      saveResult =
        await updateMealRecord(
          editingMeal,
          record
        );
    } else {
      saveResult =
        await saveMealRecord(
          record
        );
    }

    const actionText =
      editingMeal
        ? "updated"
        : "saved";

    nutritionState.editingMeal =
      null;

    clearManualMealForm();

    dismissNutritionKeyboard();

    updateManualFormMode();

    showNutritionNotice(
      saveResult.savedToCloud
        ? `${record.name} was ${actionText}.`
        : `${record.name} was ${actionText} on this device.`,
      "success"
    );

    await refreshNutritionPage();
  } catch (error) {
    console.error(
      editingMeal
        ? "[NUTRITION UPDATE ERROR]"
        : "[NUTRITION SAVE ERROR]",
      error
    );

    showNutritionNotice(
      error?.message ||
        (
          editingMeal
            ? "The meal could not be updated."
            : "The meal could not be saved."
        ),
      "error"
    );
  } finally {
    nutritionState.savingMeal =
      false;

    setManualSaveBusy(false);
  }
}


function readManualMealForm() {
  const calculation =
    nutritionState
      .foodCalculation;

  return {
    name:
      String(
        getElement(
          "mealName",
          "manualFoodName"
        )?.value ||
        ""
      ).trim(),

    calories:
      readOptionalNumberInput(
        getElement(
          "mealCalories",
          "manualCalories"
        )
      ),

    protein_g:
      readOptionalNumberInput(
        getElement(
          "mealProtein",
          "manualProtein"
        ),
        0
      ),

    carbs_g:
      readOptionalNumberInput(
        getElement(
          "mealCarbs",
          "manualCarbs"
        ),
        0
      ),

    fat_g:
      readOptionalNumberInput(
        getElement(
          "mealFat",
          "manualFat"
        ),
        0
      ),

    category:
      String(
        getElement(
          "mealType",
          "manualCategory"
        )?.value ||
        "Meal"
      ).trim(),

    date:
      String(
        getElement(
          "mealDate"
        )?.value ||
        ""
      ).trim(),

    time:
      String(
        getElement(
          "mealTime"
        )?.value ||
        ""
      ).trim(),

    databaseFoodId:
      nutritionState
        .selectedFood
        ?.id ||
      null,

    databaseFood:
      Boolean(
        nutritionState
          .selectedFood
      ),

    servingSize:
      buildSavedServingDescription(
        calculation
      ),

    multiplier:
      calculation?.ok
        ? toNumber(
            calculation
              ?.resolved
              ?.multiplier,
            1
          )
        : 1
  };
}


function validateManualMeal(
  meal
) {
  if (!meal.name) {
    return "Enter a food or meal name.";
  }

  /*
   * Zero-calorie foods are valid.
   *
   * Blank calories remain NaN because readOptionalNumberInput
   * does not coerce an empty field to zero.
   */
  if (
    !Number.isFinite(
      meal.calories
    ) ||
    meal.calories < 0
  ) {
    return "Enter a calorie amount of zero or greater.";
  }

  if (
    nutritionState.selectedFood &&
    !nutritionState
      .foodCalculation
      ?.ok
  ) {
    return "Choose a valid amount and serving for the selected database food.";
  }

  const macroValues = [
    meal.protein_g,
    meal.carbs_g,
    meal.fat_g
  ];

  if (
    macroValues.some(
      (value) =>
        !Number.isFinite(value) ||
        value < 0
    )
  ) {
    return "Protein, carbs, and fat cannot be negative.";
  }

  const dateInput =
    getElement("mealDate");

  const timeInput =
    getElement("mealTime");

  if (
    dateInput &&
    !meal.date
  ) {
    return "Select the date for this meal.";
  }

  if (
    timeInput &&
    !meal.time
  ) {
    return "Select the time for this meal.";
  }

  if (
    meal.date &&
    meal.time &&
    !createLocalDateTime(
      meal.date,
      meal.time
    )
  ) {
    return "Enter a valid meal date and time.";
  }

  return "";
}


function buildMealRecord(
  meal
) {
  const selectedDateTime =
    createLocalDateTime(
      meal.date,
      meal.time
    );

  const mealDateTime =
    selectedDateTime ||
    new Date();

  return {
    name:
      meal.name,

    calories:
      Math.round(
        meal.calories
      ),

    category:
      meal.category ||
      "Meal",

    nutrition_date:
      getNutritionDateForTimestamp(
        mealDateTime
      ),

    protein_g:
      roundMacro(
        meal.protein_g
      ),

    carbs_g:
      roundMacro(
        meal.carbs_g
      ),

    fat_g:
      roundMacro(
        meal.fat_g
      ),

    serving_size:
      meal.servingSize ||
      "Manual entry",

    multiplier:
      Number.isFinite(
        meal.multiplier
      )
        ? meal.multiplier
        : 1,

    is_favorite:
      false,

    created_at:
      mealDateTime.toISOString()
  };
}


function buildSavedServingDescription(
  calculation
) {
  if (!calculation?.ok) {
    return "Manual entry";
  }

  if (
    calculation.requested
      ?.servingLabel
  ) {
    const quantity =
      toNumber(
        calculation
          .requested
          .quantity,
        1
      );

    return quantity === 1
      ? calculation
          .requested
          .servingLabel
      : `${quantity} × ${
          calculation
            .requested
            .servingLabel
        }`;
  }

  const amount =
    calculation
      .requested
      ?.amount;

  const unit =
    calculation
      .requested
      ?.unit;

  if (
    amount !== undefined &&
    unit
  ) {
    return `${amount} ${unit}`;
  }

  return "Database serving";
}


// =====================================================
// SAVE / UPDATE STORAGE
// =====================================================

async function saveMealRecord(
  record
) {
  const user =
    nutritionState.currentUser;

  if (
    user &&
    window.calbuddySupabase
  ) {
    const {
      data,
      error
    } =
      await window.calbuddySupabase
        .from("meals")
        .insert({
          user_id:
            user.id,
          ...record
        })
        .select("*")
        .single();

    if (
      !error &&
      data
    ) {
      return {
        meal: {
          ...data,
          source:
            "supabase"
        },

        savedToCloud:
          true
      };
    }

    console.warn(
      "Supabase meal save failed; using local fallback:",
      error?.message ||
        "Unknown database error"
    );
  }

  const localMeal =
    saveMealLocally(
      record
    );

  return {
    meal:
      localMeal,

    savedToCloud:
      false
  };
}


async function updateMealRecord(
  existingMeal,
  record
) {
  if (!existingMeal?.id) {
    throw new Error(
      "The meal being edited does not have an ID."
    );
  }

  if (
    existingMeal.source ===
      "supabase" &&
    window.calbuddySupabase
  ) {
    let query =
      window.calbuddySupabase
        .from("meals")
        .update({
          name:
            record.name,

          calories:
            record.calories,

          category:
            record.category,

          nutrition_date:
            record.nutrition_date,

          protein_g:
            record.protein_g,

          carbs_g:
            record.carbs_g,

          fat_g:
            record.fat_g,

          serving_size:
            record.serving_size,

          multiplier:
            record.multiplier,

          is_favorite:
            record.is_favorite,

          created_at:
            record.created_at
        })
        .eq(
          "id",
          existingMeal.id
        );

    if (
      nutritionState
        .currentUser
        ?.id
    ) {
      query =
        query.eq(
          "user_id",
          nutritionState
            .currentUser
            .id
        );
    }

    const {
      data,
      error
    } =
      await query
        .select("*")
        .single();

    if (error) {
      throw error;
    }

    return {
      meal: {
        ...data,
        source:
          "supabase"
      },

      savedToCloud:
        true
    };
  }

  const meals =
    readLocalMeals();

  const index =
    meals.findIndex(
      (meal) =>
        String(meal.id) ===
        String(
          existingMeal.id
        )
    );

  if (index === -1) {
    throw new Error(
      "The local meal could not be found."
    );
  }

  meals[index] = {
    ...meals[index],
    ...record,

    id:
      meals[index].id,

    source:
      "local"
  };

  writeLocalMeals(
    meals
  );

  return {
    meal:
      meals[index],

    savedToCloud:
      false
  };
}


function saveMealLocally(
  record
) {
  const meals =
    readLocalMeals();

  const localMeal = {
    id:
      `local-${Date.now()}-${
        Math.random()
          .toString(16)
          .slice(2)
      }`,

    ...record,

    source:
      "local"
  };

  meals.push(
    localMeal
  );

  writeLocalMeals(
    meals
  );

  return localMeal;
}


// =====================================================
// CLEAR / RESET MANUAL FORM
// =====================================================

function clearManualMealForm() {
  nutritionState.selectedFood =
    null;

  nutritionState.selectedMeasurement =
    null;

  nutritionState.foodCalculation =
    null;

  nutritionState.foodSearchResults =
    [];

  nutritionState.foodSearchActiveIndex =
    -1;

  [
    "mealName",
    "manualFoodName",
    "mealCalories",
    "manualCalories",
    "mealProtein",
    "manualProtein",
    "mealCarbs",
    "manualCarbs",
    "mealFat",
    "manualFat"
  ].forEach(
    (id) => {
      const element =
        document.getElementById(
          id
        );

      if (element) {
        element.value =
          "";
      }
    }
  );

  const quantityInput =
    getElement(
      "mealQuantity"
    );

  if (quantityInput) {
    quantityInput.value =
      "1";
  }

  const unitSelect =
    getElement("mealUnit");

  if (unitSelect) {
    unitSelect.replaceChildren();
  }

  const selectedFoodContainer =
    getElement(
      "mealFoodSelection"
    );

  if (selectedFoodContainer) {
    selectedFoodContainer.hidden =
      true;
  }

  const measurementControls =
    getElement(
      "mealMeasurementControls"
    );

  if (measurementControls) {
    measurementControls.hidden =
      true;
  }

  closeManualFoodSearchResults();

  clearMealCalculationStatus();

  setDatabaseNutritionFieldsLocked(
    false
  );

  const mealType =
    getElement(
      "mealType",
      "manualCategory"
    );

  if (mealType) {
    mealType.value =
      "Breakfast";
  }

  const dateInput =
    getElement("mealDate");

  const timeInput =
    getElement("mealTime");

  if (dateInput) {
    dateInput.value =
      "";
  }

  if (timeInput) {
    timeInput.value =
      "";
  }

  setManualMealDateTimeDefaults();
}


// =====================================================
// SAVE BUTTON MODE
// =====================================================

function getSaveMealButtonParts() {
  const button =
    getElement("saveMealBtn");

  if (!button) {
    return {
      button: null,
      icon: null,
      label: null
    };
  }

  const icon =
    getElement(
      "saveMealIcon"
    ) ||
    button.querySelector(
      "span:first-child"
    );

  const label =
    getElement(
      "saveMealLabel"
    ) ||
    button.querySelector(
      "span:last-child"
    );

  return {
    button,
    icon,
    label
  };
}


function setManualSaveBusy(
  isBusy
) {
  const {
    button,
    icon,
    label
  } =
    getSaveMealButtonParts();

  if (!button) {
    return;
  }

  button.disabled =
    isBusy;

  button.setAttribute(
    "aria-busy",
    String(isBusy)
  );

  if (isBusy) {
    if (icon) {
      icon.textContent =
        "●";
    }

    if (label) {
      label.textContent =
        nutritionState
          .editingMeal
          ? "UPDATING..."
          : "SAVING...";
    }

    return;
  }

  updateManualFormMode();
}


function updateManualFormMode() {
  const {
    button,
    icon,
    label
  } =
    getSaveMealButtonParts();

  if (!button) {
    return;
  }

  const isEditing =
    Boolean(
      nutritionState
        .editingMeal
    );

  button.classList.toggle(
    "editing",
    isEditing
  );

  button.setAttribute(
    "aria-label",
    isEditing
      ? "Update meal"
      : "Save meal"
  );

  if (icon) {
    icon.textContent =
      isEditing
        ? "◇"
        : "+";
  }

  if (label) {
    label.textContent =
      isEditing
        ? "Update meal"
        : "Save meal";
  }
}


// =====================================================
// TODAY'S MEALS
// =====================================================

async function loadTodayMeals() {
  nutritionState.currentWindow =
    await getNutritionWindow();

  const cloudMeals =
    await getCloudMealsInWindow(
      nutritionState
        .currentWindow
    );

  const localMeals =
    getLocalMealsInWindow(
      nutritionState
        .currentWindow
    );

  nutritionState.mealsToday =
    mergeMealCollections(
      cloudMeals,
      localMeals
    ).sort(
      compareMealsOldestFirst
    );

  calculateNutritionTotals();
  renderTodayMeals();
  renderTodayNutrition();
}


async function getCloudMealsInWindow(
  windowInfo
) {
  const user =
    nutritionState.currentUser;

  if (
    !user ||
    !window.calbuddySupabase ||
    !windowInfo
  ) {
    return [];
  }

  const {
    data,
    error
  } =
    await window.calbuddySupabase
      .from("meals")
      .select("*")
      .eq(
        "user_id",
        user.id
      )
      .gte(
        "created_at",
        windowInfo
          .start
          .toISOString()
      )
      .lt(
        "created_at",
        windowInfo
          .end
          .toISOString()
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );

  if (error) {
    console.warn(
      "Today's cloud meals could not load:",
      error.message
    );

    return [];
  }

  return (
    data || []
  ).map(
    (meal) => ({
      ...meal,
      source:
        "supabase"
    })
  );
}


function getLocalMealsInWindow(
  windowInfo
) {
  if (!windowInfo) {
    return [];
  }

  return readLocalMeals()
    .filter(
      (meal) => {
        const createdAt =
          getMealDate(
            meal
          );

        return (
          createdAt >=
            windowInfo.start &&
          createdAt <
            windowInfo.end
        );
      }
    )
    .map(
      (meal) => ({
        ...meal,
        source:
          "local"
      })
    );
}


function renderTodayMeals() {
  const container =
    getElement(
      "todayMealList",
      "todayMealsList",
      "todayIntakeItems"
    );

  if (!container) {
    return;
  }

  container.replaceChildren();

  if (
    !nutritionState
      .mealsToday
      .length
  ) {
    const empty =
      document.createElement(
        "p"
      );

    empty.className =
      "nutrition-empty-state";

    empty.textContent =
      "No meals have been logged today.";

    container.appendChild(
      empty
    );

    return;
  }

  nutritionState
    .mealsToday
    .forEach(
      (meal) => {
        container.appendChild(
          createTodayMealCard(
            meal
          )
        );
      }
    );
}


function createTodayMealCard(
  meal
) {
  const card =
    document.createElement(
      "article"
    );

  card.className =
    "nutrition-meal-card";

  card.dataset.mealId =
    String(
      meal.id || ""
    );

  const heading =
    document.createElement(
      "div"
    );

  heading.className =
    "nutrition-meal-card-header";

  const titleGroup =
    document.createElement(
      "div"
    );

  const title =
    document.createElement(
      "h3"
    );

  title.textContent =
    meal.name ||
    "Meal";

  const meta =
    document.createElement(
      "p"
    );

  meta.className =
    "nutrition-meal-meta";

  meta.textContent = [
    meal.category ||
      "Meal",

    meal.serving_size &&
    meal.serving_size !==
      "Manual entry"
      ? meal.serving_size
      : "",

    formatMealTime(
      meal
    )
  ]
    .filter(Boolean)
    .join(" • ");

  titleGroup.append(
    title,
    meta
  );

  const calories =
    document.createElement(
      "strong"
    );

  calories.className =
    "nutrition-meal-calories";

  calories.textContent =
    `${Math.round(
      toNumber(
        meal.calories
      )
    )} kcal`;

  heading.append(
    titleGroup,
    calories
  );

  const macros =
    document.createElement(
      "p"
    );

  macros.className =
    "nutrition-meal-macros";

  macros.textContent = [
    `${roundMacro(
      readMealMacro(
        meal,
        "protein"
      )
    )}g protein`,

    `${roundMacro(
      readMealMacro(
        meal,
        "carbs"
      )
    )}g carbs`,

    `${roundMacro(
      readMealMacro(
        meal,
        "fat"
      )
    )}g fat`
  ].join(" • ");

  const actions =
    document.createElement(
      "div"
    );

  actions.className =
    "nutrition-meal-actions";

  const editButton =
    document.createElement(
      "button"
    );

  editButton.type =
    "button";

  editButton.className =
    "nutrition-edit-meal-btn";

  editButton.textContent =
    "Edit";

  editButton.addEventListener(
    "click",
    () => {
      beginMealEdit(
        meal
      );
    }
  );

  const deleteButton =
    document.createElement(
      "button"
    );

  deleteButton.type =
    "button";

  deleteButton.className =
    "nutrition-delete-meal-btn";

  deleteButton.textContent =
    "Delete";

  deleteButton.addEventListener(
    "click",
    () => {
      deleteMeal(
        meal
      );
    }
  );

  actions.append(
    editButton,
    deleteButton
  );

  card.append(
    heading,
    macros,
    actions
  );

  return card;
}


// =====================================================
// EDIT MEAL
// =====================================================

function beginMealEdit(
  meal
) {
  if (!meal) {
    return;
  }

  /*
   * Existing meal records do not currently persist a food
   * registry ID. Editing therefore opens in custom/manual
   * mode using the nutrition values already saved.
   *
   * This preserves backward compatibility with the current
   * Supabase schema and all previously logged meals.
   */
  clearSelectedDatabaseFood({
    keepName: true,
    focusName: false
  });

  nutritionState.editingMeal =
    meal;

  const mealDate =
    getMealDate(
      meal
    );

  const nameInput =
    getElement(
      "mealName",
      "manualFoodName"
    );

  const caloriesInput =
    getElement(
      "mealCalories",
      "manualCalories"
    );

  const proteinInput =
    getElement(
      "mealProtein",
      "manualProtein"
    );

  const carbsInput =
    getElement(
      "mealCarbs",
      "manualCarbs"
    );

  const fatInput =
    getElement(
      "mealFat",
      "manualFat"
    );

  const categoryInput =
    getElement(
      "mealType",
      "manualCategory"
    );

  const dateInput =
    getElement("mealDate");

  const timeInput =
    getElement("mealTime");

  if (nameInput) {
    nameInput.value =
      meal.name ||
      "";
  }

  if (caloriesInput) {
    caloriesInput.value =
      toNumber(
        meal.calories
      );
  }

  if (proteinInput) {
    proteinInput.value =
      roundMacro(
        readMealMacro(
          meal,
          "protein"
        )
      );
  }

  if (carbsInput) {
    carbsInput.value =
      roundMacro(
        readMealMacro(
          meal,
          "carbs"
        )
      );
  }

  if (fatInput) {
    fatInput.value =
      roundMacro(
        readMealMacro(
          meal,
          "fat"
        )
      );
  }

  if (categoryInput) {
    const category =
      String(
        meal.category ||
        "Breakfast"
      );

    const hasCategory =
      Array.from(
        categoryInput.options ||
        []
      ).some(
        (option) =>
          option.value ===
            category ||
          option.textContent ===
            category
      );

    categoryInput.value =
      hasCategory
        ? category
        : "Breakfast";
  }

  if (
    mealDate.getTime() !==
    0
  ) {
    if (dateInput) {
      dateInput.value =
        formatLocalDate(
          mealDate
        );
    }

    if (timeInput) {
      timeInput.value =
        formatLocalTimeInput(
          mealDate
        );
    }
  } else {
    setManualMealDateTimeDefaults();
  }

  const advancedSection =
    document.querySelector(
      "#manualEntrySection .ari-advanced-nutrition"
    );

  if (advancedSection) {
    advancedSection.open =
      true;
  }

  updateManualFormMode();

  const manualSection =
    getElement(
      "manualEntrySection"
    );

  manualSection?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  window.setTimeout(
    () => {
      nameInput?.focus();
    },
    350
  );
}


// =====================================================
// DELETE MEAL
// =====================================================

async function deleteMeal(
  meal
) {
  if (!meal?.id) {
    return;
  }

  const deleteConfirmed =
    window.confirm(
      `Delete ${
        meal.name ||
        "this meal"
      }?`
    );

  if (!deleteConfirmed) {
    return;
  }

  try {
    if (
      meal.source ===
        "supabase" &&
      window.calbuddySupabase
    ) {
      let query =
        window.calbuddySupabase
          .from("meals")
          .delete()
          .eq(
            "id",
            meal.id
          );

      if (
        nutritionState
          .currentUser
          ?.id
      ) {
        query =
          query.eq(
            "user_id",
            nutritionState
              .currentUser
              .id
          );
      }

      const {
        error
      } =
        await query;

      if (error) {
        throw error;
      }
    } else {
      const meals =
        readLocalMeals()
          .filter(
            (item) =>
              String(
                item.id
              ) !==
              String(
                meal.id
              )
          );

      writeLocalMeals(
        meals
      );
    }

    if (
      nutritionState
        .editingMeal &&
      String(
        nutritionState
          .editingMeal
          .id
      ) ===
        String(meal.id)
    ) {
      nutritionState.editingMeal =
        null;

      clearManualMealForm();
      updateManualFormMode();
    }

    showNutritionNotice(
      "Meal deleted.",
      "success"
    );

    await refreshNutritionPage();
  } catch (error) {
    console.error(
      "[NUTRITION DELETE ERROR]",
      error
    );

    showNutritionNotice(
      error?.message ||
        "The meal could not be deleted.",
      "error"
    );
  }
}


// =====================================================
// TODAY'S NUTRITION
// =====================================================

function calculateNutritionTotals() {
  nutritionState.totals =
    nutritionState
      .mealsToday
      .reduce(
        (
          totals,
          meal
        ) => {
          totals.calories +=
            toNumber(
              meal.calories
            );

          totals.protein +=
            readMealMacro(
              meal,
              "protein"
            );

          totals.carbs +=
            readMealMacro(
              meal,
              "carbs"
            );

          totals.fat +=
            readMealMacro(
              meal,
              "fat"
            );

          return totals;
        },
        {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        }
      );

  localStorage.setItem(
    "calbuddyCaloriesConsumed",
    String(
      Math.round(
        nutritionState
          .totals
          .calories
      )
    )
  );

  localStorage.setItem(
    "calbuddyCaloriesConsumedDate",
    nutritionState.currentWindow?.nutritionDate ||
      formatLocalDate(new Date())
  );
}


function renderTodayNutrition() {
  updateNutritionMetric(
    [
      "totalCalories",
      "todayCalories",
      "totalConsumedText"
    ],
    "Calories",
    `${Math.round(
      nutritionState
        .totals
        .calories
    ).toLocaleString()} kcal`
  );

  updateNutritionMetric(
    [
      "totalProtein",
      "todayProtein",
      "totalProteinText"
    ],
    "Protein",
    `${roundMacro(
      nutritionState
        .totals
        .protein
    )} g`
  );

  updateNutritionMetric(
    [
      "totalCarbs",
      "todayCarbs",
      "totalCarbsText"
    ],
    "Carbs",
    `${roundMacro(
      nutritionState
        .totals
        .carbs
    )} g`
  );

  updateNutritionMetric(
    [
      "totalFat",
      "todayFat",
      "totalFatText"
    ],
    "Fat",
    `${roundMacro(
      nutritionState
        .totals
        .fat
    )} g`
  );
}


function updateNutritionMetric(
  ids,
  label,
  value
) {
  const element =
    getElement(...ids);

  if (!element) {
    return;
  }

  const tagName =
    element.tagName
      .toLowerCase();

  if (
    [
      "strong",
      "span",
      "output"
    ].includes(
      tagName
    )
  ) {
    element.textContent =
      value;

    return;
  }

  const existingValue =
    element.querySelector(
      "strong, output"
    );

  if (existingValue) {
    existingValue.textContent =
      value;

    return;
  }

  element.replaceChildren();

  const labelElement =
    document.createElement(
      "span"
    );

  labelElement.textContent =
    label;

  const valueElement =
    document.createElement(
      "strong"
    );

  valueElement.textContent =
    value;

  element.append(
    labelElement,
    valueElement
  );
}


// =====================================================
// RECENT MEALS
// =====================================================

async function loadRecentMeals() {
  const cloudMeals =
    await getRecentCloudMeals();

  const localMeals =
    readLocalMeals();

  nutritionState.recentMeals =
    mergeMealCollections(
      cloudMeals,
      localMeals
    )
      .sort(
        compareMealsNewestFirst
      )
      .slice(
        0,
        NUTRITION_RECENT_MEAL_LIMIT
      );

  renderRecentMeals();
}


async function getRecentCloudMeals() {
  const user =
    nutritionState.currentUser;

  if (
    !user ||
    !window.calbuddySupabase
  ) {
    return [];
  }

  const {
    data,
    error
  } =
    await window.calbuddySupabase
      .from("meals")
      .select("*")
      .eq(
        "user_id",
        user.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(
        NUTRITION_RECENT_MEAL_LIMIT
      );

  if (error) {
    console.warn(
      "Recent cloud meals could not load:",
      error.message
    );

    return [];
  }

  return (
    data || []
  ).map(
    (meal) => ({
      ...meal,
      source:
        "supabase"
    })
  );
}


function renderRecentMeals() {
  const container =
    getElement(
      "recentMealList",
      "recentMealsList"
    );

  if (!container) {
    return;
  }

  container.replaceChildren();

  if (
    !nutritionState
      .recentMeals
      .length
  ) {
    const empty =
      document.createElement(
        "p"
      );

    empty.className =
      "nutrition-empty-state";

    empty.textContent =
      "No recent meals yet.";

    container.appendChild(
      empty
    );

    return;
  }

  nutritionState
    .recentMeals
    .forEach(
      (meal) => {
        const item =
          document.createElement(
            "article"
          );

        item.className =
          "nutrition-recent-meal";

        const text =
          document.createElement(
            "div"
          );

        const name =
          document.createElement(
            "strong"
          );

        name.textContent =
          meal.name ||
          "Meal";

        const meta =
          document.createElement(
            "p"
          );

        meta.textContent = [
          `${Math.round(
            toNumber(
              meal.calories
            )
          )} kcal`,

          formatRecentMealDate(
            meal
          )
        ]
          .filter(Boolean)
          .join(" • ");

        text.append(
          name,
          meta
        );

        item.appendChild(
          text
        );

        container.appendChild(
          item
        );
      }
    );
}


// =====================================================
// RESET WINDOW
// =====================================================

async function getResetTime() {
  const savedResetTime =
    localStorage.getItem(
      "calbuddyResetTime"
    );

  const user =
    nutritionState.currentUser ||
    await getNutritionUser();

  if (
    user &&
    window.calbuddySupabase
  ) {
    const {
      data,
      error
    } =
      await window.calbuddySupabase
        .from("profiles")
        .select(
          "reset_hour, reset_minute, reset_ampm"
        )
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

    if (
      !error &&
      data
    ) {
      const resetTime = {
        hour:
          toNumber(
            data.reset_hour,
            4
          ),

        minute:
          toNumber(
            data.reset_minute,
            0
          ),

        ampm:
          data.reset_ampm ||
          "AM"
      };

      localStorage.setItem(
        "calbuddyResetTime",
        JSON.stringify(
          resetTime
        )
      );

      return resetTime;
    }
  }

  if (savedResetTime) {
    try {
      const parsed =
        JSON.parse(
          savedResetTime
        );

      return {
        hour:
          toNumber(
            parsed.hour,
            4
          ),

        minute:
          toNumber(
            parsed.minute,
            0
          ),

        ampm:
          parsed.ampm ||
          "AM"
      };
    } catch {
      // Fall through to default reset time.
    }
  }

  return {
    hour: 4,
    minute: 0,
    ampm: "AM"
  };
}


async function getNutritionWindow() {
  const reset =
    await getResetTime();

  const resetHour24 =
    convertTo24Hour(
      reset.hour,
      reset.ampm
    );

  const now =
    new Date();

  const start =
    new Date(now);

  start.setHours(
    resetHour24,
    toNumber(
      reset.minute
    ),
    0,
    0
  );

  if (now < start) {
    start.setDate(
      start.getDate() - 1
    );
  }

  const end =
    new Date(start);

  end.setDate(
    end.getDate() + 1
  );

  return {
    start,
    end,

    nutritionDate:
      formatLocalDate(
        start
      )
  };
}


function convertTo24Hour(
  hour,
  ampm
) {
  const cleanHour =
    toNumber(hour);

  const cleanAmPm =
    String(
      ampm ||
      "AM"
    ).toUpperCase();

  if (
    cleanAmPm === "AM" &&
    cleanHour === 12
  ) {
    return 0;
  }

  if (
    cleanAmPm === "PM" &&
    cleanHour !== 12
  ) {
    return cleanHour + 12;
  }

  return cleanHour;
}


function getNutritionDateForTimestamp(
  date
) {
  if (
    !(date instanceof Date) ||
    Number.isNaN(
      date.getTime()
    )
  ) {
    return formatLocalDate(
      new Date()
    );
  }

  const resetStart =
    nutritionState
      .currentWindow
      ?.start;

  if (!resetStart) {
    return formatLocalDate(
      date
    );
  }

  const resetHour =
    resetStart.getHours();

  const resetMinute =
    resetStart.getMinutes();

  const nutritionDate =
    new Date(date);

  const occursBeforeReset =
    date.getHours() <
      resetHour ||
    (
      date.getHours() ===
        resetHour &&
      date.getMinutes() <
        resetMinute
    );

  if (occursBeforeReset) {
    nutritionDate.setDate(
      nutritionDate.getDate() - 1
    );
  }

  return formatLocalDate(
    nutritionDate
  );
}


// =====================================================
// LOCAL STORAGE
// =====================================================

function readLocalMeals() {
  try {
    const parsed =
      JSON.parse(
        localStorage.getItem(
          NUTRITION_LOCAL_MEALS_KEY
        ) ||
        "[]"
      );

    return Array.isArray(
      parsed
    )
      ? parsed
      : [];
  } catch {
    return [];
  }
}


function writeLocalMeals(
  meals
) {
  localStorage.setItem(
    NUTRITION_LOCAL_MEALS_KEY,
    JSON.stringify(
      Array.isArray(
        meals
      )
        ? meals
        : []
    )
  );
}


// =====================================================
// NOTICES
// =====================================================

function showNutritionNotice(
  message,
  type = "info"
) {
  const notice =
    ensureNutritionNotice();

  if (!notice) {
    return;
  }

  notice.textContent =
    String(
      message || ""
    );

  notice.dataset.type =
    type;

  notice.className =
    `nutrition-page-notice nutrition-notice-${type}`;

  notice.hidden =
    !message;

  if (message) {
    window.clearTimeout(
      showNutritionNotice
        .timeoutId
    );

    showNutritionNotice.timeoutId =
      window.setTimeout(
        () => {
          notice.hidden =
            true;
        },
        5000
      );
  }
}


function ensureNutritionNotice() {
  let notice =
    document.getElementById(
      "nutritionPageNotice"
    );

  if (notice) {
    return notice;
  }

  const manualSection =
    getElement(
      "manualEntrySection"
    );

  if (!manualSection) {
    return null;
  }

  notice =
    document.createElement(
      "p"
    );

  notice.id =
    "nutritionPageNotice";

  notice.className =
    "nutrition-page-notice";

  notice.setAttribute(
    "role",
    "status"
  );

  notice.setAttribute(
    "aria-live",
    "polite"
  );

  notice.hidden =
    true;

  manualSection.appendChild(
    notice
  );

  return notice;
}


// =====================================================
// GENERAL UTILITIES
// =====================================================

function getElement(
  ...ids
) {
  for (const id of ids) {
    const element =
      document.getElementById(
        id
      );

    if (element) {
      return element;
    }
  }

  return null;
}


function toNumber(
  value,
  fallback = 0
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : fallback;
}


function readOptionalNumberInput(
  input,
  fallback = Number.NaN
) {
  if (!input) {
    return fallback;
  }

  const raw =
    String(
      input.value ?? ""
    ).trim();

  if (!raw) {
    return fallback;
  }

  const number =
    Number(raw);

  return Number.isFinite(
    number
  )
    ? number
    : fallback;
}


function setInputValue(
  id,
  value
) {
  const input =
    getElement(id);

  if (!input) {
    return;
  }

  input.value =
    value === null ||
    value === undefined
      ? ""
      : String(value);
}


function roundMacro(
  value
) {
  return (
    Math.round(
      toNumber(value) *
      10
    ) /
    10
  );
}


function roundDisplayCalories(
  value
) {
  return (
    Math.round(
      toNumber(value)
    )
  );
}


function readMealMacro(
  meal,
  macroName
) {
  const aliases = {
    protein: [
      "protein_g",
      "protein"
    ],

    carbs: [
      "carbs_g",
      "carbs",
      "carbohydrates_g",
      "carbohydrates"
    ],

    fat: [
      "fat_g",
      "fat"
    ]
  };

  for (
    const key of
    aliases[macroName] ||
    []
  ) {
    if (
      meal?.[key] !==
        undefined &&
      meal?.[key] !==
        null
    ) {
      return toNumber(
        meal[key]
      );
    }
  }

  return 0;
}


function getMealDate(
  meal
) {
  const rawDate =
    meal?.created_at ||
    meal?.createdAt ||
    meal?.date ||
    meal?.nutrition_date;

  const date =
    new Date(
      rawDate
    );

  return Number.isNaN(
    date.getTime()
  )
    ? new Date(0)
    : date;
}


function formatMealTime(
  meal
) {
  const date =
    getMealDate(
      meal
    );

  if (
    date.getTime() ===
    0
  ) {
    return "";
  }

  return date.toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit"
    }
  );
}


function formatRecentMealDate(
  meal
) {
  const date =
    getMealDate(
      meal
    );

  if (
    date.getTime() ===
    0
  ) {
    return "";
  }

  return date.toLocaleString(
    [],
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }
  );
}


function formatLocalDate(
  date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}


function formatLocalTimeInput(
  date
) {
  const hours =
    String(
      date.getHours()
    ).padStart(
      2,
      "0"
    );

  const minutes =
    String(
      date.getMinutes()
    ).padStart(
      2,
      "0"
    );

  return `${hours}:${minutes}`;
}


function createLocalDateTime(
  dateValue,
  timeValue
) {
  if (
    !dateValue ||
    !timeValue
  ) {
    return null;
  }

  const dateParts =
    String(dateValue)
      .split("-")
      .map(Number);

  const timeParts =
    String(timeValue)
      .split(":")
      .map(Number);

  if (
    dateParts.length !==
      3 ||
    timeParts.length <
      2
  ) {
    return null;
  }

  const [
    year,
    month,
    day
  ] =
    dateParts;

  const [
    hour,
    minute
  ] =
    timeParts;

  if (
    !Number.isInteger(
      year
    ) ||
    !Number.isInteger(
      month
    ) ||
    !Number.isInteger(
      day
    ) ||
    !Number.isInteger(
      hour
    ) ||
    !Number.isInteger(
      minute
    )
  ) {
    return null;
  }

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const date =
    new Date(
      year,
      month - 1,
      day,
      hour,
      minute,
      0,
      0
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  if (
    date.getFullYear() !==
      year ||
    date.getMonth() !==
      month - 1 ||
    date.getDate() !==
      day ||
    date.getHours() !==
      hour ||
    date.getMinutes() !==
      minute
  ) {
    return null;
  }

  return date;
}


function mergeMealCollections(
  ...collections
) {
  const merged = [];
  const seen =
    new Set();

  collections
    .flat()
    .forEach(
      (meal) => {
        if (!meal) {
          return;
        }

        const key = [
          meal.source ||
            "unknown",

          meal.id ||
            "no-id",

          meal.created_at ||
            meal.createdAt ||
            "no-date",

          meal.name ||
            "no-name"
        ].join("|");

        if (
          seen.has(
            key
          )
        ) {
          return;
        }

        seen.add(
          key
        );

        merged.push(
          meal
        );
      }
    );

  return merged;
}


function compareMealsOldestFirst(
  a,
  b
) {
  return (
    getMealDate(a) -
    getMealDate(b)
  );
}


function compareMealsNewestFirst(
  a,
  b
) {
  return (
    getMealDate(b) -
    getMealDate(a)
  );
}


function formatFoodToken(
  value
) {
  const text =
    String(
      value || ""
    )
      .replace(
        /[-_]+/g,
        " "
      )
      .trim();

  if (!text) {
    return "";
  }

  return text
    .split(/\s+/)
    .map(
      (word) =>
        word.charAt(0)
          .toUpperCase() +
        word.slice(1)
          .toLowerCase()
    )
    .join(" ");
}


// =====================================================
// NUTRITION DISPLAY TEXT CLEANER
// Repairs common UTF-8 / Latin-1 / Windows-1252
// mojibake at the presentation layer only.
// Does not modify canonical food records in AriFoodRegistry.
// =====================================================

function cleanNutritionDisplayText(
  value
) {
  return String(
    value ?? ""
  )
    // Em dash decoded through Latin-1 / C1 controls.
    .replace(
      /\u00E2\u0080\u0094/g,
      " - "
    )

    // En dash decoded through Latin-1 / C1 controls.
    .replace(
      /\u00E2\u0080\u0093/g,
      " - "
    )

    // Curly apostrophes decoded through Latin-1.
    .replace(
      /\u00E2\u0080\u0099/g,
      "'"
    )
    .replace(
      /\u00E2\u0080\u0098/g,
      "'"
    )

    // Curly quotation marks decoded through Latin-1.
    .replace(
      /\u00E2\u0080\u009C/g,
      '"'
    )
    .replace(
      /\u00E2\u0080\u009D/g,
      '"'
    )

    // Bullet decoded through Latin-1.
    .replace(
      /\u00E2\u0080\u00A2/g,
      " • "
    )

    // Ellipsis decoded through Latin-1.
    .replace(
      /\u00E2\u0080\u00A6/g,
      "..."
    )

    // Em dash decoded through Windows-1252.
    .replace(
      /\u00E2\u20AC\u201D/g,
      " - "
    )

    // En dash decoded through Windows-1252.
    .replace(
      /\u00E2\u20AC\u201C/g,
      " - "
    )

    // Curly apostrophe decoded through Windows-1252.
    .replace(
      /\u00E2\u20AC\u2122/g,
      "'"
    )

    // Curly quote decoded through Windows-1252.
    .replace(
      /\u00E2\u20AC\u0153/g,
      '"'
    )

    // Bullet decoded through Windows-1252.
    .replace(
      /\u00E2\u20AC\u00A2/g,
      " • "
    )

    // Multiplication sign decoded through Windows-1252.
    .replace(
      /\u00C3\u2014/g,
      " x "
    )

    // Multiplication sign decoded through Latin-1/C1.
    .replace(
      /\u00C3\u0097/g,
      " x "
    )

    // Non-breaking-space corruption.
    .replace(
      /\u00C2\u00A0/g,
      " "
    )

    // Stray Â.
    .replace(
      /\u00C2/g,
      ""
    )

    // Catch remaining malformed UTF-8 punctuation beginning
    // with â followed by C1 control bytes. These are what can
    // appear as the â + block/grid glyphs on iOS Safari.
    .replace(
      /\u00E2[\u0080-\u009F]{1,2}/g,
      " "
    )

    // Collapse spacing created by the repairs.
    .replace(
      /\s+/g,
      " "
    )

    .trim();
}


// =====================================================
// MOBILE KEYBOARD
// =====================================================

function dismissNutritionKeyboard() {
  const activeElement =
    document.activeElement;

  if (!activeElement) {
    return;
  }

  const tagName =
    activeElement.tagName
      ?.toLowerCase();

  if (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  ) {
    activeElement.blur();
  }
}


// =====================================================
// PUBLIC DIAGNOSTIC SURFACE
// =====================================================

window.AriNutritionPage = {
  version:
    "4.2.1",

  refresh:
    refreshNutritionPage,

  sendAriMessage,

  saveManualMeal,

  beginMealEdit,

  deleteMeal,

  // Food database surfaces
  searchFood:
    runManualFoodSearch,

  selectFood:
    selectManualDatabaseFood,

  clearSelectedFood:
    clearSelectedDatabaseFood,

  calculateSelectedFood:
    calculateSelectedFoodNutrition,

  refreshFoodSystemStatus:
    refreshNutritionFoodSystemStatus,

  getState() {
    return {
      ...nutritionState,

      chatHistory: [
        ...nutritionState
          .chatHistory
      ],

      mealsToday: [
        ...nutritionState
          .mealsToday
      ],

      recentMeals: [
        ...nutritionState
          .recentMeals
      ],

      totals: {
        ...nutritionState
          .totals
      },

      selectedFood:
        nutritionState
          .selectedFood
          ? {
              ...nutritionState
                .selectedFood
            }
          : null,

      foodSearchResults: [
        ...nutritionState
          .foodSearchResults
      ],

      foodCalculation:
        nutritionState
          .foodCalculation
          ? {
              ...nutritionState
                .foodCalculation
            }
          : null,

      foodSystem: {
        ...nutritionState
          .foodSystem
      },

      editingMeal:
        nutritionState
          .editingMeal
          ? {
              ...nutritionState
                .editingMeal
            }
          : null
    };
  }
};
