// Post-build pass: the prebuilt GLIDE bundle (vendored via public/glide → ../../valkey-io.github.io/static/glide)
// was generated with mixed link prefixes — most refs point at /glide/..., but a handful of root-relative
// links (e.g. href="/overview/", href="/getting-started/quickstart?lang=java") slipped through. Those 404
// because GLIDE lives under /glide/ on this site, not at the domain root.
//
// We rewrite href="/<glideDir>/..." → href="/glide/<glideDir>/..." across every HTML file in dist/glide/.
// Idempotent: refs that already start with /glide/ are skipped.

import { promises as fs } from "node:fs";
import path from "node:path";

const GLIDE_DIST = path.resolve("dist/glide");

// Top-level GLIDE directories (excluding _astro and pagefind, which are already correctly prefixed).
const GLIDE_DIRS = [
  "collections",
  "commands",
  "commons",
  "concepts",
  "feedback-and-support",
  "getting-started",
  "how-to",
  "migration",
  "overview",
  "reference",
  "releases",
  "troubleshooting",
  "tutorials",
];

const BROKEN = new RegExp(
  `((?:href|src)=")/(${GLIDE_DIRS.join("|")})(/|"|\\?|#)`,
  "g",
);

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name.endsWith(".html")) yield full;
  }
}

let totalFiles = 0;
let totalRewrites = 0;
for await (const file of walk(GLIDE_DIST)) {
  const before = await fs.readFile(file, "utf8");
  let rewrites = 0;
  const after = before.replace(BROKEN, (_m, attr, dir, sep) => {
    rewrites++;
    return `${attr}/glide/${dir}${sep}`;
  });
  if (rewrites > 0) {
    await fs.writeFile(file, after);
    totalFiles++;
    totalRewrites += rewrites;
  }
}

console.log(
  `[fix-glide-links] rewrote ${totalRewrites} link(s) across ${totalFiles} file(s)`,
);
