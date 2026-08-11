// =====================================================
// ARI REBIRTH
// File: home.js
// Version: 3.2.4
// Purpose: Home page behavior, Ari hero, navigation, chat, and dashboard.
//
// V3.2.3:
//   - Treats frame 7 as the quick blink version of frame 8.
//   - Holds frame 8 for seven seconds, flashes frame 7 for 140ms,
//     and immediately returns to frame 8.
//   - Keeps frame 7 brief during entry and reverse transitions.
//
// V3.2.2:
//   - Completely skips ari-thinking-3.png in both animation directions.
//   - Holds frames 8 and 7 for eight seconds each while Ari is waiting.
//
// V3.2.1:
//   - Slows the complete thinking transition for smoother visual movement.
//   - Holds frames 8 and 7 much longer during the waiting loop.
//   - Slows the return sequence from frame 8 to frame 1.
//
// V3.2.0:
//   - Adds an eight-frame Ari thinking sequence behind conversation messages.
//   - Advances 1 through 8, then alternates 8 and 7 while awaiting Ari.
//   - Reverses to frame 1 when the response arrives or thinking is stopped.
//   - Resumes forward from the current frame when a new question arrives.
//   - Creates the thinking backdrop at runtime; no new HTML is required.
//
// V3.1.0:
//   - Makes the visible Ari hero open Ari Preferences when selected.
//   - Adds keyboard-accessible Ari preference navigation.
//   - Uses only Ari's open-eye and closed-eye homepage PNGs.
//   - Synchronizes the full-screen menu's visual and ARIA state.
//   - Replaces composer symbols with SEND and STOP text.
//   - Adds functional textarea auto-resizing.
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
let ariThinkingSequenceTimer = null;
let ariThinkingSequenceFrame = 1;
let ariThinkingSequencePhase = "idle";

const ARI_ASSETS = {
  heroOpen: "assets/ari/ari-idle-open.png",
  heroClosed: "assets/ari/ari-idle-closed.png"
};

const ARI_COMPOSER_PROMPT = "What are you working on?";
const ARI_PREFERENCES_URL = "ari-preference-settings.html";

const ARI_THINKING_SEQUENCE = Object.freeze({
  frameNumbers: Object.freeze([1, 2, 4, 5, 6, 7, 8]),
  frameSources: Object.freeze({
    1: "assets/ari/ari-thinking-1.png",
    2: "assets/ari/ari-thinking-2.png",
    4: "assets/ari/ari-thinking-4.png",
    5: "assets/ari/ari-thinking-5.png",
    6: "assets/ari/ari-thinking-6.png",
    7: "assets/ari/ari-thinking-7.png",
    8: "assets/ari/ari-thinking-8.png"
  }),
  firstFrame: 1,
  holdLowFrame: 7,
  lastFrame: 8,
  enterDelay: 240,
  holdFrame8Delay: 7000,
  frame7BlinkDelay: 140,
  exitDelay: 165
});

document.addEventListener("DOMContentLoaded", async () => {
  openRequestedHomeMenu();

  preloadAriAssets();
  setupAriThinkingSequence();
  enterAriWelcomeMode();
  setRotatingWelcomeQuestion();
  startAriBlinkLoop();
  setupAriKeyboardStability();
  setupAriPreferenceNavigation();
  setupHomeMenuKeyboardControls();

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
  const sources = [
    ...Object.values(ARI_ASSETS),
    ...Object.values(ARI_THINKING_SEQUENCE.frameSources)
  ];

  sources.forEach((src) => {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  });
}

function setupAriThinkingSequence() {
  const conversationShell = document.getElementById("ariConversationShell");
  if (!conversationShell) return;

  let backdrop = document.getElementById("ariThinkingBackdrop");
  let sequenceImage = document.getElementById("ariThinkingSequence");

  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "ariThinkingBackdrop";
    backdrop.className = "ari-thinking-backdrop";
    backdrop.setAttribute("aria-hidden", "true");

    sequenceImage = document.createElement("img");
    sequenceImage.id = "ariThinkingSequence";
    sequenceImage.className = "ari-thinking-sequence-img";
    sequenceImage.alt = "";
    sequenceImage.decoding = "async";
    sequenceImage.draggable = false;

    backdrop.appendChild(sequenceImage);
    conversationShell.prepend(backdrop);
  }

  renderAriThinkingFrame(ariThinkingSequenceFrame, true);
}

function renderAriThinkingFrame(frame, force = false) {
  const sequenceImage = document.getElementById("ariThinkingSequence");
  const requestedFrame = Number(frame);
  const nextFrame = ARI_THINKING_SEQUENCE.frameNumbers.includes(requestedFrame)
    ? requestedFrame
    : ARI_THINKING_SEQUENCE.firstFrame;

  if (
    !force &&
    nextFrame === ariThinkingSequenceFrame &&
    sequenceImage?.getAttribute("src")
  ) {
    return;
  }

  ariThinkingSequenceFrame = nextFrame;

  if (sequenceImage) {
    sequenceImage.src = ARI_THINKING_SEQUENCE.frameSources[nextFrame];
    sequenceImage.dataset.frame = String(nextFrame);
  }
}

function getAdjacentAriThinkingFrame(frame, direction) {
  const frames = ARI_THINKING_SEQUENCE.frameNumbers;
  const currentIndex = Math.max(0, frames.indexOf(frame));
  const nextIndex = Math.max(
    0,
    Math.min(frames.length - 1, currentIndex + direction)
  );

  return frames[nextIndex];
}

function clearAriThinkingSequenceTimer() {
  if (ariThinkingSequenceTimer) {
    clearTimeout(ariThinkingSequenceTimer);
    ariThinkingSequenceTimer = null;
  }
}

function scheduleAriThinkingSequence(callback, delay) {
  clearAriThinkingSequenceTimer();

  ariThinkingSequenceTimer = setTimeout(() => {
    ariThinkingSequenceTimer = null;
    callback();
  }, delay);
}

function startAriThinkingSequence() {
  setupAriThinkingSequence();

  const backdrop = document.getElementById("ariThinkingBackdrop");
  backdrop?.classList.add("is-active");
  backdrop?.classList.remove("is-settling");

  if (ariThinkingSequencePhase === "holding") return;

  clearAriThinkingSequenceTimer();

  if (ariThinkingSequenceFrame >= ARI_THINKING_SEQUENCE.lastFrame) {
    ariThinkingSequencePhase = "holding";
    scheduleAriThinkingHold();
    return;
  }

  ariThinkingSequencePhase = "entering";
  scheduleAriThinkingSequence(
    advanceAriThinkingSequence,
    ARI_THINKING_SEQUENCE.enterDelay
  );
}

function advanceAriThinkingSequence() {
  if (ariThinkingSequencePhase !== "entering") return;

  const nextFrame = getAdjacentAriThinkingFrame(
    ariThinkingSequenceFrame,
    1
  );

  renderAriThinkingFrame(nextFrame);

  if (nextFrame >= ARI_THINKING_SEQUENCE.lastFrame) {
    ariThinkingSequencePhase = "holding";
    scheduleAriThinkingHold();
    return;
  }

  const nextDelay = nextFrame === ARI_THINKING_SEQUENCE.holdLowFrame
    ? ARI_THINKING_SEQUENCE.frame7BlinkDelay
    : ARI_THINKING_SEQUENCE.enterDelay;

  scheduleAriThinkingSequence(advanceAriThinkingSequence, nextDelay);
}

function scheduleAriThinkingHold() {
  if (ariThinkingSequencePhase !== "holding") return;

  const showingFrame8 =
    ariThinkingSequenceFrame === ARI_THINKING_SEQUENCE.lastFrame;

  const delay = showingFrame8
    ? ARI_THINKING_SEQUENCE.holdFrame8Delay
    : ARI_THINKING_SEQUENCE.frame7BlinkDelay;

  scheduleAriThinkingSequence(() => {
    if (ariThinkingSequencePhase !== "holding") return;

    renderAriThinkingFrame(
      showingFrame8
        ? ARI_THINKING_SEQUENCE.holdLowFrame
        : ARI_THINKING_SEQUENCE.lastFrame
    );

    scheduleAriThinkingHold();
  }, delay);
}

function finishAriThinkingSequence() {
  const backdrop = document.getElementById("ariThinkingBackdrop");

  backdrop?.classList.remove("is-active");
  backdrop?.classList.add("is-settling");

  if (ariThinkingSequencePhase === "exiting") return;

  clearAriThinkingSequenceTimer();

  if (ariThinkingSequenceFrame <= ARI_THINKING_SEQUENCE.firstFrame) {
    ariThinkingSequencePhase = "idle";
    renderAriThinkingFrame(ARI_THINKING_SEQUENCE.firstFrame, true);
    backdrop?.classList.remove("is-settling");
    return;
  }

  ariThinkingSequencePhase = "exiting";
  scheduleAriThinkingSequence(
    reverseAriThinkingSequence,
    ARI_THINKING_SEQUENCE.exitDelay
  );
}

function reverseAriThinkingSequence() {
  if (ariThinkingSequencePhase !== "exiting") return;

  const nextFrame = getAdjacentAriThinkingFrame(
    ariThinkingSequenceFrame,
    -1
  );

  renderAriThinkingFrame(nextFrame);

  if (nextFrame <= ARI_THINKING_SEQUENCE.firstFrame) {
    ariThinkingSequencePhase = "idle";
    document
      .getElementById("ariThinkingBackdrop")
      ?.classList.remove("is-settling");
    return;
  }

  const nextDelay = nextFrame === ARI_THINKING_SEQUENCE.holdLowFrame
    ? ARI_THINKING_SEQUENCE.frame7BlinkDelay
    : ARI_THINKING_SEQUENCE.exitDelay;

  scheduleAriThinkingSequence(reverseAriThinkingSequence, nextDelay);
}

function setRotatingWelcomeQuestion() {
  const input = document.getElementById("ariInput");
  const question = document.getElementById("ariWelcomeQuestion");

  if (!input) return;

  input.placeholder = ARI_COMPOSER_PROMPT;

  if (question) question.textContent = "";
}

function enterAriWelcomeMode() {
  document.getElementById("ariApp")?.classList.remove("conversation-mode");
  document.getElementById("ariApp")?.classList.add("welcome-mode");

  ariConversationStarted = false;
  ariFirstReplyCompleted = false;

  setAriHero("heroOpen");
}

function enterAriConversationMode() {
  const app = document.getElementById("ariApp");
  if (!app || app.classList.contains("conversation-mode")) return;

  app.classList.remove("welcome-mode");
  app.classList.add("conversation-mode");
}

function setAriHero(assetKey) {
  const img = document.getElementById("ariHero");
  if (!img || !ARI_ASSETS[assetKey]) return;

  img.src = ARI_ASSETS[assetKey];
}

function setAriPose(poseKey) {
  setAriHero(poseKey === "idleClosed" ? "heroClosed" : "heroOpen");
}

function updateAriAvatarMood(mood = "idle") {
  const app = document.getElementById("ariApp");
  if (!app?.classList.contains("conversation-mode")) return;

  if (mood === "thinking" || mood === "coach" || mood === "logging") {
    app.classList.add("ari-thinking-mode");
  } else {
    app.classList.remove("ari-thinking-mode");
  }

  setAriHero("heroOpen");
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
  setAriHero("heroClosed");
}

function openAriEyes() {
  setAriHero("heroOpen");
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
    setAriHero("heroOpen");
  }, delay);
}

function chooseAriReaction(message = "") {
  return { pose: "idleOpen" };
}

function applyAriAfterResponseEmotion(message = "", reply = "") {
  ariBusy = false;
  setAriHero("heroOpen");
}

function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  if (!menu) return;

  setHomeMenuState(!menu.classList.contains("open"));
}

function setHomeMenuState(isOpen, moveFocus = true) {
  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("menuOverlay");
  const toggle = document.querySelector(".ari-menu-toggle");
  const closeButton = menu?.querySelector(".ari-close-menu");

  menu?.classList.toggle("open", isOpen);
  overlay?.classList.toggle("show", isOpen);
  toggle?.classList.toggle("open", isOpen);
  document.body.classList.toggle("ari-menu-open", isOpen);

  menu?.setAttribute("aria-hidden", String(!isOpen));
  overlay?.setAttribute("aria-hidden", String(!isOpen));
  toggle?.setAttribute("aria-expanded", String(isOpen));

  if (!moveFocus) return;

  requestAnimationFrame(() => {
    if (isOpen) {
      closeButton?.focus();
    } else {
      toggle?.focus();
    }
  });
}

function setupHomeMenuKeyboardControls() {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    const menu = document.getElementById("sideMenu");
    if (!menu?.classList.contains("open")) return;

    event.preventDefault();
    setHomeMenuState(false);
  });
}

function openRequestedHomeMenu() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  if (params.get("menu") !== "open") {
    return;
  }

  setHomeMenuState(true, false);

  window.history.replaceState(
    {},
    "",
    "home.html"
  );
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

  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 144)}px`;
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

  div.className =
    `ari-message ${sender === "user" ? "ari-user" : "ari-ai"}`;

  const label = document.createElement("span");
  label.className = "ari-message-label";
  label.textContent = sender === "user" ? "You" : "Ari";

  const body = document.createElement("p");
  body.textContent = text;

  div.appendChild(label);
  div.appendChild(body);
  messages.appendChild(div);

  /*
    Wait until conversation mode has rendered before scrolling.
    Two animation frames allow display/layout changes to settle.
  */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      div.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest"
      });
    });
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
    startAriThinkingSequence();
  } else {
    finishAriThinkingSequence();
  }

  if (isThinking) {
    input.disabled = true;
    input.placeholder = "Ari is thinking...";
    button.textContent = "STOP";
    button.classList.add("ari-stop-btn");
    button.onclick = stopAriThinking;
  } else {
    input.disabled = false;
    setRotatingWelcomeQuestion();
    button.textContent = "SEND";
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

function setupAriPreferenceNavigation() {
  const ariHero = document.getElementById("ariHero");
  if (!ariHero) return;

  ariHero.tabIndex = 0;
  ariHero.setAttribute("role", "link");
  ariHero.setAttribute("aria-label", "Open Ari Preferences");
  ariHero.setAttribute("title", "Open Ari Preferences");
  ariHero.dataset.ariPreferencesLink = "true";

  ariHero.addEventListener("click", openAriPreferences);

  ariHero.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    openAriPreferences();
  });
}

function openAriPreferences() {
  window.location.assign(ARI_PREFERENCES_URL);
}

async function sendAriMessage() {
  const input = document.getElementById("ariInput");

  if (!input) return;

  const message = input.value.trim();
  if (!message) return;

  ariConversationStarted = true;
  ariBusy = false;

  setAriPose("idleOpen");

  /*
    Reveal the conversation layout before inserting
    or scrolling to any messages.
  */
  enterAriConversationMode();

  input.value = "";
  autoResizeAriInput();

  addAriMessage(message, "user");

  ariStopped = false;
  ariAbortController = new AbortController();

  setAriComposerThinking(true);

  const thinkingMessage = addAriTypingMessage();
  ariCurrentThinkingMessage = thinkingMessage;

  ariChatHistory.push({
    role: "user",
    content: message
  });

  ariChatHistory = ariChatHistory.slice(-10);

  try {
    const response = await CalBuddy.askAri({
      message,
      history: ariChatHistory,
      debugTiming: true
    });

    if (ariStopped) return;

    finishAriThinkingSequence();

    const reply =
      response.reply ||
      "Hmm. I had trouble answering that. Try again.";

    if (thinkingMessage) {
      const body = thinkingMessage.querySelector("p");

      if (body) {
        body.textContent = reply;

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            thinkingMessage.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "nearest"
            });
          });
        });
      }
    }

    ariChatHistory.push({
      role: "assistant",
      content: reply
    });

    ariChatHistory = ariChatHistory.slice(-10);

    ariFirstReplyCompleted = true;
    applyAriAfterResponseEmotion(message, reply);

    if (response.pendingAction) {
      showPendingAction(response.pendingAction);
    }

    await refreshHomeDashboard();
  } catch (error) {
    if (ariStopped) return;

    finishAriThinkingSequence();
    setAriPose("idleOpen");

    if (thinkingMessage) {
      const body = thinkingMessage.querySelector("p");

      if (body) {
        body.textContent =
          error.message ||
          "Something glitched. Try again in a second.";

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            thinkingMessage.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "nearest"
            });
          });
        });
      }
    }

    ariFirstReplyCompleted = true;

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
