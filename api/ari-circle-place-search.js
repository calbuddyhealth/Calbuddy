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

function normalizeText(value) {
  return clean(value, 180)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left) return right.length;
  if (!right) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array(right.length + 1);

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1)
      );
    }
    for (let j = 0; j <= right.length; j += 1) previous[j] = current[j];
  }

  return previous[right.length];
}

function milesBetween(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((value) => !Number.isFinite(Number(value)))) return null;
  const toRad = (degrees) => Number(degrees) * Math.PI / 180;
  const dLat = toRad(Number(lat2) - Number(lat1));
  const dLon = toRad(Number(lon2) - Number(lon1));
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 3958.7613 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
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
  if (/peak|mountain|trail|path|hiking|nature_reserve|rock|viewpoint/.test(text)) return 0;
  if (/park|forest|protected_area|recreation/.test(text)) return 1;
  return 2;
}

function hikingScore(item, query, latitude, longitude) {
  const textPenalty = levenshtein(query, item?.name || item?.label) * 3;
  const typePenalty = hikingPriority(item) * 8;
  const miles = milesBetween(latitude, longitude, item?.latitude, item?.longitude);
  const distancePenalty = miles === null ? 0 : Math.min(24, miles / 20);
  return textPenalty + typePenalty + distancePenalty;
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item) return false;
    const key = `${Math.round(item.latitude * 1000)}:${Math.round(item.longitude * 1000)}:${normalizeText(item.name || item.label)}`;
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
  const near = clean(req.query?.near, 100);
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

    if (near) {
      try {
        const localQueryResults = await searchPhoton(`${query} ${near}`, {
          latitude: safeLatitude,
          longitude: safeLongitude,
          limit,
          signal: controller.signal
        });
        results = dedupe([...results, ...localQueryResults]);
      } catch {
        results = dedupe(results);
      }
    }

    if (results.length < Math.min(6, limit)) {
      try {
        const fallbackQuery = near ? `${query}, ${near}` : query;
        const fallback = await searchNominatim(fallbackQuery, { limit, signal: controller.signal });
        results = dedupe([...results, ...fallback]);
      } catch {
        results = dedupe(results);
      }
    } else {
      results = dedupe(results);
    }

    if (category === "hiking") {
      results.sort((a, b) =>
        hikingScore(a, query, safeLatitude, safeLongitude)
        - hikingScore(b, query, safeLatitude, safeLongitude)
      );
    }

    return res.status(200).json({
      scope: "US",
      biased: Boolean(near || (safeLatitude !== null && safeLongitude !== null)),
      near: near || null,
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
