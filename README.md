# ORBIT — Space Explorer

An interactive 3D solar system built with React, Vite, Three.js, and React Three Fiber.
Drag to orbit the camera, scroll to zoom, and click on any planet or the Sun to see
its key facts.

## Tech stack

- **React 18** — UI and app state
- **Vite** — dev server and build tool
- **Three.js** + **React Three Fiber** — 3D rendering
- **@react-three/drei** — helper components (orbit controls, starfield, HTML overlays)

## Getting started

Requires [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev
```

Open the local URL that Vite prints in the terminal (usually `http://localhost:5173`).

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
| Click a planet/Sun  | Open its info panel                 |
| Search box          | Jump directly to a celestial body   |

## Project structure

```
orbit-space-explorer/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                 # React entry point
    ├── App.jsx                  # Top-level layout and state
    ├── styles.css
    ├── data/
    │   └── celestialBodies.js   # Planet & Sun data (position, size, facts, stats)
    └── components/
        ├── Scene.jsx            # <Canvas> and everything inside it
        ├── Sun.jsx
        ├── Planet.jsx
        ├── Orbit.jsx            # Faint orbital path lines
        ├── Comets.jsx           # Background comet animation
        ├── TopBar.jsx           # Brand + search field
        ├── Hero.jsx             # Headline and CTA buttons
        ├── SearchResults.jsx    # Search dropdown
        ├── InfoPanel.jsx        # Selected-body detail panel
        └── Footer.jsx
```

## Customizing

- **Add or edit a planet:** update the `celestialBodies` array in
  `src/data/celestialBodies.js`. Each entry controls its color, size, orbital
  distance/speed, and the fact/stats shown in the info panel.
- **Change the look:** all visual styling lives in `src/styles.css`, organized
  by section (top bar, hero, info panel, footer, etc.).
- **Change scene behavior:** camera settings, lighting, and starfield density
  are configured in `src/components/Scene.jsx`.

## Deploying

The `npm run build` command outputs a static `dist/` folder that can be hosted
on any static host (Vercel, Netlify, GitHub Pages, S3, etc.).
"# Orbit-x-Space" 
