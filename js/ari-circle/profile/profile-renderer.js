// js/ari-circle/profile/profile-renderer.js
// ARI Circle
// V1.0.0
//
// Purpose:
// - Render ARI Circle profile data from CircleStore into ari-circle.html.
// - Keep DOM rendering separate from data fetching and business logic.
// - Render profile hero, About Me, Things I'm Into, Circle Details,
//   ownership label, and selected Break the Ice prompts.
// - React to CircleStore changes.
//
// This module does NOT:
// - Query Supabase.
// - Persist profile edits.
// - Upload media.
// - Create connection requests.
// - Send messages.
// - Own presence subscriptions.
//
// Data comes from CircleStore.
// Actions are owned by controllers.
// This renderer only turns state into DOM.

import CircleStore from "../core/circle-store.js";

const VERSION = "1.0.0";
const SOURCE = "ari-circle/profile/profile-renderer";

const ICEBREAKER_DEFINITIONS = Object.freeze({
  ask_me_about: {
    label: "💬 Ask me about..."
  },

  current_obsession: {
    label: "🔥 Current obsession..."
  },

  dream_trip: {
    label: "✈️ Dream trip..."
  },

  make_me_laugh: {
    label: "😂 Best way to make me laugh..."
  },

  comfort_show_movie: {
    label: "🍿 My comfort show/movie..."
  },

  song_every_word: {
    label: "🎤 Song I know every word to..."
  },

  unpopular_opinion: {
    label: "🤔 Unpopular opinion..."
  },

  want_to_learn: {
    label: "🎯 Something I want to learn..."
  },

  weirdly_good_at: {
    label: "👀 Weirdly good at..."
  },

  perfect_night: {
    label: "🌙 Perfect night looks like..."
  }
});

const DEFAULT_VISIBLE_ICEBREAKERS = 4;

function normalizeString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim();

  return normalized
    ? normalized
    : null;
}

function firstString(...values) {
  for (const value of values) {
    const normalized =
      normalizeString(value);

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function normalizeHandle(value) {
  const normalized =
    normalizeString(value);

  if (!normalized) {
    return null;
  }

  return normalized
    .replace(/^@+/, "")
    .trim()
    .toLowerCase() || null;
}

function getInitials(value) {
  const normalized =
    normalizeString(value);

  if (!normalized) {
    return "A";
  }

  const parts =
    normalized
      .split(/\s+/)
      .filter(Boolean);

  if (!parts.length) {
    return "A";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 1)
      .toUpperCase();
  }

  return (
    parts[0].slice(0, 1) +
    parts[parts.length - 1].slice(0, 1)
  ).toUpperCase();
}

function formatBirthday(value) {
  const normalized =
    normalizeString(value);

  if (!normalized) {
    return null;
  }

  const date =
    new Date(normalized);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return normalized;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      month: "long",
      day: "numeric"
    }
  ).format(date);
}

function formatJoinedDate(value) {
  const normalized =
    normalizeString(value);

  if (!normalized) {
    return "—";
  }

  const date =
    new Date(normalized);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return normalized;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      month: "short",
      year: "2-digit"
    }
  ).format(date);
}

function normalizeIcebreakers(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map(item => {
        if (
          typeof item === "string"
        ) {
          return {
            key: null,
            prompt: null,
            answer:
              normalizeString(item)
          };
        }

        if (
          !item ||
          typeof item !== "object"
        ) {
          return null;
        }

        const key =
          normalizeString(
            item.key ||
            item.id ||
            item.type
          );

        const definition =
          key
            ? ICEBREAKER_DEFINITIONS[key]
            : null;

        return {
          key,
          prompt:
            firstString(
              item.prompt,
              item.label,
              definition?.label
            ),

          answer:
            firstString(
              item.answer,
              item.value,
              item.text
            )
        };
      })
      .filter(
        item =>
          item?.answer
      );
  }

  if (
    typeof value === "object"
  ) {
    return Object.entries(value)
      .map(([key, answer]) => {
        const normalizedAnswer =
          normalizeString(answer);

        if (!normalizedAnswer) {
          return null;
        }

        return {
          key,
          prompt:
            ICEBREAKER_DEFINITIONS[key]
              ?.label ||
            key,

          answer:
            normalizedAnswer
        };
      })
      .filter(Boolean);
  }

  return [];
}

const ProfileRenderer = {
  version:
    VERSION,

  source:
    SOURCE,

  state: {
    initialized: false,
    icebreakersExpanded: false,
    unsubscribeStore: null
  },

  dom: {},

  init() {
    if (this.state.initialized) {
      return this.getDiagnostics();
    }

    this.cacheDom();
    this.bindStore();
    this.bindLocalActions();
    this.render(
      CircleStore.getState()
    );

    this.state.initialized =
      true;

    return this.getDiagnostics();
  },

  cacheDom() {
    this.dom = {
      displayName:
        document.getElementById(
          "circle-display-name"
        ),

      handle:
        document.getElementById(
          "circle-handle"
        ),

      bio:
        document.getElementById(
          "circle-bio"
        ),

      avatarImage:
        document.getElementById(
          "circle-avatar-image"
        ),

      avatarFallback:
        document.getElementById(
          "circle-avatar-fallback"
        ),

      coverImage:
        document.getElementById(
          "circle-cover-image"
        ),

      coverFallback:
        document.getElementById(
          "circle-cover-fallback"
        ),

      topOwnerAvatar:
        document.getElementById(
          "circle-top-owner-avatar"
        ),

      topOwnerFallback:
        document.getElementById(
          "circle-top-owner-fallback"
        ),

      topOwnerLabel:
        document.getElementById(
          "circle-top-owner-label"
        ),

      aboutLocationRow:
        document.getElementById(
          "circle-about-location-row"
        ),

      aboutLocation:
        document.getElementById(
          "circle-about-location"
        ),

      aboutBirthdayRow:
        document.getElementById(
          "circle-about-birthday-row"
        ),

      aboutBirthday:
        document.getElementById(
          "circle-about-birthday"
        ),

      aboutGoalRow:
        document.getElementById(
          "circle-about-goal-row"
        ),

      aboutGoal:
        document.getElementById(
          "circle-about-goal"
        ),

      aboutBucketRow:
        document.getElementById(
          "circle-about-bucket-list-row"
        ),

      aboutBucket:
        document.getElementById(
          "circle-about-bucket-list"
        ),

      aboutEmpty:
        document.getElementById(
          "circle-about-empty"
        ),

      interestSongRow:
        document.getElementById(
          "circle-interest-song-row"
        ),

      interestSong:
        document.getElementById(
          "circle-interest-song"
        ),

      interestFoodRow:
        document.getElementById(
          "circle-interest-food-row"
        ),

      interestFood:
        document.getElementById(
          "circle-interest-food"
        ),

      interestMovieRow:
        document.getElementById(
          "circle-interest-movie-row"
        ),

      interestMovie:
        document.getElementById(
          "circle-interest-movie"
        ),

      interestHobbyRow:
        document.getElementById(
          "circle-interest-hobby-row"
        ),

      interestHobby:
        document.getElementById(
          "circle-interest-hobby"
        ),

      interestsEmpty:
        document.getElementById(
          "circle-interests-empty"
        ),

      icebreakerList:
        document.getElementById(
          "circle-icebreaker-list"
        ),

      icebreakersEmpty:
        document.getElementById(
          "circle-icebreakers-empty"
        ),

      icebreakersToggle:
        document.getElementById(
          "circle-icebreakers-toggle"
        ),

      icebreakerTemplate:
        document.getElementById(
          "circle-icebreaker-template"
        ),

      circleCount:
        document.getElementById(
          "circle-detail-count"
        ),

      mutualCount:
        document.getElementById(
          "circle-detail-mutual"
        ),

      joined:
        document.getElementById(
          "circle-detail-joined"
        )
    };
  },

  bindStore() {
    this.state.unsubscribeStore =
      CircleStore.subscribe(
        (state, change) => {
          const keys =
            Array.isArray(
              change?.keys
            )
              ? change.keys
              : [];

          if (!keys.length) {
            this.render(state);
            return;
          }

          if (
            keys.includes("profile")
          ) {
            this.renderProfile(
              state.profile,
              state.context
            );
          }

          if (
            keys.includes("context")
          ) {
            this.renderProfile(
              state.profile,
              state.context
            );
          }

          if (
            keys.includes("circle")
          ) {
            this.renderCircleDetails(
              state.circle
            );
          }
        }
      );
  },

  bindLocalActions() {
    this.dom.icebreakersToggle
      ?.addEventListener(
        "click",
        () =>
          this.toggleIcebreakers()
      );
  },

  render(state) {
    this.renderProfile(
      state?.profile,
      state?.context
    );

    this.renderCircleDetails(
      state?.circle
    );
  },

  renderProfile(profile, context) {
    const safeProfile =
      profile &&
      typeof profile === "object"
        ? profile
        : {};

    this.renderHero(
      safeProfile,
      context
    );

    this.renderAbout(
      safeProfile
    );

    this.renderInterests(
      safeProfile
    );

    this.renderIcebreakers(
      safeProfile
    );
  },

  renderHero(profile, context) {
    const displayName =
      firstString(
        profile.display_name,
        profile.displayName,
        profile.name
      ) ||
      "ARI Circle";

    const handle =
      normalizeHandle(
        profile.handle ||
        profile.username
      );

    const bio =
      firstString(
        profile.bio,
        profile.status,
        profile.about
      );

    const avatarUrl =
      firstString(
        profile.avatar_url,
        profile.avatarUrl,
        profile.photo_url,
        profile.photoUrl
      );

    const coverUrl =
      firstString(
        profile.cover_url,
        profile.coverUrl,
        profile.background_url,
        profile.backgroundUrl
      );

    if (this.dom.displayName) {
      this.dom.displayName.textContent =
        displayName;
    }

    if (this.dom.handle) {
      this.dom.handle.textContent =
        handle
          ? `@${handle}`
          : "";

      this.dom.handle.hidden =
        !handle;
    }

    if (this.dom.bio) {
      this.dom.bio.textContent =
        bio || "";

      this.dom.bio.hidden =
        !bio;
    }

    this.renderImage({
      image:
        this.dom.avatarImage,

      fallback:
        this.dom.avatarFallback,

      url:
        avatarUrl,

      fallbackText:
        getInitials(
          displayName
        ),

      alt:
        `${displayName} profile photo`
    });

    this.renderImage({
      image:
        this.dom.topOwnerAvatar,

      fallback:
        this.dom.topOwnerFallback,

      url:
        avatarUrl,

      fallbackText:
        getInitials(
          displayName
        ),

      alt:
        `${displayName} profile photo`
    });

    if (
      this.dom.topOwnerLabel
    ) {
      this.dom.topOwnerLabel.textContent =
        context?.isOwner
          ? "YOU"
          : displayName;
    }

    if (this.dom.coverImage) {
      if (coverUrl) {
        this.dom.coverImage.src =
          coverUrl;

        this.dom.coverImage.hidden =
          false;

        this.dom.coverFallback &&
          (
            this.dom.coverFallback.hidden =
              true
          );
      } else {
        this.dom.coverImage.removeAttribute(
          "src"
        );

        this.dom.coverImage.hidden =
          true;

        if (
          this.dom.coverFallback
        ) {
          this.dom.coverFallback.hidden =
            false;
        }
      }
    }
  },

  renderAbout(profile) {
    const about =
      profile.about_me &&
      typeof profile.about_me === "object"
        ? profile.about_me
        : {};

    const location =
      firstString(
        profile.location,
        profile.lives_in,
        profile.livesIn,
        about.location,
        about.lives_in,
        about.livesIn
      );

    const birthday =
      formatBirthday(
        firstString(
          profile.birthday,
          profile.birth_date,
          profile.birthDate,
          about.birthday
        )
      );

    const goal =
      firstString(
        profile.goal,
        about.goal
      );

    const bucketList =
      firstString(
        profile.bucket_list,
        profile.bucketList,
        about.bucket_list,
        about.bucketList
      );

    const visibleCount =
      [
        this.renderFact(
          this.dom.aboutLocationRow,
          this.dom.aboutLocation,
          location
        ),

        this.renderFact(
          this.dom.aboutBirthdayRow,
          this.dom.aboutBirthday,
          birthday
        ),

        this.renderFact(
          this.dom.aboutGoalRow,
          this.dom.aboutGoal,
          goal
        ),

        this.renderFact(
          this.dom.aboutBucketRow,
          this.dom.aboutBucket,
          bucketList
        )
      ]
        .filter(Boolean)
        .length;

    if (
      this.dom.aboutEmpty
    ) {
      this.dom.aboutEmpty.hidden =
        visibleCount > 0;
    }
  },

  renderInterests(profile) {
    const interests =
      profile.interests &&
      typeof profile.interests === "object"
        ? profile.interests
        : {};

    const favoriteSong =
      firstString(
        profile.favorite_song,
        profile.favoriteSong,
        interests.favorite_song,
        interests.favoriteSong,
        interests.song
      );

    const favoriteFood =
      firstString(
        profile.favorite_food,
        profile.favoriteFood,
        interests.favorite_food,
        interests.favoriteFood,
        interests.food
      );

    const favoriteMovie =
      firstString(
        profile.favorite_movie,
        profile.favoriteMovie,
        interests.favorite_movie,
        interests.favoriteMovie,
        interests.movie
      );

    const favoriteHobby =
      firstString(
        profile.favorite_hobby,
        profile.favoriteHobby,
        interests.favorite_hobby,
        interests.favoriteHobby,
        interests.hobby
      );

    const visibleCount =
      [
        this.renderFact(
          this.dom.interestSongRow,
          this.dom.interestSong,
          favoriteSong
        ),

        this.renderFact(
          this.dom.interestFoodRow,
          this.dom.interestFood,
          favoriteFood
        ),

        this.renderFact(
          this.dom.interestMovieRow,
          this.dom.interestMovie,
          favoriteMovie
        ),

        this.renderFact(
          this.dom.interestHobbyRow,
          this.dom.interestHobby,
          favoriteHobby
        )
      ]
        .filter(Boolean)
        .length;

    if (
      this.dom.interestsEmpty
    ) {
      this.dom.interestsEmpty.hidden =
        visibleCount > 0;
    }
  },

  renderIcebreakers(profile) {
    if (
      !this.dom.icebreakerList
    ) {
      return;
    }

    const raw =
      profile.icebreakers ||
      profile.break_the_ice ||
      profile.breakTheIce ||
      [];

    const items =
      normalizeIcebreakers(
        raw
      );

    this.dom.icebreakerList.replaceChildren();

    if (!items.length) {
      if (
        this.dom.icebreakersEmpty
      ) {
        this.dom.icebreakersEmpty.hidden =
          false;
      }

      if (
        this.dom.icebreakersToggle
      ) {
        this.dom.icebreakersToggle.hidden =
          true;

        this.dom.icebreakersToggle
          .setAttribute(
            "aria-expanded",
            "false"
          );
      }

      return;
    }

    if (
      this.dom.icebreakersEmpty
    ) {
      this.dom.icebreakersEmpty.hidden =
        true;
    }

    const visibleLimit =
      this.state.icebreakersExpanded
        ? items.length
        : DEFAULT_VISIBLE_ICEBREAKERS;

    items
      .slice(
        0,
        visibleLimit
      )
      .forEach(
        item =>
          this.appendIcebreaker(
            item
          )
      );

    if (
      this.dom.icebreakersToggle
    ) {
      const hasExtra =
        items.length >
        DEFAULT_VISIBLE_ICEBREAKERS;

      this.dom.icebreakersToggle.hidden =
        !hasExtra;

      this.dom.icebreakersToggle.textContent =
        this.state.icebreakersExpanded
          ? "Show Less ↑"
          : "Show All ↓";

      this.dom.icebreakersToggle
        .setAttribute(
          "aria-expanded",
          String(
            this.state
              .icebreakersExpanded
          )
        );
    }
  },

  appendIcebreaker(item) {
    let node =
      null;

    if (
      this.dom.icebreakerTemplate
        ?.content
    ) {
      node =
        this.dom.icebreakerTemplate
          .content
          .firstElementChild
          ?.cloneNode(true);
    }

    if (!node) {
      node =
        document.createElement(
          "article"
        );

      node.className =
        "circle-icebreaker";

      node.innerHTML =
        `
          <h3 class="circle-icebreaker__prompt"></h3>
          <p class="circle-icebreaker__answer"></p>
        `;
    }

    const prompt =
      node.querySelector(
        ".circle-icebreaker__prompt"
      );

    const answer =
      node.querySelector(
        ".circle-icebreaker__answer"
      );

    if (prompt) {
      prompt.textContent =
        firstString(
          item.prompt,
          item.key &&
            ICEBREAKER_DEFINITIONS[
              item.key
            ]?.label
        ) ||
        "Break the Ice";
    }

    if (answer) {
      answer.textContent =
        item.answer ||
        "";
    }

    this.dom.icebreakerList.append(
      node
    );
  },

  toggleIcebreakers() {
    const profile =
      CircleStore.get(
        "profile"
      ) || {};

    this.state.icebreakersExpanded =
      !this.state
        .icebreakersExpanded;

    this.renderIcebreakers(
      profile
    );
  },

  renderCircleDetails(circle) {
    const safeCircle =
      circle &&
      typeof circle === "object"
        ? circle
        : {};

    const count =
      Number.isFinite(
        Number(
          safeCircle.count
        )
      )
        ? Number(
            safeCircle.count
          )
        : 0;

    const mutualCount =
      Number.isFinite(
        Number(
          safeCircle.mutualCount
        )
      )
        ? Number(
            safeCircle.mutualCount
          )
        : 0;

    if (
      this.dom.circleCount
    ) {
      this.dom.circleCount.textContent =
        String(count);
    }

    if (
      this.dom.mutualCount
    ) {
      this.dom.mutualCount.textContent =
        String(mutualCount);
    }

    if (
      this.dom.joined
    ) {
      this.dom.joined.textContent =
        formatJoinedDate(
          safeCircle.joinedAt
        );
    }
  },

  renderFact(row, valueNode, value) {
    const normalized =
      normalizeString(value);

    if (!row) {
      return false;
    }

    if (!normalized) {
      row.hidden =
        true;

      if (valueNode) {
        valueNode.textContent =
          "";
      }

      return false;
    }

    row.hidden =
      false;

    if (valueNode) {
      valueNode.textContent =
        normalized;
    }

    return true;
  },

  renderImage({
    image,
    fallback,
    url,
    fallbackText,
    alt
  }) {
    if (!image) {
      return;
    }

    if (url) {
      image.src =
        url;

      image.alt =
        alt || "";

      image.hidden =
        false;

      if (fallback) {
        fallback.hidden =
          true;
      }

      return;
    }

    image.removeAttribute(
      "src"
    );

    image.alt =
      "";

    image.hidden =
      true;

    if (fallback) {
      fallback.textContent =
        fallbackText || "A";

      fallback.hidden =
        false;
    }
  },

  destroy() {
    this.state.unsubscribeStore
      ?.();

    this.state.unsubscribeStore =
      null;

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

      hasProfile:
        Boolean(
          CircleStore.get(
            "profile"
          )
        ),

      icebreakersExpanded:
        this.state
          .icebreakersExpanded,

      domReady:
        Boolean(
          this.dom.displayName
        )
    };
  }
};

export {
  ProfileRenderer,
  ICEBREAKER_DEFINITIONS
};

export default ProfileRenderer;
