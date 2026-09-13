/**
 * Hyperreal photo sources for solar system bodies.
 * Primary: NASA/ESA public-domain imagery hosted on Wikimedia Commons
 * (via Special:FilePath, which resolves to the actual image file and
 * supports on-the-fly thumbnailing — reliable and hotlink-friendly).
 * Fallback: Special:Search (returns best match) — SmartPhoto falls back
 * to the procedural 3D-style render if load fails entirely.
 */

const WIKI = 'https://commons.wikimedia.org/wiki/Special:FilePath';

// Hand-picked canonical images (the most iconic photo of each body)
const PHOTO_FILES = {
  Sun: 'The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819-02.jpg',
  Mercury: 'Mercury_in_color_-_Prockter07-edit1.jpg',
  Venus: 'Venus-real_color.jpg',
  Earth: 'The_Earth_seen_from_Apollo_17.jpg',
  Mars: 'OSIRIS_Mars_true_color.jpg',
  Jupiter: 'Jupiter_and_its_shrunken_Great_Red_Spot.jpg',
  Saturn: 'Saturn_during_Equinox.jpg',
  Uranus: 'Uranus2.jpg',
  Neptune: 'Neptune_-_Voyager_2_(29347980845)_flatten_crop.jpg',
  Pluto: 'Pluto_in_True_Color_-_High-Res.jpg',

  // Moons
  Moon: 'FullMoon2010.jpg',
  Phobos: 'Phobos_colour_2008.jpg',
  Deimos: 'Deimos-MRO.jpg',
  Io: 'Io_highest_resolution_true_color.jpg',
  Europa: 'Europa-moon-with-margins.jpg',
  Ganymede: 'Ganymede_-_Perijove_34_Composite.png',
  Callisto: 'Callisto_-_July_8_1979_(39292609651).jpg',
  Titan: 'Titan_in_true_color.jpg',
  Enceladus: 'Enceladus_2018.jpg',
  Iapetus: 'Iapetus_as_seen_by_the_Cassini_probe-20070910.jpg',
  Miranda: 'Miranda_in_true_color.jpg',
  Titania: 'Titania_(moon)_color.png',
  Triton: 'Triton_(moon)_in_natural_colour.png',
  Charon: 'Charon_(moon)_color.png',

  // Dwarf planets
  Ceres: 'Ceres_-_False_Color_Map_(5932840672).jpg',
  Eris: 'Eris_-_HST.png',
  Haumea: 'Haumea.png',
  Makemake: 'Makemake_-_HST_(2008).png',

  // Comets
  "Halley's Comet": 'Lspn_comet_halley.jpg',
  "Encke's Comet": 'Comet_Encke.jpg',
  '67P/Churyumov–Gerasimenko': '67P-Churyumov-Gerasimenko-Rosetta-navcam-20140803.jpg',

  // Asteroids
  Vesta: 'Vesta_true_color.jpg',
  Pallas: 'Pallas_VLT.jpg',
  Bennu: 'OSIRIS-REx_Bennu_mosaic.png',
};

/**
 * Build the photo URL for a body.
 * @param {string} name  Body name as in the databases
 * @param {number} width Desired thumbnail width (default 640)
 */
export function getPhotoUrl(name, width = 640) {
  const file = PHOTO_FILES[name];
  if (file) return `${WIKI}/${file}?width=${width}`;
  // graceful search fallback (returns best-matching file)
  return `${WIKI}/Special:Search?search=${encodeURIComponent(name + ' moon planet')}&width=${width}`;
}

export function hasPhoto(name) {
  return !!PHOTO_FILES[name];
}
