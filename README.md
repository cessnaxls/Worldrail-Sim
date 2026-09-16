# WorldRail Simulator

Touch-first browser rail simulator / route designer built for iPad-class hardware.

## Run
```bash
npm install
npm run dev
```

## Deploy to Render
Push this folder to GitHub, create a Blueprint in Render, and select the repository. `render.yaml` contains the build/start configuration.

## Data / asset strategy
- Leaflet + OpenStreetMap tiles for route design.
- Optional Census API hook for US population/ridership scoring.
- Three.js procedural geometry ships in the prototype so it runs immediately.
- `public/assets/` is ready for CC0 glTF assets (Kenney Train Kit / Poly Haven-derived optimized textures). See `ASSETS.md`.

This is a serious prototype, not a full OpenBVE replacement. The physics, signaling, timetable, AI traffic, route geometry and cab workflows are implemented as extensible systems so higher-fidelity rolling stock and scenery can be dropped in later.
