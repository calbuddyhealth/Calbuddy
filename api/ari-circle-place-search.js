const SEARCH_TIMEOUT_MS = 4500;
const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 10;
const APP_USER_AGENT = "CalBuddyHealth-AriCircle/1.0 (https://www.calbuddyhealth.com)";

function clean(value, max = 120) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clampLimit(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(number)));
}

function roundCoordinate(value, digits = 5) {
  const number = finiteNumber(value);
  if (number === null) return null;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

function joinLabel(parts) {
  const seen = new Set();
  return parts
    .map((part) => clean(part, 100))
    .filter(Boolean)
    .filter((part) => {
      const key = part.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(", ")
    .slice(0, 180);
}

function normalizePhotonFeature(feature) {
  const props = feature?.properties || {};
  const coordinates = feature?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

  const longitude = roundCoordinate(coordinates[0]);
  const latitude = roundCoordinate(coordinates[1]);
  if (latitude === null || longitude === null) return null;

  const countryCode = clean(props.countrycode, 8).toUpperCase();
  if (countryCode && countryCode !== "US") return null;

  const name = clean(props.name || props.street || props.locality || props.district || props.city, 120);
  const city = clean(props.city || props.locality || props.county, 100);
  const state = clean(props.state, 100);
  const label = joinLabel([name, city, state]);
  if (!label) return null;

  return {
    label,
    name: name || label,
    city,
    state,
    country: "United States",
    latitude,
    longitude,
    kind: clean(props.osm_value || props.type || props.osm_key, 60) || "place",
    source: "photon"
  };
}

function normalizeNominatimRow(row) {
  const address = row?.address || {};
  const latitude = roundCoordinate(row?.lat);
  const longitude = roundCoordinate(row?.lon);
  if (latitude === null || longitude === null) return null;

  const countryCode = clean(address.country_code, 8).toUpperCase();
  if (countryCode && countryCode !== "US") return null;

  const name = clean(
    row?.namedetails?.name ||
      row?.name ||
      address.peak ||
      address.attraction ||
      address.park ||
      address.path ||
      address.road,
    120
  );
  const city = clean(address.city || address.town || address.village || address.hamlet || address.county, 100);
  const state = clean(address.state, 100);
  const label = joinLabel([name || row?.display_name, city, state]);
  if (!label) return null;

  return {
    label,
    name: name || label,
    city,
    state,
    country: "United States",
    latitude,
    longitude,
    kind: clean(row?.type || row?.category, 60) || "place",
    source: "nominatim"
  };
}

function hikingPriority(item) {
  const text = `${item?.kind || ""} ${item?.label || ""}`.toLowerCase();
  if (/peak|mountain|trail|path|hiking|nature_reserve/.test(text)) return 0;
  if (/park|forest|protected_area|recreation/.test(text)) return 1;
  return 2;
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item) return false;
    const key = `${Math.round(item.latitude * 1000)}:${Math.round(item.longitude * 1000)}:${item.label.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchJson(url, signal) {
  const response = await fetch(url, {
    signal,
    headers: {
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": APP_USER_AGENT
    }
  });
  if (!response.ok) throw new Error(`Place provider returned ${response.status}`);
  return response.json();
}

async function searchPhoton(query, { latitude, longitude, limit, signal }) {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("lang", "en");
  if (latitude !== null && longitude !== null) {
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
  }

  const payload = await fetchJson(url, signal);
  return Array.isArray(payload?.features)
    ? payload.features.map(normalizePhotonFeature).filter(Boolean)
    : [];
}

async function searchNominatim(query, { limit, signal }) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", query);
  url.searchParams.set("countrycodes", "us");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("namedetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("dedupe", "1");
  url.searchParams.set("limit", String(limit));

  const payload = await fetchJson(url, signal);
  return Array.isArray(payload)
    ? payload.map(normalizeNominatimRow).filter(Boolean)
    : [];
}

export default async function handler(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "public, max-age=30, s-maxage=900, stale-while-revalidate=86400");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const query = clean(req.query?.q, 100);
  if (query.length < 2) return res.status(200).json({ results: [] });

  const limit = clampLimit(req.query?.limit);
  const category = clean(req.query?.category, 40).toLowerCase();
  const latitude = finiteNumber(req.query?.lat);
  const longitude = finiteNumber(req.query?.lon);
  const safeLatitude = latitude !== null && latitude >= -90 && latitude <= 90 ? latitude : null;
  const safeLongitude = longitude !== null && longitude >= -180 && longitude <= 180 ? longitude : null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    let results = [];
    try {
      results = await searchPhoton(query, {
        latitude: safeLatitude,
        longitude: safeLongitude,
        limit,
        signal: controller.signal
      });
    } catch {
      results = [];
    }

    if (results.length < Math.min(4, limit)) {
      try {
        const fallback = await searchNominatim(query, { limit, signal: controller.signal });
        results = dedupe([...results, ...fallback]);
      } catch {
        results = dedupe(results);
      }
    } else {
      results = dedupe(results);
    }

    if (category === "hiking") {
      results.sort((a, b) => hikingPriority(a) - hikingPriority(b));
    }

    return res.status(200).json({
      scope: "US",
      biased: safeLatitude !== null && safeLongitude !== null,
      results: results.slice(0, limit)
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      return res.status(504).json({ error: "Place search timed out" });
    }
    return res.status(502).json({ error: "Place search is unavailable right now" });
  } finally {
    clearTimeout(timeout);
  }
}
