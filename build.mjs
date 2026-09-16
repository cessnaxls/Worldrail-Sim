import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const file of ['index.html','README.md','LICENSES.md']) {
  await copyFile(file, `dist/${file}`);
}
console.log('WorldRail static bundle built to dist/');
