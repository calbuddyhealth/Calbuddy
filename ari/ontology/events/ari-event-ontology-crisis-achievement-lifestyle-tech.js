// ari/ontology/events/ari-event-ontology-crisis-achievement-lifestyle-tech.js
// Purpose: Crisis, loss, achievement, lifestyle, travel, technology, and creative event definitions.
// V0.1.0 — Crisis / Achievement / Lifestyle / Technology / Creation Ontology

window.Ari = window.Ari || {};

window.AriEventOntologyCrisisAchievementLifestyleTech = {
  version: "0.1.0",

  definitions: [
    {
      category: "crisis_event",
      type: "immediate_safety",
      subtype: "physical_danger",
      label: "Physical Danger",
      importance: "critical",
      expectedDuration: "minutes_to_hours",
      polarity: "urgent",
      outcome: "immediate_safety_risk",
      stage: "active",
      affects: ["safety", "health", "family", "decision_making"],
      commonEmotions: ["fear", "panic", "urgency", "shock"],
      commonNeeds: ["immediate_safety", "emergency_help", "trusted_person"],
      possibleNextEvents: ["emergency_services", "shelter", "medical_evaluation"],
      threshold: 5,
      signals: [
        ["raw", /\b(in danger|unsafe right now|someone is threatening me|physical danger|being attacked|need help now)\b/, 5],
        ["domainAny", ["safety", "crisis", "health"], 3]
      ]
    },

    {
      category: "crisis_event",
      type: "natural_disaster",
      subtype: "environmental_disaster",
      label: "Natural Disaster",
      importance: "critical",
      expectedDuration: "hours_to_weeks",
      polarity: "urgent_or_negative",
      outcome: "environmental_crisis",
      stage: "active_or_recent",
      affects: ["safety", "housing", "family", "finances", "health"],
      commonEmotions: ["fear", "shock", "grief", "urgency"],
      commonNeeds: ["safety", "resources", "family_contact", "practical_steps"],
      possibleNextEvents: ["evacuation", "property_damage", "insurance_claim"],
      threshold: 5,
      signals: [
        ["raw", /\b(earthquake|fire|wildfire|flood|hurricane|tornado|evacuate|natural disaster)\b/, 5],
        ["domainAny", ["crisis", "safety", "home"], 2]
      ]
    },

    {
      category: "crisis_event",
      type: "accident",
      subtype: "vehicle_accident",
      label: "Vehicle Accident",
      importance: "critical",
      expectedDuration: "hours_to_weeks",
      polarity: "negative_or_urgent",
      outcome: "accident_event",
      stage: "active_or_recent",
      affects: ["safety", "health", "transportation", "finances", "stress"],
      commonEmotions: ["shock", "fear", "anger", "relief"],
      commonNeeds: ["safety_check", "documentation", "medical_awareness"],
      possibleNextEvents: ["insurance_claim", "medical_evaluation", "vehicle_repair"],
      threshold: 5,
      signals: [
        ["raw", /\b(car accident|crash|got rear ended|hit my car|vehicle accident|totaled my car)\b/, 5],
        ["domainAny", ["safety", "finance", "health"], 2]
      ]
    },

    {
      category: "loss_event",
      type: "death_or_bereavement",
      subtype: "death_of_loved_one",
      label: "Death of Loved One",
      importance: "critical",
      expectedDuration: "months_to_years",
      polarity: "negative",
      outcome: "bereavement",
      stage: "active_or_recent",
      affects: ["grief", "family", "identity", "routine", "meaning"],
      commonEmotions: ["grief", "shock", "sadness", "anger", "numbness"],
      commonNeeds: ["presence", "compassion", "practical_support", "time"],
      possibleNextEvents: ["funeral", "estate_process", "anniversary_grief"],
      threshold: 5,
      signals: [
        ["raw", /\b(died|passed away|lost my|death of|funeral|mourning)\b/, 5],
        ["domainAny", ["grief", "loss", "family"], 2]
      ]
    },

    {
      category: "loss_event",
      type: "pet_loss",
      subtype: "death_or_illness_of_pet",
      label: "Pet Loss or Pet Illness",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative",
      outcome: "companion_loss_or_concern",
      stage: "active_or_recent",
      affects: ["grief", "routine", "attachment", "family"],
      commonEmotions: ["sadness", "fear", "guilt", "love"],
      commonNeeds: ["compassion", "vet_boundary", "grief_support"],
      possibleNextEvents: ["vet_visit", "euthanasia_decision", "grief_processing"],
      threshold: 5,
      signals: [
        ["raw", /\b(my cat|my dog|pet died|pet is sick|put my pet down|euthanize my pet|vet)\b/, 4],
        ["domainAny", ["grief", "family", "health"], 2]
      ]
    },

    {
      category: "achievement_event",
      type: "personal_achievement",
      subtype: "goal_completed",
      label: "Goal Completed",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_weeks",
      polarity: "positive",
      outcome: "personal_success",
      stage: "completed_or_recent",
      affects: ["confidence", "identity", "motivation", "future_planning"],
      commonEmotions: ["pride", "relief", "joy", "motivation"],
      commonNeeds: ["celebration", "reflection", "next_goal"],
      possibleNextEvents: ["confidence_gain", "new_goal", "habit_maintenance"],
      threshold: 5,
      signals: [
        ["raw", /\b(I did it|completed my goal|reached my goal|finally finished|accomplished)\b/, 4],
        ["action", "achievement", 2],
        ["polarity", "positive", 1]
      ]
    },

    {
      category: "achievement_event",
      type: "competition",
      subtype: "competition_win",
      label: "Competition Win",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_weeks",
      polarity: "positive",
      outcome: "competitive_success",
      stage: "completed_or_recent",
      affects: ["confidence", "identity", "status", "motivation"],
      commonEmotions: ["pride", "joy", "relief", "excitement"],
      commonNeeds: ["celebration", "recognition", "momentum"],
      possibleNextEvents: ["next_competition", "confidence_gain", "public_recognition"],
      threshold: 5,
      signals: [
        ["raw", /\b(won the competition|won first place|won the game|placed first|took first|victory)\b/, 4],
        ["domainAny", ["achievement", "sports", "competition"], 2],
        ["action", "achievement", 1]
      ]
    },

    {
      category: "achievement_event",
      type: "competition",
      subtype: "competition_loss",
      label: "Competition Loss",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative_or_mixed",
      outcome: "competitive_setback",
      stage: "completed_or_recent",
      affects: ["confidence", "motivation", "identity", "mood"],
      commonEmotions: ["disappointment", "frustration", "shame", "determination"],
      commonNeeds: ["perspective", "learning_review", "next_attempt_plan"],
      possibleNextEvents: ["training_plan", "confidence_rebuild", "next_competition"],
      threshold: 5,
      signals: [
        ["raw", /\b(lost the competition|lost the game|didn't place|came in last|failed at the competition)\b/, 4],
        ["domainAny", ["achievement", "sports", "competition"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "lifestyle_event",
      type: "travel",
      subtype: "trip_planning",
      label: "Trip Planning",
      importance: "moderate",
      expectedDuration: "days_to_months",
      polarity: "positive_or_stressful",
      outcome: "travel_preparation",
      stage: "planning",
      affects: ["finances", "relationship", "routine", "enjoyment"],
      commonEmotions: ["excitement", "stress", "anticipation", "uncertainty"],
      commonNeeds: ["recommendations", "logistics", "budget_awareness"],
      possibleNextEvents: ["travel_departure", "reservation_decision", "travel_problem"],
      threshold: 5,
      signals: [
        ["raw", /\b(planning a trip|traveling to|vacation plans|book a hotel|flight|itinerary)\b/, 4],
        ["domainAny", ["travel", "lifestyle", "finance"], 2]
      ]
    },

    {
      category: "lifestyle_event",
      type: "travel",
      subtype: "travel_problem",
      label: "Travel Problem",
      importance: "major",
      expectedDuration: "hours_to_days",
      polarity: "negative_or_stressful",
      outcome: "travel_disruption",
      stage: "active_or_recent",
      affects: ["stress", "finances", "schedule", "relationship"],
      commonEmotions: ["frustration", "anxiety", "anger", "fatigue"],
      commonNeeds: ["logistics", "backup_plan", "calm_prioritization"],
      possibleNextEvents: ["rebooking", "refund_request", "schedule_change"],
      threshold: 5,
      signals: [
        ["raw", /\b(flight delayed|flight canceled|lost luggage|missed flight|travel problem|hotel issue)\b/, 4],
        ["domainAny", ["travel", "finance", "stress"], 2]
      ]
    },

    {
      category: "lifestyle_event",
      type: "food_or_dining",
      subtype: "restaurant_decision",
      label: "Restaurant Decision",
      importance: "low_to_moderate",
      expectedDuration: "minutes_to_hours",
      polarity: "neutral_or_positive",
      outcome: "dining_choice",
      stage: "decision",
      affects: ["relationship", "enjoyment", "finances", "time"],
      commonEmotions: ["excitement", "indecision", "pressure"],
      commonNeeds: ["recommendation", "tradeoff", "quick_decision"],
      possibleNextEvents: ["reservation", "date_night", "spending_decision"],
      threshold: 5,
      signals: [
        ["raw", /\b(restaurant|where should we eat|dinner reservation|date night dinner|food place)\b/, 4],
        ["domainAny", ["lifestyle", "relationship", "travel"], 2]
      ]
    },

    {
      category: "lifestyle_event",
      type: "fitness",
      subtype: "fitness_goal",
      label: "Fitness Goal",
      importance: "moderate_to_major",
      expectedDuration: "weeks_to_months",
      polarity: "positive_or_mixed",
      outcome: "body_or_performance_goal",
      stage: "planning_or_active",
      affects: ["health", "confidence", "routine", "identity"],
      commonEmotions: ["motivation", "frustration", "hope", "self_criticism"],
      commonNeeds: ["realistic_plan", "accountability", "progress_tracking"],
      possibleNextEvents: ["weight_change", "injury", "goal_completed"],
      threshold: 5,
      signals: [
        ["raw", /\b(fitness goal|get in shape|workout plan|run faster|build muscle|lose fat)\b/, 4],
        ["domainAny", ["fitness", "health", "lifestyle"], 2]
      ]
    },

    {
      category: "technology_event",
      type: "app_development",
      subtype: "building_app",
      label: "Building an App",
      importance: "major",
      expectedDuration: "weeks_to_years",
      polarity: "positive_or_stressful",
      outcome: "product_creation",
      stage: "active",
      affects: ["identity", "career", "finances", "creativity", "stress"],
      commonEmotions: ["excitement", "frustration", "obsession", "pride"],
      commonNeeds: ["architecture", "debugging", "scope_control"],
      possibleNextEvents: ["bug_fix", "deployment", "feature_design"],
      threshold: 5,
      signals: [
        ["raw", /\b(building an app|my app|app development|calbuddy|ari rebirth|product build)\b/, 4],
        ["domainAny", ["developer", "technology", "creation"], 2]
      ]
    },

    {
      category: "technology_event",
      type: "debugging",
      subtype: "bug_found",
      label: "Bug Found",
      importance: "moderate_to_major",
      expectedDuration: "minutes_to_days",
      polarity: "negative_or_problem",
      outcome: "technical_fault_identified",
      stage: "active",
      affects: ["stress", "product_quality", "confidence", "time"],
      commonEmotions: ["frustration", "focus", "confusion", "urgency"],
      commonNeeds: ["diagnosis", "evidence", "contained_patch"],
      possibleNextEvents: ["bug_fix", "test_result", "architecture_change"],
      threshold: 5,
      signals: [
        ["raw", /\b(bug|broken|not working|error|issue in the code|debug)\b/, 4],
        ["domainAny", ["developer", "technology"], 2]
      ]
    },

    {
      category: "technology_event",
      type: "deployment",
      subtype: "deployment_success",
      label: "Deployment Success",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_days",
      polarity: "positive",
      outcome: "technical_release_success",
      stage: "completed_or_recent",
      affects: ["confidence", "product_progress", "motivation", "career"],
      commonEmotions: ["relief", "pride", "excitement", "momentum"],
      commonNeeds: ["celebration", "testing", "next_feature_plan"],
      possibleNextEvents: ["user_testing", "bug_report", "feature_expansion"],
      threshold: 5,
      signals: [
        ["raw", /\b(deployed|deployment worked|site is live|pushed to production|vercel deployed)\b/, 4],
        ["domainAny", ["developer", "technology"], 2],
        ["polarity", "positive", 1]
      ]
    },

    {
      category: "technology_event",
      type: "deployment",
      subtype: "deployment_failure",
      label: "Deployment Failure",
      importance: "major",
      expectedDuration: "hours_to_days",
      polarity: "negative_or_problem",
      outcome: "release_blocked",
      stage: "active_or_recent",
      affects: ["stress", "product_progress", "confidence", "time"],
      commonEmotions: ["frustration", "panic", "confusion", "urgency"],
      commonNeeds: ["triage", "rollback_or_fix", "logs"],
      possibleNextEvents: ["bug_fix", "rollback", "config_change"],
      threshold: 5,
      signals: [
        ["raw", /\b(deployment failed|vercel failed|build failed|site crashed|production error)\b/, 4],
        ["domainAny", ["developer", "technology"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "creation_event",
      type: "creative_project",
      subtype: "starting_project",
      label: "Starting Creative Project",
      importance: "moderate_to_major",
      expectedDuration: "days_to_months",
      polarity: "positive_or_mixed",
      outcome: "creative_beginning",
      stage: "starting_or_planning",
      affects: ["identity", "motivation", "time", "confidence"],
      commonEmotions: ["excitement", "uncertainty", "hope", "fear"],
      commonNeeds: ["scope_control", "first_step", "encouragement"],
      possibleNextEvents: ["creative_block", "project_progress", "project_completion"],
      threshold: 5,
      signals: [
        ["raw", /\b(starting a project|creative project|write a book|make music|make art|build something new)\b/, 4],
        ["domainAny", ["creation", "creativity", "technology"], 2]
      ]
    },

    {
      category: "creation_event",
      type: "creative_project",
      subtype: "creative_block",
      label: "Creative Block",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative_or_mixed",
      outcome: "creative_stuckness",
      stage: "active",
      affects: ["confidence", "motivation", "identity", "time"],
      commonEmotions: ["frustration", "self_doubt", "restlessness", "pressure"],
      commonNeeds: ["unsticking", "small_prompt", "non_perfectionism"],
      possibleNextEvents: ["project_progress", "pause", "scope_change"],
      threshold: 5,
      signals: [
        ["raw", /\b(writer's block|creative block|stuck on my project|can't create|no ideas)\b/, 4],
        ["domainAny", ["creation", "creativity"], 2]
      ]
    },

    {
      category: "creation_event",
      type: "creative_project",
      subtype: "project_completion",
      label: "Project Completion",
      importance: "major",
      expectedDuration: "days_to_weeks",
      polarity: "positive_or_mixed",
      outcome: "creation_completed",
      stage: "completed_or_recent",
      affects: ["confidence", "identity", "future_planning", "motivation"],
      commonEmotions: ["pride", "relief", "emptiness", "excitement"],
      commonNeeds: ["celebration", "reflection", "next_step"],
      possibleNextEvents: ["sharing_project", "feedback", "new_project"],
      threshold: 5,
      signals: [
        ["raw", /\b(finished my project|completed the project|done with my project|launched my project|finished building)\b/, 4],
        ["domainAny", ["creation", "technology", "achievement"], 2],
        ["action", "achievement", 1]
      ]
    },

    {
      category: "identity_event",
      type: "public_recognition",
      subtype: "being_seen_or_validated",
      label: "Being Seen or Validated",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "positive",
      outcome: "identity_validation",
      stage: "recent",
      affects: ["confidence", "identity", "belonging", "motivation"],
      commonEmotions: ["pride", "relief", "gratitude", "joy"],
      commonNeeds: ["integration", "celebration", "humility_balance"],
      possibleNextEvents: ["confidence_gain", "new_goal", "public_pressure"],
      threshold: 5,
      signals: [
        ["raw", /\b(felt seen|recognized me|validated me|people noticed|got recognition)\b/, 4],
        ["domainAny", ["identity", "achievement", "social"], 2],
        ["polarity", "positive", 1]
      ]
    },

    {
      category: "identity_event",
      type: "public_pressure",
      subtype: "fear_of_judgment",
      label: "Fear of Judgment",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative_or_mixed",
      outcome: "evaluation_pressure",
      stage: "active_or_anticipated",
      affects: ["confidence", "identity", "social_life", "decision_making"],
      commonEmotions: ["anxiety", "shame", "fear", "self_consciousness"],
      commonNeeds: ["grounding", "values_clarity", "self_respect"],
      possibleNextEvents: ["avoidance", "social_success", "support_request"],
      threshold: 5,
      signals: [
        ["raw", /\b(afraid people will judge|worried what people think|embarrassed to share|fear of judgment)\b/, 4],
        ["domainAny", ["identity", "social", "mental_health"], 2]
      ]
    },

    {
      category: "lifestyle_event",
      type: "celebration",
      subtype: "personal_celebration",
      label: "Personal Celebration",
      importance: "moderate",
      expectedDuration: "hours_to_days",
      polarity: "positive",
      outcome: "joy_or_marking_milestone",
      stage: "planned_or_recent",
      affects: ["mood", "relationships", "identity", "memory"],
      commonEmotions: ["joy", "gratitude", "excitement", "pride"],
      commonNeeds: ["presence", "celebration", "appreciation"],
      possibleNextEvents: ["shared_memory", "social_connection", "financial_spending"],
      threshold: 5,
      signals: [
        ["raw", /\b(celebrate|celebration|birthday|anniversary|special day|big moment)\b/, 4],
        ["domainAny", ["lifestyle", "social", "relationship"], 2],
        ["polarity", "positive", 1]
      ]
    },

    {
      category: "lifestyle_event",
      type: "routine_change",
      subtype: "new_habit",
      label: "New Habit",
      importance: "moderate",
      expectedDuration: "weeks_to_months",
      polarity: "positive_or_mixed",
      outcome: "routine_rebuild",
      stage: "starting_or_active",
      affects: ["identity", "health", "confidence", "routine"],
      commonEmotions: ["motivation", "frustration", "hope", "pressure"],
      commonNeeds: ["small_steps", "consistency", "forgiveness_after_slip"],
      possibleNextEvents: ["habit_success", "habit_slip", "goal_completed"],
      threshold: 5,
      signals: [
        ["raw", /\b(new habit|trying to be consistent|daily routine|morning routine|habit change)\b/, 4],
        ["domainAny", ["lifestyle", "health", "personal_growth"], 2]
      ]
    },

    {
      category: "lifestyle_event",
      type: "routine_change",
      subtype: "habit_slip",
      label: "Habit Slip",
      importance: "moderate",
      expectedDuration: "hours_to_days",
      polarity: "negative_or_mixed",
      outcome: "routine_disruption",
      stage: "recent",
      affects: ["confidence", "motivation", "health", "identity"],
      commonEmotions: ["guilt", "frustration", "shame", "disappointment"],
      commonNeeds: ["non_shame_restart", "small_next_step", "pattern_review"],
      possibleNextEvents: ["habit_restart", "self_criticism", "goal_adjustment"],
      threshold: 5,
      signals: [
        ["raw", /\b(fell off|slipped up|broke my routine|missed my habit|failed my habit)\b/, 4],
        ["domainAny", ["lifestyle", "health", "personal_growth"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "technology_event",
      type: "ai_interaction",
      subtype: "ai_quality_evaluation",
      label: "AI Quality Evaluation",
      importance: "moderate_to_major",
      expectedDuration: "minutes_to_days",
      polarity: "neutral_or_mixed",
      outcome: "ai_behavior_assessment",
      stage: "active_or_recent",
      affects: ["trust", "product_quality", "architecture", "expectations"],
      commonEmotions: ["curiosity", "frustration", "hope", "skepticism"],
      commonNeeds: ["diagnosis", "architecture_reasoning", "test_case"],
      possibleNextEvents: ["engine_patch", "test_prompt", "quality_improvement"],
      threshold: 5,
      signals: [
        ["raw", /\b(ai quality|ari response|chatbot response|why did ari|assistant behavior|model behavior)\b/, 4],
        ["domainAny", ["developer", "technology", "ai"], 2]
      ]
    },

    {
      category: "technology_event",
      type: "architecture_design",
      subtype: "system_architecture_change",
      label: "System Architecture Change",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "neutral_or_stressful",
      outcome: "technical_design_change",
      stage: "planning_or_active",
      affects: ["product_quality", "complexity", "maintenance", "future_scaling"],
      commonEmotions: ["focus", "uncertainty", "excitement", "overwhelm"],
      commonNeeds: ["scope_control", "design_principle", "migration_plan"],
      possibleNextEvents: ["engine_creation", "file_split", "integration_test"],
      threshold: 5,
      signals: [
        ["raw", /\b(architecture|pipeline change|new engine|ontology|semantic engine|understanding engine|wire it together)\b/, 4],
        ["domainAny", ["developer", "technology", "ai"], 2]
      ]
    },

    {
      category: "crisis_event",
      type: "major_disruption",
      subtype: "sudden_life_disruption",
      label: "Sudden Life Disruption",
      importance: "critical",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "life_stability_disrupted",
      stage: "active_or_recent",
      affects: ["safety", "routine", "family", "finances", "mental_health"],
      commonEmotions: ["shock", "fear", "confusion", "overwhelm"],
      commonNeeds: ["triage", "stabilization", "next_step"],
      possibleNextEvents: ["financial_pressure", "housing_change", "support_request"],
      threshold: 5,
      signals: [
        ["raw", /\b(everything changed|life blew up|sudden crisis|major disruption|don't know what to do now)\b/, 4],
        ["domainAny", ["crisis", "life", "mental_health"], 2]
      ]
    }
  ]
};

window.Ari.eventOntologyCrisisAchievementLifestyleTech =
  window.AriEventOntologyCrisisAchievementLifestyleTech;

console.log(
  "ARI EVENT ONTOLOGY CRISIS ACHIEVEMENT LIFESTYLE TECH LOADED:",
  window.AriEventOntologyCrisisAchievementLifestyleTech.version
);