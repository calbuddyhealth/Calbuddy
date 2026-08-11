// ari/developer/ari-rebirth-capability-registry-engine.js
// Purpose: Universal capability inventory for Ari + CalBuddy tools.
// V1.0.0 — Universal Tool Awareness / Permission-Gated / No Execution

window.Ari = window.Ari || {};

window.AriRebirthCapabilityRegistryEngine = {
  version: "1.0.0",

  inspect(input = {}) {
    const summary = input.summary || input || {};
    const appContext = summary.appContext || {};
    const text = this.getText(summary);

    if (!appContext.ownerMode) return null;

    const requestedCapability = this.inferRequestedCapability(text);
    const registry = this.buildRegistry();

    return {
      capabilityRegistryRan: true,
      capabilityRegistryVersion: this.version,
      source: "ari-rebirth-capability-registry-engine",

      requestedCapability,
      capabilityStatus: this.getCapabilityStatus(requestedCapability, registry),
      existingCapabilities: this.getExistingCapabilities(registry),
      missingCapabilities: this.getMissingCapabilities(registry),
      plannedCapabilities: this.getPlannedCapabilities(registry),
      reusableCapabilities: this.getReusableCapabilities(requestedCapability, registry),
      requiredNewCapabilities: this.getRequiredNewCapabilities(requestedCapability, registry),

      permissionRequirements: this.getPermissionRequirements(requestedCapability, registry),
      safetyBoundaries: this.getSafetyBoundaries(requestedCapability, registry),
      recommendedNextStep: this.getRecommendedNextStep(requestedCapability, registry),

      registry,

      registryPolicy: {
        inventoryOnly: true,
        noSearch: true,
        noRead: true,
        noPatch: true,
        noExecution: true,
        permissionGated: true,
        reusableBeforeNewBuild: true
      }
    };
  },

  getText(summary = {}) {
    return String(
      summary.userMessage ||
        summary.message ||
        summary.input ||
        summary.normalizedMessage ||
        ""
    ).trim();
  },

  inferRequestedCapability(text = "") {
    const t = String(text || "").toLowerCase();

    if (this.hasAny(t, ["email", "gmail", "inbox"])) return "email_access";
    if (this.hasAny(t, ["calendar", "schedule", "appointment"])) return "calendar_access";
    if (this.hasAny(t, ["contacts", "phonebook"])) return "contacts_access";
    if (this.hasAny(t, ["barcode", "scan food", "scanner"])) return "barcode_scanning";
    if (this.hasAny(t, ["photo", "image", "food picture", "analyze image"])) return "photo_food_analysis";
    if (this.hasAny(t, ["knowledge", "anatomy", "education", "learn"])) return "knowledge_search";
    if (this.hasAny(t, ["github", "repo", "code", "commit", "edit file"])) return "github_code_tools";
    if (this.hasAny(t, ["meal", "log food", "calories"])) return "meal_logging";
    if (this.hasAny(t, ["weight", "weigh"])) return "weight_logging";
    if (this.hasAny(t, ["profile", "goal", "calorie goal"])) return "profile_updates";
    if (this.hasAny(t, ["memory", "remember"])) return "memory_storage";
    if (this.hasAny(t, ["notification", "remind", "alert"])) return "notifications";

    return "unknown_capability";
  },

  buildRegistry() {
    return [
      {
        name: "meal_logging",
        status: "available",
        category: "nutrition",
        ownerFiles: ["calbuddy-core.js", "api/actions.js"],
        reusableFor: ["barcode_scanning", "photo_food_analysis", "food_search"],
        requiresUserPermission: false,
        requiresConfirmation: true,
        riskLevel: "medium",
        allowedActions: ["create_pending_log_meal", "confirm_log_meal"],
        forbiddenActions: ["log_without_confirmation"]
      },
      {
        name: "weight_logging",
        status: "available",
        category: "health_tracking",
        ownerFiles: ["calbuddy-core.js", "api/actions.js"],
        reusableFor: ["progress_tracking", "goal_adjustment"],
        requiresUserPermission: false,
        requiresConfirmation: true,
        riskLevel: "medium",
        allowedActions: ["create_pending_log_weight", "confirm_log_weight"],
        forbiddenActions: ["change_weight_without_confirmation"]
      },
      {
        name: "profile_updates",
        status: "available",
        category: "profile",
        ownerFiles: ["calbuddy-core.js", "api/actions.js"],
        reusableFor: ["goal_setting", "calorie_goal_updates"],
        requiresUserPermission: false,
        requiresConfirmation: true,
        riskLevel: "medium_high",
        allowedActions: ["update_goals", "update_profile_fields"],
        forbiddenActions: ["silent_profile_change"]
      },
      {
        name: "daily_dashboard_refresh",
        status: "available",
        category: "app_state",
        ownerFiles: ["calbuddy-core.js", "index.html"],
        reusableFor: ["meal_logging", "weight_logging", "activity_logging"],
        requiresUserPermission: false,
        requiresConfirmation: false,
        riskLevel: "low",
        allowedActions: ["refresh_dashboard", "dispatch_dashboard_event"],
        forbiddenActions: []
      },
      {
        name: "pending_action_confirmation",
        status: "available",
        category: "safety",
        ownerFiles: ["calbuddy-core.js", "index.html"],
        reusableFor: ["all_write_actions"],
        requiresUserPermission: false,
        requiresConfirmation: true,
        riskLevel: "high",
        allowedActions: ["ask_confirmation", "execute_after_yes", "cancel_after_no"],
        forbiddenActions: ["execute_write_without_confirmation"]
      },
      {
        name: "github_code_tools",
        status: "available",
        category: "developer",
        ownerFiles: [
          "calbuddy-core.js",
          "server/ari-owner-auth.js",
          "api/ari-owner-status.js",
          "api/ari-github-read.js",
          "api/ari-github-search.js",
          "api/ari-github-edit.js"
        ],
        reusableFor: ["bug_fixing", "self_improvement", "feature_building"],
        requiresUserPermission: true,
        requiresConfirmation: true,
        riskLevel: "high",
        allowedActions: ["search_repo", "read_file", "preview_edit", "commit_after_confirmation"],
        forbiddenActions: ["secret_commit", "edit_without_verified_owner", "guess_patch"]
      },
      {
        name: "barcode_scanning",
        status: "planned",
        category: "nutrition_tool",
        ownerFiles: ["calbuddy-core.js", "api/barcode.js", "log.html"],
        reusableFor: ["meal_logging"],
        dependsOn: ["meal_logging", "pending_action_confirmation", "daily_dashboard_refresh"],
        missingParts: ["scanner_ui", "barcode_lookup_endpoint", "food_normalization"],
        requiresUserPermission: true,
        requiresConfirmation: true,
        riskLevel: "medium",
        allowedActions: ["lookup_barcode", "prepare_log_meal"],
        forbiddenActions: ["log_unknown_food_without_confirmation"]
      },
      {
        name: "photo_food_analysis",
        status: "planned",
        category: "nutrition_tool",
        ownerFiles: ["calbuddy-core.js", "api/image-analyze.js"],
        reusableFor: ["meal_logging"],
        dependsOn: ["meal_logging", "pending_action_confirmation"],
        missingParts: ["image_upload_ui", "vision_endpoint", "portion_estimation"],
        requiresUserPermission: true,
        requiresConfirmation: true,
        riskLevel: "medium_high",
        allowedActions: ["estimate_food_from_image", "prepare_log_meal"],
        forbiddenActions: ["claim_exact_calories", "log_without_confirmation"]
      },
      {
        name: "knowledge_search",
        status: "partial",
        category: "education_tool",
        ownerFiles: ["calbuddy-core.js", "api/knowledge.js"],
        reusableFor: ["anatomy_education", "nutrition_education"],
        dependsOn: [],
        missingParts: ["trusted_source_layer", "citation_layer", "safety_classifier"],
        requiresUserPermission: false,
        requiresConfirmation: false,
        riskLevel: "medium_high",
        allowedActions: ["educational_answers", "general_explanations"],
        forbiddenActions: ["diagnosis", "medical_orders", "emergency_replacement"]
      },
      {
        name: "email_access",
        status: "missing",
        category: "external_account",
        ownerFiles: [],
        reusableFor: ["email_summary", "draft_email", "inbox_triage"],
        dependsOn: ["oauth_auth", "permission_gate", "user_confirmation"],
        missingParts: ["email_auth_provider", "email_api_endpoint", "scoped_permissions"],
        requiresUserPermission: true,
        requiresConfirmation: true,
        riskLevel: "high",
        allowedActions: ["read_after_permission", "summarize_after_permission", "draft_after_permission"],
        forbiddenActions: ["store_password", "login_secretly", "send_without_confirmation"]
      },
      {
        name: "calendar_access",
        status: "missing",
        category: "external_account",
        ownerFiles: [],
        reusableFor: ["schedule_review", "event_creation", "reminders"],
        dependsOn: ["oauth_auth", "permission_gate"],
        missingParts: ["calendar_auth", "calendar_api_endpoint"],
        requiresUserPermission: true,
        requiresConfirmation: true,
        riskLevel: "high",
        allowedActions: ["read_schedule_after_permission", "draft_event", "create_event_after_confirmation"],
        forbiddenActions: ["create_event_without_confirmation"]
      },
      {
        name: "contacts_access",
        status: "missing",
        category: "external_account",
        ownerFiles: [],
        reusableFor: ["email_drafting", "calendar_invites"],
        dependsOn: ["oauth_auth", "permission_gate"],
        missingParts: ["contacts_auth", "contacts_api_endpoint"],
        requiresUserPermission: true,
        requiresConfirmation: false,
        riskLevel: "medium_high",
        allowedActions: ["lookup_contact_after_permission"],
        forbiddenActions: ["expose_contact_data_unnecessarily"]
      },
      {
        name: "memory_storage",
        status: "available",
        category: "ari_memory",
        ownerFiles: ["calbuddy-core.js", "api/memory.js"],
        reusableFor: ["personalization", "food_preferences", "ari_tone_preferences"],
        requiresUserPermission: false,
        requiresConfirmation: false,
        riskLevel: "medium",
        allowedActions: ["save_preference", "retrieve_memories"],
        forbiddenActions: ["store_sensitive_data_without_clear_reason"]
      },
      {
        name: "notifications",
        status: "missing",
        category: "system_tool",
        ownerFiles: [],
        reusableFor: ["reminders", "streaks", "meal_prompts"],
        dependsOn: ["notification_permission", "scheduler"],
        missingParts: ["notification_permission_ui", "notification_service", "scheduler"],
        requiresUserPermission: true,
        requiresConfirmation: true,
        riskLevel: "medium",
        allowedActions: ["send_user_requested_reminder"],
        forbiddenActions: ["spam_notifications", "notify_without_permission"]
      }
    ];
  },

  getCapabilityStatus(name, registry = []) {
    const found = registry.find(item => item.name === name);

    if (!found) {
      return {
        name,
        status: "unknown",
        available: false,
        reason: "Capability is not registered yet."
      };
    }

    return {
      name: found.name,
      status: found.status,
      available: found.status === "available",
      partial: found.status === "partial",
      planned: found.status === "planned",
      missing: found.status === "missing",
      riskLevel: found.riskLevel,
      category: found.category,
      missingParts: found.missingParts || [],
      dependsOn: found.dependsOn || []
    };
  },

  getExistingCapabilities(registry = []) {
    return registry.filter(item => item.status === "available");
  },

  getMissingCapabilities(registry = []) {
    return registry.filter(item => item.status === "missing");
  },

  getPlannedCapabilities(registry = []) {
    return registry.filter(item => item.status === "planned" || item.status === "partial");
  },

  getReusableCapabilities(requestedCapability, registry = []) {
    return registry.filter(item =>
      Array.isArray(item.reusableFor) &&
      item.reusableFor.includes(requestedCapability)
    );
  },

  getRequiredNewCapabilities(requestedCapability, registry = []) {
    const found = registry.find(item => item.name === requestedCapability);

    if (!found) {
      return ["Capability must be defined before architecture can be planned."];
    }

    return found.missingParts || [];
  },

  getPermissionRequirements(requestedCapability, registry = []) {
    const found = registry.find(item => item.name === requestedCapability);

    if (!found) {
      return {
        requiresUserPermission: true,
        requiresConfirmation: true,
        reason: "Unknown capabilities default to permission-gated."
      };
    }

    return {
      requiresUserPermission: found.requiresUserPermission === true,
      requiresConfirmation: found.requiresConfirmation === true,
      riskLevel: found.riskLevel
    };
  },

  getSafetyBoundaries(requestedCapability, registry = []) {
    const found = registry.find(item => item.name === requestedCapability);

    if (!found) {
      return {
        allowedActions: [],
        forbiddenActions: ["execute_unknown_capability"]
      };
    }

    return {
      allowedActions: found.allowedActions || [],
      forbiddenActions: found.forbiddenActions || []
    };
  },

  getRecommendedNextStep(requestedCapability, registry = []) {
    const status = this.getCapabilityStatus(requestedCapability, registry);

    if (status.available) {
      return {
        type: "reuse_existing_capability",
        reason: `${requestedCapability} already exists. Reuse the existing owner files and safety rules.`
      };
    }

    if (status.partial || status.planned) {
      return {
        type: "complete_existing_capability",
        missingParts: status.missingParts,
        reason: `${requestedCapability} is already planned or partially available. Build only the missing parts.`
      };
    }

    if (status.missing) {
      return {
        type: "architecture_required",
        missingParts: status.missingParts,
        dependsOn: status.dependsOn,
        reason: `${requestedCapability} is missing. Send this to Architecture Engine before any code work.`
      };
    }

    return {
      type: "define_capability_first",
      reason: "Ari does not know this capability yet. Define purpose, inputs, outputs, permissions, and risk level first."
    };
  },

  hasAny(text = "", terms = []) {
    return terms.some(term => text.includes(term));
  }
};

console.log(
  "ARI REBIRTH CAPABILITY REGISTRY ENGINE LOADED:",
  window.AriRebirthCapabilityRegistryEngine.version
);
