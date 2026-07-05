// ari/ontology/events/ari-event-ontology-finance-legal.js
// Purpose: Finance, legal, admin, benefits, and paperwork event definitions.
// V0.1.0 — Money / Debt / Benefits / Immigration / Legal/Admin Ontology

window.Ari = window.Ari || {};

window.AriEventOntologyFinanceLegal = {
  version: "0.1.0",

  definitions: [
    {
      category: "finance_legal_event",
      type: "financial_pressure",
      subtype: "money_stress",
      label: "Money Stress",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "negative_or_mixed",
      outcome: "resource_pressure",
      stage: "active",
      affects: ["stress", "family", "relationship", "future_planning"],
      commonEmotions: ["anxiety", "shame", "pressure", "frustration"],
      commonNeeds: ["budget_clarity", "prioritization", "small_plan"],
      possibleNextEvents: ["budgeting", "debt_management", "major_purchase_delay"],
      threshold: 5,
      signals: [
        ["raw", /\b(money is tight|broke|can't afford|financial stress|paycheck to paycheck|money stress)\b/, 4],
        ["domainAny", ["finance", "life"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "budgeting",
      subtype: "budget_planning",
      label: "Budget Planning",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_weeks",
      polarity: "neutral_or_positive",
      outcome: "financial_structure",
      stage: "planning_or_active",
      affects: ["finances", "stress", "future_planning", "relationship"],
      commonEmotions: ["hope", "pressure", "anxiety", "control"],
      commonNeeds: ["numbers", "prioritization", "realistic_plan"],
      possibleNextEvents: ["debt_payoff", "savings_goal", "spending_cut"],
      threshold: 5,
      signals: [
        ["raw", /\b(budget|budgeting|make a budget|track spending|monthly expenses|spending plan)\b/, 4],
        ["domainAny", ["finance", "planning"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "debt",
      subtype: "debt_management",
      label: "Debt Management",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "negative_or_mixed",
      outcome: "debt_reduction_process",
      stage: "active_or_planning",
      affects: ["finances", "stress", "relationship", "future_planning"],
      commonEmotions: ["shame", "pressure", "hope", "frustration"],
      commonNeeds: ["repayment_plan", "prioritization", "non_shame_framing"],
      possibleNextEvents: ["debt_payoff", "credit_repair", "financial_pressure"],
      threshold: 5,
      signals: [
        ["raw", /\b(debt|credit card debt|pay off debt|debt payment|owe money|minimum payment)\b/, 4],
        ["domainAny", ["finance", "legal"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "debt",
      subtype: "debt_payoff",
      label: "Debt Payoff",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "positive",
      outcome: "financial_relief",
      stage: "completed_or_near_completion",
      affects: ["finances", "confidence", "stress", "future_planning"],
      commonEmotions: ["relief", "pride", "hope", "freedom"],
      commonNeeds: ["celebration", "maintenance_plan", "next_goal"],
      possibleNextEvents: ["savings_goal", "major_purchase", "investment_planning"],
      threshold: 5,
      signals: [
        ["raw", /\b(paid off debt|debt free|paid everything off|no more debt|finished paying)\b/, 4],
        ["domain", "finance", 2],
        ["action", "achievement", 1]
      ]
    },

    {
      category: "finance_legal_event",
      type: "credit",
      subtype: "credit_score_change",
      label: "Credit Score Change",
      importance: "moderate_to_major",
      expectedDuration: "days_to_months",
      polarity: "mixed",
      outcome: "credit_status_change",
      stage: "recent_or_active",
      affects: ["finances", "future_planning", "confidence", "major_purchase"],
      commonEmotions: ["relief", "frustration", "anxiety", "pride"],
      commonNeeds: ["interpretation", "credit_plan", "next_step"],
      possibleNextEvents: ["loan_application", "credit_repair", "major_purchase"],
      threshold: 5,
      signals: [
        ["raw", /\b(credit score|fico|credit went up|credit dropped|credit report|missed payment)\b/, 4],
        ["domainAny", ["finance", "credit"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "major_purchase",
      subtype: "vehicle_purchase_or_lease",
      label: "Vehicle Purchase or Lease",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "positive_or_stressful",
      outcome: "transportation_financial_decision",
      stage: "planning_or_decision",
      affects: ["finances", "family", "routine", "identity"],
      commonEmotions: ["excitement", "anxiety", "pressure", "uncertainty"],
      commonNeeds: ["cost_comparison", "risk_assessment", "decision_support"],
      possibleNextEvents: ["loan_application", "insurance_change", "budget_adjustment"],
      threshold: 5,
      signals: [
        ["raw", /\b(buy a car|lease a car|car payment|vehicle purchase|trade in|down payment|auto loan)\b/, 4],
        ["domainAny", ["finance", "vehicle", "family"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "major_purchase",
      subtype: "home_purchase",
      label: "Home Purchase",
      importance: "critical",
      expectedDuration: "months",
      polarity: "positive_or_stressful",
      outcome: "housing_financial_commitment",
      stage: "planning_or_active",
      affects: ["finances", "family", "housing", "future_planning"],
      commonEmotions: ["excitement", "fear", "pressure", "pride"],
      commonNeeds: ["risk_assessment", "budget_clarity", "timeline_planning"],
      possibleNextEvents: ["mortgage", "inspection", "moving_home"],
      threshold: 5,
      signals: [
        ["raw", /\b(buying a house|buying a home|mortgage|home loan|down payment on a house|offer on a house)\b/, 4],
        ["domainAny", ["finance", "home", "family"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "income",
      subtype: "raise_or_bonus",
      label: "Raise or Bonus",
      importance: "moderate_to_major",
      expectedDuration: "days_to_months",
      polarity: "positive",
      outcome: "income_increase",
      stage: "recent_or_expected",
      affects: ["finances", "confidence", "future_planning", "career"],
      commonEmotions: ["relief", "pride", "excitement", "gratitude"],
      commonNeeds: ["celebration", "allocation_plan", "future_planning"],
      possibleNextEvents: ["debt_payoff", "savings_goal", "major_purchase"],
      threshold: 5,
      signals: [
        ["raw", /\b(got a raise|pay raise|bonus|higher pay|salary increase|increased income)\b/, 4],
        ["domainAny", ["finance", "career", "work"], 2],
        ["polarity", "positive", 1]
      ]
    },

    {
      category: "finance_legal_event",
      type: "income",
      subtype: "income_loss",
      label: "Income Loss",
      importance: "critical",
      expectedDuration: "weeks_to_months",
      polarity: "negative",
      outcome: "income_reduction",
      stage: "active_or_recent",
      affects: ["finances", "family", "stress", "housing", "future_planning"],
      commonEmotions: ["fear", "shame", "anger", "uncertainty"],
      commonNeeds: ["stabilization", "budget_triage", "resource_plan"],
      possibleNextEvents: ["job_search", "debt_management", "financial_pressure"],
      threshold: 5,
      signals: [
        ["raw", /\b(pay cut|lost income|income dropped|hours cut|reduced pay|no paycheck)\b/, 4],
        ["domainAny", ["finance", "career", "work"], 2],
        ["polarity", "negative", 1]
      ]
    },

    {
      category: "finance_legal_event",
      type: "savings",
      subtype: "emergency_fund",
      label: "Emergency Fund",
      importance: "moderate_to_major",
      expectedDuration: "weeks_to_months",
      polarity: "positive_or_planning",
      outcome: "financial_buffer",
      stage: "planning_or_active",
      affects: ["security", "stress", "future_planning", "finances"],
      commonEmotions: ["hope", "control", "pressure", "relief"],
      commonNeeds: ["goal_setting", "realistic_plan", "automation"],
      possibleNextEvents: ["debt_payoff", "investment_planning", "major_purchase"],
      threshold: 5,
      signals: [
        ["raw", /\b(emergency fund|savings goal|save money|building savings|rainy day fund)\b/, 4],
        ["domain", "finance", 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "windfall",
      subtype: "unexpected_money",
      label: "Unexpected Money",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "positive_or_mixed",
      outcome: "financial_gain",
      stage: "recent_or_expected",
      affects: ["finances", "future_planning", "family", "identity"],
      commonEmotions: ["excitement", "relief", "pressure", "uncertainty"],
      commonNeeds: ["allocation_plan", "tax_awareness", "values_alignment"],
      possibleNextEvents: ["debt_payoff", "major_purchase", "investment_planning"],
      threshold: 5,
      signals: [
        ["raw", /\b(inheritance|windfall|unexpected money|large bonus|settlement money|lottery)\b/, 4],
        ["domainAny", ["finance", "legal"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "taxes",
      subtype: "tax_issue",
      label: "Tax Issue",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "neutral_or_stressful",
      outcome: "tax_admin_process",
      stage: "active_or_planning",
      affects: ["finances", "stress", "legal_admin", "future_planning"],
      commonEmotions: ["confusion", "anxiety", "frustration"],
      commonNeeds: ["documentation", "professional_boundary", "deadline_clarity"],
      possibleNextEvents: ["tax_payment", "refund", "audit_notice"],
      threshold: 5,
      signals: [
        ["raw", /\b(taxes|tax return|irs|tax refund|owe taxes|tax bill|audit)\b/, 4],
        ["domainAny", ["finance", "legal", "admin"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "insurance",
      subtype: "insurance_claim",
      label: "Insurance Claim",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "neutral_or_stressful",
      outcome: "insurance_process",
      stage: "active_or_planning",
      affects: ["finances", "health", "housing", "transportation", "stress"],
      commonEmotions: ["frustration", "worry", "confusion"],
      commonNeeds: ["documentation", "claim_tracking", "advocacy_language"],
      possibleNextEvents: ["claim_denial", "repair_payment", "appeal"],
      threshold: 5,
      signals: [
        ["raw", /\b(insurance claim|file a claim|claim denied|deductible|insurance adjuster|coverage)\b/, 4],
        ["domainAny", ["finance", "legal", "admin"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "benefits",
      subtype: "military_or_va_benefits",
      label: "Military or VA Benefits",
      importance: "major",
      expectedDuration: "weeks_to_years",
      polarity: "neutral_or_stressful",
      outcome: "benefits_navigation",
      stage: "active_or_planning",
      affects: ["finances", "health", "career", "family", "future_planning"],
      commonEmotions: ["confusion", "hope", "frustration", "anxiety"],
      commonNeeds: ["process_navigation", "documentation", "deadline_clarity"],
      possibleNextEvents: ["claim_submission", "benefits_decision", "appeal"],
      threshold: 5,
      signals: [
        ["raw", /\b(va benefits|gi bill|military benefits|disability claim|benefits claim|tricare)\b/, 4],
        ["domainAny", ["finance", "military", "health", "legal"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "legal_admin",
      subtype: "paperwork_deadline",
      label: "Paperwork Deadline",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_weeks",
      polarity: "neutral_or_stressful",
      outcome: "admin_deadline_pressure",
      stage: "active_or_upcoming",
      affects: ["stress", "future_planning", "legal_admin", "career"],
      commonEmotions: ["pressure", "anxiety", "frustration"],
      commonNeeds: ["checklist", "deadline_clarity", "prioritization"],
      possibleNextEvents: ["submission", "delay", "approval_or_denial"],
      threshold: 5,
      signals: [
        ["raw", /\b(paperwork due|forms due|deadline for forms|submit documents|application deadline)\b/, 4],
        ["domainAny", ["admin", "legal", "career", "education"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "legal_admin",
      subtype: "document_request",
      label: "Document Request",
      importance: "moderate_to_major",
      expectedDuration: "hours_to_weeks",
      polarity: "neutral_or_stressful",
      outcome: "documentation_needed",
      stage: "active_or_planning",
      affects: ["stress", "legal_admin", "career", "family"],
      commonEmotions: ["confusion", "pressure", "urgency"],
      commonNeeds: ["checklist", "organization", "source_identification"],
      possibleNextEvents: ["submission", "delay", "application_process"],
      threshold: 5,
      signals: [
        ["raw", /\b(need documents|need paperwork|birth certificate|transcripts|dd214|statement of service|proof of)\b/, 4],
        ["domainAny", ["admin", "legal", "career", "education"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "immigration",
      subtype: "immigration_case",
      label: "Immigration Case",
      importance: "critical",
      expectedDuration: "months_to_years",
      polarity: "mixed_or_stressful",
      outcome: "immigration_status_process",
      stage: "active_or_planning",
      affects: ["family", "legal_status", "security", "identity", "future_planning"],
      commonEmotions: ["fear", "hope", "frustration", "uncertainty"],
      commonNeeds: ["process_navigation", "documentation", "legal_boundary"],
      possibleNextEvents: ["uscis_decision", "appeal", "congressional_inquiry"],
      threshold: 5,
      signals: [
        ["raw", /\b(immigration case|uscis|green card|visa|citizenship|deportation|legal status)\b/, 4],
        ["domainAny", ["legal", "government", "family"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "immigration",
      subtype: "citizenship_process",
      label: "Citizenship Process",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "positive_or_stressful",
      outcome: "citizenship_status_change",
      stage: "active_or_planning",
      affects: ["identity", "family", "security", "legal_status"],
      commonEmotions: ["hope", "pride", "anxiety", "relief"],
      commonNeeds: ["process_navigation", "documentation", "interview_preparation"],
      possibleNextEvents: ["interview", "oath_ceremony", "denial_or_approval"],
      threshold: 5,
      signals: [
        ["raw", /\b(citizenship|naturalization|citizenship interview|oath ceremony|becoming a citizen)\b/, 4],
        ["domainAny", ["legal", "government", "identity"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "legal_process",
      subtype: "court_case",
      label: "Court Case",
      importance: "critical",
      expectedDuration: "weeks_to_years",
      polarity: "negative_or_stressful",
      outcome: "legal_case_process",
      stage: "active_or_planning",
      affects: ["stress", "finances", "family", "future_planning", "legal_status"],
      commonEmotions: ["fear", "anger", "uncertainty", "pressure"],
      commonNeeds: ["legal_boundary", "documentation", "support"],
      possibleNextEvents: ["hearing", "settlement", "legal_decision"],
      threshold: 5,
      signals: [
        ["raw", /\b(court case|court date|hearing|lawsuit|legal case|judge|attorney)\b/, 4],
        ["domainAny", ["legal", "admin"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "legal_process",
      subtype: "legal_letter_or_advocacy",
      label: "Legal Letter or Advocacy Request",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "neutral_or_stressful",
      outcome: "advocacy_document",
      stage: "active_or_planning",
      affects: ["legal_admin", "family", "future_planning", "stress"],
      commonEmotions: ["hope", "pressure", "uncertainty"],
      commonNeeds: ["clear_writing", "facts", "respectful_tone"],
      possibleNextEvents: ["submission", "response_waiting", "followup_request"],
      threshold: 5,
      signals: [
        ["raw", /\b(letter to senator|letter to congressman|advocacy letter|write a letter|supporting statement)\b/, 4],
        ["domainAny", ["legal", "government", "writing"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "contract",
      subtype: "prenup_or_marital_agreement",
      label: "Prenup or Marital Agreement",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "mixed_or_sensitive",
      outcome: "relationship_financial_contract",
      stage: "planning_or_active",
      affects: ["relationship", "finances", "trust", "legal_status", "family"],
      commonEmotions: ["anxiety", "protectiveness", "guilt", "relief"],
      commonNeeds: ["fairness", "legal_boundary", "clear_values"],
      possibleNextEvents: ["lawyer_consult", "partner_conversation", "agreement_revision"],
      threshold: 5,
      signals: [
        ["raw", /\b(prenup|prenuptial|marital agreement|separate property|community property|alimony)\b/, 4],
        ["domainAny", ["legal", "finance", "relationship"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "contract",
      subtype: "lease_or_rental_issue",
      label: "Lease or Rental Issue",
      importance: "major",
      expectedDuration: "days_to_months",
      polarity: "neutral_or_stressful",
      outcome: "housing_contract_issue",
      stage: "active_or_planning",
      affects: ["housing", "finances", "stress", "family"],
      commonEmotions: ["frustration", "anxiety", "uncertainty"],
      commonNeeds: ["document_review", "rights_boundary", "next_step"],
      possibleNextEvents: ["move", "rent_increase", "landlord_conversation"],
      threshold: 5,
      signals: [
        ["raw", /\b(lease|rental agreement|landlord|rent increase|security deposit|tenant)\b/, 4],
        ["domainAny", ["legal", "finance", "home"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "family_finance",
      subtype: "shared_expenses",
      label: "Shared Expenses",
      importance: "major",
      expectedDuration: "weeks_to_years",
      polarity: "mixed_or_stressful",
      outcome: "household_financial_coordination",
      stage: "active_or_planning",
      affects: ["relationship", "family", "finances", "trust"],
      commonEmotions: ["pressure", "resentment", "guilt", "teamwork"],
      commonNeeds: ["transparent_numbers", "fairness", "communication"],
      possibleNextEvents: ["budget_planning", "financial_conflict", "shared_goal"],
      threshold: 5,
      signals: [
        ["raw", /\b(split rent|shared expenses|pay bills together|household budget|we split|shared finances)\b/, 4],
        ["domainAny", ["finance", "relationship", "family"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "family_finance",
      subtype: "partner_debt",
      label: "Partner Debt",
      importance: "major",
      expectedDuration: "months_to_years",
      polarity: "mixed_or_stressful",
      outcome: "relationship_financial_pressure",
      stage: "active_or_planning",
      affects: ["relationship", "trust", "future_planning", "finances"],
      commonEmotions: ["concern", "resentment", "protectiveness", "anxiety"],
      commonNeeds: ["boundaries", "fairness", "financial_plan"],
      possibleNextEvents: ["budget_planning", "prenup_conversation", "debt_management"],
      threshold: 5,
      signals: [
        ["raw", /\b(partner.*debt|wife.*debt|husband.*debt|girlfriend.*debt|boyfriend.*debt|their debt)\b/, 4],
        ["domainAny", ["finance", "relationship"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "legal_risk",
      subtype: "arrest_or_criminal_case",
      label: "Arrest or Criminal Case",
      importance: "critical",
      expectedDuration: "days_to_years",
      polarity: "negative_or_urgent",
      outcome: "criminal_legal_process",
      stage: "active_or_recent",
      affects: ["legal_status", "family", "career", "finances", "stress"],
      commonEmotions: ["fear", "shame", "anger", "panic"],
      commonNeeds: ["legal_boundary", "immediate_support", "documentation"],
      possibleNextEvents: ["court_case", "lawyer_consult", "family_conversation"],
      threshold: 5,
      signals: [
        ["raw", /\b(arrested|charged with|criminal case|jail|bail|police report)\b/, 5],
        ["domainAny", ["legal", "safety"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "identity_admin",
      subtype: "name_change_or_records",
      label: "Name Change or Records Update",
      importance: "moderate_to_major",
      expectedDuration: "weeks_to_months",
      polarity: "neutral_or_mixed",
      outcome: "identity_record_change",
      stage: "active_or_planning",
      affects: ["identity", "legal_admin", "family", "career"],
      commonEmotions: ["excitement", "confusion", "pressure"],
      commonNeeds: ["checklist", "document_sequence", "timeline"],
      possibleNextEvents: ["passport_update", "license_update", "benefits_update"],
      threshold: 5,
      signals: [
        ["raw", /\b(name change|change my name|update records|new last name|legal name)\b/, 4],
        ["domainAny", ["legal", "admin", "identity"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "planning",
      subtype: "estate_or_will_planning",
      label: "Estate or Will Planning",
      importance: "major",
      expectedDuration: "weeks_to_months",
      polarity: "neutral_or_sensitive",
      outcome: "future_legal_financial_planning",
      stage: "planning",
      affects: ["family", "finances", "legal_admin", "future_planning"],
      commonEmotions: ["discomfort", "responsibility", "protectiveness", "relief"],
      commonNeeds: ["legal_boundary", "values_clarity", "document_checklist"],
      possibleNextEvents: ["lawyer_consult", "beneficiary_update", "family_conversation"],
      threshold: 5,
      signals: [
        ["raw", /\b(will|estate planning|beneficiary|inheritance planning|power of attorney|living trust)\b/, 4],
        ["domainAny", ["legal", "finance", "family"], 2]
      ]
    },

    {
      category: "finance_legal_event",
      type: "consumer_problem",
      subtype: "scam_or_fraud_concern",
      label: "Scam or Fraud Concern",
      importance: "major",
      expectedDuration: "hours_to_weeks",
      polarity: "negative_or_urgent",
      outcome: "financial_or_identity_risk",
      stage: "active_or_recent",
      affects: ["finances", "identity", "security", "stress"],
      commonEmotions: ["fear", "anger", "embarrassment", "urgency"],
      commonNeeds: ["damage_control", "documentation", "reporting_steps"],
      possibleNextEvents: ["bank_contact", "credit_freeze", "police_report"],
      threshold: 5,
      signals: [
        ["raw", /\b(scam|fraud|identity theft|stolen card|someone used my card|fraudulent charge)\b/, 4],
        ["domainAny", ["finance", "legal", "security"], 2]
      ]
    }
  ]
};

window.Ari.eventOntologyFinanceLegal = window.AriEventOntologyFinanceLegal;

console.log(
  "ARI EVENT ONTOLOGY FINANCE LEGAL LOADED:",
  window.AriEventOntologyFinanceLegal.version
);