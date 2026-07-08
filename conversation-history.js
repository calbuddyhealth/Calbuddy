// =====================================================
// ARI REBIRTH
// File: conversation-history.js
// Version: 2.1.0
// Purpose:
//   Displays Ari's recent Memory Vault.
//
// Features:
//   • Save conversation
//   • Automatically keeps Today & Yesterday only
//   • Delete conversation
//   • Clear history
//   • Safe to load on every page
// =====================================================

const historyList = document.getElementById("conversationHistoryList");

// -----------------------------------------------------
// Keep only Today + Yesterday
// -----------------------------------------------------

function keepOnlyTodayAndYesterday(history = []) {

  const now = new Date();

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return history.filter(item => {

    if (!item.created_at) return false;

    const created = new Date(item.created_at);

    return created >= yesterday;

  });

}

// -----------------------------------------------------
// Save Conversation
// -----------------------------------------------------

function saveAriConversation(title, preview, messages = []) {

  let history = JSON.parse(
    localStorage.getItem("ariConversationHistory") || "[]"
  );

  history = keepOnlyTodayAndYesterday(history);

  history.push({
    id: Date.now(),
    title: title || "Conversation",
    preview: preview || "",
    messages,
    created_at: new Date().toISOString()
  });

  localStorage.setItem(
    "ariConversationHistory",
    JSON.stringify(history)
  );

}

// -----------------------------------------------------
// Date Helpers
// -----------------------------------------------------

function isToday(date) {

  const today = new Date();

  return (

    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  );

}

function isYesterday(date) {

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (

    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()

  );

}

// -----------------------------------------------------
// Card Builder
// -----------------------------------------------------

function createConversationCard(item) {

  const card = document.createElement("div");
  card.className = "ari-history-card";

  card.innerHTML = `

    <strong>${item.title}</strong>

    <p>${item.preview}</p>

    <small>
      ${new Date(item.created_at).toLocaleString()}
    </small>

    <div class="intake-actions">

      <button
        class="delete-intake-btn"
        onclick="deleteConversation(${item.id})">

        Delete

      </button>

    </div>

  `;

  return card;

}

// -----------------------------------------------------
// Load History
// -----------------------------------------------------

function loadConversationHistory() {

  if (!historyList) return;

  let history = JSON.parse(
    localStorage.getItem("ariConversationHistory") || "[]"
  );

  // Automatically remove anything older than yesterday

  history = keepOnlyTodayAndYesterday(history);

  localStorage.setItem(
    "ariConversationHistory",
    JSON.stringify(history)
  );

  history.reverse();

  historyList.innerHTML = "";

  const todayItems = [];
  const yesterdayItems = [];

  history.forEach(item => {

    if (!item.created_at) return;

    const date = new Date(item.created_at);

    if (isToday(date)) {

      todayItems.push(item);

    } else if (isYesterday(date)) {

      yesterdayItems.push(item);

    }

  });

  if (!todayItems.length && !yesterdayItems.length) {

    historyList.innerHTML = `

      <p class="window-note">

        No recent conversations yet.

      </p>

    `;

    return;

  }

  if (todayItems.length) {

    historyList.innerHTML += `

      <h3 class="ari-history-section-title">

        Today

      </h3>

    `;

    todayItems.forEach(item => {
      historyList.appendChild(createConversationCard(item));
    });

  }

  if (yesterdayItems.length) {

    historyList.innerHTML += `

      <h3 class="ari-history-section-title">

        Yesterday

      </h3>

    `;

    yesterdayItems.forEach(item => {
      historyList.appendChild(createConversationCard(item));
    });

  }

}

// -----------------------------------------------------
// Delete Conversation
// -----------------------------------------------------

function deleteConversation(id) {

  let history = JSON.parse(
    localStorage.getItem("ariConversationHistory") || "[]"
  );

  history = history.filter(item => item.id !== id);

  localStorage.setItem(
    "ariConversationHistory",
    JSON.stringify(history)
  );

  loadConversationHistory();

}

// -----------------------------------------------------
// Clear All
// -----------------------------------------------------

function clearConversationHistory() {

  localStorage.removeItem("ariConversationHistory");

  loadConversationHistory();

}

// -----------------------------------------------------
// Getters
// -----------------------------------------------------

function getConversationHistory() {

  return keepOnlyTodayAndYesterday(

    JSON.parse(
      localStorage.getItem("ariConversationHistory") || "[]"
    )

  );

}

function getConversationById(id) {

  return getConversationHistory().find(

    item => item.id === id

  );

}

// -----------------------------------------------------
// Initialize
// -----------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

  if (historyList) {

    loadConversationHistory();

  }

});