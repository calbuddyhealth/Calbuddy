// ari/core/ari-registry-contract.js
// Ari Registry Contract
//
// Purpose:
// Define the canonical contract that every Ari registry follows.
//
// V1.0.0 — Canonical Registry Standard
//
// Responsibilities:
// - Standardize registry interfaces.
// - Prevent inconsistent registry APIs.
// - Provide validation helpers.
// - Ensure predictable runtime behavior.
//
// Non-responsibilities:
// - Does not own registry data.
// - Does not execute runtime logic.
// - Does not classify conversations.
// - Does not perform routing.

window.Ari = window.Ari || {};

window.AriRegistryContract = Object.freeze({

  requiredProperties: [

    "version",

    "schemaVersion",

    "types"

  ],

  requiredFunctions: [

    "values",

    "list",

    "count",

    "has",

    "isValid"

  ]

});