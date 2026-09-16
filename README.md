# WorldRail → Hmmsim Route Generator

This build automatically uses a built-in curated CC0 community asset library. No user asset import is required and WorldRail does not synthesize primitive fallback scenery.

At runtime the Render server caches the original Kenney Train Kit and Building Kit ZIP archives, and the browser converts selected artist-created OBJ meshes + their original textures to BVE/Hmmsim CSV objects for each exported route.

Deploy as the existing Render Web Service with `npm install && npm run build` and `npm start`.
