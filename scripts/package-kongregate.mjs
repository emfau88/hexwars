import { spawnSync } from 'node:child_process';
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const projectDirectory = fileURLToPath(new URL('../', import.meta.url));
const uploadDirectory = fileURLToPath(new URL('../dist/kongregate-upload/', import.meta.url));
const stagingDirectory = fileURLToPath(new URL('../dist/kongregate-upload/package/', import.meta.url));
const builtIndexPath = fileURLToPath(new URL('../dist/index.html', import.meta.url));
const builtAssetsPath = fileURLToPath(new URL('../dist/assets/', import.meta.url));
const splitIndexPath = fileURLToPath(new URL('../dist/kongregate-upload/index.html', import.meta.url));
const completeZipPath = fileURLToPath(new URL('../dist/kongregate-upload/hexfront-kongregate-complete.zip', import.meta.url));
const additionalZipPath = fileURLToPath(new URL('../dist/kongregate-upload/hexfront-additional-files.zip', import.meta.url));

await rm(uploadDirectory, { recursive: true, force: true });
await mkdir(stagingDirectory, { recursive: true });

await cp(builtIndexPath, `${stagingDirectory}/index.html`);
await cp(builtAssetsPath, `${stagingDirectory}/assets`, { recursive: true });
await cp(builtIndexPath, splitIndexPath);

const html = await readFile(builtIndexPath, 'utf8');
const localReferences = [...html.matchAll(/(?:src|href)=["']\.\/([^"'?#]+)["']/g)].map((match) => match[1]);

if (localReferences.length === 0) {
  throw new Error('Kongregate packaging found no relative CSS or JavaScript references in the production HTML.');
}

for (const relativePath of localReferences) {
  const referencedFile = fileURLToPath(new URL(`../dist/${relativePath}`, import.meta.url));
  const referencedFileStat = await stat(referencedFile).catch(() => null);
  if (!referencedFileStat?.isFile()) {
    throw new Error(`Kongregate packaging is missing a referenced file: ${relativePath}`);
  }
}

function createZipArchive(destinationPath, entries) {
  const result = spawnSync('tar.exe', ['-a', '-c', '-f', destinationPath, ...entries], {
    cwd: stagingDirectory,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`Could not create ${destinationPath}.`);
  }

  const listing = spawnSync('tar.exe', ['-t', '-f', destinationPath], {
    cwd: projectDirectory,
    encoding: 'utf8',
  });
  if (listing.status !== 0) {
    throw new Error(`Could not verify ${destinationPath}.`);
  }

  const archivedPaths = listing.stdout.split(/\r?\n/).filter(Boolean);
  if (archivedPaths.some((archivedPath) => archivedPath.includes('\\'))) {
    throw new Error(`ZIP contains non-portable backslash paths: ${destinationPath}`);
  }
  for (const entry of entries) {
    if (!archivedPaths.some((archivedPath) => archivedPath === entry || archivedPath.startsWith(`${entry}/`))) {
      throw new Error(`ZIP is missing its expected root entry ${entry}: ${destinationPath}`);
    }
  }
}

// Recommended upload: one ZIP containing index.html and assets/ at its root.
createZipArchive(completeZipPath, ['index.html', 'assets']);

// Compatibility upload for forms that expose a separate Additional Files field.
createZipArchive(additionalZipPath, ['assets']);

await rm(stagingDirectory, { recursive: true, force: true });

const instructions = `HEXFRONT - Kongregate upload\n\n` +
  `RECOMMENDED (current Kongregate portal):\n` +
  `Upload hexfront-kongregate-complete.zip as the WebGL/HTML5 File.\n` +
  `Leave Additional Files empty. The ZIP contains index.html and assets/ at its root.\n\n` +
  `FALLBACK (split upload form):\n` +
  `Upload index.html as the WebGL/HTML5 File.\n` +
  `Upload hexfront-additional-files.zip as Additional Files.\n\n` +
  `Do not upload hexfront-additional-files.zip as the main WebGL/HTML5 file; it intentionally has no index.html.\n`;

await writeFile(`${uploadDirectory}/UPLOAD-INSTRUCTIONS.txt`, instructions, 'utf8');

console.log('Kongregate packages created successfully:');
console.log(`- ${completeZipPath} (recommended)`);
console.log(`- ${splitIndexPath} + ${additionalZipPath} (fallback)`);
