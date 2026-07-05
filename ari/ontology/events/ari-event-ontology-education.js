// ari/ontology/events/ari-event-ontology-education.js
// Purpose: Education and learning event definitions for Ari Event Understanding.
// V0.1.0 — School / Exams / Studying / Certification / Academic Identity Ontology

window.Ari = window.Ari || {};

window.AriEventOntologyEducation = {
  version: "0.1.0",

  definitions: [
    {
      category: "education_event",
      type: "academic_result",
      subtype: "major_exam_success",
      label: "Major Exam Success",
      importance: "major",
      expectedDuration: "days_to_weeks",
      polarity: "positive",
      outcome: "academic_success",
      stage: "completed_or_recent",
      affects: ["confidence", "career", "identity", "future_planning"],
      commonEmotions: ["pride", "relief", "joy", "confidence"],
      commonNeeds: ["celebration", "recognition", "next_step_planning"],
      possibleNextEvents: ["certification", "graduation", "career_transition"],
      threshold: 5,
      signals: [
        ["raw", /\b(passed my exam|passed the final|got an a|aced it|did well on the test|passed boards)\b/, 4],
        ["domainAny", ["school", "education", "career"], 2],
        ["action", "achievement", 1]
      ]
    },

    {
      category: "education_event",
      type: "academic_result",
      subtype: "major_exam_failure",
      label: "Major Exam Failure",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative",
      outcome: "academic_setback",
      stage: "completed_or_recent",
      affects: ["confidence", "future_planning", "identity", "stress"],
      commonEmotions: ["shame", "sadness", "fear", "frustration"],
      commonNeeds: ["stabilization", "study_plan", "self_compassion", "next_attempt_strategy"],
      possibleNextEvents: ["retake_exam", "study_plan_change", "academic_reassessment"],
      threshold: 5,
      signals: [
        ["raw", /\b(failed my exam|failed the final|got an f|didn't pass|did not pass|failed boards)\b/, 4],
        ["domainAny", ["school", "education", "career"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "education_event",
      type: "academic_result",
      subtype: "unexpected_grade",
      label: "Unexpected Grade",
      importance: "moderate",
      expectedDuration: "hours_to_days",
      polarity: "mixed",
      outcome: "grade_surprise",
      stage: "completed_or_recent",
      affects: ["confidence", "stress", "academic_identity"],
      commonEmotions: ["surprise", "relief", "confusion", "frustration"],
      commonNeeds: ["interpretation", "next_step", "perspective"],
      possibleNextEvents: ["professor_email", "grade_review", "study_adjustment"],
      threshold: 5,
      signals: [
        ["raw", /\b(unexpected grade|grade surprised me|thought I failed but|thought I passed but|curved my grade)\b/, 4],
        ["domainAny", ["school", "education"], 2]
      ]
    },

    {
      category: "education_event",
      type: "exam_process",
      subtype: "exam_anxiety",
      label: "Exam Anxiety",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative_or_mixed",
      outcome: "performance_anxiety",
      stage: "anticipated_or_active",
      affects: ["stress", "sleep", "confidence", "performance"],
      commonEmotions: ["anxiety", "fear", "pressure", "self_doubt"],
      commonNeeds: ["grounding", "study_structure", "reassurance", "realistic_plan"],
      possibleNextEvents: ["exam_success", "exam_failure", "study_crunch"],
      threshold: 5,
      signals: [
        ["raw", /\b(nervous about.*exam|anxious about.*test|test anxiety|final anxiety|scared for my exam)\b/, 4],
        ["domainAny", ["school", "education"], 2],
        ["emotion", "anxiety", 1]
      ]
    },

    {
      category: "education_event",
      type: "exam_process",
      subtype: "exam_preparation",
      label: "Exam Preparation",
      importance: "moderate_to_major",
      expectedDuration: "days_to_weeks",
      polarity: "neutral_or_stressful",
      outcome: "preparing_for_evaluation",
      stage: "active_or_planning",
      affects: ["routine", "stress", "sleep", "confidence"],
      commonEmotions: ["focus", "pressure", "anxiety", "motivation"],
      commonNeeds: ["study_plan", "prioritization", "accountability"],
      possibleNextEvents: ["exam_anxiety", "exam_success", "exam_failure"],
      threshold: 5,
      signals: [
        ["raw", /\b(studying for|preparing for.*exam|exam coming up|final coming up|boards coming up)\b/, 4],
        ["domainAny", ["school", "education"], 2]
      ]
    },

    {
      category: "education_event",
      type: "study_process",
      subtype: "study_overwhelm",
      label: "Study Overwhelm",
      importance: "major",
      expectedDuration: "days_to_weeks",
      polarity: "negative_or_mixed",
      outcome: "learning_load_overwhelm",
      stage: "active",
      affects: ["stress", "confidence", "sleep", "routine"],
      commonEmotions: ["overwhelm", "anxiety", "frustration", "fatigue"],
      commonNeeds: ["prioritization", "study_structure", "breakdown_into_steps"],
      possibleNextEvents: ["burnout", "study_plan_change", "exam_anxiety"],
      threshold: 5,
      signals: [
        ["raw", /\b(too much to study|overwhelmed studying|can't keep up with school|too much material|study burnout)\b/, 4],
        ["domainAny", ["school", "education", "mental_health"], 2]
      ]
    },

    {
      category: "education_event",
      type: "study_process",
      subtype: "procrastination",
      label: "Academic Procrastination",
      importance: "moderate_to_major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "delayed_academic_work",
      stage: "active",
      affects: ["stress", "confidence", "performance", "routine"],
      commonEmotions: ["guilt", "avoidance", "anxiety", "frustration"],
      commonNeeds: ["small_start", "accountability", "non_shame_plan"],
      possibleNextEvents: ["deadline_pressure", "study_plan_change", "exam_anxiety"],
      threshold: 5,
      signals: [
        ["raw", /\b(procrastinating|putting off studying|can't start studying|avoiding homework|waiting until last minute)\b/, 4],
        ["domainAny", ["school", "education"], 2]
      ]
    },

    {
      category: "education_event",
      type: "academic_work",
      subtype: "assignment_deadline",
      label: "Assignment Deadline",
      importance: "moderate",
      expectedDuration: "hours_to_days",
      polarity: "neutral_or_stressful",
      outcome: "deadline_pressure",
      stage: "active_or_upcoming",
      affects: ["routine", "stress", "performance", "sleep"],
      commonEmotions: ["pressure", "anxiety", "focus", "frustration"],
      commonNeeds: ["prioritization", "time_blocking", "completion_strategy"],
      possibleNextEvents: ["assignment_submission", "late_work", "study_overwhelm"],
      threshold: 5,
      signals: [
        ["raw", /\b(assignment due|paper due|homework due|deadline|due tonight|due tomorrow)\b/, 4],
        ["domainAny", ["school", "education"], 2]
      ]
    },

    {
      category: "education_event",
      type: "academic_work",
      subtype: "assignment_success",
      label: "Assignment Success",
      importance: "moderate",
      expectedDuration: "hours_to_days",
      polarity: "positive",
      outcome: "academic_task_success",
      stage: "completed_or_recent",
      affects: ["confidence", "motivation", "academic_identity"],
      commonEmotions: ["relief", "pride", "motivation", "satisfaction"],
      commonNeeds: ["celebration", "momentum", "reinforcement"],
      possibleNextEvents: ["exam_preparation", "next_assignment", "academic_confidence"],
      threshold: 5,
      signals: [
        ["raw", /\b(finished my paper|submitted my assignment|got a good grade on my paper|finished homework)\b/, 4],
        ["domainAny", ["school", "education"], 2],
        ["action", "achievement", 1]
      ]
    },

    {
      category: "education_event",
      type: "academic_path",
      subtype: "starting_program",
      label: "Starting an Educational Program",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "positive_or_mixed",
      outcome: "education_path_beginning",
      stage: "starting_or_planning",
      affects: ["career", "identity", "routine", "finances", "stress"],
      commonEmotions: ["excitement", "anxiety", "hope", "pressure"],
      commonNeeds: ["planning", "orientation", "confidence_building"],
      possibleNextEvents: ["course_load_adjustment", "tuition_payment", "exam_anxiety"],
      threshold: 5,
      signals: [
        ["raw", /\b(starting my program|accepted into.*program|nursing school|grad school|college program|university program)\b/, 4],
        ["domainAny", ["school", "education", "career"], 2]
      ]
    },

    {
      category: "education_event",
      type: "academic_path",
      subtype: "returning_to_school",
      label: "Returning to School",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "positive_or_mixed",
      outcome: "education_reentry",
      stage: "planning_or_starting",
      affects: ["identity", "career", "finances", "routine", "family"],
      commonEmotions: ["hope", "fear", "excitement", "uncertainty"],
      commonNeeds: ["decision_support", "planning", "confidence_building"],
      possibleNextEvents: ["application", "starting_program", "career_change"],
      threshold: 5,
      signals: [
        ["raw", /\b(going back to school|returning to school|back in school|start school again|school after years)\b/, 4],
        ["domainAny", ["school", "education", "career"], 2]
      ]
    },

    {
      category: "education_event",
      type: "academic_path",
      subtype: "dropping_or_withdrawing",
      label: "Dropping or Withdrawing From School",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "negative_or_mixed",
      outcome: "education_path_interruption",
      stage: "planning_or_recent",
      affects: ["identity", "career", "finances", "confidence", "future_planning"],
      commonEmotions: ["shame", "relief", "fear", "uncertainty"],
      commonNeeds: ["non_shame_review", "decision_support", "next_step_planning"],
      possibleNextEvents: ["career_reassessment", "returning_to_school", "financial_pressure"],
      threshold: 5,
      signals: [
        ["raw", /\b(drop out|dropping out|withdraw from school|withdrawing from class|leave school)\b/, 4],
        ["domainAny", ["school", "education"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "education_event",
      type: "academic_identity",
      subtype: "imposter_syndrome",
      label: "Academic Imposter Syndrome",
      importance: "major",
      expectedDuration: "days_to_years",
      polarity: "negative_or_mixed",
      outcome: "confidence_threat",
      stage: "active_or_recurring",
      affects: ["confidence", "identity", "performance", "stress"],
      commonEmotions: ["self_doubt", "anxiety", "shame", "pressure"],
      commonNeeds: ["reframing", "evidence_review", "confidence_building"],
      possibleNextEvents: ["study_overwhelm", "academic_success", "avoidance"],
      threshold: 5,
      signals: [
        ["raw", /\b(not smart enough|don't belong in school|imposter syndrome|everyone is smarter|feel like a fraud)\b/, 4],
        ["domainAny", ["school", "education", "mental_health"], 2]
      ]
    },

    {
      category: "education_event",
      type: "academic_identity",
      subtype: "academic_confidence",
      label: "Academic Confidence",
      importance: "moderate_to_major",
      expectedDuration: "days_to_months",
      polarity: "positive",
      outcome: "learning_confidence_gain",
      stage: "active_or_recent",
      affects: ["confidence", "identity", "motivation", "career"],
      commonEmotions: ["pride", "hope", "relief", "motivation"],
      commonNeeds: ["reinforcement", "celebration", "momentum"],
      possibleNextEvents: ["major_exam_success", "new_goal", "program_completion"],
      threshold: 5,
      signals: [
        ["raw", /\b(feel confident in school|finally understand it|I'm getting better at school|school is clicking|academic confidence)\b/, 4],
        ["domainAny", ["school", "education"], 2],
        ["polarity", "positive", 1]
      ]
    },

    {
      category: "education_event",
      type: "learning_goal",
      subtype: "self_directed_learning",
      label: "Self-Directed Learning",
      importance: "moderate",
      expectedDuration: "days_to_months",
      polarity: "positive_or_mixed",
      outcome: "personal_learning_goal",
      stage: "active_or_planning",
      affects: ["identity", "skills", "confidence", "routine"],
      commonEmotions: ["curiosity", "motivation", "uncertainty", "frustration"],
      commonNeeds: ["structure", "resource_selection", "practice_plan"],
      possibleNextEvents: ["skill_milestone", "project_creation", "learning_plateau"],
      threshold: 5,
      signals: [
        ["raw", /\b(teach myself|learn on my own|self-study|trying to learn|learning a new skill)\b/, 4],
        ["domainAny", ["education", "learning", "personal_growth"], 2]
      ]
    },

    {
      category: "education_event",
      type: "learning_goal",
      subtype: "skill_mastery",
      label: "Skill Mastery",
      importance: "moderate_to_major",
      expectedDuration: "weeks_to_years",
      polarity: "positive_or_mixed",
      outcome: "competence_growth",
      stage: "active_or_completed",
      affects: ["confidence", "identity", "career", "motivation"],
      commonEmotions: ["pride", "satisfaction", "relief", "curiosity"],
      commonNeeds: ["recognition", "next_challenge", "practice_plan"],
      possibleNextEvents: ["career_opportunity", "creative_project", "teaching_others"],
      threshold: 5,
      signals: [
        ["raw", /\b(mastered|finally learned|getting good at|skill improved|I understand it now)\b/, 4],
        ["domainAny", ["education", "learning", "career"], 2],
        ["action", "achievement", 1]
      ]
    },

    {
      category: "education_event",
      type: "application_process",
      subtype: "school_application",
      label: "School Application",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "mixed_or_stressful",
      outcome: "education_access_process",
      stage: "planning_or_active",
      affects: ["future_planning", "career", "finances", "identity"],
      commonEmotions: ["hope", "anxiety", "pressure", "uncertainty"],
      commonNeeds: ["organization", "application_strategy", "timeline_planning"],
      possibleNextEvents: ["acceptance", "rejection", "starting_program"],
      threshold: 5,
      signals: [
        ["raw", /\b(apply to school|school application|college application|grad school application|program application)\b/, 4],
        ["domainAny", ["school", "education", "career"], 2]
      ]
    },

    {
      category: "education_event",
      type: "application_process",
      subtype: "acceptance",
      label: "Accepted Into School or Program",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "positive",
      outcome: "education_opportunity",
      stage: "completed_or_recent",
      affects: ["identity", "career", "future_planning", "finances"],
      commonEmotions: ["joy", "relief", "pride", "anxiety"],
      commonNeeds: ["celebration", "planning", "decision_support"],
      possibleNextEvents: ["starting_program", "tuition_planning", "career_transition"],
      threshold: 5,
      signals: [
        ["raw", /\b(got accepted|accepted into school|accepted into the program|admission offer|got in)\b/, 4],
        ["domainAny", ["school", "education"], 2],
        ["action", "achievement", 1]
      ]
    },

    {
      category: "education_event",
      type: "application_process",
      subtype: "rejection",
      label: "Rejected From School or Program",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "education_opportunity_loss",
      stage: "completed_or_recent",
      affects: ["confidence", "future_planning", "identity", "mood"],
      commonEmotions: ["disappointment", "shame", "sadness", "anger"],
      commonNeeds: ["validation", "next_option_planning", "self_worth_protection"],
      possibleNextEvents: ["reapplication", "alternate_program", "career_reassessment"],
      threshold: 5,
      signals: [
        ["raw", /\b(rejected from school|didn't get accepted|did not get accepted|waitlisted|denied admission)\b/, 4],
        ["domainAny", ["school", "education"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "education_event",
      type: "classroom_experience",
      subtype: "teacher_or_professor_conflict",
      label: "Teacher or Professor Conflict",
      importance: "moderate_to_major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "authority_relationship_tension",
      stage: "active_or_recent",
      affects: ["confidence", "performance", "stress", "fairness"],
      commonEmotions: ["frustration", "anger", "anxiety", "helplessness"],
      commonNeeds: ["communication_strategy", "documentation", "perspective"],
      possibleNextEvents: ["email_professor", "grade_dispute", "academic_support"],
      threshold: 5,
      signals: [
        ["raw", /\b(professor|teacher|instructor).*\b(unfair|rude|won't help|doesn't like me|conflict)\b/, 4],
        ["domainAny", ["school", "education"], 2]
      ]
    },

    {
      category: "education_event",
      type: "classroom_experience",
      subtype: "group_project_conflict",
      label: "Group Project Conflict",
      importance: "moderate",
      expectedDuration: "days_to_weeks",
      polarity: "negative_or_mixed",
      outcome: "teamwork_tension",
      stage: "active_or_recent",
      affects: ["stress", "performance", "communication", "fairness"],
      commonEmotions: ["frustration", "resentment", "anxiety", "pressure"],
      commonNeeds: ["boundary_setting", "task_clarity", "communication_plan"],
      possibleNextEvents: ["professor_email", "assignment_deadline", "team_repair"],
      threshold: 5,
      signals: [
        ["raw", /\b(group project|class group|team project).*\b(not helping|doing all the work|conflict|lazy)\b/, 4],
        ["domainAny", ["school", "education", "social"], 2]
      ]
    },

    {
      category: "education_event",
      type: "certification",
      subtype: "professional_board_exam",
      label: "Professional Board Exam",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "mixed_or_stressful",
      outcome: "credential_evaluation",
      stage: "planned_or_completed",
      affects: ["career", "identity", "income_potential", "confidence"],
      commonEmotions: ["pressure", "anxiety", "hope", "relief"],
      commonNeeds: ["study_strategy", "confidence_building", "next_attempt_plan_if_needed"],
      possibleNextEvents: ["certification_success", "certification_failure", "career_opportunity"],
      threshold: 5,
      signals: [
        ["raw", /\b(board exam|boards|certification exam|licensure exam|credential exam|ancc|nclex)\b/, 4],
        ["domainAny", ["education", "career", "work"], 2]
      ]
    },

    {
      category: "education_event",
      type: "certification",
      subtype: "certification_success",
      label: "Certification Success",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "positive",
      outcome: "credential_earned",
      stage: "completed_or_recent",
      affects: ["career", "identity", "confidence", "income_potential"],
      commonEmotions: ["pride", "relief", "joy", "confidence"],
      commonNeeds: ["celebration", "career_planning", "identity_integration"],
      possibleNextEvents: ["job_application", "promotion", "career_transition"],
      threshold: 5,
      signals: [
        ["raw", /\b(passed boards|got certified|earned certification|officially certified|passed my licensure)\b/, 4],
        ["domainAny", ["education", "career"], 2],
        ["action", "achievement", 1]
      ]
    },

    {
      category: "education_event",
      type: "certification",
      subtype: "certification_failure",
      label: "Certification Failure",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "credential_setback",
      stage: "completed_or_recent",
      affects: ["career", "identity", "confidence", "future_planning"],
      commonEmotions: ["shame", "fear", "disappointment", "frustration"],
      commonNeeds: ["stabilization", "retake_strategy", "self_worth_protection"],
      possibleNextEvents: ["retake_exam", "study_plan_change", "career_reassessment"],
      threshold: 5,
      signals: [
        ["raw", /\b(failed boards|failed certification|didn't pass boards|did not pass certification|failed licensure)\b/, 4],
        ["domainAny", ["education", "career"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "education_event",
      type: "education_finance",
      subtype: "tuition_or_student_debt",
      label: "Tuition or Student Debt Concern",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "negative_or_mixed",
      outcome: "education_financial_pressure",
      stage: "active_or_planning",
      affects: ["finances", "career", "stress", "future_planning"],
      commonEmotions: ["anxiety", "pressure", "fear", "hope"],
      commonNeeds: ["financial_planning", "risk_assessment", "decision_support"],
      possibleNextEvents: ["loan_application", "program_decision", "career_transition"],
      threshold: 5,
      signals: [
        ["raw", /\b(tuition|student loans|school debt|can't afford school|financial aid|fafsa)\b/, 4],
        ["domainAny", ["education", "finance"], 2]
      ]
    },

    {
      category: "education_event",
      type: "academic_support",
      subtype: "tutoring_or_help_seeking",
      label: "Seeking Academic Help",
      importance: "moderate",
      expectedDuration: "days_to_weeks",
      polarity: "positive_or_mixed",
      outcome: "support_seeking",
      stage: "planned_or_active",
      affects: ["confidence", "performance", "stress", "learning"],
      commonEmotions: ["humility", "anxiety", "hope", "relief"],
      commonNeeds: ["permission", "resource_selection", "specific_request"],
      possibleNextEvents: ["tutoring_session", "grade_improvement", "confidence_gain"],
      threshold: 5,
      signals: [
        ["raw", /\b(tutor|tutoring|ask for help in class|office hours|academic support|study group)\b/, 4],
        ["domainAny", ["school", "education"], 2]
      ]
    },

    {
      category: "education_event",
      type: "graduation_pressure",
      subtype: "near_completion_stress",
      label: "Near-Completion Stress",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "mixed_or_stressful",
      outcome: "final_stage_pressure",
      stage: "active_or_upcoming",
      affects: ["stress", "identity", "career", "future_planning"],
      commonEmotions: ["pressure", "excitement", "fear", "fatigue"],
      commonNeeds: ["prioritization", "encouragement", "finish_line_strategy"],
      possibleNextEvents: ["graduation", "major_exam", "career_transition"],
      threshold: 5,
      signals: [
        ["raw", /\b(almost done with school|last semester|final semester|close to graduation|finish line)\b/, 4],
        ["domainAny", ["education", "career"], 2]
      ]
    }
  ]
};

window.Ari.eventOntologyEducation = window.AriEventOntologyEducation;

console.log(
  "ARI EVENT ONTOLOGY EDUCATION LOADED:",
  window.AriEventOntologyEducation.version
);