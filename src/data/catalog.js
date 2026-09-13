/**
 * Unified catalog — one consistent list of every body across the app.
 * Merges sunData + celestialBodies + extendedDatabase entries,
 * normalizing shape so SearchResults, ExploreUniverse and InfoPanel
 * all work from the same source.
 */
import { celestialBodies, sunData } from './celestialBodies';
import { EXTENDED_BODIES } from './extendedDatabase';
import { researchData } from './researchDatabase';

const kindOf = (b) => {
  if (b.name === 'Sun') return 'STAR';
  const t = b.type || b.kind || '';
  if (t.includes('MOON')) return 'MOON';
  if (t.includes('DWARF')) return 'DWARF PLANET';
  if (t.includes('COMET')) return 'COMET';
  if (t.includes('ASTEROID')) return 'ASTEROID';
  return 'PLANET';
};

export const CATALOG = [
  ...[sunData, ...celestialBodies].map((b) => ({
    name: b.name,
    kind: kindOf(b),
    parent: b.name === 'Sun' ? null : 'Sun',
    color: b.color,
    palette: b.palette,
    size: b.size,
    bumpiness: b.bumpiness ?? 0.5,
    banded: b.banded,
    rings: b.rings,
    haze: !!(b.atmosphere && (b.atmosphereStrength ?? 0.5) > 0.5),
    elongated: false,
    fact: b.fact,
    deep: b.deep,
    stats: b.stats,
    data: null,
    facts: null,
    isPlanet: true,
  })),
  ...EXTENDED_BODIES.filter((e) => !e.hidden).map((e) => ({
    ...e,
    parent: e.parent || null,
    isPlanet: false,
  })),
];

export const CATALOG_BY_NAME = Object.fromEntries(CATALOG.map((c) => [c.name, c]));

export function searchCatalog(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return CATALOG.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.parent || '').toLowerCase().includes(q) ||
      c.kind.toLowerCase().includes(q)
  );
}

export { researchData };
