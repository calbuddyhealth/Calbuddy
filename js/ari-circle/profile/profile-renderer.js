// js/ari-circle/profile/profile-renderer.js
// ARI Circle
// V2.1.0
//
// Purpose:
// - Render ARI Circle profile data from CircleStore into ari-circle.html.
// - Keep DOM rendering separate from data fetching and business logic.
// - Render profile hero, About Me, Things I'm Into, Circle Details,
//   and ownership label.
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

const VERSION = "2.1.0";
const SOURCE = "ari-circle/profile/profile-renderer";

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

const ProfileRenderer = {
  version:
    VERSION,

  source:
    SOURCE,

  state: {
    initialized: false,
    unsubscribeStore: null
  },

  dom: {},

  init() {
    if (this.state.initialized) {
      return this.getDiagnostics();
    }

    this.cacheDom();
    this.bindStore();
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

    const cover = document.getElementById("circle-cover");
    const profileCard = document.getElementById("circle-profile");
    const templateName = coverUrl?.startsWith("template:")
      ? coverUrl.slice("template:".length)
      : (coverUrl ? "custom" : "pearl");

    if (cover) cover.dataset.profileTemplate = templateName || "pearl";
    if (profileCard) profileCard.dataset.profileTemplate = templateName || "pearl";

    if (this.dom.coverImage) {
      const customCoverUrl = coverUrl && !coverUrl.startsWith("template:")
        ? coverUrl
        : null;

      if (customCoverUrl) {
        this.dom.coverImage.src = customCoverUrl;
        this.dom.coverImage.hidden = false;
        if (this.dom.coverFallback) this.dom.coverFallback.hidden = true;
      } else {
        this.dom.coverImage.removeAttribute("src");
        this.dom.coverImage.hidden = true;
        if (this.dom.coverFallback) this.dom.coverFallback.hidden = false;
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

      breakTheIceRemoved:
        true,

      domReady:
        Boolean(
          this.dom.displayName
        )
    };
  }
};

export {
  ProfileRenderer
};

export default ProfileRenderer;
