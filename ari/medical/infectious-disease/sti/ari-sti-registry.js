// ari/medical/infectious-disease/sti/ari-sti-registry.js
// Purpose: Register STI knowledge for Ari Medical OS.
// V1.0.0 — STI Registry / UMKO Stable IDs / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.sti =
  window.Ari.medical.infectiousDisease.sti || {};

window.Ari.medical.infectiousDisease.sti.registry = {
  version: "1.0.0",

  entries() {
    return [
      {
        id: "chlamydia",
        umkoId: "STI-BACT-CHLAM-0001",
        versionId: "1.0",
        status: "active",

        name: "Chlamydia",
        aliases: ["chlamydia", "chlamydia trachomatis", "positive chlamydia"],

        category: "bacterial_sti",
        organism: "Chlamydia trachomatis",

        transmission: ["sexual contact", "vertical transmission"],
        commonSymptoms: [
          "often asymptomatic",
          "urethral discharge",
          "dysuria",
          "pelvic pain",
          "cervicitis",
          "testicular pain"
        ],

        syndromes: [
          "urethritis",
          "cervicitis",
          "pelvic inflammatory disease",
          "epididymitis",
          "proctitis"
        ],

        testing: [
          "NAAT",
          "urine NAAT",
          "vaginal swab NAAT",
          "cervical swab NAAT",
          "rectal swab NAAT when indicated",
          "pharyngeal swab NAAT when indicated"
        ],

        treatmentContext: [
          "treat confirmed infection",
          "consider empiric treatment when high suspicion or follow-up is uncertain"
        ],

        partnerManagement: [
          "partner notification",
          "partner evaluation and treatment",
          "avoid sex until treatment completed and symptoms resolved"
        ],

        retesting: [
          "retest approximately 3 months after treatment when appropriate"
        ],

        complications: [
          "pelvic inflammatory disease",
          "infertility",
          "ectopic pregnancy",
          "chronic pelvic pain",
          "epididymitis"
        ],

        pregnancyConsiderations: [
          "pregnancy changes treatment selection",
          "test-of-cure may be recommended in pregnancy"
        ],

        reportability: {
          potentiallyReportable: true,
          jurisdictionDependent: true,
          verifyLocalRequirements: true
        },

        infectionControl: {
          precautions: ["PRECAUTION-STANDARD"]
        },

        clinicalPearls: [
          "Chlamydia is commonly asymptomatic.",
          "NAAT is the usual preferred diagnostic approach.",
          "Coinfection with gonorrhea should be considered."
        ],

        reasoningHints: [
          "Urethral discharge or dysuria after sexual exposure should increase STI probability.",
          "Pelvic pain plus cervical motion tenderness raises concern for PID.",
          "Clarify anatomic exposure sites to choose appropriate specimens."
        ],

        decisionRules: [
          {
            id: "chlamydia_site_testing",
            priority: "high",
            when: ["sexual_exposure", "symptoms"],
            then: ["ask_anatomic_exposure_sites", "recommend_naat_testing_context"]
          }
        ],

        monitoring: [],
        relatedMedications: ["tetracycline_antibiotics", "macrolide_antibiotics"],
        relatedOrganisms: ["ORG-BACT-CHLAM-0001"],
        relatedKnowledge: ["urethritis", "cervicitis", "pid", "epididymitis"],

        followUpQuestions: [
          "What test was positive?",
          "Any discharge, burning with urination, pelvic pain, testicular pain, or rectal symptoms?",
          "Any pregnancy?",
          "Which exposure sites apply: genital, rectal, or oral?",
          "Have partners been notified or treated?"
        ],

        patientEducation: [
          "Many people have no symptoms.",
          "Partners may need testing and treatment.",
          "Avoid sex until treatment guidance is completed."
        ],

        references: ["CDC STI Treatment Guidelines"],
        notes: "Common bacterial STI. Ari should emphasize testing site, partner management, pregnancy context, and retesting."
      },

      {
        id: "gonorrhea",
        umkoId: "STI-BACT-GONO-0001",
        versionId: "1.0",
        status: "active",

        name: "Gonorrhea",
        aliases: ["gonorrhea", "gonorrhoea", "neisseria gonorrhoeae", "positive gonorrhea"],

        category: "bacterial_sti",
        organism: "Neisseria gonorrhoeae",

        transmission: ["sexual contact", "vertical transmission"],
        commonSymptoms: [
          "urethral discharge",
          "dysuria",
          "cervicitis",
          "pelvic pain",
          "rectal pain",
          "pharyngitis",
          "joint pain in disseminated infection"
        ],

        syndromes: [
          "urethritis",
          "cervicitis",
          "pelvic inflammatory disease",
          "epididymitis",
          "proctitis",
          "disseminated gonococcal infection"
        ],

        testing: [
          "NAAT",
          "culture when resistance or treatment failure is a concern",
          "site-specific testing based on exposure"
        ],

        treatmentContext: [
          "treat confirmed infection",
          "consider chlamydia coinfection",
          "culture and susceptibility if treatment failure suspected"
        ],

        partnerManagement: [
          "partner notification",
          "partner evaluation and treatment",
          "avoid sex until treatment completed and symptoms resolved"
        ],

        retesting: [
          "retest approximately 3 months after treatment when appropriate"
        ],

        complications: [
          "PID",
          "infertility",
          "ectopic pregnancy",
          "epididymitis",
          "disseminated gonococcal infection"
        ],

        pregnancyConsiderations: [
          "pregnancy requires clinician-guided treatment selection"
        ],

        reportability: {
          potentiallyReportable: true,
          jurisdictionDependent: true,
          verifyLocalRequirements: true
        },

        infectionControl: {
          precautions: ["PRECAUTION-STANDARD"]
        },

        clinicalPearls: [
          "Gonorrhea can infect genital, rectal, and pharyngeal sites.",
          "Resistance patterns matter.",
          "Always consider chlamydia coinfection unless excluded."
        ],

        reasoningHints: [
          "Purulent urethral discharge increases gonorrhea probability.",
          "Joint pain, tenosynovitis, or rash can suggest disseminated gonococcal infection.",
          "Ask exposure sites before deciding testing sites."
        ],

        decisionRules: [
          {
            id: "gonorrhea_dgi_warning",
            priority: "high",
            when: ["gonorrhea", "joint_pain"],
            then: ["increase_disseminated_gonococcal_infection_probability"]
          }
        ],

        monitoring: [],
        relatedMedications: ["cephalosporin_antibiotics", "tetracycline_antibiotics"],
        relatedOrganisms: ["ORG-BACT-NEISS-0002"],
        relatedKnowledge: ["urethritis", "cervicitis", "pid", "epididymitis", "proctitis"],

        followUpQuestions: [
          "What test was positive?",
          "Any discharge, burning, pelvic pain, rectal symptoms, sore throat, rash, or joint pain?",
          "Which exposure sites apply?",
          "Any pregnancy?",
          "Have partners been notified or treated?"
        ],

        patientEducation: [
          "Gonorrhea can be present without symptoms.",
          "Partners may need testing and treatment.",
          "Follow-up is important if symptoms persist."
        ],

        references: ["CDC STI Treatment Guidelines"],
        notes: "Common bacterial STI with important resistance and coinfection considerations."
      },

      {
        id: "syphilis",
        umkoId: "STI-BACT-SYPH-0001",
        versionId: "1.0",
        status: "active",

        name: "Syphilis",
        aliases: ["syphilis", "treponema pallidum", "positive rpr", "positive vdrl"],

        category: "bacterial_sti",
        organism: "Treponema pallidum",

        transmission: ["sexual contact", "vertical transmission", "blood exposure rare"],
        commonSymptoms: [
          "painless chancre",
          "rash on palms and soles",
          "mucous patches",
          "condyloma lata",
          "fever",
          "lymphadenopathy",
          "neurologic symptoms"
        ],

        syndromes: [
          "genital ulcer disease",
          "secondary syphilis",
          "latent syphilis",
          "neurosyphilis",
          "congenital syphilis"
        ],

        testing: [
          "nontreponemal test such as RPR or VDRL",
          "treponemal confirmatory testing",
          "CSF evaluation when neurosyphilis is suspected"
        ],

        treatmentContext: [
          "treatment depends on stage",
          "pregnancy requires urgent clinician-guided management",
          "neurologic or ocular symptoms require urgent evaluation"
        ],

        partnerManagement: [
          "partner notification",
          "partner evaluation and treatment based on stage and exposure"
        ],

        retesting: [
          "follow quantitative nontreponemal titers when appropriate"
        ],

        complications: [
          "neurosyphilis",
          "ocular syphilis",
          "cardiovascular syphilis",
          "congenital syphilis"
        ],

        pregnancyConsiderations: [
          "syphilis in pregnancy can cause severe fetal harm",
          "requires clinician-directed treatment and follow-up"
        ],

        reportability: {
          potentiallyReportable: true,
          jurisdictionDependent: true,
          verifyLocalRequirements: true
        },

        infectionControl: {
          precautions: ["PRECAUTION-STANDARD"]
        },

        clinicalPearls: [
          "Syphilis is a great imitator.",
          "Stage determines treatment and follow-up.",
          "Palms/soles rash is a classic secondary syphilis clue."
        ],

        reasoningHints: [
          "Painless genital ulcer should increase syphilis probability.",
          "Neurologic, ocular, or otic symptoms raise urgency.",
          "Pregnancy makes syphilis high priority."
        ],

        decisionRules: [
          {
            id: "syphilis_pregnancy",
            priority: "critical",
            when: ["syphilis", "pregnancy"],
            then: ["increase_pregnancy_safety_weight", "recommend_urgent_clinician_review"]
          }
        ],

        monitoring: [],
        relatedMedications: ["penicillin_antibiotics"],
        relatedOrganisms: ["treponema_pallidum"],
        relatedKnowledge: ["genital_ulcer", "rash", "neurosyphilis", "congenital_syphilis"],

        followUpQuestions: [
          "What test was positive?",
          "Any genital sore, rash on palms/soles, neurologic symptoms, vision changes, or hearing changes?",
          "Any pregnancy?",
          "Was this new infection or prior treated syphilis?",
          "Do you know the RPR titer?"
        ],

        patientEducation: [
          "Syphilis has stages and may not always cause obvious symptoms.",
          "Partners may need evaluation.",
          "Follow-up blood testing is often important."
        ],

        references: ["CDC STI Treatment Guidelines"],
        notes: "Syphilis requires stage-based reasoning, pregnancy safety, and public-health awareness."
      },

      {
        id: "genital_herpes",
        umkoId: "STI-VIR-HSV-0001",
        versionId: "1.0",
        status: "active",

        name: "Genital Herpes",
        aliases: ["genital herpes", "hsv", "hsv 1", "hsv 2", "herpes outbreak"],

        category: "viral_sti",
        organism: "HSV-1 or HSV-2",

        transmission: ["skin-to-skin sexual contact", "vertical transmission"],
        commonSymptoms: [
          "painful blisters",
          "genital ulcers",
          "burning",
          "tingling",
          "dysuria",
          "recurrent outbreaks"
        ],

        syndromes: ["genital ulcer disease"],

        testing: [
          "PCR or NAAT from lesion when present",
          "type-specific serology in selected cases"
        ],

        treatmentContext: [
          "episodic antiviral therapy",
          "suppressive antiviral therapy in selected patients",
          "pregnancy requires clinician guidance"
        ],

        partnerManagement: [
          "disclosure counseling",
          "risk reduction counseling",
          "avoid sex during outbreaks"
        ],

        retesting: [],
        complications: [
          "neonatal herpes",
          "aseptic meningitis rarely",
          "psychosocial distress"
        ],

        pregnancyConsiderations: [
          "new or active genital herpes in pregnancy requires clinician-directed management"
        ],

        reportability: {
          potentiallyReportable: false,
          jurisdictionDependent: true,
          verifyLocalRequirements: true
        },

        infectionControl: {
          precautions: ["PRECAUTION-STANDARD"]
        },

        clinicalPearls: [
          "HSV can transmit even when lesions are absent.",
          "PCR from a fresh lesion is high-yield.",
          "Recurrent outbreaks are common."
        ],

        reasoningHints: [
          "Painful grouped vesicles increase HSV probability.",
          "Pregnancy increases urgency because of neonatal risk."
        ],

        decisionRules: [],

        monitoring: [],
        relatedMedications: ["herpes_antivirals"],
        relatedOrganisms: ["ORG-VIR-HSV-0001"],
        relatedKnowledge: ["genital_ulcer", "pregnancy"],

        followUpQuestions: [
          "Are there painful blisters or ulcers?",
          "Is this the first outbreak or recurrent?",
          "Any pregnancy?",
          "Was testing done from a lesion?"
        ],

        patientEducation: [
          "Avoid sex during active lesions or prodrome.",
          "Suppressive therapy may reduce recurrences and transmission risk.",
          "Condoms reduce but do not eliminate risk."
        ],

        references: ["CDC STI Treatment Guidelines"],
        notes: "HSV counseling is as important as medication recognition."
      },

      {
        id: "trichomoniasis",
        umkoId: "STI-PROTO-TRICH-0001",
        versionId: "1.0",
        status: "active",

        name: "Trichomoniasis",
        aliases: ["trichomoniasis", "trich", "trichomonas vaginalis"],

        category: "protozoal_sti",
        organism: "Trichomonas vaginalis",

        transmission: ["sexual contact"],
        commonSymptoms: [
          "often asymptomatic",
          "vaginal discharge",
          "vaginal irritation",
          "dysuria",
          "odor",
          "urethritis"
        ],

        syndromes: ["vaginitis", "urethritis"],

        testing: [
          "NAAT",
          "wet mount when available but less sensitive"
        ],

        treatmentContext: [
          "treat confirmed infection",
          "partner treatment is important"
        ],

        partnerManagement: [
          "partner evaluation and treatment",
          "avoid sex until treatment complete"
        ],

        retesting: [
          "retesting may be recommended in selected patients"
        ],

        complications: [
          "increased STI acquisition risk",
          "pregnancy complications association"
        ],

        pregnancyConsiderations: [
          "pregnancy requires clinician-guided treatment selection"
        ],

        reportability: {
          potentiallyReportable: false,
          jurisdictionDependent: true,
          verifyLocalRequirements: true
        },

        infectionControl: {
          precautions: ["PRECAUTION-STANDARD"]
        },

        clinicalPearls: [
          "Trichomoniasis is a common non-viral STI.",
          "Partners should be treated to prevent reinfection."
        ],

        reasoningHints: [
          "Frothy discharge or odor can increase suspicion, but testing is needed."
        ],

        decisionRules: [],

        monitoring: [],
        relatedMedications: ["nitroimidazole_antibiotics"],
        relatedOrganisms: ["trichomonas_vaginalis"],
        relatedKnowledge: ["vaginitis", "urethritis"],

        followUpQuestions: [
          "What test was positive?",
          "Any discharge, odor, irritation, or burning?",
          "Any pregnancy?",
          "Were partners treated?"
        ],

        patientEducation: [
          "Partners often need treatment too.",
          "Avoid sex until treatment guidance is completed."
        ],

        references: ["CDC STI Treatment Guidelines"],
        notes: "Common STI often managed in sexual health and primary care settings."
      },

      {
        id: "hpv_genital_warts",
        umkoId: "STI-VIR-HPV-0001",
        versionId: "1.0",
        status: "active",

        name: "Human Papillomavirus / Genital Warts",
        aliases: ["hpv", "human papillomavirus", "genital warts", "warts"],

        category: "viral_sti",
        organism: "Human papillomavirus",

        transmission: ["skin-to-skin sexual contact"],
        commonSymptoms: [
          "often asymptomatic",
          "genital warts",
          "abnormal cervical screening"
        ],

        syndromes: ["genital warts", "cervical dysplasia"],

        testing: [
          "visual diagnosis for warts",
          "cervical cancer screening according to guidelines",
          "HPV testing in appropriate screening contexts"
        ],

        treatmentContext: [
          "wart treatment is symptom/cosmetic/transmission-context dependent",
          "screening follow-up depends on results and guidelines"
        ],

        partnerManagement: [
          "risk counseling",
          "vaccination counseling when eligible"
        ],

        retesting: [
          "follow cervical screening guidance"
        ],

        complications: [
          "cervical cancer",
          "anal cancer",
          "oropharyngeal cancer",
          "recurrent respiratory papillomatosis rare"
        ],

        pregnancyConsiderations: [
          "pregnancy may change wart treatment choices"
        ],

        reportability: {
          potentiallyReportable: false,
          jurisdictionDependent: true,
          verifyLocalRequirements: true
        },

        infectionControl: {
          precautions: ["PRECAUTION-STANDARD"]
        },

        clinicalPearls: [
          "HPV vaccination prevents many high-risk and wart-associated HPV types.",
          "Most HPV infections clear spontaneously.",
          "Visible warts do not define cancer risk by themselves."
        ],

        reasoningHints: [
          "Ask vaccination and screening history.",
          "Separate genital wart counseling from abnormal Pap/HPV cancer-screening counseling."
        ],

        decisionRules: [],

        monitoring: [],
        relatedMedications: [],
        relatedOrganisms: ["human_papillomavirus"],
        relatedKnowledge: ["genital_warts", "cervical_cancer_screening"],

        followUpQuestions: [
          "Is this about visible warts or an abnormal HPV/Pap result?",
          "Any pregnancy?",
          "HPV vaccine history?",
          "When was the last cervical cancer screening?"
        ],

        patientEducation: [
          "HPV is very common.",
          "Vaccination can prevent many HPV-related diseases.",
          "Screening follow-up matters."
        ],

        references: ["CDC STI Treatment Guidelines", "CDC HPV Vaccination Guidance"],
        notes: "HPV questions often require separating wart management from cancer-screening pathways."
      },

      {
        id: "hiv_sti_context",
        umkoId: "STI-VIR-HIV-0001",
        versionId: "1.0",
        status: "active",

        name: "HIV",
        aliases: ["hiv", "positive hiv", "hiv exposure", "hiv test"],

        category: "viral_sti",
        organism: "Human immunodeficiency virus",

        transmission: ["sexual contact", "blood exposure", "vertical transmission"],
        commonSymptoms: [
          "may be asymptomatic",
          "acute retroviral syndrome",
          "fever",
          "rash",
          "sore throat",
          "lymphadenopathy"
        ],

        syndromes: ["acute hiv", "chronic hiv", "hiv exposure"],

        testing: [
          "HIV antigen/antibody test",
          "HIV RNA when acute infection is suspected",
          "baseline testing for PrEP/PEP contexts"
        ],

        treatmentContext: [
          "confirmed HIV requires clinician-directed antiretroviral therapy",
          "PEP is time-sensitive after exposure",
          "PrEP requires confirmed HIV-negative status"
        ],

        partnerManagement: [
          "partner testing",
          "risk reduction counseling",
          "PrEP discussion for partners when appropriate"
        ],

        retesting: [
          "repeat testing based on exposure timing and test type"
        ],

        complications: [
          "opportunistic infections",
          "AIDS",
          "viral transmission"
        ],

        pregnancyConsiderations: [
          "pregnancy requires specialist-guided HIV management"
        ],

        reportability: {
          potentiallyReportable: true,
          jurisdictionDependent: true,
          verifyLocalRequirements: true
        },

        infectionControl: {
          precautions: ["PRECAUTION-STANDARD"]
        },

        clinicalPearls: [
          "Acute HIV can look like a viral illness.",
          "PEP timing matters after high-risk exposure.",
          "PrEP is prevention, not treatment for established HIV."
        ],

        reasoningHints: [
          "Clarify whether this is exposure, screening, acute symptoms, or known HIV.",
          "Recent exposure plus flu-like illness can raise acute HIV concern."
        ],

        decisionRules: [
          {
            id: "hiv_pep_time_sensitive",
            priority: "critical",
            when: ["hiv_exposure", "recent_exposure"],
            then: ["activate_exposure_management_engine"]
          }
        ],

        monitoring: ["MON-CBC-0001", "MON-RENAL-0001", "MON-LIVER-0001"],
        relatedMedications: ["hiv_antiretrovirals"],
        relatedOrganisms: ["human_immunodeficiency_virus"],
        relatedKnowledge: ["prep", "pep", "acute_hiv"],

        followUpQuestions: [
          "Is this about exposure, screening, symptoms, or known HIV?",
          "When was the possible exposure?",
          "What type of exposure occurred?",
          "What test was done and when?"
        ],

        patientEducation: [
          "Testing timing matters after exposure.",
          "PEP is time-sensitive.",
          "PrEP can reduce future risk when appropriate."
        ],

        references: ["CDC STI Treatment Guidelines", "CDC PrEP Guidance", "CDC PEP Guidance"],
        notes: "HIV STI context overlaps with PEP/PrEP, reportability, and antiretroviral registry."
      }
    ];
  },

  find(value = "") {
    const clean = this.normalize(value);

    return this.entries().find(entry =>
      this.normalize(entry.id) === clean ||
      this.normalize(entry.umkoId) === clean ||
      entry.aliases?.some(alias => this.normalize(alias) === clean)
    ) || null;
  },

  search(text = "") {
    const clean = this.normalize(text);
    if (!clean) return [];

    return this.entries().filter(entry =>
      clean.includes(this.normalize(entry.name)) ||
      entry.aliases?.some(alias => clean.includes(this.normalize(alias))) ||
      entry.commonSymptoms?.some(symptom => clean.includes(this.normalize(symptom))) ||
      entry.syndromes?.some(syndrome => clean.includes(this.normalize(syndrome)))
    );
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s'.-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

window.AriSTIRegistry =
  window.Ari.medical.infectiousDisease.sti.registry;

console.log(
  "ARI STI REGISTRY LOADED:",
  window.Ari.medical.infectiousDisease.sti.registry.version
);