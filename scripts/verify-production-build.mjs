import { readdir, readFile } from 'node:fs/promises';

const assetsDirectory = new URL('../dist/assets/', import.meta.url);
const files = (await readdir(assetsDirectory)).filter((file) => file.endsWith('.js'));
if (files.length === 0) throw new Error('Production verification found no JavaScript bundle in dist/assets.');

const bundle = (await Promise.all(files.map((file) => readFile(new URL(file, assetsDirectory), 'utf8')))).join('\n');
const forbiddenMarkers = ['__HEXFRONT__', 'debugWin', 'setOpponentEnabled', 'autostart', 'URLSearchParams'];
const leakedMarkers = forbiddenMarkers.filter((marker) => bundle.includes(marker));

if (leakedMarkers.length > 0) {
  throw new Error(`Production bundle exposes development tooling: ${leakedMarkers.join(', ')}`);
}

console.log(`Production bundle is free of development entry points (${files.length} JavaScript file${files.length === 1 ? '' : 's'} checked).`);
