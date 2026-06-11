// ari/language-system/ari-language-humanizers.js
// Ari Language Humanizers
// Purpose: Convert internal signal names into natural language.
// V1.0

window.Ari = window.Ari || {};

window.Ari.languageHumanizers = {
  version: "1.0.0",

  underlyingEmotion(name = "") {
    const map = {
      fear_of_losing_identity:
        "Underneath this, Ari may be detecting fear of losing identity.",

      fear_of_being_irresponsible:
        "Underneath this, Ari may be detecting fear of being irresponsible.",

      fear_of_failing_family:
        "Underneath this, Ari may be detecting fear of failing family.",

      fear_of_missing_irreplaceable_moments:
        "Underneath this, Ari may be detecting fear of missing irreplaceable moments.",

      fear_of_betraying_purpose:
        "Underneath this, Ari may be detecting fear of betraying purpose.",

      fear_of_collapse_if_capacity_is_ignored:
        "Underneath this, Ari may be detecting fear that capacity will collapse if ignored."
    };

    return (
      map[name] ||
      `Underneath this, Ari may be detecting ${String(name).replaceAll("_", " ")}.`
    );
  },

  lifeChapter(name = "") {
    const map = {
      fatherhood_and_transition:
        "This is a double transition: becoming a father while also leaving an old service chapter.",

      entering_fatherhood:
        "This chapter is about becoming someone your child can depend on.",

      career_and_identity_transition:
        "This chapter is about letting one career identity change shape while another forms.",

      family_transition:
        "This chapter is pulling you from achievement-centered success toward relationship-centered success.",

      fatherhood_transition:
        "This chapter is less about becoming perfect and more about becoming steady.",

      builder_development:
        "This chapter appears to be about building something meaningful without losing yourself in the process."
    };

    return (
      map[name] ||
      `This chapter appears to be about ${String(name).replaceAll("_", " ")}.`
    );
  },

  belief(name = "") {
    const map = {
      achievement_creates_security:
        "Ari may be noticing a belief underneath it: achievement creates safety.",

      all_important_roles_must_be_maintained:
        "There may be a belief that every important role has to stay active at full strength.",

      slowing_down_means_falling_behind:
        "There may be a belief that slowing down means falling behind.",

      responsibility_comes_before_rest:
        "There may be a belief that responsibility has to come before rest.",

      people_depend_on_me_to_be_stable:
        "There may be a belief that people need you to stay steady no matter what.",

      family_moments_are_irreplaceable:
        "Ari is also detecting a strong belief: family moments cannot simply be recovered later.",

      presence_matters_more_than_performance:
        "There may be a new belief forming: presence matters more than performance.",

      purpose_must_not_be_abandoned:
        "There may be a belief that purpose must be protected from being abandoned.",

      delaying_purpose_feels_like_betrayal:
        "Delay may feel like betrayal, even when it is actually discipline."
    };

    return (
      map[name] ||
      `Ari may be detecting this belief: ${String(name).replaceAll("_", " ")}.`
    );
  },

  rootNeed(name = "") {
    const map = {
      secure_family_presence:
        "The need underneath is secure family presence.",

      recovery_and_capacity:
        "The need underneath is recovery and capacity.",

      clarity_and_prioritization:
        "The need underneath is clarity and prioritization.",

      stability:
        "The need underneath is stability.",

      understanding:
        "The need underneath is understanding."
    };

    return (
      map[name] ||
      `The need underneath may be ${String(name).replaceAll("_", " ")}.`
    );
  },

  protecting(name = "") {
    const map = {
      future_family:
        "What you are protecting may be your future family.",

      family:
        "What you are protecting may be family.",

      creative_purpose:
        "What you are protecting may be creative purpose.",

      future_self:
        "What you are protecting may be your future self.",

      meaning:
        "What you are protecting may be meaning."
    };

    return (
      map[name] ||
      `What you are protecting may be ${String(name).replaceAll("_", " ")}.`
    );
  }
};