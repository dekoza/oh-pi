# 🐜 Ant Colony — Multi-Agent Swarm Extension

> A self-organizing multi-agent system modeled after real ant colony ecology. Adaptive concurrency,
> pheromone communication, zero centralized scheduling.

## When to use ant-colony

Use `@ifi/oh-pi-ant-colony` when:
- the task is large enough to justify decomposition and background execution
- you want a swarm that can keep working while you continue chatting
- you want isolated worktree execution by default
- you want colony status, resume, and stop controls

Do **not** use ant-colony when you really want explicit, hand-authored chains and per-step control. That is `@ifi/pi-extension-subagents`.

## Quick start

Inside pi:

```text
/colony Add tests for the auth module and fix the failures
/colony-status
/colony-stop all
```

Suggested first run:
1. start a colony with a concrete goal
2. check `/colony-status`
3. wait for `[COLONY_SIGNAL:...]` follow-ups
4. stop it only if the goal or environment changed

## Verification checklist

After install, verify:
- `/colony-count` exists
- `/colony-status` exists
- `/colony-stop` exists
- `/colony-resume` exists
- the `ant_colony` tool is available

## Architecture

```
Queen                           Main pi process, receives goals, orchestrates lifecycle
  │
  ├─ 🔍 Scout                   Lightweight haiku, explores paths, marks food sources
  ├─ ⚒️  Worker                  Sonnet, executes tasks, may spawn sub-tasks
  └─ 🛡️ Soldier                 Sonnet, reviews quality, may request rework

Pheromone                       Shared ant-colony state store, indirect ant-to-ant communication
Nest                            Shared state, atomic file operations, cross-process safe
```

## Lifecycle

```
Goal → Scouting → Task Pool → Workers Execute in Parallel → Soldiers Review → Fix (if needed) → Done
          │                           │
          │  Pheromone decay (10min)   │  Sub-tasks auto-spawned
          └───────────────────────────┘
```

## Workspace Isolation (Default)

<!-- {=antColonySharedStorageOverview} -->

Ant-colony stores runtime state outside the repository by default under the shared pi agent
directory, mirroring the workspace path so each repo gets its own isolated storage root.
Project-local `.ant-colony/` storage remains available as an explicit opt-in for legacy workflows.

<!-- {/antColonySharedStorageOverview} -->

<!-- {=antColonyGetColonyWorktreeParentDirDocs} -->

Resolve the parent directory for isolated colony worktrees. Shared mode keeps them under the
workspace-mirrored shared root in `worktrees/`, while project mode places them under the legacy
project-local `.ant-colony/worktrees/` path.

<!-- {/antColonyGetColonyWorktreeParentDirDocs} -->

Shared storage layout:

```text
~/.pi/agent/ant-colony/root/<mirrored-workspace-path>/
├── colonies/
└── worktrees/
```

<!-- {=antColonyPrepareColonyWorkspaceDocs} -->

Prepare the execution workspace for a colony run. When worktree isolation is enabled and git
supports it, the colony gets a fresh isolated worktree on an `ant-colony/...` branch; otherwise it
falls back to the shared working directory and records the reason.

<!-- {/antColonyPrepareColonyWorkspaceDocs} -->

You can disable worktree isolation with:

```bash
PI_ANT_COLONY_WORKTREE=0
```

<!-- {=antColonyResolveStorageOptionsDocs} -->

Resolve the effective ant-colony storage mode and shared root. Explicit options win, then
environment variables, then extension config, and shared storage is the default when no override is
provided.

<!-- {/antColonyResolveStorageOptionsDocs} -->

You can opt back into project-local storage if you want the legacy behavior:

```json
// ~/.pi/agent/extensions/ant-colony/config.json
{
  "storageMode": "project"
}
```

Optional overrides:

```bash
PI_ANT_COLONY_STORAGE_MODE=shared
PI_ANT_COLONY_STORAGE_ROOT=~/.pi/agent/ant-colony
```

## Adaptive Concurrency

Models real ant colony dynamic recruitment:

- **Cold start**: 1–2 ants, gradual exploration
- **Exploration phase**: +1 each wave, monitoring throughput inflection point
- **Steady state**: fine-tune around optimal value
- **Overload protection**: CPU > 85% or memory < 500MB → auto-reduce
- **Elastic scaling**: more tasks → recruit; fewer tasks → shrink

## Usage

### Command chooser

- `/colony <goal>` — start work
- `/colony-status [id]` — inspect a specific running colony or all colonies
- `/colony-stop [id|all]` — stop one or all running colonies
- `/colony-resume [colonyId]` — resume saved colonies
- `/colony-count` — quick count of active colonies

### Auto-Trigger

The LLM automatically invokes the `ant_colony` tool when task complexity warrants it.

### Commands

```
/colony <goal>              Start a new colony for the given goal
/colony-count               Show number of currently running colonies
/colony-status [id]         Show running colonies (runtime cN or stable colony-... ID)
/colony-stop [id|all]       Cancel one running colony (runtime/stable ID) or all
/colony-resume [colonyId]   Resume a specific stable colony ID, or all resumable by default
Ctrl+Shift+A                Open colony details panel
```

### Examples

```
/colony Migrate the entire project from CommonJS to ESM, updating all imports/exports and tsconfig

/colony Add unit tests for all modules under src/, targeting 80% coverage

/colony Refactor auth system from session-based to JWT, maintaining API compatibility
```

Good goals are concrete and outcome-oriented. Bad goals are vague commands like "work on the repo".

## Usage Tracking Integration

Ant inference usage (tokens + cost) is streamed to the `usage-tracker` extension via `pi.events` (`usage:record`).
So `/usage`, `usage_report`, and session cost totals now include background colony inference, making colony spend visible.

## Delegated model routing

When adaptive routing delegated routing is enabled, ant-colony can resolve models by caste or worker class instead of hard-coding provider/model pairs.

Default routing categories:

- `scout` → `quick-discovery`
- `worker` → `balanced-execution`
- `soldier` → `review-critical`
- `design` workers → `visual-engineering`
- `multimodal` workers → `quick-discovery`
- `backend` workers → `balanced-execution`
- `review` workers → `review-critical`

Explicit model overrides still win. If delegated routing cannot resolve a model, the colony falls back to the current session model.

You can override the default category mapping in `~/.pi/agent/extensions/ant-colony/config.json`:

```json
{
  "routingCategories": {
    "castes": {
      "scout": "review-critical"
    },
    "workerClasses": {
      "design": "visual-engineering",
      "review": "review-critical"
    }
  }
}
```

Adaptive-routing policy stays in `~/.pi/agent/extensions/adaptive-routing/config.json`.

`/colony-status` and the final report surface effective route details when available, so you can tell whether a running ant is using an explicit override, a worker-class category, or a caste category.

## Troubleshooting quick hits

### Colony fails immediately with no model available

The current pi session does not have a usable model selected. Fix the session model first.

### Worktree isolation does not happen

That is a fallback path, not necessarily a bug. Ant-colony falls back to shared cwd behavior when a worktree cannot be created and records the reason.

### Delegated routing does not change the model

Check the precedence first:
1. explicit model override
2. worker-class category
3. caste category
4. current session model fallback

If you expected category routing, verify both the ant-colony category mapping and the adaptive-routing delegated policy.

### Resume finds nothing

There may be no resumable colonies in the selected storage mode/location.

## Pheromone System

Ants communicate indirectly through pheromones (stigmergy), not direct messages:

| Type       | Released By | Meaning                                 |
| ---------- | ----------- | --------------------------------------- |
| discovery  | Scout       | Discovered code structure, dependencies |
| progress   | Worker      | Completed changes, file modifications   |
| warning    | Soldier     | Quality issues, conflict risks          |
| completion | Worker      | Task completion marker                  |
| dependency | Any         | File dependency relationships           |

Pheromones decay exponentially (10-minute half-life), preventing stale info from misleading
subsequent ants.

## File Locking

Each task declares the files it operates on. The queen guarantees:

- Only one ant modifies a given file at any time
- Conflicting tasks are automatically marked `blocked` and resume when locks release

## Nest Structure

<!-- {=antColonyGetColonyStateParentDirDocs} -->

Resolve the parent directory for persisted colony state. Shared mode stores state under the
workspace-mirrored shared root in `colonies/`, while project mode keeps using the legacy local
`.ant-colony/` directory.

<!-- {/antColonyGetColonyStateParentDirDocs} -->

```text
~/.pi/agent/ant-colony/root/<mirrored-workspace-path>/colonies/{colony-id}/
├── state.json           Colony state
├── pheromone.jsonl      Append-only pheromone log
└── tasks/               One file per task (atomic updates)
    ├── t-xxx.json
    └── t-yyy.json
```

<!-- {=antColonyMigrateLegacyProjectColoniesDocs} -->

Best-effort migration for legacy project-local colony state. When shared mode is active, existing
`.ant-colony/{colony-id}/` directories are copied into the shared store so resumable colonies keep
working without leaving runtime state in the repo.

<!-- {/antColonyMigrateLegacyProjectColoniesDocs} -->

## Installation

```bash
# Install just ant-colony
pi install npm:@ifi/oh-pi-ant-colony

# Or install the full oh-pi bundle (includes ant-colony)
pi install npm:@ifi/oh-pi
```

Then start pi:

```bash
pi
```

## Module Reference

| File             | Lines | Responsibility                                                             |
| ---------------- | ----- | -------------------------------------------------------------------------- |
| `types.ts`       | ~150  | Type system: ants, tasks, pheromones, colony state                         |
| `nest.ts`        | ~500  | Nest: file-system shared state, atomic R/W, pheromone decay                |
| `concurrency.ts` | ~120  | Adaptive concurrency: system sampling, exploration/steady-state adjustment |
| `spawner.ts`     | ~420  | Ant spawning: session lifecycle, usage streaming, prompt/output handling   |
| `queen.ts`       | ~1020 | Queen scheduling: lifecycle, task waves, multi-round iteration             |
| `worktree.ts`    | ~180  | Git worktree isolation and resume workspace recovery helpers               |
| `index.ts`       | ~1050 | Extension entry: tool/shortcut registration, TUI rendering, status signals |
| `deps.ts`        | ~140  | Lightweight import graph for dependency-aware scheduling                   |
| `parser.ts`      | ~180  | Sub-task and pheromone extraction from ant output                          |
| `prompts.ts`     | ~90   | Per-caste system prompts and prompt builder                                |
| `ui.ts`          | ~140  | Formatting helpers for status bar, overlay, and reports                    |
