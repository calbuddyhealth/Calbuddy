// ari/core/ari-registry-validator.js
// Ari Registry Validator
//
// Purpose:
// Validate that Ari registries conform to the canonical Registry Contract.
//
// V1.1.0 — Canonical Registry Validator
//
// Architectural Flow:
//
// Registry
//      ↓
// Registry Validator
//      ↓
// Validation Result
//
// Responsibilities:
// - Validate registry structure.
// - Validate required properties.
// - Validate required functions.
// - Produce deterministic diagnostics.
//
// Non-responsibilities:
// - Does not modify registries.
// - Does not create registries.
// - Does not throw runtime exceptions.
// - Does not determine startup readiness.
// - Does not execute runtime logic.

window.Ari = window.Ari || {};

window.AriRegistryValidator = {

  version: "1.1.0",

  validate(registry = {}) {

    const errors = [];
    const warnings = [];

    const contract =
      window.AriRegistryContract;

    if (!contract) {

      return {

        valid: false,

        registry: null,

        version: null,

        schemaVersion: null,

        errors: Object.freeze([
          "registry_contract_missing"
        ]),

        warnings: Object.freeze([])

      };

    }

    /* ============================================
       Required Properties
    ============================================ */

    for (const property of contract.requiredProperties) {

      if (
        registry[property] === undefined ||
        registry[property] === null
      ) {

        errors.push(
          `missing_property:${property}`
        );

      }

    }

    /* ============================================
       Required Functions
    ============================================ */

    for (const fn of contract.requiredFunctions) {

      if (
        typeof registry[fn] !== "function"
      ) {

        errors.push(
          `missing_function:${fn}`
        );

      }

    }

    /* ============================================
       Registry Types
    ============================================ */

    if (
      registry.types &&
      typeof registry.types !== "object"
    ) {

      errors.push(
        "types_not_object"
      );

    }

    /* ============================================
       Function Validation
    ============================================ */

    this.validateValues(registry, errors);

    this.validateList(registry, errors);

    this.validateCount(registry, errors);

    this.validateHas(registry, errors);

    this.validateIsValid(registry, errors);

    return Object.freeze({

      valid:
        errors.length === 0,

      registry:
        registry.constructor?.name ||
        "registry",

      version:
        registry.version || null,

      schemaVersion:
        registry.schemaVersion || null,

      errors:
        Object.freeze(errors),

      warnings:
        Object.freeze(warnings)

    });

  },

  validateValues(registry, errors) {

    if (
      typeof registry.values !== "function"
    ) return;

    try {

      const values =
        registry.values();

      if (
        !Array.isArray(values)
      ) {

        errors.push(
          "values_not_array"
        );

      }

    }

    catch {

      errors.push(
        "values_execution_failed"
      );

    }

  },

  validateList(registry, errors) {

    if (
      typeof registry.list !== "function"
    ) return;

    try {

      const values =
        registry.list();

      if (
        !Array.isArray(values)
      ) {

        errors.push(
          "list_not_array"
        );

      }

    }

    catch {

      errors.push(
        "list_execution_failed"
      );

    }

  },

  validateCount(registry, errors) {

    if (
      typeof registry.count !== "function"
    ) return;

    try {

      if (
        typeof registry.count() !==
        "number"
      ) {

        errors.push(
          "count_not_number"
        );

      }

    }

    catch {

      errors.push(
        "count_execution_failed"
      );

    }

  },

  validateHas(registry, errors) {

    if (
      typeof registry.has !== "function"
    ) return;

    try {

      registry.has(
        "__validator_test__"
      );

    }

    catch {

      errors.push(
        "has_execution_failed"
      );

    }

  },

  validateIsValid(registry, errors) {

    if (
      typeof registry.isValid !== "function"
    ) return;

    try {

      registry.isValid(
        "__validator_test__"
      );

    }

    catch {

      errors.push(
        "isValid_execution_failed"
      );

    }

  }

};

window.Ari.registryValidator =
  window.AriRegistryValidator;