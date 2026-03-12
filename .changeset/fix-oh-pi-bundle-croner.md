---
"@ifi/oh-pi": patch
---

Bundle `croner` as a transitive dependency in the published tarball.

pnpm uses symlinks into its content-addressable store for all dependencies.
When `pnpm pack` follows workspace links for the bundled `@ifi/*` packages,
it does not follow the nested pnpm store symlinks for their transitive
runtime dependencies. This left `croner` (required by `scheduler.ts`)
missing from the published tarball, causing the extension to fail at load
time and blocking all commands (`/loop`, `/colony`, `/btw`, etc.).

Add `croner` to both `dependencies` and `bundledDependencies`, with
`prepack`/`postpack` lifecycle scripts that copy the real files from the
workspace `node_modules` before packing and clean up afterwards.
