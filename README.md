# OpenWorld Native WebGL Engine v1

A zero-dependency graphics engine built directly on WebGL/WebGL2 for iPad Safari.

This is not Babylon.js, Three.js, Unity or Unreal. The engine owns:
- GLSL vertex and fragment shaders
- GPU vertex/index buffers
- perspective/view matrices
- depth testing and back-face culling
- directional + hemispheric-style shader lighting
- distance fog and simple tone mapping
- distance culling
- dynamic resolution scaling to protect iPad frame rate
- touch free-look and virtual movement stick
- deterministic open world generation
- animated road traffic and train traffic

World content:
- forest foliage
- rocks
- procedural town buildings
- main road and sidewalks
- railroad ballast/sleepers/rails
- moving cars
- moving five-car train

Performance safeguards:
- no external libraries or CDN
- no texture downloads
- no shadows in v1
- capped 350m render distance
- dynamic render scale
- device pixel ratio is deliberately controlled
- simple shared meshes/material colors

Deploy using the included render.yaml.
