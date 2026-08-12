import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ageGate = require("../js/arixp-age-gate.js");
const referenceDate = new Date(Date.UTC(2026, 7, 11));

test("accepts a user on their thirteenth birthday", () => {
  const result = ageGate.evaluate(
    { month: "08", day: "11", year: "2013" },
    referenceDate
  );

  assert.equal(result.valid, true);
  assert.equal(result.eligible, true);
  assert.equal(result.age, 13);
  assert.equal(result.dateOfBirth, "2013-08-11");
});

test("rejects a user who is one day younger than thirteen", () => {
  const result = ageGate.evaluate(
    { month: "08", day: "12", year: "2013" },
    referenceDate
  );

  assert.equal(result.valid, true);
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "ineligible");
});

test("rejects impossible calendar dates", () => {
  const result = ageGate.evaluate(
    { month: "02", day: "29", year: "2025" },
    referenceDate
  );

  assert.equal(result.valid, false);
  assert.equal(result.reason, "invalid");
});

test("accepts a real leap-day birthday", () => {
  const result = ageGate.evaluate(
    { month: "02", day: "29", year: "2012" },
    referenceDate
  );

  assert.equal(result.valid, true);
  assert.equal(result.eligible, true);
  assert.equal(result.dateOfBirth, "2012-02-29");
});

test("rejects future and implausibly old dates", () => {
  assert.equal(
    ageGate.evaluate(
      { month: "01", day: "01", year: "2027" },
      referenceDate
    ).valid,
    false
  );

  assert.equal(
    ageGate.evaluate(
      { month: "01", day: "01", year: "1800" },
      referenceDate
    ).valid,
    false
  );
});
