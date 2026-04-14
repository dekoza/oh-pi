#!/usr/bin/env node

/**
 * Pack all public workspace packages into dist/tarballs/.
 *
 * Usage:
 *   node scripts/pack-all.mjs          # build + pack
 *   pnpm pack:all                      # same, via root script
 */

import { execSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "dist", "tarballs");

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const packagesDir = join(ROOT, "packages");
const dirs = readdirSync(packagesDir, { withFileTypes: true })
	.filter((d) => d.isDirectory())
	.map((d) => d.name);

let packed = 0;
let skipped = 0;

for (const dir of dirs) {
	const pkgPath = join(packagesDir, dir, "package.json");
	let pkg;
	try {
		pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
	} catch {
		skipped++;
		continue;
	}

	if (!pkg.name || pkg.private) {
		skipped++;
		continue;
	}

	execSync("pnpm pack --pack-destination ../../dist/tarballs", {
		cwd: join(packagesDir, dir),
		stdio: "inherit",
	});
	packed++;
}

console.log(`\n✅ Packed ${packed} packages into dist/tarballs/ (${skipped} skipped)`);
