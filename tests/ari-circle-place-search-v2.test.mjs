import assert from "node:assert/strict";
import test from "node:test";
import handler from "../api/ari-circle-place-search-v2.js";

function response() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function place(name, countrycode = "US", coordinates = [-117.03, 32.81]) {
  return {
    geometry: { coordinates },
    properties: { name, city: "San Diego", state: "California", countrycode, osm_value: "peak" }
  };
}

test("destination search rejects writes and ignores short queries without contacting the provider", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("The provider must not be called");
  });
  const rejected = response();
  await handler({ method: "POST", query: { q: "Cowles Mountain" } }, rejected);
  assert.equal(rejected.statusCode, 405);
  assert.equal(rejected.headers.Allow, "GET");

  for (const query of [{}, { q: " " }, { q: " a " }]) {
    const res = response();
    await handler({ method: "GET", query }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { results: [] });
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("destination search uses a fixed provider and a bounded default request without a location bias", async (t) => {
  let requested;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    requested = new URL(url);
    assert.equal(options.headers.Accept, "application/json");
    assert.ok(options.signal instanceof AbortSignal);
    return { ok: true, json: async () => ({ features: [] }) };
  });
  const res = response();
  await handler({ method: "GET", query: { q: "  Cowles   Mountain  ", url: "https://example.invalid" } }, res);
  assert.equal(requested.origin, "https://photon.komoot.io");
  assert.equal(requested.pathname, "/api/");
  assert.equal(requested.searchParams.get("q"), "Cowles Mountain");
  assert.equal(requested.searchParams.get("limit"), "6");
  assert.equal(requested.searchParams.has("lat"), false);
  assert.equal(requested.searchParams.has("lon"), false);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["X-Content-Type-Options"], "nosniff");
  assert.match(res.headers["Cache-Control"], /s-maxage=600/);
});

test("destination search bounds the result count and only forwards a valid complete location bias", async (t) => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    requests.push(new URL(url));
    return { ok: true, json: async () => ({ features: Array.from({ length: 12 }, (_, i) => place(`Trail ${i}`)) }) };
  });
  for (const [limit, expected] of [["100", 8], ["2.9", 2], ["-1", 1], ["invalid", 6]]) {
    const res = response();
    await handler({ method: "GET", query: { q: "Trail", limit, lat: "32.81", lon: "-117.03" } }, res);
    assert.equal(res.body.results.length, expected);
    assert.equal(requests.at(-1).searchParams.get("limit"), String(expected));
    assert.equal(requests.at(-1).searchParams.get("lat"), "32.81");
    assert.equal(requests.at(-1).searchParams.get("lon"), "-117.03");
  }
  for (const bias of [{ lat: "91", lon: "0" }, { lat: "0", lon: "181" }, { lat: "invalid", lon: "0" }, { lat: "32.81" }]) {
    await handler({ method: "GET", query: { q: "Trail", ...bias } }, response());
    assert.equal(requests.at(-1).searchParams.has("lat"), false);
    assert.equal(requests.at(-1).searchParams.has("lon"), false);
  }
});

test("destination search normalizes US places and excludes unusable or foreign results", async (t) => {
  t.mock.method(globalThis, "fetch", async () => ({
    ok: true,
    json: async () => ({ features: [
      null,
      place("Foreign trail", "CA"),
      place("Invalid coordinates", "US", ["not-a-number", 32.81]),
      { geometry: { coordinates: [-117, 32] }, properties: {} },
      place("  Cowles   Mountain  ", "us"),
      place("Potato Chip Rock")
    ] })
  }));
  const res = response();
  await handler({ method: "GET", query: { q: "Mountain" } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.results, [
    { label: "Cowles Mountain, San Diego, California", latitude: 32.81, longitude: -117.03, kind: "peak" },
    { label: "Potato Chip Rock, San Diego, California", latitude: 32.81, longitude: -117.03, kind: "peak" }
  ]);
});

test("destination provider failures return bounded errors without leaking provider details", async (t) => {
  for (const [name, fetchImpl, statusCode, error] of [
    ["upstream failure", async () => ({ ok: false, status: 429 }), 502, "Destination search is unavailable right now"],
    ["network failure", async () => { throw new Error("private provider detail"); }, 502, "Destination search is unavailable right now"],
    ["invalid JSON", async () => ({ ok: true, json: async () => { throw new SyntaxError("private provider detail"); } }), 502, "Destination search is unavailable right now"]
  ]) {
    await t.test(name, async (t) => {
      t.mock.method(globalThis, "fetch", fetchImpl);
      const res = response();
      await handler({ method: "GET", query: { q: "Trail" } }, res);
      assert.equal(res.statusCode, statusCode);
      assert.deepEqual(res.body, { error });
    });
  }
});

test("destination search aborts a stalled provider request and returns a timeout", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let signal;
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    signal = options.signal;
    return new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
    });
  });
  const res = response();
  const pending = handler({ method: "GET", query: { q: "Trail" } }, res);
  t.mock.timers.tick(3500);
  await pending;
  assert.equal(signal.aborted, true);
  assert.equal(res.statusCode, 504);
  assert.deepEqual(res.body, { error: "Destination search timed out" });
});
