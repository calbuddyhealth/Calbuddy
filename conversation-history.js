// =====================================================
// ARI REBIRTH
// File: conversation-history.js
// Version: 2.1.1
// Purpose: Displays Ari's recent Memory Vault.
// =====================================================

function getHistoryList() {
  return document.getElementById("conversationHistoryList");
}

function keepOnlyTodayAndYesterday(history = []) {
  const now = new Date();

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return history.filter((item) => {
    if (!item.created_at) return false;
    return new Date(item.created_at) >= yesterday;
  });
}

function saveAriConversation(title, preview, messages = []) {
  let history = JSON.parse(localStorage.getItem("ariConversationHistory") || "[]");

  history = keepOnlyTodayAndYesterday(history);

  history.push({
    id: Date.now(),
    title: title || "Conversation",
    preview: preview || "",
    messages,
    created_at: new Date().toISOString()
  });

  localStorage.setItem("ariConversationHistory", JSON.stringify(history));
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

  const title = document.createElement("strong");
  title.textContent = item.title || "Conversation";

  const preview = document.createElement("p");
  preview.textContent = item.preview || "";

  const date = document.createElement("small");
  date.textContent = item.created_at
    ? new Date(item.created_at).toLocaleString()
    : "";

  const actions = document.createElement("div");
  actions.className = "conversation-actions";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-conversation-btn";
  deleteBtn.type = "button";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", () => deleteConversation(item.id));

  actions.appendChild(deleteBtn);

  card.appendChild(title);
  card.appendChild(preview);
  card.appendChild(date);
  card.appendChild(actions);

  return card;
}

function loadConversationHistory() {
  const historyList = getHistoryList();
  if (!historyList) return;

  let history = JSON.parse(localStorage.getItem("ariConversationHistory") || "[]");

  history = keepOnlyTodayAndYesterday(history);

  localStorage.setItem("ariConversationHistory", JSON.stringify(history));

  history.reverse();
  historyList.innerHTML = "";

  const todayItems = [];
  const yesterdayItems = [];

  history.forEach((item) => {
    if (!item.created_at) return;

    const date = new Date(item.created_at);

    if (isToday(date)) {
      todayItems.push(item);
    } else if (isYesterday(date)) {
      yesterdayItems.push(item);
    }
  });

  if (!todayItems.length && !yesterdayItems.length) {
    const empty = document.createElement("p");
    empty.className = "window-note";
    empty.textContent = "No recent conversations yet.";
    historyList.appendChild(empty);
    return;
  }

  if (todayItems.length) {
    const heading = document.createElement("h3");
    heading.className = "ari-history-section-title";
    heading.textContent = "Today";
    historyList.appendChild(heading);

    todayItems.forEach((item) => {
      historyList.appendChild(createConversationCard(item));
    });
  }

  if (yesterdayItems.length) {
    const heading = document.createElement("h3");
    heading.className = "ari-history-section-title";
    heading.textContent = "Yesterday";
    historyList.appendChild(heading);

    yesterdayItems.forEach((item) => {
      historyList.appendChild(createConversationCard(item));
    });
  }
}

function deleteConversation(id) {
  let history = JSON.parse(localStorage.getItem("ariConversationHistory") || "[]");

  history = history.filter((item) => item.id !== id);

  localStorage.setItem("ariConversationHistory", JSON.stringify(history));

  loadConversationHistory();
}

function clearConversationHistory() {
  localStorage.removeItem("ariConversationHistory");
  loadConversationHistory();
}

function getConversationHistory() {
  return keepOnlyTodayAndYesterday(
    JSON.parse(localStorage.getItem("ariConversationHistory") || "[]")
  );
}

function getConversationById(id) {
  return getConversationHistory().find((item) => item.id === id);
}
function goBack() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.replace("home.html");
}


document.addEventListener("DOMContentLoaded", () => {
  loadConversationHistory();
});