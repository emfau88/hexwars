import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(projectRoot, "dist");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all([
  cp(resolve(projectRoot, "index.html"), resolve(output, "index.html")),
  cp(resolve(projectRoot, "styles.css"), resolve(output, "styles.css")),
  cp(resolve(projectRoot, "src"), resolve(output, "src"), { recursive: true }),
  cp(resolve(projectRoot, "campaign"), resolve(output, "campaign"), { recursive: true }),
  writeFile(resolve(output, ".nojekyll"), ""),
]);

console.log(`Hexwars build created at ${output}`);
