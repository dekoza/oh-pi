# @ifi/oh-pi-core

Shared types, registries, icons, and i18n helpers for oh-pi packages.

## What this package is for

`@ifi/oh-pi-core` is an internal library used by other packages in this monorepo. It provides
common building blocks for the CLI and other compiled packages.

## Typical consumers

- `@ifi/oh-pi-cli`
- other first-party oh-pi packages that need shared registries or presentation helpers

## Install

This package is primarily intended for internal monorepo use rather than direct end-user
installation.

## Development

```bash
pnpm --filter @ifi/oh-pi-core build
pnpm --filter @ifi/oh-pi-core typecheck
```

## Exports

The package publishes compiled output from `dist/` and exposes its public API through the package
root export.

Publicly exported areas currently include:
- agent path helpers
- delegated-routing helpers
- locale/i18n helpers
- icon helpers
- static registries for extensions, providers, themes, and keybinding schemes

## Quick examples

### Build an extension config path

```ts
import { getExtensionConfigPath } from "@ifi/oh-pi-core";

const configPath = getExtensionConfigPath("adaptive-routing");
// ~/.pi/agent/extensions/adaptive-routing/config.json (or PI_CODING_AGENT_DIR override)
```

### Build shared workspace storage

```ts
import { getSharedStoragePath } from "@ifi/oh-pi-core";

const statePath = getSharedStoragePath("scheduler", process.cwd(), ["state.json"]);
```

### Resolve delegated category routing

```ts
import { resolveDelegatedCategoryRoute } from "@ifi/oh-pi-core";

const route = resolveDelegatedCategoryRoute("quick-discovery", [
	{ provider: "google", id: "gemini-2.5-flash", fullId: "google/gemini-2.5-flash" },
]);
```

That helper reads the adaptive-routing delegated policy and returns the selected available model when the category resolves.

## Agent path helpers

<!-- {=ohPiCoreAgentPathsOverview} -->

`@ifi/oh-pi-core` exposes a small set of path helpers for packages that need to resolve the pi
agent directory, extension config locations, and shared workspace-scoped storage paths without
hardcoding `~/.pi/agent` throughout the codebase.

Use these helpers when a package needs to:

- honor `PI_CODING_AGENT_DIR`
- expand `~` consistently across platforms
- mirror a workspace path into shared storage
- compute stable extension config file locations

<!-- {/ohPiCoreAgentPathsOverview} -->

### `expandHomeDir(inputPath, options?)`

<!-- {=ohPiCoreExpandHomeDirDocs} -->

Expand a leading `~` in a path using the configured home directory override when present.

This helper leaves non-home-relative paths unchanged so callers can safely normalize optional user
input before resolving it further.

<!-- {/ohPiCoreExpandHomeDirDocs} -->

### `resolvePiAgentDir(options?)`

<!-- {=ohPiCoreResolvePiAgentDirDocs} -->

Resolve the effective pi agent directory.

The resolver prefers `PI_CODING_AGENT_DIR` when it is set, expands `~` consistently, and otherwise
falls back to the standard `~/.pi/agent` location.

<!-- {/ohPiCoreResolvePiAgentDirDocs} -->

### `getExtensionConfigPath(extensionName, fileName?, options?)`

<!-- {=ohPiCoreGetExtensionConfigPathDocs} -->

Build the config file path for a named extension under the resolved pi agent directory.

Use this helper instead of manually concatenating `extensions/<name>/config.json` so every package
shares the same config-root resolution behavior.

<!-- {/ohPiCoreGetExtensionConfigPathDocs} -->

### `getMirroredWorkspacePathSegments(cwd)`

<!-- {=ohPiCoreGetMirroredWorkspacePathSegmentsDocs} -->

Convert a workspace path into stable mirrored path segments for shared storage.

The first segment encodes the filesystem root and the remaining segments mirror the resolved
workspace path, which keeps shared state unique across repositories and drives.

<!-- {/ohPiCoreGetMirroredWorkspacePathSegmentsDocs} -->

### `getSharedStoragePath(namespace, cwd, relativeSegments?, options?)`

<!-- {=ohPiCoreGetSharedStoragePathDocs} -->

Build a shared storage path inside the pi agent directory for a workspace-scoped namespace.

This helper combines the resolved pi agent directory, a package namespace, the mirrored workspace
segments, and any additional relative path segments into one canonical storage location.

<!-- {/ohPiCoreGetSharedStoragePathDocs} -->

## Delegated-routing helpers

These helpers are useful when another package wants category-based model selection without duplicating adaptive-routing config parsing.

### `readDelegatedRoutingPolicy()`

Read and normalize the delegated-routing policy from the adaptive-routing config file.

### `resolveDelegatedCategoryRoute(category, availableModels, policy?)`

Resolve a delegated category such as `quick-discovery` or `review-critical` to the first matching available model.

### `resolveModelFullId(modelName, availableModels)`

Convert a bare model id into `provider/id` form when the provider can be inferred from the available model list.
