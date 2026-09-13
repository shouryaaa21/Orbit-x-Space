# ORBIT — Space Explorer

An interactive 3D solar system built with React, Vite, Three.js, and React Three Fiber.
Drag to orbit the camera, scroll to zoom, and click on any planet or the Sun to see
its key facts.

## Tech stack

- **React 18** — UI and app state
- **Vite** — dev server and build tool
- **Three.js** + **React Three Fiber** — 3D rendering
- **@react-three/drei** — helper components (orbit controls, starfield, HTML overlays)

## Features

- **Interactive 3D solar system** — orbit, zoom, and click any planet or the
  Sun; the camera smoothly pans to focus on whatever you select.
- **Hover feedback** — bodies light up and show their name as you hover,
  before you even click.
- **Deep Dive** — opens a focused, close-up 3D view of the selected local
  body.
- **Explore the Universe** — a real search feature (see "Backend" below):
  type the name of *any* celestial body — a moon, star, galaxy, exoplanet,
  asteroid, anything — and get back a summary, physical/orbital stats, real
  space-agency photography, and an interactive 3D model, all pulled live
  from public astronomy data sources.

## Backend

This project ships one small serverless function, `api/celestial.js`,
deployed automatically by Vercel (or run locally via `vercel dev`) because
it lives under `/api`. It's the "combined backend file" behind the
**Explore the Universe** search: given a name, it queries three free,
keyless, public data sources in parallel and merges the results:

| Source | What it provides |
|---|---|
| [The Solar System OpenData API](https://api.le-systeme-solaire.net) | Physical & orbital data (mass, radius, gravity, orbital period, moons, discovery info) for solar-system bodies |
| [NASA Image and Video Library](https://images.nasa.gov) | Real photography from NASA's archives |
| [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/) | A short description for anything else — stars, galaxies, exoplanets — with a link to the full article |

No API keys are required for any of these, so there's nothing to configure
— it works as soon as it's deployed. Wikipedia extracts are shown with
attribution and a link back to the source article, as the API is intended
to be used.

## Tech stack

- **React 18** — UI and app state
- **Vite** — dev server and build tool
- **Three.js** + **React Three Fiber** — 3D rendering
- **@react-three/drei** — helper components (orbit controls, starfield, HTML overlays)
- **Vercel serverless function** (`api/celestial.js`) — the universe-search backend

## Getting started

Requires [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev
```

Open the local URL that Vite prints in the terminal (usually `http://localhost:5173`).

The **Explore the Universe** search calls `/api/celestial`, which only runs
when deployed on Vercel (or via `vercel dev` locally, if you have the
Vercel CLI installed) — a plain `npm run dev` won't serve that route, since
Vite alone doesn't run serverless functions.

Other scripts:

```bash
npm run build     # production build, output in dist/
npm run preview   # preview the production build locally
```

## Controls

| Action              | Effect                              |
|---------------------|--------------------------------------|
| Drag                | Orbit the camera around the scene   |
| Scroll / pinch       | Zoom in and out                     |
| Hover a planet/Sun  | Highlights it and shows its name     |
| Click a planet/Sun  | Focuses the camera and opens its info panel |
| Open Deep Dive      | Isolated close-up 3D view of the selected body |
| Explore the Universe | Search any celestial body via the backend |
| Search box          | Jump directly to a local celestial body |

## Project structure

```
orbit-space-explorer/
├── index.html
├── package.json
├── vite.config.js
├── api/
│   └── celestial.js         # Combined backend: universe body lookup
└── src/
    ├── main.jsx                 # React entry point
    ├── App.jsx                  # Top-level layout and state
    ├── styles.css
    ├── data/
    │   └── celestialBodies.js   # Local planet & Sun data (position, size, facts, stats)
    └── components/
        ├── Scene.jsx            # <Canvas> and everything inside it
        ├── Sun.jsx
        ├── Planet.jsx
        ├── Orbit.jsx            # Faint orbital path lines
        ├── Comets.jsx           # Background comet animation
        ├── CameraRig.jsx        # Smooth camera focus on the selected body
        ├── SpinningBody.jsx     # Shared close-up 3D body renderer
        ├── TopBar.jsx           # Brand + search field + universe search trigger
        ├── Hero.jsx             # Headline and CTA buttons
        ├── SearchResults.jsx    # Local search dropdown
        ├── InfoPanel.jsx        # Selected-body detail panel
        ├── DeepDive.jsx         # Isolated close-up view of a local body
        ├── UniverseExplorer.jsx # Search-any-body backend-powered explorer
        └── Footer.jsx
```

## Customizing

- **Add or edit a local planet:** update the `celestialBodies` array in
  `src/data/celestialBodies.js`. Each entry controls its color, size, orbital
  distance/speed, and the fact/stats shown in the info panel.
- **Change the look:** all visual styling lives in `src/styles.css`, organized
  by section (top bar, hero, info panel, universe explorer, footer, etc.).
- **Change scene behavior:** camera settings, lighting, and starfield density
  are configured in `src/components/Scene.jsx`.
- **Change what the universe search returns:** edit `api/celestial.js` — it's
  a single file with clearly separated sections for each data source.

## Deploying

The `npm run build` command outputs a static `dist/` folder. Because this
project also includes `api/celestial.js`, it's best deployed on **Vercel**,
which serves the static site and the serverless function together with no
extra configuration.
