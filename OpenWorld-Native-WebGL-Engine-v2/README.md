# OpenWorld Native WebGL Engine v2 — Visual Pass

Zero external graphics dependencies. This build expands the custom renderer rather than switching engines.

Changes from v1:
- solid 570m x 570m terrain base and distant embankments
- upgraded GLSL lighting with procedural surface variation, specular response, rim light, fog, and tone mapping
- darker asphalt with lane markings
- street lights and poles
- rail station/platform/canopy
- more detailed multi-part moving train with roof and window bands
- more vehicle silhouettes
- existing forest, rocks, buildings, road, railway, moving traffic, touch exploration
- dynamic resolution remains active and adjusts to sustained FPS
- 350m culling radius remains in place
- no realtime shadows yet; that is intentional for iPad thermal/GPU headroom

The engine is still deliberately geometry-efficient. Visual upgrades are being added only where they do not undermine the iPad-first performance budget.
