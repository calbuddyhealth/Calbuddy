// =====================================================
// ARI REBIRTH
// File: conversation-history.js
// Version: 1.0.0
// Purpose:
//   Stores and displays Ari conversation history.
//
// Features:
//   • Save conversation
//   • Load conversation history
//   • Delete individual conversations
//   • Clear all conversations
//   • Safe to load on every page
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
    JSON.stringify(history)
  );

}

function loadConversationHistory() {

  if (!historyList) return;

  const history = JSON.parse(
    localStorage.getItem("ariConversationHistory") || "[]"
  );

  if (!history.length) {
    historyList.innerHTML = `
      <p class="window-note">
        No saved conversations yet.
      </p>
    `;
    return;
  }

  historyList.innerHTML = "";

  history
    .slice()
    .reverse()
    .forEach(item => {

      const card = document.createElement("div");
      card.className = "ari-history-card";

      card.innerHTML = `
        <strong>${item.title}</strong>

        <p>${item.preview}</p>

        <small>
          ${
            item.created_at
              ? new Date(item.created_at).toLocaleString()
              : ""
          }
        </small>

        <div class="intake-actions">

          <button
            class="delete-intake-btn"
            onclick="deleteConversation(${item.id})">
            Delete
          </button>

        </div>
      `;

      historyList.appendChild(card);

    });

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

  const history = getConversationHistory();

  return history.find(item => item.id === id);

}

document.addEventListener("DOMContentLoaded", () => {

  if (historyList) {
    loadConversationHistory();
  }

});