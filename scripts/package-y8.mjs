import { spawnSync } from 'node:child_process';
import { readFile, readdir, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const projectDirectory = fileURLToPath(new URL('../', import.meta.url));
const packageDirectory = fileURLToPath(new URL('../dist-y8/package/', import.meta.url));
const indexPath = fileURLToPath(new URL('../dist-y8/package/index.html', import.meta.url));
const assetsPath = fileURLToPath(new URL('../dist-y8/package/assets/', import.meta.url));
const zipPath = fileURLToPath(new URL('../dist-y8/hexfront-y8.zip', import.meta.url));

const html = await readFile(indexPath, 'utf8');
const sdkUrl = 'https://cdn.y8.com/minimal-sdk/2-0/y8.min.js';
if (!html.includes(sdkUrl)) throw new Error('Y8 package is missing the official SDK script.');

const localReferences = [...html.matchAll(/(?:src|href)=["']\.\/([^"'?#]+)["']/g)].map((match) => match[1]);
if (localReferences.length === 0) throw new Error('Y8 package found no relative production references.');
for (const relativePath of localReferences) {
  const referencedFile = fileURLToPath(new URL(`../dist-y8/package/${relativePath}`, import.meta.url));
  const referencedFileStat = await stat(referencedFile).catch(() => null);
  if (!referencedFileStat?.isFile()) throw new Error(`Y8 package is missing: ${relativePath}`);
}

const bundleFiles = (await readdir(assetsPath)).filter((file) => file.endsWith('.js'));
const bundle = (await Promise.all(bundleFiles.map((file) => readFile(`${assetsPath}/${file}`, 'utf8')))).join('\n');
for (const marker of ['6ab6e6d4bed188670528ed6a', '284525', 'level-complete']) {
  if (!bundle.includes(marker)) throw new Error(`Y8 bundle is missing its portal marker: ${marker}`);
}

await rm(zipPath, { force:true });
const archive = spawnSync('tar.exe', ['-a', '-c', '-f', zipPath, 'index.html', 'assets'], {
  cwd:packageDirectory,
  stdio:'inherit',
});
if (archive.status !== 0) throw new Error('Could not create the Y8 ZIP archive.');

const listing = spawnSync('tar.exe', ['-t', '-f', zipPath], {
  cwd:projectDirectory,
  encoding:'utf8',
});
if (listing.status !== 0) throw new Error('Could not verify the Y8 ZIP archive.');
const archivedPaths = listing.stdout.split(/\r?\n/).filter(Boolean);
if (!archivedPaths.includes('index.html')) throw new Error('Y8 ZIP has no index.html at its root.');
if (!archivedPaths.some((entry) => entry.startsWith('assets/'))) throw new Error('Y8 ZIP has no assets directory.');
if (archivedPaths.some((entry) => entry.includes('\\'))) throw new Error('Y8 ZIP contains non-portable backslash paths.');

await rm(packageDirectory, { recursive:true, force:true });
console.log(`Y8 upload package created successfully:\n- ${zipPath}`);
