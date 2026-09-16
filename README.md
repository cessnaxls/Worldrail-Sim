# WorldRail Hmmsim Route Generator — Third-Party Assets Only

This build removes WorldRail's procedural box/cylinder scenery from the Hmmsim exporter.

Workflow:
1. Build/generate the route and stations.
2. Configure the custom train dimensions/performance.
3. Download a compatible CC0/community asset pack containing OBJ models (Kenney Train Kit is the recommended first pack).
4. Import the asset ZIP in WorldRail's Third-party asset library panel.
5. Export the Hmmsim Legacy ZIP.

WorldRail parses third-party OBJ meshes and converts those vertices/faces to BVE CSV object syntax. It never creates fallback primitive scenery. If no suitable station/tree/building/signal asset exists in the imported packs, that category is omitted.

Platform length remains calculated from consist length + configured margins.
