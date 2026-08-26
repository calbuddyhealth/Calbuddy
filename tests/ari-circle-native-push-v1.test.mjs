import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const migration = fs.readFileSync("supabase/migrations/20260826080000_ari_circle_native_push_v1.sql", "utf8");
const dispatcher = fs.readFileSync("api/ari-circle-push-dispatch.js", "utf8");
const nativeServer = fs.readFileSync("api/_lib/ari-vnext/native-push.js", "utf8");
const nativeRuntime = fs.readFileSync("js/native-push-runtime.js", "utf8");
const buildMobile = fs.readFileSync("scripts/build-mobile-web.mjs", "utf8");
const pushCapability = fs.readFileSync("scripts/ensure-ios-push-capability.mjs", "utf8");
const entitlements = fs.readFileSync("ios/App/App/App.entitlements", "utf8");
const settingsHtml = fs.readFileSync("notification-settings.html", "utf8");
const settingsJs = fs.readFileSync("js/notification-settings.js", "utf8");
const packageJson = fs.readFileSync("package.json", "utf8");
const iosWorkflow = fs.readFileSync(".github/workflows/ios-native-generate.yml", "utf8");

test("native push browser runtime is valid JavaScript and routes only explicit internal HTML deep links", () => {
  new vm.Script(nativeRuntime);
  assert.match(nativeRuntime, /pushNotificationActionPerformed/);
  assert.match(nativeRuntime, /pushNotificationReceived/);
  assert.match(nativeRuntime, /raw\.includes\(\":\/\/\"\)/);
  assert.match(nativeRuntime, /raw\.startsWith\(\"\/\/\"\)/);
  assert.match(nativeRuntime, /raw\.includes\(\"\.\.\"\)/);
  assert.match(nativeRuntime, /\.html\(\?:\[\?#\]/);
  assert.doesNotMatch(nativeRuntime, /ariSignalId|signalId/);
});

test("mobile build installs one shared native push router on every bundled HTML page", () => {
  assert.match(buildMobile, /native-push-runtime\.js\?v=1\.0\.0/);
  assert.match(buildMobile, /data-ari-native-push/);
  assert.match(buildMobile, /injectHeadTag\(html, nativePushRuntimeTag/);
  assert.match(buildMobile, /await walk\(out\)/);
});

test("native push opt-in reuses existing ARI device registration and global quiet-hour preference", () => {
  assert.match(nativeRuntime, /action:\s*"register-device"/);
  assert.match(nativeRuntime, /action:\s*"preferences"/);
  assert.match(nativeRuntime, /pushEnabled:\s*true/);
  assert.match(nativeRuntime, /pushEnabled:\s*false/);
  assert.match(nativeRuntime, /requestPermissions/);
  assert.match(nativeRuntime, /PushNotifications/);
  assert.match(nativeServer, /const PREF_TABLE = "ari_signal_preferences"/);
  assert.match(nativeServer, /const DEVICE_TABLE = "ari_push_devices"/);
  assert.match(nativeServer, /quietHoursEnabled/);
  assert.doesNotMatch(migration, /create table[^;]*push_devices/i);
});

test("Circle push outbox is server-only and cannot mutate meetup authority", () => {
  assert.match(migration, /create table if not exists public\.ari_circle_push_deliveries/);
  assert.match(migration, /notification_id uuid not null references public\.ari_circle_notifications\(id\)/);
  assert.match(migration, /revoke all on table public\.ari_circle_push_deliveries from public, anon, authenticated/);
  assert.match(migration, /grant all on table public\.ari_circle_push_deliveries to service_role/);
  assert.match(migration, /after insert on public\.ari_circle_notifications/);
  assert.match(migration, /meetup_request/);
  assert.match(migration, /meetup_accepted/);
  assert.match(migration, /meetup_spot_opened/);
  assert.match(migration, /meetup_cancelled/);
  assert.match(migration, /meetup_reminder/);
  assert.doesNotMatch(migration, /insert into public\.ari_circle_meetups/i);
  assert.doesNotMatch(migration, /update public\.ari_circle_meetups/i);
  assert.doesNotMatch(migration, /insert into public\.ari_circle_meetup_participants/i);
  assert.doesNotMatch(migration, /update public\.ari_circle_meetup_participants/i);
});

test("database dispatch sends only opaque outbox ids and has retry fallback", () => {
  assert.match(migration, /ari-circle-push-dispatch/);
  assert.match(migration, /jsonb_build_object\('deliveryId', delivery_id\)/);
  assert.doesNotMatch(migration, /jsonb_build_object\([^)]*title/i);
  assert.doesNotMatch(migration, /jsonb_build_object\([^)]*body/i);
  assert.match(migration, /ari_circle_retry_pending_native_pushes/);
  assert.match(migration, /ari-circle-native-push-v1-retry/);
  assert.match(migration, /'\*\/5 \* \* \* \*'/);
});

test("dispatcher claims server-owned rows and never accepts recipient or message content from callers", () => {
  assert.match(dispatcher, /const deliveryId = clean\(body\?\.deliveryId/);
  assert.match(dispatcher, /status:\s*"eq\.pending"/);
  assert.match(dispatcher, /loadNotification\(config, claimed\.notification_id\)/);
  assert.match(dispatcher, /notification\.user_id !== claimed\.user_id/);
  assert.match(dispatcher, /circleActivityEnabled/);
  assert.match(dispatcher, /deliverNativePush/);
  assert.doesNotMatch(dispatcher, /body\?\.userId|body\?\.title|body\?\.message|body\?\.token/);
});

test("meetup pushes deep link to coordination surfaces without changing membership", () => {
  assert.match(dispatcher, /meetup_request.*meetup_spot_opened/s);
  assert.match(dispatcher, /ari-circle-meetup\.html\?requests=/);
  assert.match(dispatcher, /meetup_accepted.*meetup_joined.*meetup_reminder.*meetup_verified/s);
  assert.match(dispatcher, /ari-circle-meetup-room\.html\?meetup=/);
  assert.match(dispatcher, /return "ari-circle-meetup\.html"/);
  for (const forbidden of [
    "ari_circle_join_meetup",
    "ari_circle_review_meetup_request",
    "ari_circle_create_meetup",
    "ari_circle_leave_meetup"
  ]) assert.doesNotMatch(dispatcher, new RegExp(forbidden));
});

test("APNs sender uses environment credentials, production topic, and disables invalid tokens", () => {
  assert.match(nativeServer, /APNS_TEAM_ID/);
  assert.match(nativeServer, /APNS_KEY_ID/);
  assert.match(nativeServer, /APNS_AUTH_KEY/);
  assert.match(nativeServer, /APNS_BUNDLE_ID/);
  assert.match(nativeServer, /APNS_ENVIRONMENT/);
  assert.match(nativeServer, /api\.push\.apple\.com/);
  assert.match(nativeServer, /api\.sandbox\.push\.apple\.com/);
  assert.match(nativeServer, /"apns-push-type": "alert"/);
  assert.match(nativeServer, /BadDeviceToken/);
  assert.match(nativeServer, /DeviceTokenNotForTopic/);
  assert.match(nativeServer, /Unregistered/);
  assert.match(nativeServer, /enabled:\s*false/);
});

test("Notification Settings exposes phone push only in the native app and keeps Circle preference independent", () => {
  assert.match(settingsHtml, /id="phoneNotificationCard" hidden/);
  assert.match(settingsHtml, /id="phoneNotificationToggle"/);
  assert.match(settingsHtml, /id="circleNotificationToggle"/);
  assert.match(settingsJs, /window\.AriNativePush/);
  assert.match(settingsJs, /window\.ARI_XP_NATIVE/);
  assert.match(settingsJs, /nativePush\.enable\(\)/);
  assert.match(settingsJs, /nativePush\.disable\(\)/);
  assert.match(settingsJs, /ari_notification_preferences/);
  assert.match(settingsJs, /circle_activity_enabled/);
});

test("iOS sync enables the real Push Notifications capability for debug and App Store release", () => {
  assert.match(packageJson, /"@capacitor\/push-notifications": "8\.1\.2"/);
  assert.match(packageJson, /ios:push-capability/);
  assert.match(packageJson, /cap sync ios && npm run ios:push-capability/);
  assert.match(entitlements, /<key>aps-environment<\/key>/);
  assert.match(entitlements, /\$\(ARI_APS_ENVIRONMENT\)/);
  assert.match(pushCapability, /ARI_APS_ENVIRONMENT", "development"/);
  assert.match(pushCapability, /ARI_APS_ENVIRONMENT", "production"/);
  assert.match(pushCapability, /CODE_SIGN_ENTITLEMENTS/);
  assert.match(pushCapability, /com\.apple\.Push/);
  assert.match(iosWorkflow, /ARI_APS_ENVIRONMENT = production/);
  assert.match(iosWorkflow, /CODE_SIGN_ENTITLEMENTS = App\/App\.entitlements/);
  assert.match(iosWorkflow, /native-push-runtime\.js\?v=1\.0\.0/);
});
