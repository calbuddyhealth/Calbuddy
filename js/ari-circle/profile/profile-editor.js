// js/ari-circle/profile/profile-editor.js
// ARI Circle — Profile Editor V2.5.1
//
// The profile is intentionally compact: identity, about, interests,
// and four showcase slots managed separately by profile-gallery-v1.

import CircleStore from "../core/circle-store.js";
import CircleEvents, { EVENT_NAMES } from "../core/circle-events.js";
import ProfileMedia, { MEDIA_TYPES } from "../media/profile-media.js";

const VERSION = "2.5.1";
const SOURCE = "ari-circle/profile/profile-editor";
const AUTOSAVE_DELAY_MS = 650;
const PROFILE_SAVED_EVENT = "circle:profile-saved";
const PROFILE_SAVE_FAILED_EVENT = "circle:profile-save-failed";

const PROFILE_FIELDS = Object.freeze([
  {
    key: "display_name",
    label: "Display Name",
    type: "text",
    maxlength: 60,
    placeholder: "Your name",
    section: "Profile"
  },
  {
    key: "handle",
    label: "@Handle",
    type: "text",
    maxlength: 30,
    placeholder: "yourhandle",
    section: "Profile"
  },
  {
    key: "bio",
    label: "Bio",
    type: "textarea",
    maxlength: 180,
    placeholder: "A short line about you",
    section: "Profile"
  },
  {
    key: "cover_url",
    label: "Profile background",
    type: "select",
    section: "Profile",
    options: [
      { value: "", label: "Default" },
      { value: "template:midnight", label: "Midnight" },
      { value: "template:violet-spectrum", label: "Violet Spectrum" },
      { value: "template:fire-spectrum", label: "Fire Spectrum" },
      { value: "template:pink-spectrum", label: "Pink Spectrum" },
      { value: "__custom_photo__", label: "Custom photo…" }
    ]
  },
  {
    key: "location",
    label: "Lives in",
    type: "text",
    maxlength: 80,
    placeholder: "City, State",
    section: "About Me"
  },
  {
    key: "birthday",
    label: "Birthday",
    type: "date",
    section: "About Me"
  },
  {
    key: "goal",
    label: "Goal",
    type: "textarea",
    maxlength: 180,
    placeholder: "Something you're working toward",
    section: "About Me"
  },
  {
    key: "bucket_list",
    label: "Bucket List",
    type: "textarea",
    maxlength: 180,
    placeholder: "Something you want to do someday",
    section: "About Me"
  },
  {
    key: "favorite_song",
    label: "Favorite Song",
    type: "text",
    maxlength: 100,
    placeholder: "Song title",
    section: "Things I'm Into"
  },
  {
    key: "favorite_food",
    label: "Favorite Food",
    type: "text",
    maxlength: 80,
    placeholder: "Favorite food",
    section: "Things I'm Into"
  },
  {
    key: "favorite_movie",
    label: "Favorite Movie",
    type: "text",
    maxlength: 100,
    placeholder: "Favorite movie",
    section: "Things I'm Into"
  },
  {
    key: "favorite_hobby",
    label: "Favorite Hobby",
    type: "text",
    maxlength: 100,
    placeholder: "Favorite hobby",
    section: "Things I'm Into"
  }
]);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeHandle(value) {
  return normalizeString(value)
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, 30);
}

function getNestedProfileValue(profile, key) {
  if (!profile || typeof profile !== "object") return "";

  const interests = profile.interests && typeof profile.interests === "object"
    ? profile.interests
    : {};
  const about = profile.about_me && typeof profile.about_me === "object"
    ? profile.about_me
    : {};

  const aliases = {
    display_name: [profile.display_name, profile.displayName, profile.name],
    handle: [profile.handle, profile.username],
    bio: [profile.bio, profile.status, profile.about],
    cover_url: [profile.cover_url, profile.coverUrl, profile.background_url, profile.backgroundUrl],
    location: [profile.location, profile.lives_in, profile.livesIn, about.location, about.lives_in, about.livesIn],
    birthday: [profile.birthday, profile.birth_date, profile.birthDate, about.birthday],
    goal: [profile.goal, about.goal],
    bucket_list: [profile.bucket_list, profile.bucketList, about.bucket_list, about.bucketList],
    favorite_song: [profile.favorite_song, profile.favoriteSong, interests.favorite_song, interests.favoriteSong, interests.song],
    favorite_food: [profile.favorite_food, profile.favoriteFood, interests.favorite_food, interests.favoriteFood, interests.food],
    favorite_movie: [profile.favorite_movie, profile.favoriteMovie, interests.favorite_movie, interests.favoriteMovie, interests.movie],
    favorite_hobby: [profile.favorite_hobby, profile.favoriteHobby, interests.favorite_hobby, interests.favoriteHobby, interests.hobby]
  };

  for (const value of aliases[key] || []) {
    const normalized = normalizeString(String(value ?? ""));
    if (normalized) return normalized;
  }
  return "";
}

const ProfileEditor = {
  version: VERSION,
  source: SOURCE,

  state: {
    initialized: false,
    fieldsBuilt: false,
    submitting: false,
    saveTimer: 0,
    saveInFlight: false,
    pendingSave: false,
    saveSequence: 0,
    activeRequestId: null,
    activeSnapshot: "",
    lastSavedSnapshot: "",
    suppressAutoSave: false,
    unsubscribers: []
  },

  dom: {
    dialog: null,
    form: null,
    fields: null,
    saveStatus: null,
    customBackgroundPicker: null,
    customBackgroundButton: null,
    customBackgroundInput: null
  },

  init() {
    if (this.state.initialized) return this.getDiagnostics();
    this.cacheDom();
    this.buildFields();
    this.bindForm();
    this.bindEvents();
    this.state.initialized = true;
    return this.getDiagnostics();
  },

  cacheDom() {
    this.dom.dialog = document.getElementById("circle-profile-editor");
    this.dom.form = document.getElementById("circle-profile-editor-form");
    this.dom.fields = document.getElementById("circle-profile-editor-fields");
    this.dom.saveStatus = document.getElementById("circle-profile-save-status");
    this.dom.customBackgroundPicker =
      document.getElementById("circle-custom-background-picker");
    this.dom.customBackgroundButton =
      document.getElementById("circle-custom-background-button");
    this.dom.customBackgroundInput =
      document.getElementById("circle-editor-custom-cover-input");
  },

  bindEvents() {
    this.state.unsubscribers.push(
      CircleEvents.onAction("edit-profile", () => this.populate()),
      CircleEvents.onAction("close-profile-editor", () => this.close()),
      CircleEvents.on(PROFILE_SAVED_EVENT, payload => {
        this.handlePersisted(true, payload?.detail || {});
      }),
      CircleEvents.on(PROFILE_SAVE_FAILED_EVENT, payload => {
        this.handlePersisted(false, payload?.detail || {});
      }),
      CircleEvents.on("circle:profile-media-uploaded", payload => {
        const detail = payload?.detail || {};
        if (
          normalizeString(detail?.mediaType).toLowerCase() === "cover" &&
          normalizeString(detail?.publicUrl)
        ) {
          this.syncBackgroundControl(detail.publicUrl);
          this.scheduleAutoSave({ immediate: true });
        }
      })
    );
  },

  bindForm() {
    if (!this.dom.form) return;

    this.dom.form.addEventListener("submit", event => this.handleSubmit(event));
    this.dom.form.addEventListener("input", () => {
      this.scheduleAutoSave();
    });
    this.dom.form.addEventListener("change", event => {
      const control = event.target;

      if (
        control?.name === "cover_url" &&
        control?.value === "__custom_photo__"
      ) {
        this.showCustomBackgroundPicker();
        return;
      }

      if (control?.name === "cover_url") {
        this.hideCustomBackgroundPicker();
      }

      const immediate =
        control?.tagName === "SELECT" ||
        control?.type === "date";
      this.scheduleAutoSave({ immediate });
    });

    this.dom.customBackgroundButton?.addEventListener("click", () => {
      this.chooseCustomBackground();
    });

    this.dom.customBackgroundInput?.addEventListener("change", event => {
      this.handleCustomBackgroundFile(event);
    });

    this.dom.dialog?.addEventListener("close", () => {
      this.hideCustomBackgroundPicker();
      this.flushAutoSave();
    });
  },

  buildFields() {
    if (this.state.fieldsBuilt || !this.dom.fields) return;
    this.dom.fields.replaceChildren();

    let currentSection = null;
    for (const field of PROFILE_FIELDS) {
      if (field.section !== currentSection) {
        currentSection = field.section;
        this.dom.fields.append(this.createSectionHeading(currentSection));
      }
      this.dom.fields.append(this.createField(field));
    }

    this.installCustomBackgroundPicker();
    this.state.fieldsBuilt = true;
  },

  createSectionHeading(title) {
    const heading = document.createElement("h3");
    heading.className = "circle-editor-section-title";
    heading.textContent = title;
    return heading;
  },

  installCustomBackgroundPicker() {
    if (!this.dom.fields || document.getElementById("circle-custom-background-picker")) {
      this.cacheDom();
      return;
    }

    const backgroundField =
      this.dom.fields.querySelector('[data-field="cover_url"]');

    if (!backgroundField) return;

    const picker =
      document.createElement("div");
    picker.id = "circle-custom-background-picker";
    picker.className = "circle-custom-background-picker";
    picker.hidden = true;

    const note =
      document.createElement("p");
    note.className = "circle-custom-background-picker__note";
    note.textContent = "Use a photo from your library as the full profile background.";

    const button =
      document.createElement("button");
    button.id = "circle-custom-background-button";
    button.className = "circle-button circle-button--secondary circle-button--full";
    button.type = "button";
    button.textContent = "Choose photo from library";

    const input =
      document.createElement("input");
    input.id = "circle-editor-custom-cover-input";
    input.type = "file";
    input.accept = "image/*";
    input.hidden = true;

    picker.append(note, button, input);
    backgroundField.insertAdjacentElement("afterend", picker);
    this.cacheDom();
  },

  createField(field) {
    const wrapper = document.createElement("label");
    wrapper.className = "circle-editor-field";
    wrapper.dataset.field = field.key;

    const label = document.createElement("span");
    label.className = "circle-editor-field__label";
    label.textContent = field.label;

    let control;
    if (field.type === "textarea") {
      control = document.createElement("textarea");
      control.rows = 3;
    } else if (field.type === "select") {
      control = document.createElement("select");
      for (const option of field.options || []) {
        const node = document.createElement("option");
        node.value = option.value;
        node.textContent = option.label;
        control.append(node);
      }
    } else {
      control = document.createElement("input");
      control.type = field.type || "text";
    }

    control.className = "circle-editor-field__input";
    control.name = field.key;
    control.id = `circle-editor-${field.key}`;

    if (field.maxlength) control.maxLength = field.maxlength;
    if (field.placeholder) control.placeholder = field.placeholder;

    if (field.key === "display_name") control.autocomplete = "name";
    if (field.key === "handle") {
      control.autocapitalize = "none";
      control.autocomplete = "off";
      control.spellcheck = false;
    }

    wrapper.append(label, control);
    return wrapper;
  },

  populate() {
    const context = CircleStore.get("context");
    if (!context?.isOwner) return false;

    this.state.suppressAutoSave = true;
    window.clearTimeout(this.state.saveTimer);
    this.state.saveTimer = 0;

    const profile = CircleStore.get("profile") || {};
    for (const field of PROFILE_FIELDS) {
      const control = this.dom.form?.elements?.namedItem(field.key);
      if (!control) continue;

      let value = getNestedProfileValue(profile, field.key);
      if (field.key === "cover_url") {
        this.syncBackgroundControl(value);
        continue;
      }
      control.value = value;
    }



    this.state.lastSavedSnapshot = this.profileSnapshot(this.collectProfile());
    this.state.suppressAutoSave = false;
    this.setAutoSaveState("saved", "Saved automatically");
    return true;
  },

  syncBackgroundControl(value) {
    const control =
      this.dom.form?.elements?.namedItem("cover_url");

    if (!control) return false;

    control
      .querySelectorAll("option[data-custom-current]")
      .forEach(option => option.remove());

    let nextValue =
      normalizeString(value);

    const isKnownOption =
      [...control.options]
        .some(option => option.value === nextValue);

    if (
      nextValue.startsWith("template:") &&
      !isKnownOption
    ) {
      nextValue = "";
    } else if (
      nextValue &&
      !isKnownOption
    ) {
      const current =
        document.createElement("option");

      current.value = nextValue;
      current.textContent = "Custom photo (current)";
      current.dataset.customCurrent = "true";

      const customChoice =
        [...control.options]
          .find(option => option.value === "__custom_photo__");

      if (customChoice) {
        control.insertBefore(current, customChoice);
      } else {
        control.append(current);
      }
    }

    control.value = nextValue;
    return true;
  },

  showCustomBackgroundPicker() {
    window.clearTimeout(this.state.saveTimer);
    this.state.saveTimer = 0;

    if (this.dom.customBackgroundPicker) {
      this.dom.customBackgroundPicker.hidden = false;
    }

    this.setAutoSaveState(
      "saved",
      "Tap Choose photo from library"
    );

    return true;
  },

  hideCustomBackgroundPicker() {
    if (this.dom.customBackgroundPicker) {
      this.dom.customBackgroundPicker.hidden = true;
    }
  },

  chooseCustomBackground() {
    if (!this.dom.customBackgroundInput) {
      this.setAutoSaveState(
        "error",
        "Photo library is unavailable right now."
      );
      return false;
    }

    this.dom.customBackgroundInput.value = "";

    try {
      if (typeof this.dom.customBackgroundInput.showPicker === "function") {
        this.dom.customBackgroundInput.showPicker();
      } else {
        this.dom.customBackgroundInput.click();
      }
    } catch {
      this.dom.customBackgroundInput.click();
    }

    return true;
  },

  async handleCustomBackgroundFile(event) {
    const input = event?.target;
    const file = input?.files?.[0] || null;

    if (input) input.value = "";
    if (!file) return false;

    this.setAutoSaveState("saving", "Uploading background…");

    const result =
      await ProfileMedia.processFile(
        MEDIA_TYPES.COVER,
        file
      );

    if (!result) {
      this.setAutoSaveState(
        "error",
        "Couldn’t use that background photo."
      );
      return false;
    }

    this.setAutoSaveState(
      "saving",
      "Uploading background…"
    );

    return true;
  },

  handleSubmit(event) {
    event.preventDefault();
    this.flushAutoSave();
  },

  scheduleAutoSave({ immediate = false } = {}) {
    if (this.state.suppressAutoSave) return;

    window.clearTimeout(this.state.saveTimer);
    this.state.saveTimer = 0;
    this.setAutoSaveState("saving", "Saving…");

    if (immediate) {
      this.flushAutoSave();
      return;
    }

    this.state.saveTimer = window.setTimeout(() => {
      this.state.saveTimer = 0;
      this.flushAutoSave();
    }, AUTOSAVE_DELAY_MS);
  },

  flushAutoSave() {
    if (this.state.suppressAutoSave) return false;

    window.clearTimeout(this.state.saveTimer);
    this.state.saveTimer = 0;

    const context = CircleStore.get("context");
    if (!context?.isOwner) return false;

    if (this.state.saveInFlight) {
      this.state.pendingSave = true;
      return false;
    }

    const nextProfile = this.collectProfile();
    const validation = this.validate(nextProfile);
    if (!validation.valid) {
      this.setAutoSaveState("error", validation.message);
      return false;
    }

    const snapshot = this.profileSnapshot(nextProfile);
    if (snapshot === this.state.lastSavedSnapshot) {
      this.setAutoSaveState("saved", "Saved automatically");
      return true;
    }

    const currentProfile = CircleStore.get("profile") || {};
    const mergedProfile = { ...currentProfile, ...nextProfile };
    const requestId = `profile-autosave-${Date.now()}-${++this.state.saveSequence}`;

    this.state.saveInFlight = true;
    this.state.pendingSave = false;
    this.state.activeRequestId = requestId;
    this.state.activeSnapshot = snapshot;
    this.state.submitting = true;
    this.setAutoSaveState("saving", "Saving…");

    CircleEvents.emit(EVENT_NAMES.PROFILE_UPDATED, {
      profile: mergedProfile,
      changes: nextProfile,
      persist: true,
      autosave: true,
      requestId
    });

    return true;
  },

  handlePersisted(success, detail = {}) {
    const requestId = normalizeString(detail?.requestId);
    if (!requestId || requestId !== this.state.activeRequestId) return;

    this.state.saveInFlight = false;
    this.state.submitting = false;
    this.state.activeRequestId = null;

    if (!success) {
      this.state.activeSnapshot = "";
      this.state.pendingSave = false;
      this.setAutoSaveState("error", "Couldn’t save. Keep editing to retry.");
      return;
    }

    this.state.lastSavedSnapshot = this.state.activeSnapshot;
    this.state.activeSnapshot = "";

    const currentSnapshot = this.profileSnapshot(this.collectProfile());
    if (this.state.pendingSave || currentSnapshot !== this.state.lastSavedSnapshot) {
      this.state.pendingSave = false;
      window.setTimeout(() => this.flushAutoSave(), 0);
      return;
    }

    this.setAutoSaveState("saved", "Saved automatically");
  },

  profileSnapshot(profile) {
    return JSON.stringify(profile || {});
  },

  collectProfile() {
    const form = this.dom.form;
    if (!form) return {};

    const getValue = name => normalizeString(form.elements.namedItem(name)?.value || "");
    const handle = normalizeHandle(getValue("handle"));

    return {
      display_name: getValue("display_name"),
      handle,
      bio: getValue("bio"),
      cover_url:
        getValue("cover_url") === "__custom_photo__"
          ? getNestedProfileValue(CircleStore.get("profile") || {}, "cover_url")
          : getValue("cover_url"),
      location: getValue("location"),
      birthday: getValue("birthday"),
      goal: getValue("goal"),
      bucket_list: getValue("bucket_list"),
      favorite_song: getValue("favorite_song"),
      favorite_food: getValue("favorite_food"),
      favorite_movie: getValue("favorite_movie"),
      favorite_hobby: getValue("favorite_hobby")
    };
  },

  validate(profile) {
    if (!profile.display_name) {
      return {
        valid: false,
        message: "Display name is required.",
        control: this.dom.form?.elements?.namedItem("display_name")
      };
    }

    if (profile.handle && !/^[a-z0-9._]{3,30}$/.test(profile.handle)) {
      return {
        valid: false,
        message: "Handle must be 3-30 characters using letters, numbers, dots, or underscores.",
        control: this.dom.form?.elements?.namedItem("handle")
      };
    }

    return { valid: true, message: null, control: null };
  },

  open() {
    const context = CircleStore.get("context");
    if (!context?.isOwner) return false;
    this.populate();

    if (!this.dom.dialog || typeof this.dom.dialog.showModal !== "function") return false;
    if (!this.dom.dialog.open) this.dom.dialog.showModal();
    return true;
  },

  close() {
    this.flushAutoSave();

    const active = document.activeElement;
    if (
      active &&
      this.dom.dialog?.contains(active) &&
      typeof active.blur === "function"
    ) {
      active.blur();
    }

    if (!this.dom.dialog || typeof this.dom.dialog.close !== "function") return false;
    if (this.dom.dialog.open) this.dom.dialog.close();
    return true;
  },

  setAutoSaveState(state, message) {
    if (!this.dom.saveStatus) return;
    this.dom.saveStatus.dataset.state = state || "idle";
    this.dom.saveStatus.textContent = message || "Changes save automatically";
  },

  destroy() {
    for (const unsubscribe of this.state.unsubscribers) {
      try { unsubscribe?.(); } catch (error) {
        console.warn("ARI Circle editor unsubscribe failed", error);
      }
    }
    window.clearTimeout(this.state.saveTimer);
    this.state.saveTimer = 0;
    this.state.unsubscribers = [];
    this.state.initialized = false;
  },

  getDiagnostics() {
    return {
      ready: this.state.initialized,
      source: this.source,
      version: this.version,
      fieldsBuilt: this.state.fieldsBuilt,
      submitting: this.state.submitting,
      autosave: true,
      saveInFlight: this.state.saveInFlight,
      pendingSave: this.state.pendingSave,
      dialogFound: Boolean(this.dom.dialog),
      formFound: Boolean(this.dom.form),
      breakTheIceRemoved: true
    };
  }
};

export { ProfileEditor, PROFILE_FIELDS };
export default ProfileEditor;
