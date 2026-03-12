#!/usr/bin/env node

/**
 * Prepack script — resolve pnpm symlinks for bundled transitive dependencies.
 *
 * pnpm uses symlinks into the content-addressable store for dependencies.
 * `pnpm pack` does not follow these symlinks when packing bundled dependencies'
 * own transitive deps. This script copies real files for any transitive
 * runtime dependency that needs to be bundled alongside the @ifi/* packages.
 *
 * Runs automatically via the `prepack` lifecycle hook before `pnpm pack`.
 */

const { cpSync, existsSync, realpathSync } = require("node:fs");
const path = require("node:path");

/** Transitive runtime dependencies that must be bundled. */
const TRANSITIVE_DEPS = ["croner"];

const pkgDir = path.resolve(__dirname, "..");
const nodeModules = path.join(pkgDir, "node_modules");

for (const dep of TRANSITIVE_DEPS) {
	const target = path.join(nodeModules, dep);

	// Already a real directory (not a symlink) — nothing to do
	if (existsSync(target)) {
		try {
			const real = realpathSync(target);
			if (real === target) {
				continue;
			}
		} catch {
			// Broken symlink — remove and re-copy below
		}
	}

	// Walk up to find the dep in a parent node_modules (workspace root)
	let searchDir = path.resolve(pkgDir, "..");
	let source = null;

	while (searchDir !== path.dirname(searchDir)) {
		const candidate = path.join(searchDir, "node_modules", dep);
		if (existsSync(candidate)) {
			source = realpathSync(candidate);
			break;
		}
		searchDir = path.dirname(searchDir);
	}

	if (!source) {
		console.warn(`[prepack] WARNING: could not find ${dep} in any parent node_modules`);
		continue;
	}

	// Copy real files (dereferencing symlinks) into our node_modules
	cpSync(source, target, { recursive: true, dereference: true });
	console.log(`[prepack] bundled ${dep} from ${source}`);
}
