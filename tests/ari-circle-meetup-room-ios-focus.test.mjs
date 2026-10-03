import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const roomHtml = fs.readFileSync("ari-circle-meetup-room.html", "utf8");
const focusCss = fs.readFileSync("assets/css/ari-circle-meetup-room-ios-focus.css", "utf8");

test("Meetup Room prevents iOS form-focus auto zoom without disabling user zoom", () => {
  assert.match(roomHtml, /ari-circle-meetup-room-ios-focus\.css\?v=1\.0\.0/);
  assert.match(focusCss, /meetup-room-point-form \.circle-v5-input/);
  assert.match(focusCss, /meetup-room-composer textarea/);
  assert.match(focusCss, /font-size:\s*16px\s*!important/);
  const viewportContent = roomHtml.match(/<meta\s+name="viewport"\s+content="([^"]+)"/i)?.[1];
  assert.ok(viewportContent, "a viewport declaration must be present");
  const viewport = Object.fromEntries(viewportContent.toLowerCase().split(",")
    .map((entry) => entry.trim().split(/\s*=\s*/)));
  assert.equal(viewport.width, "device-width");
  assert.ok(!["no", "0"].includes(viewport["user-scalable"]), "pinch zoom must stay enabled");
  assert.ok(viewport["maximum-scale"] === undefined || Number(viewport["maximum-scale"]) >= 5,
    "an explicit maximum scale must allow at least fivefold zoom");
});
