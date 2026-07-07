// ari/medical/monitoring/ari-monitoring-registry.js
// Purpose: Universal reusable monitoring profiles for Ari Medical OS.
// V1.0.0 — Monitoring Registry / UMKO Stable IDs

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.monitoring = window.Ari.medical.monitoring || {};

window.Ari.medical.monitoring.registry = {
  version: "1.0.0",

  entries() {
    return [
      {
        monitorId: "MON-CBC-0001",
        umkoId: "MON-CBC-0001",
        versionId: "1.0",
        status: "active",
        name: "Complete Blood Count",
        aliases: ["CBC", "complete blood count"],
        category: "laboratory",
        tracks: ["WBC", "hemoglobin", "hematocrit", "platelets"],
        usedFor: ["infection", "anemia", "bleeding", "myelosuppression"],
        escalationSignals: ["severe anemia", "very low platelets", "severe leukopenia"],
        notes: "Useful for infection, bleeding risk, anemia, platelet trends, and marrow suppression."
      },

      {
        monitorId: "MON-RENAL-0001",
        umkoId: "MON-RENAL-0001",
        versionId: "1.0",
        status: "active",
        name: "Renal Function",
        aliases: ["renal function", "kidney function", "creatinine", "BUN", "eGFR"],
        category: "laboratory",
        tracks: ["creatinine", "BUN", "eGFR", "urine output"],
        usedFor: ["renal dosing", "kidney injury", "nephrotoxic medications"],
        escalationSignals: ["rising creatinine", "decreased urine output", "acute kidney injury"],
        notes: "Core monitoring for renally cleared or nephrotoxic medications."
      },

      {
        monitorId: "MON-LIVER-0001",
        umkoId: "MON-LIVER-0001",
        versionId: "1.0",
        status: "active",
        name: "Liver Function",
        aliases: ["LFTs", "AST", "ALT", "bilirubin", "liver function"],
        category: "laboratory",
        tracks: ["AST", "ALT", "bilirubin", "alkaline phosphatase"],
        usedFor: ["hepatotoxic medications", "viral hepatitis", "liver injury"],
        escalationSignals: ["jaundice", "rapidly rising liver enzymes", "worsening bilirubin"],
        notes: "Core monitoring for hepatic injury and hepatotoxic medications."
      },

      {
        monitorId: "MON-ELECTROLYTES-0001",
        umkoId: "MON-ELECTROLYTES-0001",
        versionId: "1.0",
        status: "active",
        name: "Electrolytes",
        aliases: ["BMP", "CMP", "electrolytes", "sodium", "potassium", "magnesium"],
        category: "laboratory",
        tracks: ["sodium", "potassium", "chloride", "bicarbonate", "magnesium"],
        usedFor: ["arrhythmia risk", "renal disease", "diuretics", "amphotericin toxicity"],
        escalationSignals: ["severe hyperkalemia", "severe hypokalemia", "severe hyponatremia"],
        notes: "Important for arrhythmia risk, renal dysfunction, and medication toxicity."
      },

      {
        monitorId: "MON-LACTATE-0001",
        umkoId: "MON-LACTATE-0001",
        versionId: "1.0",
        status: "active",
        name: "Lactate",
        aliases: ["lactate", "lactic acid"],
        category: "laboratory",
        tracks: ["serum lactate"],
        usedFor: ["sepsis", "shock", "poor perfusion"],
        escalationSignals: ["elevated lactate", "rising lactate"],
        notes: "Useful for suspected sepsis, shock, and perfusion assessment."
      },

      {
        monitorId: "MON-ECG-QT-0001",
        umkoId: "MON-ECG-QT-0001",
        versionId: "1.0",
        status: "active",
        name: "ECG / QT Interval",
        aliases: ["ECG", "EKG", "QT", "QTc", "QT interval"],
        category: "cardiac",
        tracks: ["QTc", "rhythm", "heart rate"],
        usedFor: ["QT-prolonging medications", "arrhythmia risk", "syncope"],
        escalationSignals: ["marked QT prolongation", "syncope", "torsades risk"],
        notes: "Useful when medications or conditions increase QT or arrhythmia risk."
      },

      {
        monitorId: "MON-VITALS-0001",
        umkoId: "MON-VITALS-0001",
        versionId: "1.0",
        status: "active",
        name: "Vital Signs",
        aliases: ["vitals", "blood pressure", "heart rate", "respiratory rate", "temperature"],
        category: "bedside",
        tracks: ["BP", "HR", "RR", "temperature"],
        usedFor: ["clinical deterioration", "infection", "sepsis", "shock"],
        escalationSignals: ["hypotension", "tachycardia", "tachypnea", "high fever"],
        notes: "Core bedside monitoring for instability and clinical change."
      },

      {
        monitorId: "MON-OXYGEN-0001",
        umkoId: "MON-OXYGEN-0001",
        versionId: "1.0",
        status: "active",
        name: "Oxygenation",
        aliases: ["oxygen saturation", "SpO2", "pulse ox", "hypoxia"],
        category: "bedside",
        tracks: ["SpO2", "oxygen requirement", "work of breathing"],
        usedFor: ["respiratory distress", "pneumonia", "COVID", "RSV", "COPD"],
        escalationSignals: ["low oxygen saturation", "increasing oxygen requirement", "blue lips"],
        notes: "Important for respiratory infections and respiratory distress."
      },

      {
        monitorId: "MON-MENTAL-STATUS-0001",
        umkoId: "MON-MENTAL-STATUS-0001",
        versionId: "1.0",
        status: "active",
        name: "Mental Status",
        aliases: ["mental status", "confusion", "delirium", "alertness"],
        category: "bedside",
        tracks: ["orientation", "alertness", "confusion", "agitation"],
        usedFor: ["sepsis", "stroke", "medication toxicity", "delirium"],
        escalationSignals: ["new confusion", "unresponsiveness", "seizure"],
        notes: "New mental status change can signal serious illness or medication toxicity."
      },

      {
        monitorId: "MON-IO-0001",
        umkoId: "MON-IO-0001",
        versionId: "1.0",
        status: "active",
        name: "Intake and Output",
        aliases: ["I&O", "intake output", "urine output"],
        category: "bedside",
        tracks: ["oral intake", "IV intake", "urine output", "fluid balance"],
        usedFor: ["renal function", "dehydration", "shock", "heart failure"],
        escalationSignals: ["low urine output", "positive fluid balance", "dehydration"],
        notes: "Useful for renal perfusion, hydration, and fluid balance."
      },

      {
        monitorId: "MON-VANCO-0001",
        umkoId: "MON-VANCO-0001",
        versionId: "1.0",
        status: "active",
        name: "Vancomycin Monitoring",
        aliases: ["vancomycin level", "vanco trough", "vancomycin AUC"],
        category: "medication",
        tracks: ["AUC", "trough when applicable", "creatinine", "renal function"],
        usedFor: ["vancomycin safety", "glycopeptide antibiotics", "MRSA treatment"],
        escalationSignals: ["high vancomycin exposure", "rising creatinine", "hearing changes"],
        notes: "Supports safe vancomycin therapy and nephrotoxicity monitoring."
      },

      {
        monitorId: "MON-AMINOGLYCOSIDE-0001",
        umkoId: "MON-AMINOGLYCOSIDE-0001",
        versionId: "1.0",
        status: "active",
        name: "Aminoglycoside Monitoring",
        aliases: ["gentamicin level", "tobramycin level", "amikacin level"],
        category: "medication",
        tracks: ["peak level", "trough level", "renal function", "hearing", "vestibular symptoms"],
        usedFor: ["aminoglycoside safety", "nephrotoxicity", "ototoxicity"],
        escalationSignals: ["high trough", "rising creatinine", "hearing loss", "vertigo"],
        notes: "Important for aminoglycoside toxicity prevention."
      },

      {
        monitorId: "MON-CK-0001",
        umkoId: "MON-CK-0001",
        versionId: "1.0",
        status: "active",
        name: "Creatine Kinase",
        aliases: ["CK", "CPK", "creatine kinase"],
        category: "laboratory",
        tracks: ["CK level", "muscle symptoms", "dark urine"],
        usedFor: ["myopathy", "rhabdomyolysis", "daptomycin", "statins"],
        escalationSignals: ["markedly elevated CK", "dark urine", "muscle weakness"],
        notes: "Important for muscle injury, rhabdomyolysis, daptomycin, and statin toxicity."
      },

      {
        monitorId: "MON-GLUCOSE-0001",
        umkoId: "MON-GLUCOSE-0001",
        versionId: "1.0",
        status: "active",
        name: "Glucose Monitoring",
        aliases: ["blood sugar", "glucose", "fingerstick", "POC glucose"],
        category: "laboratory",
        tracks: ["glucose", "hypoglycemia symptoms", "hyperglycemia symptoms"],
        usedFor: ["diabetes", "insulin", "steroids", "fluoroquinolone glucose effects"],
        escalationSignals: ["severe hypoglycemia", "severe hyperglycemia", "altered mental status"],
        notes: "Core monitoring for diabetes, insulin therapy, and medications affecting glucose."
      }
    ];
  },

  find(value = "") {
    return this.entries().find(entry =>
      entry.monitorId === value ||
      entry.umkoId === value ||
      entry.aliases?.some(alias =>
        String(alias).toLowerCase() === String(value).toLowerCase()
      )
    ) || null;
  }
};

window.AriMonitoringRegistry =
  window.Ari.medical.monitoring.registry;

console.log(
  "ARI MONITORING REGISTRY LOADED:",
  window.Ari.medical.monitoring.registry.version
);