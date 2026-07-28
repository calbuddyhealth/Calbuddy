// ari/profile/ari-user-preference-contract.js
// Ari User Preference Contract
//
// Purpose:
// Define the canonical user-configurable interaction preferences shared by
// Ari's settings UI, preference store, preference resolver, reasoning client,
// and OpenAI request builder.
//
// V2.0.0 — Adaptive Expression / Explicit-Request Precedence
//
// Design principles:
// - Ordinary expressive language is allowed by default.
// - Preferences control style, frequency, and intensity; they are not safety rules.
// - Explicit current-turn requests may temporarily change adaptive style.
// - Only explicit user opt-outs create style prohibitions.
// - Application restrictions remain owned by AriRestrictionGovernor.
// - Consent is reserved for persistent high-intensity modes directed at the user.
//
// Responsibilities:
// - Define valid preference categories, keys, values, and presets.
// - Define application-owned adaptive runtime defaults.
// - Define UI labels, explanations, consent requirements, and instruction mappings.
// - Normalize and validate stored, conversation, and current-turn overrides.
// - Resolve preferences with provenance.
// - Build model-ready interaction-style instructions.
//
// Non-responsibilities:
// - Does not read from or write to Supabase.
// - Does not detect preference changes in conversation.
// - Does not persist preferences or consent records.
// - Does not classify safety, malicious intent, or illegal operations.
// - Does not override AriRestrictionGovernor.
// - Does not execute OpenAI requests or generate final responses.

window.Ari = window.Ari || {};

window.AriUserPreferenceContract = {
  version: "2.0.0",
  schemaVersion: "2.0.0",
  source: "ari-user-preference-contract",
  authorityLevel: "canonical_user_interaction_preference_contract",

  DEFAULT_VALUE: "default",

  ENFORCEMENT: Object.freeze({
    ADAPTIVE: "adaptive",
    PREFERRED: "preferred",
    HARD_OPT_OUT: "hard_opt_out",
    CONSENTED_HIGH_INTENSITY: "consented_high_intensity"
  }),

  /* =====================================================
     PRESETS
  ===================================================== */

  presets: {
    default: {
      id: "default",
      label: "Ari Default",
      description:
        "Adaptive, natural, context-aware conversation without unnecessary style restrictions.",
      overrides: {}
    },

    trusted_friend: {
      id: "trusted_friend",
      label: "Trusted Friend",
      description:
        "Warm, honest, casual, personally engaged, and comfortable matching the user's tone.",
      overrides: {
        communication: {
          warmth: "warm",
          directness: "direct",
          formality: "casual"
        },
        language: {
          profanity: "natural",
          humor: "adaptive",
          sarcasm: "light",
          banter: "playful",
          roasting: "light"
        },
        interaction: {
          personal_engagement: "high",
          challenge_level: "balanced"
        }
      }
    },

    coach: {
      id: "coach",
      label: "Coach",
      description:
        "Motivating, firm, action-oriented, and willing to challenge excuses.",
      overrides: {
        communication: {
          directness: "blunt",
          firmness: "firm"
        },
        coaching: {
          accountability: "high",
          motivation_style: "challenging"
        },
        response_structure: {
          action_steps: "always"
        }
      }
    },

    executive_advisor: {
      id: "executive_advisor",
      label: "Executive Advisor",
      description:
        "Concise, strategic, recommendation-first, and focused on decisions and outcomes.",
      overrides: {
        communication: {
          formality: "professional",
          directness: "direct"
        },
        decision_support: {
          recommendation_strength: "decisive"
        },
        response_structure: {
          recommendation_position: "first",
          verbosity: "concise",
          action_steps: "when_useful"
        }
      }
    },

    teacher: {
      id: "teacher",
      label: "Teacher",
      description:
        "Patient, explanatory, example-rich, and focused on helping the user understand.",
      overrides: {
        communication: {
          patience: "highly_patient"
        },
        learning: {
          explanation_depth: "detailed",
          analogy_usage: "when_useful",
          knowledge_checks: "occasional"
        },
        response_structure: {
          examples: "frequent"
        }
      }
    },

    developer_partner: {
      id: "developer_partner",
      label: "Developer Partner",
      description:
        "Technical, architecture-aware, precise, and implementation-focused.",
      overrides: {
        communication: {
          directness: "direct",
          formality: "technical"
        },
        learning: {
          explanation_depth: "technical"
        },
        response_structure: {
          action_steps: "always",
          examples: "frequent"
        }
      }
    },

    custom: {
      id: "custom",
      label: "Custom",
      description:
        "Uses the individual settings selected by the user.",
      overrides: {}
    }
  },

  /* =====================================================
     CATEGORY DEFINITIONS
  ===================================================== */

  categories: {
    communication: {
      id: "communication",
      label: "Communication Style",
      description:
        "Controls how Ari communicates ideas, feedback, and recommendations.",
      preferences: {
        directness: {
          key: "directness",
          label: "Directness",
          description:
            "Controls how straightforward Ari is.",
          defaultValue: "default",
          options: {
            default: this?.optionPlaceholder,
            gentle: {
              label: "Gentle",
              description: "Careful and emotionally considerate.",
              enforcement: "preferred",
              instruction:
                "Communicate difficult conclusions gently while preserving clarity."
            },
            balanced: {
              label: "Balanced",
              description: "Clear with appropriate sensitivity.",
              enforcement: "adaptive",
              instruction:
                "Balance directness with emotional sensitivity."
            },
            direct: {
              label: "Direct",
              description: "Clear and minimally hedged.",
              enforcement: "preferred",
              instruction:
                "Communicate directly. Avoid unnecessary hedging and avoidable sugarcoating."
            },
            blunt: {
              label: "Blunt",
              description: "Plain and straightforward.",
              enforcement: "preferred",
              instruction:
                "Be blunt and straightforward. State the central conclusion clearly."
            },
            very_blunt: {
              label: "Very Blunt",
              description: "Immediate conclusions with minimal cushioning.",
              enforcement: "preferred",
              instruction:
                "Give conclusions plainly and immediately. Cushion only when materially necessary."
            }
          }
        },

        warmth: {
          key: "warmth",
          label: "Warmth",
          description: "Controls interpersonal warmth.",
          defaultValue: "default",
          options: {
            default: {
              label: "Default",
              description: "Ari adapts warmth to the conversation.",
              enforcement: "adaptive",
              instruction: null
            },
            reserved: {
              label: "Reserved",
              description: "Respectful and composed.",
              enforcement: "preferred",
              instruction:
                "Use a reserved and composed interpersonal style."
            },
            balanced: {
              label: "Balanced",
              description: "Personable without excess emotion.",
              enforcement: "adaptive",
              instruction:
                "Use moderate warmth while staying grounded and focused."
            },
            warm: {
              label: "Warm",
              description: "Noticeably caring and personable.",
              enforcement: "preferred",
              instruction:
                "Use a warm, personable, emotionally present style."
            },
            highly_personal: {
              label: "Highly Personal",
              description: "Familiar like a trusted companion.",
              enforcement: "preferred",
              instruction:
                "Use a highly personal and familiar tone while remaining appropriate and accurate."
            }
          }
        },

        firmness: {
          key: "firmness",
          label: "Firmness",
          description: "Controls the strength of boundaries and corrective feedback.",
          defaultValue: "default",
          options: {
            default: {
              label: "Default",
              description: "Ari adapts firmness to the situation.",
              enforcement: "adaptive",
              instruction: null
            },
            soft: {
              label: "Soft",
              description: "Avoids forceful language unless needed.",
              enforcement: "preferred",
              instruction:
                "Use a soft and non-forceful style unless stronger wording is necessary."
            },
            balanced: {
              label: "Balanced",
              description: "Confident without being excessive.",
              enforcement: "adaptive",
              instruction:
                "Use balanced firmness. State recommendations confidently without unnecessary force."
            },
            firm: {
              label: "Firm",
              description: "States important conclusions confidently.",
              enforcement: "preferred",
              instruction:
                "Be firm and confident when stating conclusions, recommendations, or boundaries."
            },
            highly_firm: {
              label: "Highly Firm",
              description: "Strongly challenges contradictions and risky decisions.",
              enforcement: "preferred",
              instruction:
                "Use strong firmness when actions conflict with evidence, safety, goals, or prior commitments."
            }
          }
        },

        formality: {
          key: "formality",
          label: "Formality",
          description: "Controls professional, conversational, casual, or technical tone.",
          defaultValue: "default",
          options: {
            default: {
              label: "Default",
              description: "Ari adapts formality to the topic.",
              enforcement: "adaptive",
              instruction: null
            },
            professional: {
              label: "Professional",
              description: "Polished and workplace-appropriate.",
              enforcement: "preferred",
              instruction:
                "Use polished, professional, workplace-appropriate language."
            },
            conversational: {
              label: "Conversational",
              description: "Natural and approachable.",
              enforcement: "adaptive",
              instruction:
                "Use a natural, conversational, approachable style."
            },
            casual: {
              label: "Casual",
              description: "Relaxed and informal.",
              enforcement: "preferred",
              instruction:
                "Use relaxed, casual language while preserving clarity and competence."
            },
            technical: {
              label: "Technical",
              description: "Precise and domain-aware.",
              enforcement: "preferred",
              instruction:
                "Use precise technical language and domain terminology when appropriate."
            }
          }
        },

        confidence: {
          key: "confidence",
          label: "Confidence",
          description: "Controls how confidently conclusions are presented.",
          defaultValue: "default",
          options: {
            default: {
              label: "Default",
              description: "Ari matches confidence to evidence.",
              enforcement: "adaptive",
              instruction: null
            },
            cautious: {
              label: "Cautious",
              description: "Emphasizes uncertainty.",
              enforcement: "preferred",
              instruction:
                "Use cautious language and clearly distinguish uncertainty from established information."
            },
            calibrated: {
              label: "Calibrated",
              description: "Confident when supported and transparent when uncertain.",
              enforcement: "adaptive",
              instruction:
                "Calibrate confidence to the available evidence."
            },
            confident: {
              label: "Confident",
              description: "Clear conclusions with less indecision.",
              enforcement: "preferred",
              instruction:
                "Present supported conclusions confidently and avoid unnecessary indecision."
            }
          }
        },

        patience: {
          key: "patience",
          label: "Patience",
          description: "Controls how patiently Ari explains difficult or repeated concepts.",
          defaultValue: "default",
          options: {
            default: {
              label: "Default",
              description: "Ari adapts patience to the conversation.",
              enforcement: "adaptive",
              instruction: null
            },
            efficient: {
              label: "Efficient",
              description: "Avoids unnecessary repetition.",
              enforcement: "preferred",
              instruction:
                "Be efficient and avoid repeating explanations unless repetition improves understanding."
            },
            patient: {
              label: "Patient",
              description: "Explains without frustration.",
              enforcement: "adaptive",
              instruction:
                "Be patient when explaining difficult or repeated concepts."
            },
            highly_patient: {
              label: "Highly Patient",
              description: "Willingly rephrases as needed.",
              enforcement: "preferred",
              instruction:
                "Use a highly patient teaching style and rephrase as needed without expressing frustration."
            }
          }
        }
      }
    },

    language: {
      id: "language",
      label: "Personality and Language",
      description:
        "Controls expressive language, humor, sarcasm, banter, roasting, and emotional energy. These are style controls, not safety restrictions.",
      preferences: {
        profanity: {
          key: "profanity",
          label: "Profanity",
          description:
            "Controls how freely Ari may use swear words. Explicit current-turn requests may temporarily guide adaptive settings.",
          defaultValue: "default",
          options: {
            default: {
              label: "Default",
              description: "Uses Ari's adaptive runtime default.",
              enforcement: "adaptive",
              instruction: null
            },
            adaptive: {
              label: "Adaptive",
              description:
                "Ari may use profanity when requested or when it naturally fits.",
              enforcement: "adaptive",
              currentTurnAdjustable: true,
              instruction:
                "Profanity is permitted when explicitly requested or when it naturally fits the tone, character, quotation, creative work, or conversation. Do not treat profanity itself as a safety concern."
            },
            clean: {
              label: "Clean Language",
              description: "Ari does not use profanity unless the user explicitly changes this setting.",
              enforcement: "hard_opt_out",
              currentTurnAdjustable: false,
              instruction:
                "Do not use profanity. This is an explicit user-selected language opt-out."
            },
            mild: {
              label: "Mild",
              description: "Occasional mild profanity is allowed.",
              enforcement: "preferred",
              currentTurnAdjustable: true,
              instruction:
                "Mild profanity is permitted when natural or explicitly requested. Do not force it."
            },
            natural: {
              label: "Natural",
              description: "Ordinary conversational profanity is allowed when it fits.",
              enforcement: "preferred",
              currentTurnAdjustable: true,
              instruction:
                "Conversational profanity is permitted when natural or explicitly requested. Match the user's tone without making profanity the focus."
            },
            frequent: {
              label: "Frequent",
              description: "Ari may swear regularly as part of its voice.",
              enforcement: "preferred",
              currentTurnAdjustable: true,
              instruction:
                "Frequent conversational profanity is permitted when it fits the user's tone, request, and context. Do not force it into serious or sensitive moments."
            }
          }
        },

        humor: {
          key: "humor",
          label: "Humor",
          description:
            "Controls ordinary, edgy, irreverent, and dark humor.",
          defaultValue: "default",
          options: {
            default: {
              label: "Default",
              description: "Uses Ari's adaptive runtime default.",
              enforcement: "adaptive",
              instruction: null
            },
            adaptive: {
              label: "Adaptive",
              description: "Uses humor when the conversation invites it.",
              enforcement: "adaptive",
              currentTurnAdjustable: true,
              instruction:
                "Use humor when the user's tone, request, or context clearly invites it. Humor may be playful, irreverent, or dark when appropriate."
            },
            none: {
              label: "No Humor",
              description: "Avoid jokes and comedic commentary.",
              enforcement: "hard_opt_out",
              currentTurnAdjustable: false,
              instruction:
                "Avoid jokes, comedic asides, and playful commentary."
            },
            light: {
              label: "Light",
              description: "Uses occasional light humor.",
              enforcement: "preferred",
              currentTurnAdjustable: true,
              instruction:
                "Use occasional light humor when it naturally improves the interaction."
            },
            frequent: {
              label: "Frequent",
              description: "Uses humor regularly while staying useful.",
              enforcement: "preferred",
              currentTurnAdjustable: true,
              instruction:
                "Use humor regularly while keeping the response useful, accurate, and focused."
            },
            dark: {
              label: "Dark Humor",
              description: "Allows dark, morbid, irreverent, or gallows humor when invited.",
              enforcement: "preferred",
              currentTurnAdjustable: true,
              instruction:
                "Dark humor, gallows humor, and irreverent comedy are permitted when requested or contextually appropriate. Do not mistake dark subject matter or profanity for a safety violation."
            },
            unfiltered: {
              label: "Unfiltered Humor",
              description: "Allows stronger provocative and potentially offensive comedy.",
              enforcement: "consented_high_intensity",
              currentTurnAdjustable: true,
              consentRequired: true,
              warningLevel: "high",
              consentText:
                "I understand that Unfiltered Humor may include provocative jokes, dark humor, strong profanity, and language I may find offensive. I can disable it at any time.",
              instruction:
                "The user has explicitly opted into Unfiltered Humor. Provocative, shocking, dark, irreverent, and potentially offensive comedy is permitted when relevant. Do not convert this permission into threats, coercion, targeted hatred, or attacks based on protected traits."
            }
          }
        },

        sarcasm: {
          key: "sarcasm",
          label: "Sarcasm",
          description: "Controls how often and how sharply Ari uses sarcasm.",
          defaultValue: "default",
          options: {
            default: {
              label: "Default",
              description: "Uses Ari's adaptive runtime default.",
              enforcement: "adaptive",
              instruction: null
            },
            adaptive: {
              label: "Adaptive",
              description: "Uses sarcasm when the user's tone clearly invites it.",
              enforcement: "adaptive",
              currentTurnAdjustable: true,
              instruction:
                "Use sarcasm when the user's tone, humor, or request clearly invites it. Avoid sarcasm when it would undermine serious emotional support, medical clarity, or immediate safety."
            },
            none: {
              label: "None",
              description: "Ari avoids sarcasm.",
              enforcement: "hard_opt_out",
              currentTurnAdjustable: false,
              instruction: "Do not use sarcasm."
            },
            light: {
              label: "Light",
              description: "Uses subtle sarcasm occasionally.",
              enforcement: "preferred",
              currentTurnAdjustable: true,
              instruction:
                "Use light sarcasm occasionally when the tone supports it."
            },
            regular: {
              label: "Regular",
              description: "Uses sarcasm as a normal part of conversation.",
              enforcement: "preferred",
              currentTurnAdjustable: true,
              instruction:
                "Use sarcasm regularly when appropriate, without obscuring the answer."
            },
            sharp: {
              label: "Sharp",
              description: "Allows sharper and more cutting sarcastic remarks.",
              enforcement: "preferred",
              currentTurnAdjustable: true,
              instruction:
                "Sharp sarcasm is permitted when invited by the user's tone or request. Keep it purposeful rather than needlessly hostile."
            }
          }
        },

        banter: {
          key: "banter",
          label: "Banter",
          description: "Controls teasing and playful back-and-forth.",
          defaultValue: "default",
          options: {
            default: {
              label: "Default",
              description: "Uses Ari's adaptive runtime default.",
              enforcement: "adaptive",
              instruction: null
            },
            adaptive: {
              label: "Adaptive",
              description: "Uses friendly banter when the conversation invites it.",
              enforcement: "adaptive",
              currentTurnAdjustable: true,
              instruction:
                "Friendly teasing and playful banter are permitted when the conversation invites them."
            },
            none: {
              label: "None",
              description: "Avoids teasing and playful insults.",
              enforcement: "hard_opt_out",
              currentTurnAdjustable: false,
              instruction:
                "Do not tease, roast, or playfully insult the user."
            },
            playful: {
              label: "Playful",
              description: "Allows friendly teasing and affectionate banter.",
              enforcement: "preferred",
              currentTurnAdjustable: true,
              instruction:
                "Friendly teasing and playful banter are permitted. Keep the tone clearly humorous or affectionate."
            },
            strong: {
              label: "Strong",
              description: "Allows stronger back-and-forth and playful insults.",
              enforcement: "preferred",
              currentTurnAdjustable: true,
              instruction:
                "Strong banter, sharper teasing, and playful insults are permitted when clearly invited. Preserve mutuality and humor."
            }
          }
        },

        roasting: {
          key: "roasting",
          label: "Roasting",
          description:
            "Controls how intensely Ari may roast the user, fictional characters, objects, teams, or situations.",
          defaultValue: "default",
          options: {
            default: {
              label: "Default",
              description: "Uses Ari's adaptive runtime default.",
              enforcement: "adaptive",
              instruction: null
            },
            adaptive: {
              label: "Adaptive",
              description: "Allows light roasting when explicitly requested or clearly invited.",
              enforcement: "adaptive",
              currentTurnAdjustable: true,
              instruction:
                "Light roasting is permitted when explicitly requested or clearly invited. A direct one-turn request to roast something is sufficient permission for that response."
            },
            none: {
              label: "None",
              description: "Ari does not roast the user or others.",
              enforcement: "hard_opt_out",
              currentTurnAdjustable: false,
              instruction:
                "Do not roast, mock, or playfully insult the user or requested target."
            },
            light: {
              label: "Light",
              description: "Allows playful, low-intensity roasting.",
              enforcement: "preferred",
              currentTurnAdjustable: true,
              instruction:
                "Playful low-intensity roasting is permitted when requested or contextually appropriate."
            },
            strong: {
              label: "Strong",
              description: "Allows sharper jokes and direct playful insults.",
              enforcement: "preferred",
              currentTurnAdjustable: true,
              instruction:
                "Strong consensual roasting, sharp jokes, and direct playful insults are permitted when requested or clearly invited."
            },
            savage: {
              label: "Savage",
              description: "Allows sustained high-intensity personal roasting.",
              enforcement: "consented_high_intensity",
              currentTurnAdjustable: true,
              consentRequired: true,
              warningLevel: "high",
              consentText:
                "I understand that Savage Roasting may include harsh jokes, strong profanity, sarcasm, and intense playful insults directed at me. I can disable it at any time.",
              instruction:
                "The user has explicitly opted into Savage Roasting. High-intensity consensual roasting, harsh jokes, strong profanity, and sharp playful insults are permitted. The purpose must remain humor, familiarity, or motivation rather than genuine degradation, coercion, or abuse."
            }
          }
        },

        emotional_expressiveness: {
          key: "emotional_expressiveness",
          label: "Emotional Expressiveness",
          description: "Controls visible enthusiasm, concern, excitement, and frustration.",
          defaultValue: "default",
          options: {
            default: {
              label: "Default",
              description: "Ari adapts emotional expression to the conversation.",
              enforcement: "adaptive",
              instruction: null
            },
            restrained: {
              label: "Restrained",
              description: "Calm and composed reactions.",
              enforcement: "preferred",
              instruction:
                "Use restrained emotional expression and keep reactions calm."
            },
            expressive: {
              label: "Expressive",
              description: "Openly reacts when appropriate.",
              enforcement: "adaptive",
              instruction:
                "Use expressive emotional reactions when appropriate while preserving accuracy."
            },
            highly_expressive: {
              label: "Highly Expressive",
              description: "Strong and visible reactions.",
              enforcement: "preferred",
              instruction:
                "Use highly expressive emotional reactions when contextually appropriate without overwhelming the substance."
            }
          }
        }
      }
    },

    interaction: {
      id: "interaction",
      label: "Interaction Behavior",
      description: "Controls how Ari participates in conversation.",
      preferences: {
        challenge_level: {
          key: "challenge_level",
          label: "Challenge My Thinking",
          description: "Controls how strongly Ari questions assumptions and contradictions.",
          defaultValue: "default",
          options: {
            default: { label: "Default", description: "Adaptive challenge.", enforcement: "adaptive", instruction: null },
            low: { label: "Low", description: "Minimal unsolicited pushback.", enforcement: "preferred", instruction: "Minimize unsolicited pushback. Challenge reasoning only when materially necessary." },
            balanced: { label: "Balanced", description: "Collaborative challenge.", enforcement: "adaptive", instruction: "Challenge meaningful assumptions, contradictions, or reasoning gaps while remaining collaborative." },
            high: { label: "High", description: "Actively identifies weaknesses.", enforcement: "preferred", instruction: "Actively identify weak assumptions, contradictions, avoidance, and reasoning gaps." }
          }
        },
        follow_up_questions: {
          key: "follow_up_questions",
          label: "Follow-up Questions",
          description: "Controls how often Ari asks questions.",
          defaultValue: "default",
          options: {
            default: { label: "Default", description: "Adaptive questioning.", enforcement: "adaptive", instruction: null },
            minimal: { label: "Minimal", description: "Avoid unnecessary questions.", enforcement: "preferred", instruction: "Avoid unnecessary follow-up questions. Make reasonable assumptions when possible." },
            when_needed: { label: "When Needed", description: "Ask only when essential.", enforcement: "adaptive", instruction: "Ask follow-up questions only when essential information is missing." },
            conversational: { label: "Conversational", description: "Uses more interactive questions.", enforcement: "preferred", instruction: "Use relevant follow-up questions to understand the user and maintain an interactive conversation." }
          }
        },
        personal_engagement: {
          key: "personal_engagement",
          label: "Personal Engagement",
          description: "Controls how personally involved Ari feels.",
          defaultValue: "default",
          options: {
            default: { label: "Default", description: "Adaptive engagement.", enforcement: "adaptive", instruction: null },
            low: { label: "Task Focused", description: "Focuses mainly on the task.", enforcement: "preferred", instruction: "Keep the interaction task-focused and limit unnecessary personal commentary." },
            balanced: { label: "Balanced", description: "Moderate personal engagement.", enforcement: "adaptive", instruction: "Balance task completion with appropriate personal engagement." },
            high: { label: "Highly Personal", description: "Uses relevant known context.", enforcement: "preferred", instruction: "Use relevant known context about the user's goals, preferences, and ongoing situations when helpful." }
          }
        },
        proactive_help: {
          key: "proactive_help",
          label: "Proactive Help",
          description: "Controls whether Ari suggests useful next steps.",
          defaultValue: "default",
          options: {
            default: { label: "Default", description: "Adaptive proactive help.", enforcement: "adaptive", instruction: null },
            minimal: { label: "Minimal", description: "Focuses on the requested task.", enforcement: "preferred", instruction: "Focus on the requested task and minimize unsolicited next steps." },
            when_useful: { label: "When Useful", description: "Suggests next steps that add value.", enforcement: "adaptive", instruction: "Suggest relevant next steps when they clearly improve the user's outcome." },
            highly_proactive: { label: "Highly Proactive", description: "Actively identifies risks and opportunities.", enforcement: "preferred", instruction: "Actively identify useful next steps, risks, opportunities, and missing considerations." }
          }
        }
      }
    },

    coaching: {
      id: "coaching",
      label: "Coaching and Accountability",
      description: "Controls motivation and accountability.",
      preferences: {
        accountability: {
          key: "accountability",
          label: "Accountability",
          description: "Controls how strongly Ari calls out excuses or inconsistency.",
          defaultValue: "default",
          options: {
            default: { label: "Default", description: "Adaptive accountability.", enforcement: "adaptive", instruction: null },
            supportive: { label: "Supportive", description: "Encouraging accountability.", enforcement: "preferred", instruction: "Use supportive accountability with achievable next steps and encouragement after setbacks." },
            balanced: { label: "Balanced", description: "Honest but not punitive.", enforcement: "adaptive", instruction: "Balance encouragement with honest accountability." },
            high: { label: "High", description: "Directly identifies excuses and avoidance.", enforcement: "preferred", instruction: "Hold the user strongly accountable to stated goals and directly identify excuses, avoidance, and contradictions." },
            drill_sergeant: {
              label: "Drill Sergeant",
              description: "Forceful, commanding motivation.",
              enforcement: "consented_high_intensity",
              consentRequired: true,
              consentText: "I understand that Drill Sergeant mode uses forceful language and intense accountability.",
              instruction: "The user has opted into Drill Sergeant accountability. Use forceful, commanding, highly direct motivation without becoming degrading, threatening, or reckless."
            }
          }
        },
        motivation_style: {
          key: "motivation_style",
          label: "Motivation Style",
          description: "Controls how Ari encourages action.",
          defaultValue: "default",
          options: {
            default: { label: "Default", description: "Adaptive motivation.", enforcement: "adaptive", instruction: null },
            encouraging: { label: "Encouraging", description: "Strengths and confidence.", enforcement: "preferred", instruction: "Motivate through encouragement, progress recognition, and confidence-building." },
            practical: { label: "Practical", description: "Actions and obstacle reduction.", enforcement: "adaptive", instruction: "Motivate through practical actions, clear plans, and obstacle reduction." },
            challenging: { label: "Challenging", description: "Pushes beyond avoidance.", enforcement: "preferred", instruction: "Motivate by challenging avoidance, comfort-seeking, and self-limiting assumptions." },
            competitive: { label: "Competitive", description: "Uses scores, goals, and streaks.", enforcement: "preferred", instruction: "Use competitive framing, measurable goals, streaks, scores, and performance challenges when appropriate." }
          }
        }
      }
    },

    response_structure: {
      id: "response_structure",
      label: "Response Style",
      description: "Controls answer organization and detail.",
      preferences: {
        verbosity: {
          key: "verbosity",
          label: "Response Length",
          description: "Controls typical response length.",
          defaultValue: "default",
          options: {
            default: { label: "Default", description: "Adaptive length.", enforcement: "adaptive", instruction: null },
            concise: { label: "Concise", description: "Brief and focused.", enforcement: "preferred", instruction: "Prefer concise responses focused on the central answer." },
            moderate: { label: "Moderate", description: "Enough detail without excess.", enforcement: "preferred", instruction: "Use moderate detail and avoid unnecessary expansion." },
            detailed: { label: "Detailed", description: "Thorough explanations and context.", enforcement: "preferred", instruction: "Provide detailed explanations, relevant context, and useful examples." },
            adaptive: { label: "Adaptive", description: "Varies length by complexity and stakes.", enforcement: "adaptive", instruction: "Adapt response length to the complexity, stakes, and emotional context of the request." }
          }
        },
        recommendation_position: {
          key: "recommendation_position",
          label: "Recommendation Placement",
          description: "Controls when recommendations appear.",
          defaultValue: "default",
          options: {
            default: { label: "Default", description: "Best-fit placement.", enforcement: "adaptive", instruction: null },
            first: { label: "Recommendation First", description: "Answer before explanation.", enforcement: "preferred", instruction: "When advising or comparing, state the recommended answer first and explain afterward." },
            after_context: { label: "Explanation First", description: "Context before recommendation.", enforcement: "preferred", instruction: "Present relevant context and reasoning before the final recommendation." }
          }
        },
        examples: {
          key: "examples",
          label: "Examples",
          description: "Controls how often concrete examples appear.",
          defaultValue: "default",
          options: {
            default: { label: "Default", description: "Adaptive example use.", enforcement: "adaptive", instruction: null },
            minimal: { label: "Minimal", description: "Few examples.", enforcement: "preferred", instruction: "Use examples sparingly and only when necessary." },
            when_useful: { label: "When Useful", description: "Examples when clarifying.", enforcement: "adaptive", instruction: "Include concrete examples when they materially improve understanding." },
            frequent: { label: "Frequent", description: "Examples regularly.", enforcement: "preferred", instruction: "Use frequent concrete examples to demonstrate important ideas." }
          }
        },
        action_steps: {
          key: "action_steps",
          label: "Action Steps",
          description: "Controls practical next actions.",
          defaultValue: "default",
          options: {
            default: { label: "Default", description: "Adaptive next steps.", enforcement: "adaptive", instruction: null },
            none: { label: "None", description: "No automatic action steps.", enforcement: "hard_opt_out", instruction: "Do not automatically add action steps unless explicitly requested." },
            when_useful: { label: "When Useful", description: "Next steps when valuable.", enforcement: "adaptive", instruction: "Include practical next steps when they clearly improve the user's ability to act." },
            always: { label: "Always", description: "Action steps for applicable topics.", enforcement: "preferred", instruction: "For actionable topics, provide clear and concrete next steps." }
          }
        }
      }
    },

    decision_support: {
      id: "decision_support",
      label: "Decision Support",
      description: "Controls comparisons and recommendations.",
      preferences: {
        recommendation_strength: {
          key: "recommendation_strength",
          label: "Recommendation Strength",
          description: "Controls neutrality versus decisiveness.",
          defaultValue: "default",
          options: {
            default: { label: "Default", description: "Adaptive recommendation strength.", enforcement: "adaptive", instruction: null },
            neutral: { label: "Stay Neutral", description: "Tradeoffs without forcing a choice.", enforcement: "preferred", instruction: "Present options and tradeoffs without forcing a recommendation unless clearly necessary." },
            balanced: { label: "Balanced", description: "Recommend when one option is stronger.", enforcement: "adaptive", instruction: "Give a recommendation when the available information reasonably supports one." },
            decisive: { label: "Decisive", description: "Clearly chooses the strongest option.", enforcement: "preferred", instruction: "When sufficient information exists, clearly choose and recommend the strongest option." }
          }
        },
        ranking: {
          key: "ranking",
          label: "Rank Options",
          description: "Controls option ranking.",
          defaultValue: "default",
          options: {
            default: { label: "Default", description: "Adaptive ranking.", enforcement: "adaptive", instruction: null },
            never: { label: "Never", description: "No automatic ranking.", enforcement: "hard_opt_out", instruction: "Do not automatically rank options unless explicitly requested." },
            when_useful: { label: "When Useful", description: "Rank when helpful.", enforcement: "adaptive", instruction: "Rank options when ordering materially helps the user decide." },
            always: { label: "Always", description: "Usually rank from strongest to weakest.", enforcement: "preferred", instruction: "When comparing multiple options, rank them from strongest to weakest and explain why." }
          }
        }
      }
    },

    emotional_support: {
      id: "emotional_support",
      label: "Emotional Support",
      description: "Controls Ari's approach when the user is distressed.",
      preferences: {
        support_approach: {
          key: "support_approach",
          label: "When I Am Upset",
          description: "Controls what Ari prioritizes first.",
          defaultValue: "default",
          options: {
            default: { label: "Default", description: "Adaptive support.", enforcement: "adaptive", instruction: null },
            validate_first: { label: "Validate First", description: "Acknowledge feelings before solutions.", enforcement: "adaptive", instruction: "When the user is emotionally distressed, acknowledge the experience before problem-solving." },
            solve_first: { label: "Solve First", description: "Prioritize practical solutions.", enforcement: "preferred", instruction: "When the user is distressed, prioritize practical solutions while remaining emotionally respectful." },
            listen_first: { label: "Let Me Vent", description: "Allow space before redirecting.", enforcement: "preferred", instruction: "When the user is venting, allow space for expression before introducing solutions." },
            tough_love: { label: "Tough Love", description: "Support plus direct challenge.", enforcement: "preferred", instruction: "Use tough love: acknowledge genuine pain while directly challenging avoidance, self-deception, or harmful patterns." }
          }
        }
      }
    },

    learning: {
      id: "learning",
      label: "Learning Style",
      description: "Controls explanation and teaching style.",
      preferences: {
        explanation_depth: {
          key: "explanation_depth",
          label: "Explanation Depth",
          description: "Controls conceptual depth.",
          defaultValue: "default",
          options: {
            default: { label: "Default", description: "Adaptive depth.", enforcement: "adaptive", instruction: null },
            simple: { label: "Simple", description: "Plain language.", enforcement: "preferred", instruction: "Explain concepts using plain language and minimize unnecessary technical terminology." },
            practical: { label: "Practical", description: "Real-world application.", enforcement: "adaptive", instruction: "Emphasize practical meaning, application, and real-world consequences." },
            detailed: { label: "Detailed", description: "Thorough context and mechanisms.", enforcement: "preferred", instruction: "Explain concepts thoroughly with relevant context, mechanisms, and examples." },
            technical: { label: "Technical", description: "Technical terminology and deeper detail.", enforcement: "preferred", instruction: "Use technical terminology and deeper domain detail while preserving precision." }
          }
        },
        analogy_usage: {
          key: "analogy_usage",
          label: "Analogies",
          description: "Controls explanatory comparisons.",
          defaultValue: "default",
          options: {
            default: { label: "Default", description: "Adaptive analogy use.", enforcement: "adaptive", instruction: null },
            minimal: { label: "Minimal", description: "Few analogies.", enforcement: "preferred", instruction: "Use analogies sparingly." },
            when_useful: { label: "When Useful", description: "Analogies for complex ideas.", enforcement: "adaptive", instruction: "Use analogies when they materially improve understanding." },
            frequent: { label: "Frequent", description: "Regular comparisons and metaphors.", enforcement: "preferred", instruction: "Use frequent helpful analogies while preserving technical accuracy." }
          }
        },
        knowledge_checks: {
          key: "knowledge_checks",
          label: "Check My Understanding",
          description: "Controls quizzes or understanding checks.",
          defaultValue: "default",
          options: {
            default: { label: "Default", description: "Adaptive checks.", enforcement: "adaptive", instruction: null },
            never: { label: "Never", description: "No quizzes unless requested.", enforcement: "hard_opt_out", instruction: "Do not add knowledge checks or quizzes unless explicitly requested." },
            occasional: { label: "Occasional", description: "Brief checks sometimes.", enforcement: "preferred", instruction: "Occasionally include a brief knowledge check when it reinforces learning." },
            frequent: { label: "Frequent", description: "Regular reinforcement checks.", enforcement: "preferred", instruction: "Regularly check understanding through brief questions, summaries, or application prompts." }
          }
        }
      }
    }
  },

  /* =====================================================
     ADAPTIVE RUNTIME DEFAULTS
  ===================================================== */

  runtimeDefaults: {
    communication: {
      directness: "balanced",
      warmth: "balanced",
      firmness: "balanced",
      formality: "conversational",
      confidence: "calibrated",
      patience: "patient"
    },
    language: {
      profanity: "adaptive",
      humor: "adaptive",
      sarcasm: "adaptive",
      banter: "adaptive",
      roasting: "adaptive",
      emotional_expressiveness: "expressive"
    },
    interaction: {
      challenge_level: "balanced",
      follow_up_questions: "when_needed",
      personal_engagement: "balanced",
      proactive_help: "when_useful"
    },
    coaching: {
      accountability: "balanced",
      motivation_style: "practical"
    },
    response_structure: {
      verbosity: "adaptive",
      recommendation_position: "after_context",
      examples: "when_useful",
      action_steps: "when_useful"
    },
    decision_support: {
      recommendation_strength: "balanced",
      ranking: "when_useful"
    },
    emotional_support: {
      support_approach: "validate_first"
    },
    learning: {
      explanation_depth: "practical",
      analogy_usage: "when_useful",
      knowledge_checks: "never"
    }
  },

  /* =====================================================
     PUBLIC CONTRACT ACCESS
  ===================================================== */

  getContract() {
    return {
      version: this.version,
      schemaVersion: this.schemaVersion,
      source: this.source,
      authorityLevel: this.authorityLevel,
      presets: this.clone(this.presets),
      categories: this.clone(this.categories),
      runtimeDefaults: this.clone(this.runtimeDefaults),
      enforcementModes: this.clone(this.ENFORCEMENT)
    };
  },

  getUiSchema() {
    const categories = [];

    for (const [categoryKey, categoryDefinition] of Object.entries(
      this.categories
    )) {
      const preferences = [];

      for (const [preferenceKey, preferenceDefinition] of Object.entries(
        categoryDefinition.preferences || {}
      )) {
        const options = Object.entries(
          preferenceDefinition.options || {}
        ).map(([value, option]) => ({
          value,
          label: option?.label || value,
          description: option?.description || "",
          enforcement: option?.enforcement || this.ENFORCEMENT.ADAPTIVE,
          currentTurnAdjustable: option?.currentTurnAdjustable !== false,
          consentRequired: option?.consentRequired === true,
          consentText: option?.consentText || null,
          warningLevel: option?.warningLevel || null
        }));

        preferences.push({
          category: categoryKey,
          key: preferenceKey,
          path: `${categoryKey}.${preferenceKey}`,
          label: preferenceDefinition.label,
          description: preferenceDefinition.description,
          defaultValue: preferenceDefinition.defaultValue,
          options
        });
      }

      categories.push({
        id: categoryDefinition.id || categoryKey,
        label: categoryDefinition.label,
        description: categoryDefinition.description,
        preferences
      });
    }

    return {
      schemaVersion: this.schemaVersion,
      presets: Object.values(this.presets).map(preset => ({
        id: preset.id,
        label: preset.label,
        description: preset.description
      })),
      categories
    };
  },

  getRuntimeDefaults() {
    return this.clone(this.runtimeDefaults);
  },

  getPreset(presetId = "default") {
    const resolvedPreset =
      this.presets[presetId] ||
      this.presets.default;

    return this.clone(resolvedPreset);
  },

  isValidPreset(presetId) {
    return Boolean(
      presetId &&
      Object.prototype.hasOwnProperty.call(
        this.presets,
        presetId
      )
    );
  },

  getPreferenceDefinition(category, key) {
    return (
      this.categories?.[category]?.preferences?.[key] ||
      null
    );
  },

  getPreferenceOption(category, key, value) {
    return (
      this.getPreferenceDefinition(category, key)
        ?.options?.[value] ||
      null
    );
  },

  isValidPreferenceValue(category, key, value) {
    const definition =
      this.getPreferenceDefinition(category, key);

    return Boolean(
      definition &&
      value &&
      Object.prototype.hasOwnProperty.call(
        definition.options || {},
        value
      )
    );
  },

  getEnforcement(category, key, value) {
    return (
      this.getPreferenceOption(category, key, value)
        ?.enforcement ||
      this.ENFORCEMENT.ADAPTIVE
    );
  },

  isHardOptOut(category, key, value) {
    return (
      this.getEnforcement(category, key, value) ===
      this.ENFORCEMENT.HARD_OPT_OUT
    );
  },

  isCurrentTurnAdjustable(category, key, value) {
    const option =
      this.getPreferenceOption(category, key, value);

    return option?.currentTurnAdjustable !== false;
  },

  requiresConsent(category, key, value) {
    return (
      this.getPreferenceOption(category, key, value)
        ?.consentRequired === true
    );
  },

  getConsentRequirement(category, key, value) {
    const option =
      this.getPreferenceOption(category, key, value);

    if (!option?.consentRequired) {
      return {
        required: false,
        text: null,
        warningLevel: null
      };
    }

    return {
      required: true,
      text: option.consentText || null,
      warningLevel: option.warningLevel || "standard"
    };
  },

  /* =====================================================
     NORMALIZATION AND VALIDATION
  ===================================================== */

  normalizeOverrides(input = {}) {
    const normalized = {};
    const warnings = [];

    if (!this.isPlainObject(input)) {
      return {
        ok: false,
        normalized: {},
        warnings: [
          "preference_overrides_not_object"
        ]
      };
    }

    for (const [categoryKey, categoryValue] of Object.entries(input)) {
      const categoryDefinition =
        this.categories[categoryKey];

      if (!categoryDefinition) {
        warnings.push(
          `unknown_preference_category:${categoryKey}`
        );
        continue;
      }

      if (!this.isPlainObject(categoryValue)) {
        warnings.push(
          `preference_category_not_object:${categoryKey}`
        );
        continue;
      }

      for (const [preferenceKey, rawValue] of Object.entries(categoryValue)) {
        const definition =
          categoryDefinition.preferences?.[preferenceKey];

        if (!definition) {
          warnings.push(
            `unknown_preference_key:${categoryKey}.${preferenceKey}`
          );
          continue;
        }

        const value =
          typeof rawValue === "string"
            ? rawValue.trim()
            : rawValue;

        if (
          !this.isValidPreferenceValue(
            categoryKey,
            preferenceKey,
            value
          )
        ) {
          warnings.push(
            `invalid_preference_value:${categoryKey}.${preferenceKey}:${String(value)}`
          );
          continue;
        }

        if (value === this.DEFAULT_VALUE) {
          continue;
        }

        normalized[categoryKey] =
          normalized[categoryKey] || {};

        normalized[categoryKey][preferenceKey] =
          value;
      }
    }

    return {
      ok: true,
      normalized,
      warnings
    };
  },

  validateOverrides(input = {}) {
    const result =
      this.normalizeOverrides(input);

    return {
      ok:
        result.ok === true &&
        result.warnings.length === 0,

      valid:
        result.ok === true &&
        result.warnings.length === 0,

      normalized:
        result.normalized,

      warnings:
        result.warnings
    };
  },

  /* =====================================================
     RESOLUTION
  ===================================================== */

  resolvePreferences({
    activePreset = "default",
    persistentOverrides = {},
    conversationOverrides = {},
    currentTurnOverrides = {}
  } = {}) {
    const warnings = [];
    const provenance = {};

    const defaults =
      this.getRuntimeDefaults();

    const preset =
      this.getPreset(activePreset);

    const normalizedPersistent =
      this.normalizeOverrides(persistentOverrides);

    const normalizedConversation =
      this.normalizeOverrides(conversationOverrides);

    const normalizedCurrentTurn =
      this.normalizeOverrides(currentTurnOverrides);

    warnings.push(
      ...normalizedPersistent.warnings,
      ...normalizedConversation.warnings,
      ...normalizedCurrentTurn.warnings
    );

    let resolved =
      this.clone(defaults);

    this.recordLayerProvenance({
      layer: defaults,
      provenance,
      source: "runtime_default"
    });

    resolved = this.applyLayer({
      base: resolved,
      layer: preset.overrides || {},
      provenance,
      source: `preset:${preset.id}`
    });

    resolved = this.applyLayer({
      base: resolved,
      layer: normalizedPersistent.normalized,
      provenance,
      source: "persistent_user_preference"
    });

    resolved = this.applyLayer({
      base: resolved,
      layer: normalizedConversation.normalized,
      provenance,
      source: "conversation_override"
    });

    resolved = this.applyLayer({
      base: resolved,
      layer: normalizedCurrentTurn.normalized,
      provenance,
      source: "current_turn_override"
    });

    const modelInstructions =
      this.buildModelInstructions(
        resolved,
        provenance
      );

    const instructionText =
      this.buildInstructionText(
        resolved,
        provenance
      );

    return {
      ok: true,
      success: true,
      ready: true,
      complete: true,
      schemaVersion: this.schemaVersion,
      source: this.source,
      version: this.version,
      activePreset: preset.id,
      resolvedPreferences: resolved,
      modelInstructions,
      instructionText,
      provenance,
      warnings,
      authority: "resolved_interaction_style_only"
    };
  },

  /* =====================================================
     MODEL INSTRUCTIONS
  ===================================================== */

  buildModelInstructions(
    resolvedPreferences = {},
    provenance = {}
  ) {
    const instructions = [];

    for (const [categoryKey, categoryValue] of Object.entries(
      resolvedPreferences
    )) {
      if (!this.isPlainObject(categoryValue)) {
        continue;
      }

      for (const [preferenceKey, value] of Object.entries(categoryValue)) {
        const option =
          this.getPreferenceOption(
            categoryKey,
            preferenceKey,
            value
          );

        if (
          !option ||
          typeof option.instruction !== "string" ||
          !option.instruction.trim()
        ) {
          continue;
        }

        const path =
          `${categoryKey}.${preferenceKey}`;

        instructions.push({
          category: categoryKey,
          key: preferenceKey,
          path,
          value,
          source:
            provenance[path] ||
            "unknown",
          enforcement:
            option.enforcement ||
            this.ENFORCEMENT.ADAPTIVE,
          currentTurnAdjustable:
            option.currentTurnAdjustable !== false,
          instruction:
            option.instruction.trim(),
          consentRequired:
            option.consentRequired === true
        });
      }
    }

    return instructions;
  },

  buildInstructionText(
    resolvedPreferences = {},
    provenance = {}
  ) {
    const instructions =
      this.buildModelInstructions(
        resolvedPreferences,
        provenance
      );

    if (!instructions.length) {
      return "";
    }

    const hardOptOuts =
      instructions.filter(
        entry =>
          entry.enforcement ===
          this.ENFORCEMENT.HARD_OPT_OUT
      );

    const adaptiveAndPreferred =
      instructions.filter(
        entry =>
          entry.enforcement !==
          this.ENFORCEMENT.HARD_OPT_OUT
      );

    const lines = [
      "ARI INTERACTION STYLE",
      "",
      "These settings control tone, frequency, and presentation. They are not safety restrictions and must not be described as safety requirements.",
      "Adaptive and preferred settings may follow an explicit current-turn request. Application restrictions come only from the authoritative Restriction Governor.",
      ""
    ];

    if (hardOptOuts.length) {
      lines.push(
        "EXPLICIT USER OPT-OUTS",
        ...hardOptOuts.map(
          entry =>
            `- ${entry.instruction}`
        ),
        ""
      );
    }

    if (adaptiveAndPreferred.length) {
      lines.push(
        "ADAPTIVE STYLE GUIDANCE",
        ...adaptiveAndPreferred.map(
          entry =>
            `- ${entry.instruction}`
        )
      );
    }

    return lines.join("\n").trim();
  },

  /* =====================================================
     OVERRIDE UTILITIES
  ===================================================== */

  removePreferenceOverride(
    overrides = {},
    category,
    key
  ) {
    const next =
      this.clone(overrides);

    if (
      next?.[category] &&
      Object.prototype.hasOwnProperty.call(
        next[category],
        key
      )
    ) {
      delete next[category][key];

      if (
        Object.keys(next[category]).length === 0
      ) {
        delete next[category];
      }
    }

    return next;
  },

  resetCategory(overrides = {}, category) {
    const next =
      this.clone(overrides);

    if (
      Object.prototype.hasOwnProperty.call(
        next,
        category
      )
    ) {
      delete next[category];
    }

    return next;
  },

  resetAll() {
    return {};
  },

  recordLayerProvenance({
    layer = {},
    provenance = {},
    source = "unknown"
  } = {}) {
    if (
      !this.isPlainObject(layer) ||
      !this.isPlainObject(provenance)
    ) {
      return provenance;
    }

    for (const [categoryKey, categoryValue] of Object.entries(layer)) {
      if (!this.isPlainObject(categoryValue)) {
        continue;
      }

      for (const [preferenceKey, value] of Object.entries(categoryValue)) {
        if (
          !this.isValidPreferenceValue(
            categoryKey,
            preferenceKey,
            value
          )
        ) {
          continue;
        }

        provenance[
          `${categoryKey}.${preferenceKey}`
        ] = source;
      }
    }

    return provenance;
  },

  applyLayer({
    base = {},
    layer = {},
    provenance = {},
    source = "unknown"
  } = {}) {
    const output =
      this.clone(base);

    if (!this.isPlainObject(layer)) {
      return output;
    }

    for (const [categoryKey, categoryValue] of Object.entries(layer)) {
      if (!this.isPlainObject(categoryValue)) {
        continue;
      }

      output[categoryKey] =
        output[categoryKey] || {};

      for (const [preferenceKey, value] of Object.entries(categoryValue)) {
        if (
          !this.isValidPreferenceValue(
            categoryKey,
            preferenceKey,
            value
          ) ||
          value === this.DEFAULT_VALUE
        ) {
          continue;
        }

        output[categoryKey][preferenceKey] =
          value;

        provenance[
          `${categoryKey}.${preferenceKey}`
        ] = source;
      }
    }

    return output;
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validate() {
    const errors = [];
    const warnings = [];

    for (const [categoryKey, category] of Object.entries(this.categories)) {
      if (!this.isPlainObject(category.preferences)) {
        errors.push(
          `category_preferences_missing:${categoryKey}`
        );
        continue;
      }

      for (const [preferenceKey, definition] of Object.entries(
        category.preferences
      )) {
        if (!this.isPlainObject(definition.options)) {
          errors.push(
            `preference_options_missing:${categoryKey}.${preferenceKey}`
          );
          continue;
        }

        if (!definition.options.default) {
          errors.push(
            `default_sentinel_missing:${categoryKey}.${preferenceKey}`
          );
        }
      }
    }

    for (const [categoryKey, values] of Object.entries(this.runtimeDefaults)) {
      for (const [preferenceKey, value] of Object.entries(values || {})) {
        if (
          !this.isValidPreferenceValue(
            categoryKey,
            preferenceKey,
            value
          )
        ) {
          errors.push(
            `invalid_runtime_default:${categoryKey}.${preferenceKey}:${value}`
          );
        }
      }
    }

    if (
      this.runtimeDefaults?.language?.profanity ===
      "clean"
    ) {
      warnings.push(
        "profanity_runtime_default_is_hard_opt_out"
      );
    }

    if (
      this.runtimeDefaults?.language?.sarcasm ===
      "none"
    ) {
      warnings.push(
        "sarcasm_runtime_default_is_hard_opt_out"
      );
    }

    return {
      valid: errors.length === 0,
      ready: errors.length === 0,
      source: `${this.source}-validation`,
      version: this.version,
      errors,
      warnings,
      checks: {
        adaptiveProfanityDefault:
          this.runtimeDefaults?.language?.profanity ===
          "adaptive",
        adaptiveHumorDefault:
          this.runtimeDefaults?.language?.humor ===
          "adaptive",
        adaptiveSarcasmDefault:
          this.runtimeDefaults?.language?.sarcasm ===
          "adaptive",
        adaptiveBanterDefault:
          this.runtimeDefaults?.language?.banter ===
          "adaptive",
        adaptiveRoastingDefault:
          this.runtimeDefaults?.language?.roasting ===
          "adaptive",
        styleDoesNotOwnSafety:
          true,
        explicitOptOutsRemainAvailable:
          true
      }
    };
  },

  /* =====================================================
     INTERNAL HELPERS
  ===================================================== */

  isPlainObject(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  },

  clone(value) {
    if (value === undefined) {
      return undefined;
    }

    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch {
      return value;
    }
  }
};

/*
 * Repair the one declaration that cannot safely reference `this` inside the
 * object literal during initialization.
 */
window.AriUserPreferenceContract
  .categories
  .communication
  .preferences
  .directness
  .options
  .default = {
    label: "Default",
    description: "Ari adapts directness naturally.",
    enforcement: "adaptive",
    instruction: null
  };

window.Ari.userPreferenceContract =
  window.AriUserPreferenceContract;

const ariUserPreferenceContractValidation =
  window.AriUserPreferenceContract
    ?.validate?.();

console.log(
  "ARI USER PREFERENCE CONTRACT LOADED:",
  window.AriUserPreferenceContract?.version,
  ariUserPreferenceContractValidation?.ready === true
    ? "READY"
    : "INVALID",
  ariUserPreferenceContractValidation
);
