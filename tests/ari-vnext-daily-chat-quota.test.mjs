import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  dailyChatLimit,
  isOwnerQuotaExempt,
  publicDailyChatQuota
} from "../api/_lib/ari-vnext/daily-chat-quota.js";

const requestIdempotency = fs.readFileSync("api/_lib/ari-vnext/request-idempotency.js", "utf8");
const quotaService = fs.readFileSync("api/_lib/ari-vnext/daily-chat-quota.js", "utf8");
const quotaApi = fs.readFileSync("api/ari-daily-chat-quota.js", "utf8");
const bridge = fs.readFileSync("ari/vnext/ari-vnext-bridge.js", "utf8");
const runtime = fs.readFileSync("ari/runtime/ari-runtime-controller.js", "utf8");
const resilience = fs.readFileSync("js/home-resilience.js", "utf8");
const router = fs.readFileSync("ari/intent/ari-central-intent-router.js", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260909173000_add_ari_daily_chat_quota.sql", "utf8");

const originalLimit = process.env.ARI_DAILY_CHAT_LIMIT;
const originalOwner = process.env.ARI_OWNER_USER_ID;

test.afterEach(() => {
  if (originalLimit === undefined) delete process.env.ARI_DAILY_CHAT_LIMIT;
  else process.env.ARI_DAILY_CHAT_LIMIT = originalLimit;
  if (originalOwner === undefined) delete process.env.ARI_OWNER_USER_ID;
  else process.env.ARI_OWNER_USER_ID = originalOwner;
});

test("regular Ari chat defaults to ten daily questions and remains configurable", () => {
  delete process.env.ARI_DAILY_CHAT_LIMIT;
  assert.equal(dailyChatLimit(), 10);
  process.env.ARI_DAILY_CHAT_LIMIT = "7";
  assert.equal(dailyChatLimit(), 7);
  process.env.ARI_DAILY_CHAT_LIMIT = "999";
  assert.equal(dailyChatLimit(), 100);
});

test("owner exemption derives only from server owner identity", () => {
  process.env.ARI_OWNER_USER_ID = "owner-user";
  assert.equal(isOwnerQuotaExempt("owner-user"), true);
  assert.equal(isOwnerQuotaExempt("regular-user"), false);
  assert.equal(isOwnerQuotaExempt(""), false);
});

test("public quota exposes counter and local reset metadata without reservation internals", () => {
  assert.deepEqual(publicDailyChatQuota({
    enabled: true,
    allowed: true,
    unlimited: false,
    used: 3,
    remaining: 7,
    dailyLimit: 10,
    timezone: "America/Los_Angeles",
    localDate: "2026-09-09",
    resetAt: "2026-09-10T07:00:00.000Z",
    reserved: true,
    source: "daily_quota_rpc"
  }), {
    enabled: true,
    allowed: true,
    unlimited: false,
    used: 3,
    remaining: 7,
    dailyLimit: 10,
    timezone: "America/Los_Angeles",
    localDate: "2026-09-09",
    resetAt: "2026-09-10T07:00:00.000Z",
    source: "daily_quota_rpc"
  });
});

test("quota reservation is coupled to new idempotent turns and failures release the slot", () => {
  assert.match(requestIdempotency, /reserveDailyChatQuota\(\{ userId: user, turnId: turn \}\)/);
  assert.match(requestIdempotency, /code: "ARI_DAILY_CHAT_LIMIT"/);
  assert.match(requestIdempotency, /consumeDailyChatQuota\(\{ userId: user, turnId: turn \}\)/);
  assert.match(requestIdempotency, /releaseDailyChatQuota\(\{ userId: user, turnId: turn \}\)/);
  assert.match(requestIdempotency, /quota: safePayload\(value\.quota\)/);
});

test("quota service is server-authoritative, timezone-aware, and owner-exempt", () => {
  assert.match(quotaService, /ARI_DAILY_CHAT_LIMIT/);
  assert.match(quotaService, /ARI_OWNER_USER_ID/);
  assert.match(quotaService, /ari_reserve_daily_chat_quota/);
  assert.match(quotaService, /Intl\.DateTimeFormat/);
  assert.match(quotaService, /TIMEZONE_CHANGE_COOLDOWN_MS = 7 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(quotaService, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("authenticated quota endpoint saves timezone and returns a quota snapshot", () => {
  assert.match(quotaApi, /saveDailyChatTimezone/);
  assert.match(quotaApi, /loadDailyChatQuota/);
  assert.match(quotaApi, /Authorization: `Bearer \$\{accessToken\}`/);
  assert.match(quotaApi, /Cache-Control/);
});

test("browser bridge syncs IANA timezone, renders remaining questions, and bypasses model for pending yes or cancel", () => {
  assert.match(bridge, /version: "1\.9\.0"/);
  assert.match(bridge, /Intl\.DateTimeFormat\(\)\.resolvedOptions\(\)\.timeZone/);
  assert.match(bridge, /\/api\/ari-daily-chat-quota/);
  assert.match(bridge, /ariDailyQuotaStatus/);
  assert.match(bridge, /Ari questions remaining · Resets at midnight/);
  assert.match(bridge, /isPendingConfirmationText/);
  assert.match(bridge, /isPendingCancellationText/);
  assert.match(bridge, /ari_vnext_local_pending_confirmation/);
  assert.match(bridge, /ari_vnext_local_pending_cancel/);
});

test("runtime and Home require the quota-aware bridge and runtime versions", () => {
  assert.match(runtime, /const VERSION = "1\.3\.9"/);
  assert.match(runtime, /ari-vnext-bridge\.js\?v=1\.9\.0/);
  assert.match(runtime, /versionAtLeast\(window\.AriVNextBridge\?\.version, "1\.9\.0"\)/);
  assert.match(resilience, /REQUIRED_RUNTIME_VERSION = "1\.3\.9"/);
  assert.match(router, /ari\/runtime\/ari-runtime-controller\.js\?v=1\.3\.9/);
});

test("database quota boundary is atomic, local-day aware, and service-role only", () => {
  assert.match(migration, /ari_daily_chat_quota_reservations/);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /pg_timezone_names/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /interval '7 days'/);
  assert.match(migration, /revoke execute[\s\S]*from anon, authenticated, public/i);
  assert.match(migration, /grant execute[\s\S]*to service_role/i);
  assert.match(migration, /coalesce\(requested_daily_limit, 10\)/);
});