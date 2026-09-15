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
  assert.doesNotMatch(roomHtml, /maximum-scale\s*=|user-scalable\s*=\s*no/i);
});
