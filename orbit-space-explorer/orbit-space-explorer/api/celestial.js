// api/celestial.js
//
// A single combined backend endpoint: GET /api/celestial?name=<query>
//
// Given the name of ANY celestial body (a solar-system planet/moon/asteroid,
// a star, a galaxy, an exoplanet, whatever), this looks it up across three
// real, free, keyless public data sources and returns one unified JSON
// object with a summary, physical/orbital stats (when available), a small
// gallery of real space-agency photography, and hints for rendering a
// simple 3D model of it.
//
// Data sources used:
//   1. The Solar System OpenData API (api.le-systeme-solaire.net)
//      -> physical & orbital data for solar-system bodies.
//   2. NASA Image and Video Library (images-api.nasa.gov)
//      -> real photography/imagery from NASA's archives.
//   3. Wikipedia REST API (en.wikipedia.org/api/rest_v1)
//      -> a short description for anything not in the solar system data
//         (stars, galaxies, exoplanets, etc.), with a link to the source.
//
// This file is deployed automatically by Vercel as a serverless function
// because it lives under /api — no extra configuration needed.

const SOLAR_SYSTEM_BODIES_URL = 'https://api.le-systeme-solaire.net/rest/bodies/';
const NASA_IMAGES_SEARCH_URL = 'https://images-api.nasa.gov/search';
const WIKIPEDIA_SEARCH_URL = 'https://en.wikipedia.org/w/api.php';
const WIKIPEDIA_SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary';

const EARTH_RADIUS_KM = 6371;

// A small in-memory cache so repeated searches (and the ~400-entry solar
// system body list in particular) don't re-fetch on every request within
// the same warm serverless instance. Cleared whenever the instance recycles.
let solarSystemBodyListCache = null;

export default async function handler(req, res) {
  const rawName = (req.query.name || '').toString().trim();

  if (!rawName) {
    res.status(400).json({ error: 'missing_name', message: 'Pass ?name=<celestial body>' });
    return;
  }

  const [solarResult, nasaResult, wikiResult] = await Promise.allSettled([
    findSolarSystemBody(rawName),
    fetchNasaImages(rawName),
    fetchWikipediaSummary(rawName),
  ]);

  const solar = solarResult.status === 'fulfilled' ? solarResult.value : null;
  const images = nasaResult.status === 'fulfilled' ? nasaResult.value : [];
  const wiki = wikiResult.status === 'fulfilled' ? wikiResult.value : null;

  if (!solar && !wiki && images.length === 0) {
    res.status(404).json({ error: 'not_found', query: rawName });
    return;
  }

  const name = solar?.englishName || wiki?.title || rawName;
  const type = guessType(solar, wiki);

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).json({
    query: rawName,
    name,
    type,
    summary: wiki?.extract || null,
    summarySource: wiki ? 'Wikipedia' : null,
    summaryUrl: wiki?.pageUrl || null,
    stats: solar ? buildStats(solar) : [],
    statsSource: solar ? 'The Solar System OpenData API' : null,
    images,
    imagesSource: images.length ? 'NASA Image and Video Library' : null,
    render: buildRenderHints(solar, type),
  });
}

// ---------- Solar System OpenData ----------

async function getSolarSystemBodyList() {
  if (solarSystemBodyListCache) return solarSystemBodyListCache;
  const response = await fetch(SOLAR_SYSTEM_BODIES_URL);
  if (!response.ok) throw new Error(`solar system API responded ${response.status}`);
  const data = await response.json();
  solarSystemBodyListCache = data.bodies || [];
  return solarSystemBodyListCache;
}

async function findSolarSystemBody(rawName) {
  const bodies = await getSolarSystemBodyList();
  const needle = rawName.toLowerCase();

  const exact = bodies.find(
    (b) => b.englishName?.toLowerCase() === needle || b.name?.toLowerCase() === needle
  );
  if (exact) return exact;

  return bodies.find((b) => b.englishName?.toLowerCase().includes(needle)) || null;
}

function buildStats(solar) {
  const stats = [];

  if (solar.bodyType) stats.push({ label: 'Body type', value: solar.bodyType });
  if (solar.meanRadius) stats.push({ label: 'Mean radius', value: `${formatNumber(solar.meanRadius)} km` });
  if (solar.mass?.massValue) {
    stats.push({ label: 'Mass', value: `${solar.mass.massValue} × 10^${solar.mass.massExponent} kg` });
  }
  if (solar.gravity) stats.push({ label: 'Surface gravity', value: `${solar.gravity} m/s²` });
  if (solar.density) stats.push({ label: 'Density', value: `${solar.density} g/cm³` });
  if (solar.sideralOrbit) stats.push({ label: 'Orbital period', value: `${formatNumber(solar.sideralOrbit)} days` });
  if (solar.sideralRotation) {
    stats.push({ label: 'Rotation period', value: `${formatNumber(solar.sideralRotation)} hours` });
  }
  if (solar.semimajorAxis) {
    stats.push({ label: 'Distance from parent', value: `${formatNumber(solar.semimajorAxis)} km` });
  }
  if (typeof solar.avgTemp === 'number' && solar.avgTemp > 0) {
    stats.push({ label: 'Average temperature', value: `${solar.avgTemp} K (${(solar.avgTemp - 273.15).toFixed(0)} °C)` });
  }
  if (Array.isArray(solar.moons)) stats.push({ label: 'Known moons', value: String(solar.moons.length) });
  if (solar.discoveredBy) stats.push({ label: 'Discovered by', value: solar.discoveredBy });
  if (solar.discoveryDate) stats.push({ label: 'Discovery date', value: solar.discoveryDate });

  return stats;
}

function formatNumber(value) {
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// ---------- NASA Image and Video Library ----------

async function fetchNasaImages(rawName) {
  const url = `${NASA_IMAGES_SEARCH_URL}?q=${encodeURIComponent(rawName)}&media_type=image&page_size=6`;
  const response = await fetch(url);
  if (!response.ok) return [];

  const data = await response.json();
  const items = data?.collection?.items || [];

  return items.slice(0, 6).map((item) => {
    const meta = item.data?.[0] || {};
    const links = item.links || [];
    const bestLink =
      links.find((l) => l.rel === 'canonical') ||
      links.find((l) => l.rel === 'preview') ||
      links[0];

    return {
      url: bestLink?.href || null,
      title: meta.title || rawName,
      credit: meta.center ? `NASA / ${meta.center}` : 'NASA',
    };
  }).filter((image) => image.url);
}

// ---------- Wikipedia ----------

async function fetchWikipediaSummary(rawName) {
  const direct = await tryWikipediaSummary(rawName);
  if (direct) return direct;

  const resolvedTitle = await resolveWikipediaTitle(rawName);
  if (!resolvedTitle) return null;

  return tryWikipediaSummary(resolvedTitle);
}

async function tryWikipediaSummary(title) {
  const response = await fetch(`${WIKIPEDIA_SUMMARY_URL}/${encodeURIComponent(title)}`);
  if (!response.ok) return null;

  const data = await response.json();
  if (!data.extract) return null;

  return {
    title: data.title,
    extract: data.extract,
    pageUrl: data.content_urls?.desktop?.page || null,
  };
}

async function resolveWikipediaTitle(rawName) {
  const url = `${WIKIPEDIA_SEARCH_URL}?action=query&list=search&srsearch=${encodeURIComponent(
    rawName
  )}&format=json&origin=*`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const firstResult = data?.query?.search?.[0];
  return firstResult?.title || null;
}

// ---------- Combining into type + render hints ----------

function guessType(solar, wiki) {
  if (solar?.bodyType) return solar.bodyType;

  const text = `${wiki?.extract || ''}`.toLowerCase();
  if (text.includes('galaxy')) return 'Galaxy';
  if (text.includes('exoplanet') || text.includes('extrasolar planet')) return 'Exoplanet';
  if (text.includes('nebula')) return 'Nebula';
  if (text.includes('star') || text.includes('sun')) return 'Star';
  if (text.includes('asteroid')) return 'Asteroid';
  if (text.includes('comet')) return 'Comet';
  if (text.includes('moon') || text.includes('natural satellite')) return 'Moon';
  if (text.includes('planet')) return 'Planet';

  return 'Celestial object';
}

const PALETTE_BY_TYPE = {
  Planet: '#7fa7d6',
  'Dwarf Planet': '#b79a7d',
  Moon: '#b8b8b8',
  Asteroid: '#8a7f6b',
  Comet: '#8edcff',
  Star: '#ffcf6b',
  Galaxy: '#8fa8ff',
  Nebula: '#c98fdd',
  Exoplanet: '#6fd6a8',
};

function buildRenderHints(solar, type) {
  const isStar = type === 'Star';
  const color = PALETTE_BY_TYPE[type] || '#7fa7d6';

  let sizeScale = 1.2;
  if (solar?.meanRadius) {
    sizeScale = clamp(solar.meanRadius / EARTH_RADIUS_KM, 0.35, 3);
  } else if (isStar) {
    sizeScale = 1.8;
  } else if (type === 'Galaxy' || type === 'Nebula') {
    sizeScale = 2.2;
  } else if (type === 'Asteroid' || type === 'Comet') {
    sizeScale = 0.6;
  }

  const hasRings = /saturn|uranus/i.test(solar?.englishName || '');
  const banded = /jupiter|saturn|uranus|neptune/i.test(solar?.englishName || '');

  return { color, sizeScale, hasRings, isStar, banded };
}
