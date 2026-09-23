import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const menu = fs.readFileSync("js/ari-circle/circle-menu-v5.js", "utf8");
const authority = fs.readFileSync("assets/css/ari-circle-menu-v5-authority.css", "utf8");

test("Profile primes the same light Circle shell used by member routes", () => {
  assert.match(menu, /const VERSION = "2\.6\.1"/);
  assert.match(menu, /REAL_WORLD_SCRIPT_SRC = "js\/ari-circle\/v5-real-world\.js\?v=5\.4\.0"/);
  assert.match(menu, /function primeProfileV5Theme\(\)/);
  assert.match(menu, /document\.documentElement\.classList\.add\("circle-v5-real-world-root"\)/);
  assert.match(menu, /document\.body\?\.classList\.add\("circle-v5-real-world"\)/);
  assert.match(menu, /themeMeta\.setAttribute\("content", "#f8faff"\)/);
});

test("drawer uses a page-independent final color authority", () => {
  assert.match(menu, /ari-circle-menu-v5-authority\.css\?v=1\.0\.0/);
  assert.match(menu, /function ensureThemeAuthority\(\)/);
  assert.match(menu, /if \(open\) ensureThemeAuthority\(\)/);
  assert.match(authority, /data-circle-v5-portal="true"/);
  assert.match(authority, /color-scheme:\s*light\s*!important/);
  assert.match(authority, /background:\s*rgba\(255, 255, 255, \.985\)\s*!important/);
});

test("drawer groups and rows remain pearl instead of inheriting Profile theme", () => {
  assert.match(authority, /circle-v52-menu-group__items[\s\S]*background:\s*#fff\s*!important/);
  assert.match(authority, /circle-v5-menu__label[\s\S]*color:\s*#1d2b41\s*!important/);
  assert.match(authority, /circle-v5-menu__icon[\s\S]*background:\s*#f8fbff\s*!important/);
  assert.match(authority, /circle-v52-menu-exit[\s\S]*background:\s*#fff\s*!important/);
});
