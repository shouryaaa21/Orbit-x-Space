/**
 * Keplerian orbital mechanics engine.
 * Uses JPL J2000 osculating elements with secular rates to compute
 * heliocentric ecliptic positions for every body in the solar system.
 *
 * Reference: JPL Solar System Dynamics — "Keplerian Elements for Approximate
 * Positions of the Major Planets" (Standish & Williams, 2012).
 */

const DEG = Math.PI / 180;

// Julian Date of the J2000.0 epoch: 2000-Jan-01 12:00 TT
export const J2000 = 2451545.0;

/**
 * JPL Keplerian elements at J2000.0 + rates per Julian century.
 * { a(AU), e, I(°), L(° mean long), wBar(° long peri), Omega(° long node),
 *   + da, de, dI, dL, dwBar, dOmega (per century) }
 */
const ELEMENTS = {
  Sun: null, // stays at origin
  Mercury: {
    a: 0.38709927, e: 0.20563593, I: 7.00497902,
    L: 252.25032350, wBar: 77.45779628, Omega: 48.33076593,
    da: 0.00000037, de: 0.00001906, dI: -0.00594749,
    dL: 149472.67411175, dwBar: 0.16047689, dOmega: -0.12534081,
  },
  Venus: {
    a: 0.72333566, e: 0.00677672, I: 3.39467605,
    L: 181.97909950, wBar: 131.60246718, Omega: 76.67984255,
    da: 0.00000390, de: -0.00004107, dI: -0.00078890,
    dL: 58517.81538729, dwBar: 0.00268329, dOmega: -0.27769418,
  },
  Earth: {
    a: 1.00000261, e: 0.01671123, I: -0.00001531,
    L: 100.46457166, wBar: 102.93768193, Omega: 0.0,
    da: 0.00000562, de: -0.00004392, dI: -0.01294668,
    dL: 35999.37244981, dwBar: 0.32327364, dOmega: 0.0,
  },
  Mars: {
    a: 1.52371034, e: 0.09339410, I: 1.84969142,
    L: -4.55343205, wBar: -23.94362959, Omega: 49.55953891,
    da: 0.00001847, de: 0.00007882, dI: -0.00813131,
    dL: 19140.30268499, dwBar: 0.44441088, dOmega: -0.29257343,
  },
  Jupiter: {
    a: 5.20288700, e: 0.04838624, I: 1.30439695,
    L: 34.39644051, wBar: 14.72847983, Omega: 100.47390909,
    da: -0.00011607, de: -0.00013253, dI: -0.00183714,
    dL: 3034.74612775, dwBar: 0.21252668, dOmega: 0.20469106,
  },
  Saturn: {
    a: 9.53667594, e: 0.05386179, I: 2.48599187,
    L: 49.95424421, wBar: 92.59887831, Omega: 113.66242448,
    da: -0.00125060, de: -0.00050991, dI: 0.00193609,
    dL: 1222.49362201, dwBar: -0.41897216, dOmega: -0.28867794,
  },
  Uranus: {
    a: 19.18916464, e: 0.04725744, I: 0.77263783,
    L: 313.23810451, wBar: 170.95427630, Omega: 74.01692503,
    da: -0.00196176, de: -0.00004397, dI: -0.00242939,
    dL: 428.48202785, dwBar: 0.40805281, dOmega: 0.04240589,
  },
  Neptune: {
    a: 30.06992276, e: 0.00859048, I: 1.77004347,
    L: -55.12002969, wBar: 44.96476227, Omega: 131.78422574,
    da: -0.00026291, de: 0.00005105, dI: 0.00005372,
    dL: 218.45945325, dwBar: -0.32241464, dOmega: -0.00508664,
  },
  Pluto: {
    a: 39.48211675, e: 0.24882730, I: 17.14001206,
    L: 238.92903833, wBar: 224.06891629, Omega: 110.30393684,
    da: -0.00031596, de: 0.00005170, dI: 0.00004818,
    dL: 145.20780515, dwBar: -0.04062942, dOmega: -0.01183482,
  },
};

/* ---------- distance compression ---------- */

/**
 * Compress AU to scene units using a power law.
 * Mercury (0.387 AU) must clear the Sun radius (~1.8 scene units).
 * Formula: pow(au, 0.55) * 6 → Mercury at ~3.65, Earth at 6.0, Neptune at ~38.
 */
export function auToScene(au) {
  if (au <= 0) return 0;
  return Math.pow(au, 0.55) * 6;
}

/**
 * Reverse: scene units → AU (approximate, for scale labels).
 */
export function sceneToAu(scene) {
  if (scene <= 0) return 0;
  return Math.pow(scene / 6, 1 / 0.55);
}

/**
 * Compress a heliocentric ecliptic vector (AU) to scene space.
 * IMPORTANT: compresses the DISTANCE (magnitude), preserving direction.
 * Never apply auToScene() to individual components — negative components
 * produce NaN, which throws bodies at the origin (into the Sun).
 *
 * Returns [x, y, z] in scene space where ecliptic z → scene y (up).
 */
export function compressEcliptic(x, y, z) {
  const r = Math.sqrt(x * x + y * y + z * z);
  if (r === 0 || !isFinite(r)) return [0, 0, 0];
  const scale = auToScene(r) / r;
  return [x * scale, z * scale, y * scale];
}

/* ---------- Julian date helpers ---------- */

/** JavaScript Date → Julian Date. */
export function dateToJD(date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d =
    date.getUTCDate() +
    date.getUTCHours() / 24 +
    date.getUTCMinutes() / 1440 +
    date.getUTCSeconds() / 86400;
  const Y = m <= 2 ? y - 1 : y;
  const M = m <= 2 ? m + 12 : m;
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (Y + 4716)) +
    Math.floor(30.6001 * (M + 1)) +
    d +
    B -
    1524.5
  );
}

/** Julian Date → JavaScript Date. */
export function jdToDate(jd) {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;
  let a = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const day = b - d - Math.floor(30.6001 * e) + f;
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  return new Date(Date.UTC(year, month - 1, day));
}

/** Format JD as a readable date string. */
export function jdToDateStr(jd) {
  const d = jdToDate(jd);
  return d.toISOString().slice(0, 10);
}

/* ---------- Kepler solver ---------- */

/**
 * Solve Kepler's equation  M = E − e sin E  via Newton-Raphson.
 * M in radians, returns E in radians.
 */
export function solveKepler(M, e, tol = 1e-9) {
  let E = M;
  for (let i = 0; i < 40; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < tol) break;
  }
  return E;
}

/* ---------- position from elements ---------- */

/**
 * Compute heliocentric ecliptic position (AU) for a named body at Julian Date.
 * Returns { x, y, z } in ecliptic coords (x → vernal equinox, z → north ecliptic pole).
 */
export function getHeliocentricEcliptic(bodyName, jd) {
  const el = ELEMENTS[bodyName];
  if (!el) return { x: 0, y: 0, z: 0 };

  const T = (jd - J2000) / 36525.0; // centuries since J2000

  // Osculating elements at epoch
  const a = el.a + el.da * T;
  const e = el.e + el.de * T;
  const I = (el.I + el.dI * T) * DEG;
  const L = (el.L + el.dL * T) % 360;
  const wBar = (el.wBar + el.dwBar * T) % 360;
  const Omega = (el.Omega + el.dOmega * T) % 360;
  const OmegaRad = Omega * DEG;

  // Mean anomaly  M = L − ϖ
  const Mraw = L - wBar;
  const M = ((Mraw % 360) + 360) % 360;
  const Mrad = M * DEG;

  // Eccentric anomaly
  const E = solveKepler(Mrad, e);

  // True anomaly
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2)
  );

  // Heliocentric distance (AU)
  const r = a * (1 - e * Math.cos(E));

  // Argument of perihelion  ω = ϖ − Ω
  const w = (wBar - Omega) * DEG;

  // Position in ecliptic (x-y plane, z = north)
  const u = nu + w;
  const cosU = Math.cos(u);
  const sinU = Math.sin(u);
  const cosO = Math.cos(OmegaRad);
  const sinO = Math.sin(OmegaRad);
  const cosI = Math.cos(I);
  const sinI = Math.sin(I);

  const x = r * (cosU * cosO - sinU * sinO * cosI);
  const y = r * (cosU * sinO + sinU * cosO * cosI);
  const z = r * sinU * sinI;

  return { x, y, z, r, a, e, nu, M, E };
}

/**
 * Get orbital velocity components (AU/century) in ecliptic coords.
 * Uses vis-viva + angular momentum.
 */
export function getHeliocentricVelocity(bodyName, jd) {
  const pos = getHeliocentricEcliptic(bodyName, jd);
  const el = ELEMENTS[bodyName];
  if (!el) return { vx: 0, vy: 0, vz: 0 };

  const T = (jd - J2000) / 36525.0;
  const a = el.a + el.da * T;
  const e = el.e + el.de * T;
  const I = (el.I + el.dI * T) * DEG;
  const OmegaRad = ((el.Omega + el.dOmega * T) % 360) * DEG;
  const w = ((el.wBar + el.dwBar * T - el.Omega - el.dOmega * T) % 360) * DEG;
  const L = (el.L + el.dL * T) % 360;
  const wBar = (el.wBar + el.dwBar * T) % 360;
  const M = (((L - wBar) % 360 + 360) % 360) * DEG;
  const E = solveKepler(M, e);

  // Velocity in orbital plane (AU/century)
  const n = 2 * Math.PI / ((el.a + el.da * T) * 36525.0 / Math.sqrt((el.a + el.da * T) ** 3)); // mean motion rad/century
  const h = Math.sqrt(a * (1 - e * e)) * n; // angular momentum per unit mass

  const vr = (a * e * n * Math.sin(E)) / (1 - e * Math.cos(E));
  const vt = a * n * (1 - e * Math.cos(E)) / 1; // = h/r

  const sinNu = Math.sin(pos.nu);
  const cosNu = Math.cos(pos.nu);
  const u = pos.nu + w;

  const vxOrb = vr * Math.cos(pos.nu) - vt * Math.sin(pos.nu);
  const vyOrb = vr * Math.sin(pos.nu) + vt * Math.cos(pos.nu);

  const cosO = Math.cos(OmegaRad);
  const sinO = Math.sin(OmegaRad);
  const cosI = Math.cos(I);
  const sinI = Math.sin(I);
  const cosW = Math.cos(w);
  const sinW = Math.sin(w);

  const vx = (cosW * cosO - sinW * sinO * cosI) * vxOrb + (-sinW * cosO - cosW * sinO * cosI) * vyOrb;
  const vy = (cosW * sinO + sinW * cosO * cosI) * vxOrb + (-sinW * sinO + cosW * cosO * cosI) * vyOrb;
  const vz = (sinW * sinI) * vxOrb + (cosW * sinI) * vyOrb;

  return { vx, vy, vz };
}

/**
 * Compute the full Keplerian orbital path as an array of scene-space points.
 * nPoints segments along one complete orbit.
 */
export function getOrbitPath(bodyName, jd, nPoints = 256) {
  const el = ELEMENTS[bodyName];
  if (!el) return [];

  const T = (jd - J2000) / 36525.0;
  const a = el.a + el.da * T;
  const e = el.e + el.de * T;
  const I = (el.I + el.dI * T) * DEG;
  const wBar = (el.wBar + el.dwBar * T) % 360;
  const OmegaRad = (((el.Omega + el.dOmega * T) % 360) + 360) % 360 * DEG;
  const w = (wBar - (el.Omega + el.dOmega * T)) * DEG;
  const p = a * (1 - e * e); // semi-latus rectum

  const cosO = Math.cos(OmegaRad);
  const sinO = Math.sin(OmegaRad);
  const cosI = Math.cos(I);
  const sinI = Math.sin(I);
  const cosW = Math.cos(w);
  const sinW = Math.sin(w);

  const points = [];
  for (let i = 0; i <= nPoints; i++) {
    const nu = (i / nPoints) * Math.PI * 2;
    const r = p / (1 + e * Math.cos(nu));
    const u = nu + w;
    const cosU = Math.cos(u);
    const sinU = Math.sin(u);

    const x = r * (cosU * cosO - sinU * sinO * cosI);
    const y = r * (cosU * sinO + sinU * cosO * cosI);
    const z = r * sinU * sinI;

    points.push(compressEcliptic(x, y, z));
  }
  return points;
}

/** Get the full orbital element summary for display. */
export function getElementSummary(bodyName, jd) {
  const el = ELEMENTS[bodyName];
  if (!el) return null;

  const T = (jd - J2000) / 36525.0;
  const a = el.a + el.da * T;
  const e = el.e + el.de * T;
  const I = el.I + el.dI * T;
  const wBar = el.wBar + el.dwBar * T;
  const Omega = el.Omega + el.dOmega * T;
  const w = wBar - Omega;

  // Orbital period (years)
  const period = Math.sqrt(a * a * a); // Kepler's third law

  // Orbital velocity at current position (km/s) — vis-viva
  const pos = getHeliocentricEcliptic(bodyName, jd);
  const r = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
  // v = sqrt(GM * (2/r - 1/a)), GM_sun = 1.32712440018e20 m³/s²
  const rMeters = r * 1.496e11;
  const aMeters = a * 1.496e11;
  const v = Math.sqrt(1.32712440018e20 * (2 / rMeters - 1 / aMeters));

  return {
    semiMajorAxis: a,
    eccentricity: e,
    inclination: I,
    longitudeNode: ((Omega % 360) + 360) % 360,
    argumentPerihelion: ((w % 360) + 360) % 360,
    period,
    orbitalVelocity: v / 1000, // km/s
    distance: r,
  };
}
