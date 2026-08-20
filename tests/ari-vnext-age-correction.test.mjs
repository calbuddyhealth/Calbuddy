import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function source(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("birthday correction is a pending owner-review workflow, never a direct DOB write", () => {
  const sql = source("supabase/migrations/20260818232000_age_correction_support_workflow.sql");
  assert.match(sql, /ari_age_correction_requests/i);
  assert.match(sql, /status text not null default 'pending'/i);
  assert.match(sql, /ari_request_my_age_correction/i);
  assert.match(sql, /ari_owner_review_age_correction/i);
  assert.match(sql, /if requested_decision = 'approved' then[\s\S]*update public\.ari_account_state[\s\S]*date_of_birth = request_row\.requested_date_of_birth/i);
  assert.doesNotMatch(sql, /update public\.ari_account_state[\s\S]{0,500}requested_date_of_birth[\s\S]{0,500}insert into public\.ari_age_correction_requests/i);
});

test("request requires password authentication evidence and a meaningful explanation", () => {
  const sql = source("supabase/migrations/20260818232000_age_correction_support_workflow.sql");
  assert.match(sql, /auth\.jwt\(\)->'amr'/i);
  assert.match(sql, /item->>'method' = 'password'/i);
  assert.match(sql, /now\(\) - interval '5 minutes'/i);
  assert.match(sql, /char_length\(btrim\(coalesce\(requested_explanation/i);
  assert.match(sql, /between 20 and 2000/i);
  assert.doesNotMatch(sql, /current_password\s+text/i);
  assert.doesNotMatch(sql, /password\s+text\s+not\s+null/i);
});

test("only the owner role can approve or deny a protected DOB correction", () => {
  const sql = source("supabase/migrations/20260818232000_age_correction_support_workflow.sql");
  assert.match(sql, /a\.role = 'owner'/i);
  assert.match(sql, /requested_decision not in \('approved','denied'\)/i);
  assert.match(sql, /if request_row\.status <> 'pending'/i);
  assert.match(sql, /reviewed_by = reviewer_id/i);
  assert.match(sql, /reviewed_at = now\(\)/i);
});

test("a denied request does not alter account DOB or age authorization", () => {
  const sql = source("supabase/migrations/20260818232000_age_correction_support_workflow.sql");
  const approvalStart = sql.indexOf("if requested_decision = 'approved' then");
  const approvalUpdate = sql.indexOf("update public.ari_account_state", approvalStart);
  const denialElse = sql.indexOf("\n  else\n    select status into resulting_status", approvalStart);
  const outerEnd = sql.indexOf("\n  end if;", denialElse);
  assert.ok(approvalStart > 0);
  assert.ok(approvalUpdate > approvalStart && approvalUpdate < denialElse);
  assert.ok(denialElse > approvalUpdate);
  const denialBranch = sql.slice(denialElse, outerEnd);
  assert.match(denialBranch, /select status into resulting_status/i);
  assert.doesNotMatch(denialBranch, /update public\.ari_account_state/i);
});

test("approved under-13 correction fails safe by suspending the account", () => {
  const sql = source("supabase/migrations/20260818232000_age_correction_support_workflow.sql");
  assert.match(sql, /case when requested_age < 13 then 'suspended_by_admin' else status end/i);
});

test("database forces teen profile age to protected account DOB but leaves adults editable", () => {
  const sql = source("supabase/migrations/20260818232100_lock_minor_profile_age_to_account_dob.sql");
  assert.match(sql, /before insert or update of age on public\.profiles/i);
  assert.match(sql, /account_age between 13 and 17/i);
  assert.match(sql, /new\.age := account_age/i);
  assert.doesNotMatch(sql, /account_age >= 18[\s\S]*new\.age/i);
});

test("Goals client makes teen age read-only and preserves adult editability", () => {
  const js = source("js/goals-age-policy.js");
  assert.doesNotThrow(() => new Function(js));
  assert.match(js, /age >= 13 && age < 18/i);
  assert.match(js, /input\.readOnly = true/i);
  assert.match(js, /input\.value = String\(age\)/i);
  assert.match(js, /input\.readOnly = false/i);
  assert.match(js, /adult_editable/i);
  assert.match(js, /Based on your protected account birthday/i);
});

test("Goals age policy is loaded centrally only on Goals pages", () => {
  const config = source("supabase-config.js");
  assert.doesNotThrow(() => new Function(config));
  assert.match(config, /shouldLoadGoalsAgePolicy/i);
  assert.match(config, /path\.endsWith\("\/goals\.html"\)/i);
  assert.match(config, /js\/goals-age-policy\.js\?v=1\.0\.0/i);
});

test("account correction UI reauthenticates with Supabase and never stores the password", () => {
  const html = source("account.html");
  const js = source("js/account.js");
  assert.doesNotThrow(() => new Function(js));
  assert.match(html, /Request a birthday correction/i);
  assert.match(html, /Current sign-in email/i);
  assert.match(html, /Current password/i);
  assert.match(html, /Submit for owner review/i);
  assert.match(js, /auth\.signInWithPassword/i);
  assert.match(js, /ari_request_my_age_correction/i);
  assert.match(js, /birthdayPasswordInput"\)\.value = ""/i);
  assert.doesNotMatch(js, /localStorage\.setItem\([^\n]*password/i);
});

test("pending correction leaves current birthday and safety settings unchanged", () => {
  const js = source("js/account.js");
  assert.match(js, /current age and safety settings stay unchanged until the owner approves or denies it/i);
  assert.match(js, /already pending owner review/i);
});

test("owner moderation exposes age corrections with explicit approve and deny actions", () => {
  const html = source("owner-moderation.html");
  const js = source("js/owner-moderation.js");
  assert.doesNotThrow(() => new Function(js));
  assert.match(html, /data-owner-panel="age"/i);
  assert.match(html, /Changes 18\+ access/i);
  assert.match(js, /data-age-action="approved"/i);
  assert.match(js, /data-age-action="denied"/i);
  assert.match(js, /ari_owner_review_age_correction/i);
  assert.match(js, /crosses_adult_boundary/i);
});

test("Circle authorization remains separate from editable adult Goals age", () => {
  const entitlement = source("api/_lib/ari-vnext/account-entitlements.js");
  const goalsPolicy = source("js/goals-age-policy.js");
  assert.match(entitlement, /ari_account_state/i);
  assert.match(entitlement, /date_of_birth/i);
  assert.match(entitlement, /circleAllowed:\s*authorizationKnown[\s\S]*active && ageBand === "adult"[\s\S]*:\s*null/i);
  assert.doesNotMatch(entitlement, /profiles\.age/i);
  assert.doesNotMatch(goalsPolicy, /circleAllowed\s*=/i);
});