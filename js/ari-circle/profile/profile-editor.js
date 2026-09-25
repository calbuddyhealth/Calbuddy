// js/ari-circle/profile/profile-editor.js
// ARI Circle — Profile Editor V2.0.0
//
// The profile is intentionally compact: one identity card, one selected
// icebreaker, and four showcase slots managed separately by profile-gallery-v1.

import CircleStore from "../core/circle-store.js";
import CircleEvents, { EVENT_NAMES } from "../core/circle-events.js";

const VERSION = "2.0.0";
const SOURCE = "ari-circle/profile/profile-editor";

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
      { value: "", label: "Pearl" },
      { value: "template:aurora", label: "Aurora" },
      { value: "template:coastal", label: "Coastal" },
      { value: "template:sunset", label: "Sunset" },
      { value: "template:violet", label: "Violet" },
      { value: "template:midnight", label: "Midnight" }
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

const ICEBREAKER_FIELDS = Object.freeze([
  { key: "ask_me_about", label: "Ask me about..." },
  { key: "current_obsession", label: "My current obsession is..." },
  { key: "dream_trip", label: "My dream trip is..." },
  { key: "make_me_laugh", label: "The best way to make me laugh is..." },
  { key: "comfort_show_movie", label: "My comfort show or movie is..." },
  { key: "song_every_word", label: "A song I know every word to is..." },
  { key: "unpopular_opinion", label: "An unpopular opinion I have is..." },
  { key: "want_to_learn", label: "Something I want to learn is..." },
  { key: "weirdly_good_at", label: "I'm weirdly good at..." },
  { key: "perfect_night", label: "My perfect night looks like..." }
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

function normalizeIcebreakerMap(profile) {
  const raw = profile?.icebreakers || profile?.break_the_ice || profile?.breakTheIce || {};
  const output = {};

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const key = normalizeString(item.key || item.id || item.type || "");
      const answer = normalizeString(item.answer || item.value || item.text || "");
      if (key && answer) output[key] = answer;
    }
    return output;
  }

  if (raw && typeof raw === "object") {
    for (const [key, value] of Object.entries(raw)) {
      const answer = normalizeString(String(value ?? ""));
      if (answer) output[key] = answer;
    }
  }
  return output;
}

const ProfileEditor = {
  version: VERSION,
  source: SOURCE,

  state: {
    initialized: false,
    fieldsBuilt: false,
    submitting: false,
    unsubscribers: []
  },

  dom: {
    dialog: null,
    form: null,
    fields: null,
    saveButton: null,
    icebreakerQuestion: null,
    icebreakerAnswer: null
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
    this.dom.saveButton = document.getElementById("circle-profile-save-button");
  },

  bindEvents() {
    this.state.unsubscribers.push(
      CircleEvents.onAction("edit-profile", () => this.populate()),
      CircleEvents.onAction("close-profile-editor", () => this.close())
    );
  },

  bindForm() {
    this.dom.form?.addEventListener("submit", event => this.handleSubmit(event));
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

    this.dom.fields.append(this.createSectionHeading("Break the Ice"));

    const iceIntro = document.createElement("p");
    iceIntro.className = "circle-editor-section-note";
    iceIntro.textContent = "Choose one question to show on your profile.";
    this.dom.fields.append(iceIntro, this.createIcebreakerControls());

    this.state.fieldsBuilt = true;
  },

  createSectionHeading(title) {
    const heading = document.createElement("h3");
    heading.className = "circle-editor-section-title";
    heading.textContent = title;
    return heading;
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

  createIcebreakerControls() {
    const wrap = document.createElement("div");
    wrap.className = "circle-editor-icebreaker-single";

    const questionLabel = document.createElement("label");
    questionLabel.className = "circle-editor-field";
    const questionTitle = document.createElement("span");
    questionTitle.className = "circle-editor-field__label";
    questionTitle.textContent = "Question";
    const question = document.createElement("select");
    question.className = "circle-editor-field__input";
    question.name = "icebreaker.key";
    question.id = "circle-editor-icebreaker-question";

    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "Choose a question";
    question.append(empty);

    for (const field of ICEBREAKER_FIELDS) {
      const option = document.createElement("option");
      option.value = field.key;
      option.textContent = field.label;
      question.append(option);
    }
    questionLabel.append(questionTitle, question);

    const answerLabel = document.createElement("label");
    answerLabel.className = "circle-editor-field";
    const answerTitle = document.createElement("span");
    answerTitle.className = "circle-editor-field__label";
    answerTitle.textContent = "Your answer";
    const answer = document.createElement("textarea");
    answer.className = "circle-editor-field__input";
    answer.name = "icebreaker.answer";
    answer.id = "circle-editor-icebreaker-answer";
    answer.rows = 3;
    answer.maxLength = 220;
    answer.placeholder = "Write one answer";
    answerLabel.append(answerTitle, answer);

    const sync = () => {
      answer.disabled = !question.value;
      if (!question.value) answer.value = "";
    };
    question.addEventListener("change", sync);
    sync();

    this.dom.icebreakerQuestion = question;
    this.dom.icebreakerAnswer = answer;
    wrap.append(questionLabel, answerLabel);
    return wrap;
  },

  populate() {
    const context = CircleStore.get("context");
    if (!context?.isOwner) return false;

    const profile = CircleStore.get("profile") || {};
    for (const field of PROFILE_FIELDS) {
      const control = this.dom.form?.elements?.namedItem(field.key);
      if (!control) continue;

      const value = getNestedProfileValue(profile, field.key);
      if (
        field.key === "cover_url" &&
        value &&
        ![...control.options].some(option => option.value === value)
      ) {
        const current = document.createElement("option");
        current.value = value;
        current.textContent = "Current background image";
        current.dataset.legacyCover = "true";
        control.append(current);
      }
      control.value = value;
    }

    const icebreakers = normalizeIcebreakerMap(profile);
    const selected = ICEBREAKER_FIELDS.find(field => icebreakers[field.key]) ||
      Object.keys(icebreakers).map(key => ({ key })).find(Boolean) ||
      null;

    if (this.dom.icebreakerQuestion) {
      this.dom.icebreakerQuestion.value = selected?.key || "";
    }
    if (this.dom.icebreakerAnswer) {
      this.dom.icebreakerAnswer.disabled = !selected?.key;
      this.dom.icebreakerAnswer.value = selected?.key ? (icebreakers[selected.key] || "") : "";
    }

    return true;
  },

  async handleSubmit(event) {
    event.preventDefault();
    if (this.state.submitting) return;

    const context = CircleStore.get("context");
    if (!context?.isOwner) {
      CircleEvents.showToast("You can only edit your own Circle.");
      return;
    }

    try {
      this.state.submitting = true;
      this.setSaveState(true);

      const nextProfile = this.collectProfile();
      const validation = this.validate(nextProfile);
      if (!validation.valid) {
        CircleEvents.showToast(validation.message, { type: "error" });
        validation.control?.focus();
        return;
      }

      const currentProfile = CircleStore.get("profile") || {};
      const mergedProfile = { ...currentProfile, ...nextProfile };
      CircleStore.setProfile(mergedProfile);
      CircleEvents.emit(EVENT_NAMES.PROFILE_UPDATED, {
        profile: mergedProfile,
        changes: nextProfile,
        persist: true
      });

      this.close();
      CircleEvents.showToast("Circle updated.");
    } catch (error) {
      CircleEvents.reportError(error, { message: "Could not update your Circle." });
    } finally {
      this.state.submitting = false;
      this.setSaveState(false);
    }
  },

  collectProfile() {
    const form = this.dom.form;
    if (!form) return {};

    const getValue = name => normalizeString(form.elements.namedItem(name)?.value || "");
    const handle = normalizeHandle(getValue("handle"));
    const icebreakerKey = getValue("icebreaker.key");
    const icebreakerAnswer = getValue("icebreaker.answer");
    const icebreakers = icebreakerKey && icebreakerAnswer
      ? { [icebreakerKey]: icebreakerAnswer }
      : {};

    return {
      display_name: getValue("display_name"),
      handle,
      bio: getValue("bio"),
      cover_url: getValue("cover_url"),
      location: getValue("location"),
      birthday: getValue("birthday"),
      goal: getValue("goal"),
      bucket_list: getValue("bucket_list"),
      favorite_song: getValue("favorite_song"),
      favorite_food: getValue("favorite_food"),
      favorite_movie: getValue("favorite_movie"),
      favorite_hobby: getValue("favorite_hobby"),
      icebreakers
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
    if (!this.dom.dialog || typeof this.dom.dialog.close !== "function") return false;
    if (this.dom.dialog.open) this.dom.dialog.close();
    return true;
  },

  setSaveState(isSaving) {
    if (!this.dom.saveButton) return;
    this.dom.saveButton.disabled = Boolean(isSaving);
    this.dom.saveButton.textContent = isSaving ? "Saving..." : "Save Changes";
  },

  destroy() {
    for (const unsubscribe of this.state.unsubscribers) {
      try { unsubscribe?.(); } catch (error) {
        console.warn("ARI Circle editor unsubscribe failed", error);
      }
    }
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
      dialogFound: Boolean(this.dom.dialog),
      formFound: Boolean(this.dom.form),
      singleIcebreaker: true
    };
  }
};

export { ProfileEditor, PROFILE_FIELDS, ICEBREAKER_FIELDS };
export default ProfileEditor;
