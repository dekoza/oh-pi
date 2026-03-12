#!/usr/bin/env node

/**
 * Postpack cleanup — remove copies of transitive deps created by prepack.
 *
 * After `pnpm pack` finishes, remove the real-file copies so pnpm's
 * symlink-based node_modules stays clean during development.
 */

const { rmSync, existsSync, lstatSync } = require("node:fs");
const path = require("node:path");

/** Must match the list in prepack.js. */
const TRANSITIVE_DEPS = ["croner"];

const nodeModules = path.join(__dirname, "..", "node_modules");

for (const dep of TRANSITIVE_DEPS) {
	const target = path.join(nodeModules, dep);
	if (!existsSync(target)) {
		continue;
	}

	// Only remove if it's a real directory (prepack-created), not a pnpm symlink
	const stat = lstatSync(target);
	if (stat.isDirectory() && !stat.isSymbolicLink()) {
		rmSync(target, { recursive: true, force: true });
		console.log(`[postpack] cleaned up ${dep}`);
	}
}
