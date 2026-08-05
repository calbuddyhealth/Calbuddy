(() => {
  "use strict";

  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));

  const controller = {
    version: "1.0.0",
    source: "ari-circle-controller",

    state: {
      topCircleCount: 6,
      connectionState: "none",
      promptsExpanded: false,
      toastTimer: null
    },

    init() {
      this.cache();
      this.bind();
      this.renderTopCircle();
      this.updateLoveCounter();
      console.log("ARI CIRCLE LOADED:", this.version);
    },

    cache() {
      this.dom = {
        editCover: $("#ari-circle-edit-cover"),
        coverInput: $("#ari-circle-cover-input"),
        coverImage: $("#ari-circle-cover-image"),
        avatarButton: $("#ari-circle-avatar-button"),
        avatarInput: $("#ari-circle-avatar-input"),
        avatar: $("#ari-circle-avatar"),
        addToCircle: $("#ari-circle-add-to-circle"),
        messageProfile: $("#ari-circle-message-profile"),
        topDialog: $("#ari-circle-top-dialog"),
        editTop: $("#ari-circle-edit-top"),
        saveTop: $("#ari-circle-save-top"),
        topCircle: $("#ari-circle-top-circle"),
        topCount: $("#ari-circle-top-count"),
        loveForm: $("#ari-circle-love-form"),
        loveInput: $("#ari-circle-love-input"),
        loveCount: $("#ari-circle-love-count"),
        comments: $("#ari-circle-comments"),
        togglePrompts: $("#ari-circle-toggle-prompts"),
        messageDialog: $("#ari-circle-message-dialog"),
        messageInput: $("#ari-circle-message-input"),
        sendMessage: $("#ari-circle-send-message"),
        toast: $("#ari-circle-toast")
      };
    },

    bind() {
      this.dom.editCover?.addEventListener("click", () => this.dom.coverInput?.click());
      this.dom.coverInput?.addEventListener("change", e => this.previewImage(e, this.dom.coverImage));
      this.dom.avatarButton?.addEventListener("click", () => this.dom.avatarInput?.click());
      this.dom.avatarInput?.addEventListener("change", e => this.previewImage(e, this.dom.avatar));
      this.dom.addToCircle?.addEventListener("click", () => this.toggleConnectionRequest());
      this.dom.messageProfile?.addEventListener("click", () => this.openDialog(this.dom.messageDialog));
      this.dom.editTop?.addEventListener("click", () => this.openDialog(this.dom.topDialog));
      this.dom.saveTop?.addEventListener("click", () => this.saveTopCircleChoice());
      this.dom.loveInput?.addEventListener("input", () => this.updateLoveCounter());
      this.dom.loveForm?.addEventListener("submit", e => this.submitLove(e));
      this.dom.togglePrompts?.addEventListener("click", () => this.togglePrompts());
      this.dom.sendMessage?.addEventListener("click", e => this.mockSendMessage(e));

      $$(".ari-circle-orbit-person").forEach(button => {
        button.addEventListener("click", () => {
          const name = button.dataset.person || "This person";
          this.showToast(`${name}'s ARI Circle profile will open here.`);
        });
      });
    },

    previewImage(event, targetImage) {
      const file = event.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      if (targetImage) targetImage.src = url;
      this.showToast("Preview updated. Backend upload comes next.");
    },

    toggleConnectionRequest() {
      this.state.connectionState = this.state.connectionState === "none" ? "pending" : "none";
      const pending = this.state.connectionState === "pending";
      this.dom.addToCircle.textContent = pending ? "Requested â" : "Add to Circle";
      this.dom.addToCircle.dataset.state = this.state.connectionState;
      this.showToast(pending ? "Circle request staged for the prototype." : "Circle request canceled.");
    },

    saveTopCircleChoice() {
      const selected = document.querySelector('input[name="topCircleCount"]:checked');
      const count = Number(selected?.value || 6);
      this.state.topCircleCount = count === 4 ? 4 : 6;
      this.renderTopCircle();
      this.showToast(`Top ${this.state.topCircleCount} selected.`);
    },

    renderTopCircle() {
      if (!this.dom.topCircle) return;
      this.dom.topCircle.classList.toggle("ari-circle-orbit--four", this.state.topCircleCount === 4);
      this.dom.topCircle.classList.toggle("ari-circle-orbit--six", this.state.topCircleCount === 6);
      if (this.dom.topCount) this.dom.topCount.textContent = String(this.state.topCircleCount);
    },

    updateLoveCounter() {
      const value = this.dom.loveInput?.value || "";
      if (this.dom.loveCount) this.dom.loveCount.textContent = `${value.length} / 280`;
    },

    submitLove(event) {
      event.preventDefault();
      const text = this.dom.loveInput?.value?.trim();
      if (!text) return this.showToast("Write something first.");

      const article = document.createElement("article");
      article.className = "ari-circle-comment";
      article.innerHTML = `
        <div class="ari-circle-comment__avatar" aria-hidden="true"></div>
        <div class="ari-circle-comment__body">
          <div class="ari-circle-comment__meta"><strong>You</strong><span>Now</span></div>
          <p></p>
        </div>
        <button class="ari-circle-comment__more" type="button" aria-label="Comment options">â¢â¢â¢</button>
      `;
      article.querySelector("p").textContent = text;
      this.dom.comments?.prepend(article);
      this.dom.loveInput.value = "";
      this.updateLoveCounter();
      this.showToast("Love added locally.");
    },

    togglePrompts() {
      this.state.promptsExpanded = !this.state.promptsExpanded;
      $$(".ari-circle-prompt--extra").forEach(prompt => {
        prompt.hidden = !this.state.promptsExpanded;
      });
      this.dom.togglePrompts?.setAttribute("aria-expanded", String(this.state.promptsExpanded));
      if (this.dom.togglePrompts) this.dom.togglePrompts.textContent = this.state.promptsExpanded ? "Show Less â" : "Show All â";
    },

    mockSendMessage(event) {
      event.preventDefault();
      const text = this.dom.messageInput?.value?.trim();
      if (!text) return this.showToast("Write a message first.");
      this.dom.messageInput.value = "";
      this.dom.messageDialog?.close();
      this.showToast("Message UI works. Supabase sending comes next.");
    },

    openDialog(dialog) {
      if (dialog && typeof dialog.showModal === "function") dialog.showModal();
    },

    showToast(message) {
      if (!this.dom.toast) return;
      window.clearTimeout(this.state.toastTimer);
      this.dom.toast.textContent = message;
      this.dom.toast.hidden = false;
      this.state.toastTimer = window.setTimeout(() => {
        this.dom.toast.hidden = true;
      }, 2600);
    },

    getDiagnostics() {
      return {
        ready: true,
        source: this.source,
        version: this.version,
        topCircleCount: this.state.topCircleCount,
        connectionState: this.state.connectionState,
        backendConnected: false
      };
    }
  };

  window.AriCircle = controller;
  window.Ari = window.Ari || {};
  window.Ari.circle = controller;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => controller.init(), { once: true });
  } else {
    controller.init();
  }
})();
