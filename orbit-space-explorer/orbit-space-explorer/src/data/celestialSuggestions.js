// A broad, curated list of real celestial bodies used to power search
// suggestions in the Universe Explorer. This is just a list of names to
// suggest — the actual data for whichever one gets searched still comes
// live from /api/celestial.

export const celestialSuggestions = [
  // Planets
  { name: 'Mercury', category: 'Planets' },
  { name: 'Venus', category: 'Planets' },
  { name: 'Earth', category: 'Planets' },
  { name: 'Mars', category: 'Planets' },
  { name: 'Jupiter', category: 'Planets' },
  { name: 'Saturn', category: 'Planets' },
  { name: 'Uranus', category: 'Planets' },
  { name: 'Neptune', category: 'Planets' },

  // Dwarf planets
  { name: 'Pluto', category: 'Dwarf planets' },
  { name: 'Ceres', category: 'Dwarf planets' },
  { name: 'Eris', category: 'Dwarf planets' },
  { name: 'Haumea', category: 'Dwarf planets' },
  { name: 'Makemake', category: 'Dwarf planets' },
  { name: 'Sedna', category: 'Dwarf planets' },
  { name: 'Quaoar', category: 'Dwarf planets' },

  // Moons
  { name: 'Moon', category: 'Moons' },
  { name: 'Io', category: 'Moons' },
  { name: 'Europa', category: 'Moons' },
  { name: 'Ganymede', category: 'Moons' },
  { name: 'Callisto', category: 'Moons' },
  { name: 'Titan', category: 'Moons' },
  { name: 'Enceladus', category: 'Moons' },
  { name: 'Mimas', category: 'Moons' },
  { name: 'Rhea', category: 'Moons' },
  { name: 'Iapetus', category: 'Moons' },
  { name: 'Dione', category: 'Moons' },
  { name: 'Tethys', category: 'Moons' },
  { name: 'Titania', category: 'Moons' },
  { name: 'Oberon', category: 'Moons' },
  { name: 'Miranda', category: 'Moons' },
  { name: 'Ariel', category: 'Moons' },
  { name: 'Umbriel', category: 'Moons' },
  { name: 'Triton', category: 'Moons' },
  { name: 'Charon', category: 'Moons' },
  { name: 'Phobos', category: 'Moons' },
  { name: 'Deimos', category: 'Moons' },

  // Asteroids & comets
  { name: 'Vesta', category: 'Asteroids & comets' },
  { name: 'Pallas', category: 'Asteroids & comets' },
  { name: 'Hygiea', category: 'Asteroids & comets' },
  { name: 'Bennu', category: 'Asteroids & comets' },
  { name: 'Ryugu', category: 'Asteroids & comets' },
  { name: 'Eros', category: 'Asteroids & comets' },
  { name: "Halley's Comet", category: 'Asteroids & comets' },
  { name: 'Hale-Bopp', category: 'Asteroids & comets' },
  { name: 'NEOWISE', category: 'Asteroids & comets' },
  { name: 'Oumuamua', category: 'Asteroids & comets' },

  // Stars
  { name: 'Sun', category: 'Stars' },
  { name: 'Sirius', category: 'Stars' },
  { name: 'Betelgeuse', category: 'Stars' },
  { name: 'Rigel', category: 'Stars' },
  { name: 'Proxima Centauri', category: 'Stars' },
  { name: 'Alpha Centauri', category: 'Stars' },
  { name: 'Vega', category: 'Stars' },
  { name: 'Polaris', category: 'Stars' },
  { name: 'Antares', category: 'Stars' },
  { name: 'Aldebaran', category: 'Stars' },
  { name: 'Canopus', category: 'Stars' },
  { name: 'Arcturus', category: 'Stars' },
  { name: 'Deneb', category: 'Stars' },
  { name: 'Altair', category: 'Stars' },
  { name: 'Pollux', category: 'Stars' },
  { name: 'Regulus', category: 'Stars' },
  { name: 'Spica', category: 'Stars' },
  { name: 'Capella', category: 'Stars' },
  { name: 'Bellatrix', category: 'Stars' },

  // Galaxies
  { name: 'Milky Way', category: 'Galaxies' },
  { name: 'Andromeda Galaxy', category: 'Galaxies' },
  { name: 'Triangulum Galaxy', category: 'Galaxies' },
  { name: 'Whirlpool Galaxy', category: 'Galaxies' },
  { name: 'Sombrero Galaxy', category: 'Galaxies' },
  { name: 'Large Magellanic Cloud', category: 'Galaxies' },
  { name: 'Small Magellanic Cloud', category: 'Galaxies' },
  { name: 'Cartwheel Galaxy', category: 'Galaxies' },
  { name: 'Black Eye Galaxy', category: 'Galaxies' },
  { name: 'Pinwheel Galaxy', category: 'Galaxies' },

  // Nebulae & deep sky
  { name: 'Orion Nebula', category: 'Nebulae & deep sky' },
  { name: 'Crab Nebula', category: 'Nebulae & deep sky' },
  { name: 'Eagle Nebula', category: 'Nebulae & deep sky' },
  { name: 'Helix Nebula', category: 'Nebulae & deep sky' },
  { name: 'Ring Nebula', category: 'Nebulae & deep sky' },
  { name: 'Horsehead Nebula', category: 'Nebulae & deep sky' },
  { name: 'Pillars of Creation', category: 'Nebulae & deep sky' },
  { name: 'Butterfly Nebula', category: 'Nebulae & deep sky' },

  // Exoplanets
  { name: 'Proxima Centauri b', category: 'Exoplanets' },
  { name: 'Kepler-186f', category: 'Exoplanets' },
  { name: 'TRAPPIST-1e', category: 'Exoplanets' },
  { name: 'HD 209458 b', category: 'Exoplanets' },
  { name: '51 Pegasi b', category: 'Exoplanets' },
  { name: 'Gliese 667 Cc', category: 'Exoplanets' },
  { name: 'WASP-12b', category: 'Exoplanets' },
];
