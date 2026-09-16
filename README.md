# WorldRail Hmmsim Route Generator — Realistic Asset Library

This build removes Kenney from the built-in library and uses a curated third-party catalog intended for BVE/Hmmsim visual style. The Render server retrieves and caches approved source archives; the user does not import asset packs manually.

Strict rule: no generated box/cylinder scenery fallback. If a required library asset is unavailable, it is omitted and the UI reports the missing pack.

The starter catalog includes CC0 realistic architecture, a CC0 textured locomotive source, and the public-domain BRSigs_Open signal library. Some source archives may contain formats the current browser converter cannot yet ingest; those are reported rather than replaced with fake geometry.
