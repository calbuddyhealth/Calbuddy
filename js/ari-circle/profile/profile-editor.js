// js/ari-circle/profile/profile-editor.js
// ARI Circle
// V1.0.0
//
// Purpose:
// - Build and control the Edit Circle form.
// - Populate editable fields from CircleStore.
// - Validate user-entered profile values.
// - Update CircleStore locally after a successful edit.
// - Emit a profile-updated event for future persistence.
//
// This module does NOT:
// - Query or write to Supabase.
// - Upload avatar/background images.
// - Resolve authentication.
// - Render the public profile page.
//
// Future persistence flow:
//   ProfileEditor
//        -> CircleStore
//        -> EVENT_NAMES.PROFILE_UPDATED
//        -> circle-api.js persists profile changes
//
// Media changes are intentionally handled separately by:
//   media/profile-media.js

import CircleStore from "../core/circle-store.js";
import CircleEvents, {
  EVENT_NAMES
} from "../core/circle-events.js";

const VERSION = "1.0.0";
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
  {
    key: "ask_me_about",
    label: "ð¬ Ask me about..."
  },
  {
    key: "current_obsession",
    label: "ð¥ Current obsession..."
  },
  {
    key: "dream_trip",
    label: "âï¸ Dream trip..."
  },
  {
    key: "make_me_laugh",
    label: "ð Best way to make me laugh..."
  },
  {
    key: "comfort_show_movie",
    label: "ð¿ My comfort show/movie..."
  },
  {
    key: "song_every_word",
    label: "ð¤ Song I know every word to..."
  },
  {
    key: "unpopular_opinion",
    label: "ð¤ Unpopular opinion..."
  },
  {
    key: "want_to_learn",
    label: "ð¯ Something I want to learn..."
  },
  {
    key: "weirdly_good_at",
    label: "ð Weirdly good at..."
  },
  {
    key: "perfect_night",
    label: "ð Perfect night looks like..."
  }
]);

function normalizeString(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeHandle(value) {
  return normalizeString(value)
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, 30);
}

function getNestedProfileValue(profile, key) {
  if (!profile || typeof profile !== "object") {
    return "";
  }

  const interests =
    profile.interests &&
    typeof profile.interests === "object"
      ? profile.interests
      : {};

  const about =
    profile.about_me &&
    typeof profile.about_me === "object"
      ? profile.about_me
      : {};

  const aliases = {
    display_name: [
      profile.display_name,
      profile.displayName,
      profile.name
    ],

    handle: [
      profile.handle,
      profile.username
    ],

    bio: [
      profile.bio,
      profile.status,
      profile.about
    ],

    location: [
      profile.location,
      profile.lives_in,
      profile.livesIn,
      about.location,
      about.lives_in,
      about.livesIn
    ],

    birthday: [
      profile.birthday,
      profile.birth_date,
      profile.birthDate,
      about.birthday
    ],

    goal: [
      profile.goal,
      about.goal
    ],

    bucket_list: [
      profile.bucket_list,
      profile.bucketList,
      about.bucket_list,
      about.bucketList
    ],

    favorite_song: [
      profile.favorite_song,
      profile.favoriteSong,
      interests.favorite_song,
      interests.favoriteSong,
      interests.song
    ],

    favorite_food: [
      profile.favorite_food,
      profile.favoriteFood,
      interests.favorite_food,
      interests.favoriteFood,
      interests.food
    ],

    favorite_movie: [
      profile.favorite_movie,
      profile.favoriteMovie,
      interests.favorite_movie,
      interests.favoriteMovie,
      interests.movie
    ],

    favorite_hobby: [
      profile.favorite_hobby,
      profile.favoriteHobby,
      interests.favorite_hobby,
      interests.favoriteHobby,
      interests.hobby
    ]
  };

  const values =
    aliases[key] || [];

  for (const value of values) {
    const normalized =
      normalizeString(
        String(value ?? "")
      );

    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function normalizeIcebreakerMap(profile) {
  const raw =
    profile?.icebreakers ||
    profile?.break_the_ice ||
    profile?.breakTheIce ||
    {};

  const output =
    {};

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (
        !item ||
        typeof item !== "object"
      ) {
        continue;
      }

      const key =
        normalizeString(
          item.key ||
          item.id ||
          item.type ||
          ""
        );

      const answer =
        normalizeString(
          item.answer ||
          item.value ||
          item.text ||
          ""
        );

      if (key && answer) {
        output[key] =
          answer;
      }
    }

    return output;
  }

  if (
    raw &&
    typeof raw === "object"
  ) {
    for (
      const [key, value]
      of Object.entries(raw)
    ) {
      const answer =
        normalizeString(
          String(value ?? "")
        );

      if (answer) {
        output[key] =
          answer;
      }
    }
  }

  return output;
}

const ProfileEditor = {
  version:
    VERSION,

  source:
    SOURCE,

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
    saveButton: null
  },

  init() {
    if (this.state.initialized) {
      return this.getDiagnostics();
    }

    this.cacheDom();
    this.buildFields();
    this.bindForm();
    this.bindEvents();

    this.state.initialized =
      true;

    return this.getDiagnostics();
  },

  cacheDom() {
    this.dom.dialog =
      document.getElementById(
        "circle-profile-editor"
      );

    this.dom.form =
      document.getElementById(
        "circle-profile-editor-form"
      );

    this.dom.fields =
      document.getElementById(
        "circle-profile-editor-fields"
      );

    this.dom.saveButton =
      document.getElementById(
        "circle-profile-save-button"
      );
  },

  bindEvents() {
    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "edit-profile",
        () => {
          this.populate();
        }
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "close-profile-editor",
        () => {
          this.close();
        }
      )
    );
  },

  bindForm() {
    this.dom.form
      ?.addEventListener(
        "submit",
        event =>
          this.handleSubmit(event)
      );
  },

  buildFields() {
    if (
      this.state.fieldsBuilt ||
      !this.dom.fields
    ) {
      return;
    }

    this.dom.fields.replaceChildren();

    let currentSection =
      null;

    for (
      const field
      of PROFILE_FIELDS
    ) {
      if (
        field.section !==
        currentSection
      ) {
        currentSection =
          field.section;

        this.dom.fields.append(
          this.createSectionHeading(
            currentSection
          )
        );
      }

      this.dom.fields.append(
        this.createField(field)
      );
    }

    this.dom.fields.append(
      this.createSectionHeading(
        "Break the Ice"
      )
    );

    const iceIntro =
      document.createElement(
        "p"
      );

    iceIntro.className =
      "circle-editor-section-note";

    iceIntro.textContent =
      "Answer any, all, or none of these.";

    this.dom.fields.append(
      iceIntro
    );

    for (
      const field
      of ICEBREAKER_FIELDS
    ) {
      this.dom.fields.append(
        this.createIcebreakerField(
          field
        )
      );
    }

    this.state.fieldsBuilt =
      true;
  },

  createSectionHeading(title) {
    const heading =
      document.createElement(
        "h3"
      );

    heading.className =
      "circle-editor-section-title";

    heading.textContent =
      title;

    return heading;
  },

  createField(field) {
    const wrapper =
      document.createElement(
        "label"
      );

    wrapper.className =
      "circle-editor-field";

    wrapper.dataset.field =
      field.key;

    const label =
      document.createElement(
        "span"
      );

    label.className =
      "circle-editor-field__label";

    label.textContent =
      field.label;

    const control =
      field.type === "textarea"
        ? document.createElement(
            "textarea"
          )
        : document.createElement(
            "input"
          );

    control.className =
      "circle-editor-field__input";

    control.name =
      field.key;

    control.id =
      `circle-editor-${field.key}`;

    if (
      field.type === "textarea"
    ) {
      control.rows =
        3;
    } else {
      control.type =
        field.type ||
        "text";
    }

    if (field.maxlength) {
      control.maxLength =
        field.maxlength;
    }

    if (field.placeholder) {
      control.placeholder =
        field.placeholder;
    }

    if (
      field.key === "display_name"
    ) {
      control.autocomplete =
        "name";
    }

    if (
      field.key === "handle"
    ) {
      control.autocapitalize =
        "none";

      control.autocomplete =
        "off";

      control.spellcheck =
        false;
    }

    wrapper.append(
      label,
      control
    );

    return wrapper;
  },

  createIcebreakerField(field) {
    const wrapper =
      document.createElement(
        "label"
      );

    wrapper.className =
      "circle-editor-field circle-editor-field--icebreaker";

    wrapper.dataset.icebreaker =
      field.key;

    const label =
      document.createElement(
        "span"
      );

    label.className =
      "circle-editor-field__label";

    label.textContent =
      field.label;

    const control =
      document.createElement(
        "textarea"
      );

    control.className =
      "circle-editor-field__input";

    control.name =
      `icebreaker.${field.key}`;

    control.id =
      `circle-editor-icebreaker-${field.key}`;

    control.rows =
      2;

    control.maxLength =
      220;

    control.placeholder =
      "Your answer";

    wrapper.append(
      label,
      control
    );

    return wrapper;
  },

  populate() {
    const context =
      CircleStore.get(
        "context"
      );

    if (!context?.isOwner) {
      return false;
    }

    const profile =
      CircleStore.get(
        "profile"
      ) || {};

    for (
      const field
      of PROFILE_FIELDS
    ) {
      const control =
        this.dom.form
          ?.elements
          ?.namedItem(
            field.key
          );

      if (!control) {
        continue;
      }

      control.value =
        getNestedProfileValue(
          profile,
          field.key
        );
    }

    const icebreakers =
      normalizeIcebreakerMap(
        profile
      );

    for (
      const field
      of ICEBREAKER_FIELDS
    ) {
      const control =
        this.dom.form
          ?.elements
          ?.namedItem(
            `icebreaker.${field.key}`
          );

      if (!control) {
        continue;
      }

      control.value =
        icebreakers[
          field.key
        ] || "";
    }

    return true;
  },

  async handleSubmit(event) {
    event.preventDefault();

    if (this.state.submitting) {
      return;
    }

    const context =
      CircleStore.get(
        "context"
      );

    if (!context?.isOwner) {
      CircleEvents.showToast(
        "You can only edit your own Circle."
      );

      return;
    }

    try {
      this.state.submitting =
        true;

      this.setSaveState(true);

      const nextProfile =
        this.collectProfile();

      const validation =
        this.validate(
          nextProfile
        );

      if (!validation.valid) {
        CircleEvents.showToast(
          validation.message,
          {
            type:
              "error"
          }
        );

        validation.control
          ?.focus();

        return;
      }

      const currentProfile =
        CircleStore.get(
          "profile"
        ) || {};

      const mergedProfile = {
        ...currentProfile,
        ...nextProfile
      };

      CircleStore.setProfile(
        mergedProfile
      );

      CircleEvents.emit(
        EVENT_NAMES.PROFILE_UPDATED,
        {
          profile:
            mergedProfile,

          changes:
            nextProfile,

          persist:
            true
        }
      );

      this.close();

      CircleEvents.showToast(
        "Circle updated."
      );
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not update your Circle."
        }
      );
    } finally {
      this.state.submitting =
        false;

      this.setSaveState(false);
    }
  },

  collectProfile() {
    const form =
      this.dom.form;

    if (!form) {
      return {};
    }

    const getValue =
      name => {
        const control =
          form.elements
            .namedItem(name);

        return normalizeString(
          control?.value ||
          ""
        );
      };

    const handle =
      normalizeHandle(
        getValue("handle")
      );

    const icebreakers =
      {};

    for (
      const field
      of ICEBREAKER_FIELDS
    ) {
      const answer =
        getValue(
          `icebreaker.${field.key}`
        );

      if (answer) {
        icebreakers[
          field.key
        ] =
          answer;
      }
    }

    return {
      display_name:
        getValue(
          "display_name"
        ),

      handle,

      bio:
        getValue(
          "bio"
        ),

      location:
        getValue(
          "location"
        ),

      birthday:
        getValue(
          "birthday"
        ),

      goal:
        getValue(
          "goal"
        ),

      bucket_list:
        getValue(
          "bucket_list"
        ),

      favorite_song:
        getValue(
          "favorite_song"
        ),

      favorite_food:
        getValue(
          "favorite_food"
        ),

      favorite_movie:
        getValue(
          "favorite_movie"
        ),

      favorite_hobby:
        getValue(
          "favorite_hobby"
        ),

      icebreakers
    };
  },

  validate(profile) {
    if (!profile.display_name) {
      return {
        valid:
          false,

        message:
          "Display name is required.",

        control:
          this.dom.form
            ?.elements
            ?.namedItem(
              "display_name"
            )
      };
    }

    if (
      profile.handle &&
      !/^[a-z0-9._]{3,30}$/
        .test(
          profile.handle
        )
    ) {
      return {
        valid:
          false,

        message:
          "Handle must be 3-30 characters using letters, numbers, dots, or underscores.",

        control:
          this.dom.form
            ?.elements
            ?.namedItem(
              "handle"
            )
      };
    }

    return {
      valid:
        true,

      message:
        null,

      control:
        null
    };
  },

  open() {
    const context =
      CircleStore.get(
        "context"
      );

    if (!context?.isOwner) {
      return false;
    }

    this.populate();

    if (
      !this.dom.dialog ||
      typeof this.dom.dialog
        .showModal !==
        "function"
    ) {
      return false;
    }

    if (!this.dom.dialog.open) {
      this.dom.dialog.showModal();
    }

    return true;
  },

  close() {
    if (
      !this.dom.dialog ||
      typeof this.dom.dialog
        .close !==
        "function"
    ) {
      return false;
    }

    if (this.dom.dialog.open) {
      this.dom.dialog.close();
    }

    return true;
  },

  setSaveState(isSaving) {
    if (!this.dom.saveButton) {
      return;
    }

    this.dom.saveButton.disabled =
      Boolean(isSaving);

    this.dom.saveButton.textContent =
      isSaving
        ? "Saving..."
        : "Save Changes";
  },

  destroy() {
    for (
      const unsubscribe
      of this.state.unsubscribers
    ) {
      try {
        unsubscribe?.();
      } catch (error) {
        console.warn(
          "ARI Circle editor unsubscribe failed",
          error
        );
      }
    }

    this.state.unsubscribers =
      [];

    this.state.initialized =
      false;
  },

  getDiagnostics() {
    return {
      ready:
        this.state.initialized,

      source:
        this.source,

      version:
        this.version,

      fieldsBuilt:
        this.state.fieldsBuilt,

      submitting:
        this.state.submitting,

      dialogFound:
        Boolean(
          this.dom.dialog
        ),

      formFound:
        Boolean(
          this.dom.form
        )
    };
  }
};

export {
  ProfileEditor,
  PROFILE_FIELDS,
  ICEBREAKER_FIELDS
};

export default ProfileEditor;
