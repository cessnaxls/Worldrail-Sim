# OpenWorld Native WebGL Engine V3 — FSX Visual Target

This pass deliberately targets the visual construction style of Microsoft Flight Simulator X rather than modern AAA rendering.

Added:
- landclass-style terrain variation with field patches and a pond
- denser suburban autogen with houses, roof silhouettes, yard trees
- procedural facade panel/window variation in the GLSL shader
- procedural grass/asphalt surface breakup
- road lane markings, sidewalks, lamps and utility poles
- railway ballast, sleepers, rails, station, crossing signals
- moving road vehicles and multi-part train
- stronger atmospheric haze and FSX-like distant fade
- sunlight/specular response and tone mapping
- additional world detail without external textures or dependencies

iPad safeguards:
- visible-object radius reduced from 350m to 310m to offset the denser scenery
- adaptive internal resolution remains active
- no realtime shadow maps
- no external libraries/CDNs
- shared cube/cone GPU meshes
- distance culling before draw submission

This is an FSX-era visual *construction target*, not a claim that procedural geometry equals Microsoft's original FSX art assets. The next quality jump after this renderer is proven on-device is a UV/textured atlas asset library.
