(function attachAriXpAgeGate(root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.AriXpAgeGate = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function createAgeGate() {
  "use strict";

  const MINIMUM_AGE = 13;
  const MAXIMUM_AGE = 120;

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function ageOnDate(birthDate, referenceDate = new Date()) {
    let age = referenceDate.getUTCFullYear() - birthDate.getUTCFullYear();

    const birthdayHasPassed =
      referenceDate.getUTCMonth() > birthDate.getUTCMonth() ||
      (
        referenceDate.getUTCMonth() === birthDate.getUTCMonth() &&
        referenceDate.getUTCDate() >= birthDate.getUTCDate()
      );

    if (!birthdayHasPassed) {
      age -= 1;
    }

    return age;
  }

  function evaluate({ month, day, year }, referenceDate = new Date()) {
    const monthText = String(month || "").trim();
    const dayText = String(day || "").trim();
    const yearText = String(year || "").trim();

    if (!/^\d{1,2}$/.test(monthText) || !/^\d{1,2}$/.test(dayText) || !/^\d{4}$/.test(yearText)) {
      return { valid: false, eligible: false, reason: "invalid" };
    }

    const numericMonth = Number(monthText);
    const numericDay = Number(dayText);
    const numericYear = Number(yearText);

    const birthDate = new Date(Date.UTC(numericYear, numericMonth - 1, numericDay));

    const isRealDate =
      numericMonth >= 1 &&
      numericMonth <= 12 &&
      numericDay >= 1 &&
      numericDay <= 31 &&
      birthDate.getUTCFullYear() === numericYear &&
      birthDate.getUTCMonth() === numericMonth - 1 &&
      birthDate.getUTCDate() === numericDay;

    if (!isRealDate) {
      return { valid: false, eligible: false, reason: "invalid" };
    }

    const today = new Date(Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate()
    ));

    if (birthDate > today) {
      return { valid: false, eligible: false, reason: "future" };
    }

    const age = ageOnDate(birthDate, today);

    if (age > MAXIMUM_AGE) {
      return { valid: false, eligible: false, reason: "invalid" };
    }

    return {
      valid: true,
      eligible: age >= MINIMUM_AGE,
      reason: age >= MINIMUM_AGE ? "eligible" : "ineligible",
      age,
      dateOfBirth: `${numericYear}-${pad(numericMonth)}-${pad(numericDay)}`
    };
  }

  return Object.freeze({
    MINIMUM_AGE,
    MAXIMUM_AGE,
    ageOnDate,
    evaluate
  });
});
