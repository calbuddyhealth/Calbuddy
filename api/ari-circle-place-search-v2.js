const ENDPOINT = "https://photon.komoot.io/api/";
const TIMEOUT_MS = 3500;
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 8;

function clean(value, max = 120) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function limitValue(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(number)));
}

function labelFor(props = {}) {
  const parts = [
    props.name || props.street || props.locality || props.district,
    props.city || props.locality || props.county,
    props.state
  ]
    .map((part) => clean(part, 100))
    .filter(Boolean);

  return [...new Set(parts)].join(", ").slice(0, 180);
}

function normalize(feature) {
  const props = feature?.properties || {};
  const coordinates = feature?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

  const longitude = finite(coordinates[0]);
  const latitude = finite(coordinates[1]);
  if (latitude === null || longitude === null) return null;

  const countryCode = clean(props.countrycode, 8).toUpperCase();
  if (countryCode && countryCode !== "US") return null;

  const label = labelFor(props);
  if (!label) return null;

  return {
    label,
    latitude,
    longitude,
    kind: clean(props.osm_value || props.type || props.osm_key, 60) || "place"
  };
}

export default async function handler(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "public, max-age=30, s-maxage=600, stale-while-revalidate=3600");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const query = clean(req.query?.q, 100);
  if (query.length < 2) return res.status(200).json({ results: [] });

  const limit = limitValue(req.query?.limit);
  const latitude = finite(req.query?.lat);
  const longitude = finite(req.query?.lon);
  const safeLatitude = latitude !== null && latitude >= -90 && latitude <= 90 ? latitude : null;
  const safeLongitude = longitude !== null && longitude >= -180 && longitude <= 180 ? longitude : null;

  const url = new URL(ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("lang", "en");
  url.searchParams.set("limit", String(limit));
  if (safeLatitude !== null && safeLongitude !== null) {
    url.searchParams.set("lat", String(safeLatitude));
    url.searchParams.set("lon", String(safeLongitude));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Destination search is unavailable right now" });
    }

    const payload = await response.json();
    const results = Array.isArray(payload?.features)
      ? payload.features.map(normalize).filter(Boolean).slice(0, limit)
      : [];

    return res.status(200).json({ results });
  } catch (error) {
    const timedOut = error?.name === "AbortError";
    return res.status(timedOut ? 504 : 502).json({
      error: timedOut ? "Destination search timed out" : "Destination search is unavailable right now"
    });
  } finally {
    clearTimeout(timeout);
  }
}
