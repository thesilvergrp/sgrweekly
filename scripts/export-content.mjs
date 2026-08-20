/**
 * Emits the content documents as JSON, ready to seed the content store.
 *
 *   npm run --silent content:export        > site.json     (page copy, ~4 KB)
 *   npm run --silent content:export stays  > stays.json    (per-stay editorial)
 *
 * Then upload, e.g.
 *   aws s3 cp site.json  s3://<bucket>/site/site.json  --content-type application/json
 *   aws s3 cp stays.json s3://<bucket>/site/stays.json --content-type application/json
 *
 * The documents are TypeScript modules, so they are bundled with esbuild and
 * imported from memory. That keeps app source idiomatic (extensionless imports,
 * same as everywhere else) instead of bending it to suit a dev script.
 */
import * as esbuild from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const which = process.argv[2] ?? 'site';

if (!['site', 'stays'].includes(which)) {
  console.error(`Unknown document "${which}". Use "site" or "stays".`);
  process.exit(1);
}

const entry =
  which === 'stays'
    ? `${root}/src/content/stays-document.ts`
    : `${root}/src/content/site-content.ts`;

const { outputFiles } = await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  absWorkingDir: root,
});

const module = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`
);

const document =
  which === 'stays' ? module.buildDefaultStaysDocument() : module.defaultSiteContent;

process.stdout.write(
  `${JSON.stringify({ ...document, updatedAt: new Date().toISOString() }, null, 2)}\n`,
);
