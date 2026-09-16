# WorldRail → Hmmsim Route Studio

Static iPad-friendly web prototype. Open `index.html` through a web host (GitHub Pages/Render static site) and generate a BVE-style route package.

## Included in this build
- Leaflet map route drawing and center/radius generation
- Custom train builder
- Platform length automatically equals train length + configurable stopping margins, subject to minimum platform length
- BVE-style route CSV generation
- BVE-style train.dat and extensions.cfg generation
- Generated CC0-style basic BVE CSV objects for platform, canopy, buildings, signals, trees, rails and train cars
- ZIP export with Route/Object/Sound/Train structure and license manifest

## Asset packs
This source build is prepared for Kenney Train Kit (CC0) and Poly Haven (CC0). Their binary asset packs are not mirrored in this repository; the generated BVE CSV objects are bundled and the exporter emits a license/source manifest. Before public redistribution, validate every third-party asset and Hmmsim version-specific format requirement.
