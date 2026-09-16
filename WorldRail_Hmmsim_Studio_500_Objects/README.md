# WorldRail Hmmsim Studio

Built-in starter library: **624 native BVE CSV objects**, 10 texture families and 7 original WAV sounds.

Deploy: push this folder to GitHub, create Render Web Service, use `npm install && npm run build` and `npm start` (render.yaml is included).

Route planner: point + radius + track count + subway/surface + optional real OSM railway tracing. Generated lines converge on the selected central terminus. Demand scoring uses nearby OSM amenity/shop/tourism features; a Census-key field is included for population-data integration.

Exporter: each generated line becomes a separate BVE/Hmmsim route CSV, with platform sizing from train length, curvature/speed logic, signals/sections, Route.RunInterval AI traffic, shared object/sound library and custom train.
