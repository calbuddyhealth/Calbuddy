// =====================================================
// ARI REBIRTH
// File: conversation-history.js
// Version: 2.0.0
// Purpose:
//   Displays Ari's recent Memory Vault.
//
// Features:
//   • Save conversation
//   • Show Today & Yesterday only
//   • Delete conversation
//   • Clear history
// =====================================================

const historyList = document.getElementById("conversationHistoryList");

function saveAriConversation(title, preview, messages = []) {

  const history = JSON.parse(
    localStorage.getItem("ariConversationHistory") || "[]"
  );

  history.push({
    id: Date.now(),
    title: title || "Conversation",
    preview: preview || "",
    messages,
    created_at: new Date().toISOString()
  });

  localStorage.setItem(
    "ariConversationHistory",
    JSON.stringify(history.slice(-100))
  );
}

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

function loadConversationHistory() {

  if (!historyList) return;

  const history = JSON.parse(
    localStorage.getItem("ariConversationHistory") || "[]"
  ).reverse();

  historyList.innerHTML = "";

  const todayItems = [];
  const yesterdayItems = [];

  history.forEach(item => {

    if (!item.created_at) return;

    const date = new Date(item.created_at);

    if (isToday(date)) {
      todayItems.push(item);
    }
    else if (isYesterday(date)) {
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

function clearConversationHistory() {

  localStorage.removeItem("ariConversationHistory");

  loadConversationHistory();

}

function getConversationHistory() {

  return JSON.parse(
    localStorage.getItem("ariConversationHistory") || "[]"
  );

}

function getConversationById(id) {

  return getConversationHistory().find(
    item => item.id === id
  );

}

document.addEventListener("DOMContentLoaded", () => {

  if (historyList) {
    loadConversationHistory();
  }

});