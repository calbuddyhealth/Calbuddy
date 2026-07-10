// =====================================================
// ARI REBIRTH
// File: home.js
// Purpose: Home page behavior, Ari avatar, menu, chat, and dashboard.
// =====================================================

let ariChatHistory = [];
let ariBlinkInterval = null;
let ariBlinkTimeout = null;
let ariResetTimeout = null;
let ariBusy = false;
let ariConversationStarted = false;
let ariFirstReplyCompleted = false;
let ariAbortController = null;
let ariCurrentThinkingMessage = null;
let ariStopped = false;

const ARI_ASSETS = {
  heroOpen: "assets/ari/ari-idle-open.png",
  heroClosed: "assets/ari/ari-idle-closed.png",
  avatarOpen: "assets/ari/avatar-idle-open.png",
  avatarClosed: "assets/ari/avatar-idle-closed.png",
  thinking: "assets/ari/ari-thinking.png",
  goodNews: "assets/ari/ari-good-news.png",
  badNews: "assets/ari/ari-bad-news.png",
  concerned: "assets/ari/ari-concerned.png",
  celebrate: "assets/ari/ari-celebrate.png",
  excited: "assets/ari/ari-excited.png",
  shocked: "assets/ari/ari-shocked.png",
  shrug: "assets/ari/ari-shrug.png",
  shy: "assets/ari/ari-shy.png",
  sad: "assets/ari/ari-sad.png",
  armsCrossed: "assets/ari/ari-arms-crossed.png",
  disappointed: "assets/ari/ari-disappointed.png",
  knifeHand: "assets/ari/ari-knife-hand.png",
  pointing: "assets/ari/ari-pointing-finger.png"
};

const ARI_WELCOME_QUESTIONS = [
  "Ask me anything.",
  "What's on your mind?",
  "Tell me about yourself.",
  "What are you working on?",
  "Need help with something?",
  "What's your next goal?",
  "What should we solve today?",
  "Teach me something."
];

document.addEventListener("DOMContentLoaded", async () => {
  preloadAriAssets();
  enterAriWelcomeMode();
  setRotatingWelcomeQuestion();
  startAriBlinkLoop();
  setupAriKeyboardStability();

  await setupHomeAuth();
  await refreshHomeDashboard();

  const savedPending = window.CalBuddy?.getPendingAction?.();
  if (savedPending) showPendingAction(savedPending);

  setInterval(refreshHomeDashboard, 60000);
});

window.addEventListener("focus", refreshHomeDashboard);
window.addEventListener("pageshow", () => setTimeout(refreshHomeDashboard, 300));

window.addEventListener("calbuddy:dashboardUpdated", (event) => {
  renderDashboard(event.detail);
});

window.addEventListener("calbuddy:pendingAction", (event) => {
  showPendingAction(event.detail.action);
});

window.addEventListener("calbuddy:pendingActionCleared", () => {
  hidePendingAction();
});

window.addEventListener("calbuddy:mood", (event) => {
  updateAriAvatarMood(event.detail?.mood || "idle");
});

function preloadAriAssets() {
  Object.values(ARI_ASSETS).forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

function setRotatingWelcomeQuestion() {
  const input = document.getElementById("ariInput");
  const question = document.getElementById("ariWelcomeQuestion");

  if (!input) return;

  const savedIndex = Number(localStorage.getItem("ariWelcomeQuestionIndex") || 0);
  const nextIndex = savedIndex % ARI_WELCOME_QUESTIONS.length;
  const prompt = ARI_WELCOME_QUESTIONS[nextIndex];

  input.placeholder = prompt;

  if (question) question.textContent = "";

  localStorage.setItem(
    "ariWelcomeQuestionIndex",
    String((nextIndex + 1) % ARI_WELCOME_QUESTIONS.length)
  );
}

function enterAriWelcomeMode() {
  document.getElementById("ariApp")?.classList.remove("conversation-mode");
  document.getElementById("ariApp")?.classList.add("welcome-mode");

  ariConversationStarted = false;
  ariFirstReplyCompleted = false;

  setAriHero("heroOpen");
  setAriAvatar("avatarOpen");
}

function enterAriConversationMode() {
  const app = document.getElementById("ariApp");
  if (!app || app.classList.contains("conversation-mode")) return;

  app.classList.remove("welcome-mode");
  app.classList.add("conversation-mode");

  setAriAvatar("avatarOpen");
}

function setAriHero(assetKey) {
  const img = document.getElementById("ariHero");
  if (!img || !ARI_ASSETS[assetKey]) return;

  img.src = ARI_ASSETS[assetKey];
}

function setAriAvatar(assetKey) {
  const img = document.getElementById("ariHeaderAvatar");
  if (!img || !ARI_ASSETS[assetKey]) return;

  img.src = ARI_ASSETS[assetKey];
}

function setAriPose(poseKey) {
  if (ariFirstReplyCompleted) {
    updateAriAvatarMood(poseKey);
    return;
  }

  const heroPoseMap = {
    idleOpen: "heroOpen",
    idleClosed: "heroClosed",
    thinking: "thinking",
    goodNews: "goodNews",
    badNews: "badNews",
    concerned: "concerned",
    celebrate: "celebrate",
    excited: "excited",
    shocked: "shocked",
    shrug: "shrug",
    shy: "shy",
    sad: "sad",
    armsCrossed: "armsCrossed",
    disappointed: "disappointed",
    knifeHand: "knifeHand",
    pointing: "pointing"
  };

  setAriHero(heroPoseMap[poseKey] || "heroOpen");
}

function updateAriAvatarMood(mood = "idle") {
  const app = document.getElementById("ariApp");
  if (!app?.classList.contains("conversation-mode")) return;

  if (mood === "thinking" || mood === "coach" || mood === "logging") {
    app.classList.add("ari-thinking-mode");
  } else {
    app.classList.remove("ari-thinking-mode");
  }

  setAriAvatar("avatarOpen");
}

function startAriBlinkLoop() {
  clearTimeout(ariBlinkInterval);
  clearTimeout(ariBlinkTimeout);
  scheduleNextAriBlink();
}

function scheduleNextAriBlink() {
  const nextBlinkDelay = 2600 + Math.random() * 7200;

  ariBlinkInterval = setTimeout(() => {
    performAriBlink();
  }, nextBlinkDelay);
}

function performAriBlink() {
  if (ariBusy) {
    openAriEyes();
    scheduleNextAriBlink();
    return;
  }

  const longBlink = Math.random() < 0.14;
  const doubleBlink = !longBlink && Math.random() < 0.22;

  const blinkDuration = longBlink
    ? 520 + Math.random() * 260
    : 90 + Math.random() * 190;

  closeAriEyes();

  ariBlinkTimeout = setTimeout(() => {
    openAriEyes();

    if (doubleBlink && !ariBusy) {
      ariBlinkTimeout = setTimeout(() => {
        closeAriEyes();

        ariBlinkTimeout = setTimeout(() => {
          openAriEyes();
          scheduleNextAriBlink();
        }, 85 + Math.random() * 150);

      }, 120 + Math.random() * 100);

    } else {
      scheduleNextAriBlink();
    }
  }, blinkDuration);
}

function closeAriEyes() {
  if (ariFirstReplyCompleted) {
    setAriAvatar("avatarClosed");
  } else {
    setAriHero("heroClosed");
  }
}

function openAriEyes() {
  if (ariFirstReplyCompleted) {
    setAriAvatar("avatarOpen");
  } else {
    setAriHero("heroOpen");
  }
}

function interruptAri(poseKey) {
  ariBusy = true;
  clearTimeout(ariResetTimeout);
  clearTimeout(ariBlinkTimeout);
  openAriEyes();
  setAriPose(poseKey);
}

function resetAriAfterDelay(delay = 120000) {
  clearTimeout(ariResetTimeout);

  ariResetTimeout = setTimeout(() => {
    ariBusy = false;

    if (ariFirstReplyCompleted) {
      setAriAvatar("avatarOpen");
    } else {
      setAriHero("heroOpen");
    }
  }, delay);
}

function chooseAriReaction(message = "") {
  return { pose: "idleOpen" };
}

function applyAriAfterResponseEmotion(message = "", reply = "") {
  ariBusy = false;

  if (ariFirstReplyCompleted) {
    setAriAvatar("avatarOpen");
  } else {
    setAriHero("heroOpen");
  }
}

function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("menuOverlay");
  const toggle = document.querySelector(".ari-menu-toggle");

  menu?.classList.toggle("open");
  overlay?.classList.toggle("show");
  toggle?.classList.toggle("open");
}

async function setupHomeAuth() {
  if (typeof requireAuth === "function") {
    await requireAuth();
    return;
  }

  if (!window.calbuddySupabase) return;

  const { data } = await window.calbuddySupabase.auth.getSession();

  if (!data?.session) {
    window.location.replace("signin.html");
  }
}

async function refreshHomeDashboard() {
  if (!window.CalBuddy) return;

  try {
    const context = await CalBuddy.refreshDashboard();
    renderDashboard(context);
  } catch (error) {
    console.log("Home dashboard refresh skipped:", error.message);
  }
}

function renderDashboard(context = {}) {
  const goal = Number(context.dailyGoal || 2100);
  const consumed = Number(context.caloriesConsumed || 0);
  const burned = Number(context.caloriesBurned || 0);

  const netConsumed = Math.max(consumed - burned, 0);
  const caloriesLeft = Math.max(goal - netConsumed, 0);

  const percentLeft = goal
    ? Math.max(0, Math.min(caloriesLeft / goal, 1))
    : 1;

  const percentUsed = goal
    ? Math.max(0, Math.min(netConsumed / goal, 1))
    : 0;

  setText("caloriesLeftText", caloriesLeft.toLocaleString());
  setText("dailyGoalText", goal.toLocaleString());
  setText("caloriesConsumedText", netConsumed.toLocaleString());

  const navFill = document.getElementById("navMeterFill");

  if (navFill) {
    navFill.style.strokeDasharray = "100";
    navFill.style.strokeDashoffset = String(100 - percentLeft * 100);

    navFill.classList.remove("nav-meter-yellow", "nav-meter-red");

    if (percentUsed >= 1) {
      navFill.classList.add("nav-meter-red");
    } else if (percentUsed >= 0.75) {
      navFill.classList.add("nav-meter-yellow");
    }
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function autoResizeAriInput() {
  const input = document.getElementById("ariInput");
  if (!input) return;
}

function handleAriEnter(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendAriMessage();
  }
}

function addAriMessage(text, sender = "ari") {
  const messages = document.getElementById("ariMessages");
  if (!messages) return null;

  const div = document.createElement("div");
  div.className = `ari-message ${sender === "user" ? "ari-user" : "ari-ai"}`;

  const label = document.createElement("span");
  label.className = "ari-label";
  label.textContent = sender === "user" ? "You" : "Ari";

  const body = document.createElement("p");
  body.textContent = text;

  div.appendChild(label);
  div.appendChild(body);
  messages.appendChild(div);

  requestAnimationFrame(() => {
    div.scrollIntoView({ behavior: "smooth", block: "end" });
  });

  return div;
}

function setAriComposerThinking(isThinking) {
  const input = document.getElementById("ariInput");
  const button = document.getElementById("ariSendBtn");
  const shell = document.querySelector(".ari-input-shell");
  const app = document.getElementById("ariApp");

  if (!input || !button) return;

  shell?.classList.toggle("thinking", isThinking);
  app?.classList.toggle("ari-system-thinking", isThinking);
  app?.classList.toggle("ari-thinking-mode", isThinking);

  if (isThinking) {
    input.disabled = true;
    input.placeholder = "Ari is thinking...";
    button.textContent = "■";
    button.classList.add("ari-stop-btn");
    button.onclick = stopAriThinking;
  } else {
    input.disabled = false;
    setRotatingWelcomeQuestion();
    button.textContent = "➤";
    button.classList.remove("ari-stop-btn");
    button.onclick = sendAriMessage;
  }
}

function addAriTypingMessage() {
  const div = addAriMessage("", "ari");
  if (!div) return null;

  const body = div.querySelector("p");

  if (body) {
    body.innerHTML = `
      <span class="ari-typing-dots">
        <span></span><span></span><span></span>
      </span>
    `;
  }

  return div;
}

function stopAriThinking() {
  ariStopped = true;

  if (ariAbortController) {
    ariAbortController.abort();
  }

  if (ariCurrentThinkingMessage) {
    ariCurrentThinkingMessage.remove();
    ariCurrentThinkingMessage = null;
  }

  ariBusy = false;
  setAriPose("idleOpen");
  setAriComposerThinking(false);
}

function setAriTypingMode(isTyping) {
  const app = document.getElementById("ariApp");
  if (!app) return;

  app.classList.toggle("ari-keyboard-mode", isTyping);
}

function setupAriKeyboardStability() {
  const input = document.getElementById("ariInput");
  if (!input) return;

  input.addEventListener("focus", () => setAriTypingMode(true));
  input.addEventListener("blur", () => setAriTypingMode(false));
}

async function sendAriMessage() {
  const input = document.getElementById("ariInput");

  if (!input) return;

  const message = input.value.trim();
  if (!message) return;

  ariConversationStarted = true;
  ariBusy = false;
  setAriPose("idleOpen");

  input.value = "";
  autoResizeAriInput();

  addAriMessage(message, "user");

  ariStopped = false;
  ariAbortController = new AbortController();

  setAriComposerThinking(true);

  const thinkingMessage = addAriTypingMessage();
  ariCurrentThinkingMessage = thinkingMessage;

  ariChatHistory.push({ role: "user", content: message });
  ariChatHistory = ariChatHistory.slice(-10);

  try {
    const response = await CalBuddy.askAri({
      message,
      history: ariChatHistory,
      ownerMode: true,
      appContext: {
        ownerMode: true
      },
      debugTiming: true
    });

    if (ariStopped) return;

    const reply = response.reply || "Hmm. I had trouble answering that. Try again.";

    if (thinkingMessage) {
      const body = thinkingMessage.querySelector("p");
      if (body) body.textContent = reply;
    }

    ariChatHistory.push({ role: "assistant", content: reply });
    ariChatHistory = ariChatHistory.slice(-10);

    applyAriAfterResponseEmotion(message, reply);

    if (!ariFirstReplyCompleted) {
      ariFirstReplyCompleted = true;
      setTimeout(enterAriConversationMode, 450);
    }

    if (response.pendingAction) {
      showPendingAction(response.pendingAction);
    }

    await refreshHomeDashboard();
  } catch (error) {
    if (ariStopped) return;

    setAriPose("idleOpen");

    if (thinkingMessage) {
      const body = thinkingMessage.querySelector("p");
      if (body) body.textContent = error.message || "Something glitched. Try again in a second.";
    }

    if (!ariFirstReplyCompleted) {
      ariFirstReplyCompleted = true;
      setTimeout(enterAriConversationMode, 450);
    }

    resetAriAfterDelay();
  } finally {
    ariAbortController = null;
    ariCurrentThinkingMessage = null;

    if (!ariStopped) {
      setAriComposerThinking(false);
    }
  }
}

function showPendingAction(action) {
  const bar = document.getElementById("pendingActionBar");
  const text = document.getElementById("pendingActionText");

  if (!bar || !text || !action) return;

  text.textContent = action.confirmation_text || "Want me to log that?";
  bar.classList.add("show");
}

function hidePendingAction() {
  document.getElementById("pendingActionBar")?.classList.remove("show");
}

async function confirmAriAction() {
  const result = await CalBuddy.confirmPendingAction();

  addAriMessage(result.reply || "Done.", "ari");
  setAriPose("idleOpen");
  hidePendingAction();

  await refreshHomeDashboard();
  resetAriAfterDelay();
}

function cancelAriAction() {
  const result = CalBuddy.cancelPendingAction();

  addAriMessage(result.reply || "No problem.", "ari");
  setAriPose("idleOpen");
  hidePendingAction();

  resetAriAfterDelay();
}
