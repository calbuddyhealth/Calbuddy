const historyList = document.getElementById("conversationHistoryList");

function loadConversationHistory() {
  const history = JSON.parse(localStorage.getItem("ariConversationHistory") || "[]");

  if (!history.length) {
    historyList.innerHTML = "<p>No saved conversations yet.</p>";
    return;
  }

  historyList.innerHTML = "";

  history.slice().reverse().forEach(item => {
    const card = document.createElement("div");
    card.className = "ari-history-card";

    card.innerHTML = `
      <strong>${item.title || "Conversation"}</strong>
      <p>${item.preview || ""}</p>
      <small>${item.created_at ? new Date(item.created_at).toLocaleString() : ""}</small>
    `;

    historyList.appendChild(card);
  });
}

loadConversationHistory();