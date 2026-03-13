<div align="center">

<img src="./logo.svg" width="180" alt="oh-pi logo"/>

# 🐜 oh-pi

**One command to supercharge [pi-coding-agent](https://github.com/badlogic/pi-mono).**

Like oh-my-zsh for pi — but with an autonomous ant colony.

[![CI](https://github.com/ifiokjr/oh-pi/actions/workflows/ci.yml/badge.svg)](https://github.com/ifiokjr/oh-pi/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/ifiokjr/oh-pi)](./LICENSE)
[![node](https://img.shields.io/node/v/@ifi/oh-pi)](https://nodejs.org)

[English](./README.md) | [Français](./README.fr.md)

```bash
npx @ifi/oh-pi
```

</div>

---

## 30-Second Start

```bash
npx @ifi/oh-pi       # install all extensions, themes, prompts, and skills
pi                    # start coding
```

oh-pi installs the full bundle into pi in one command. See [Installer Options](#installer-options)
for project-scoped installs and version pinning.

## Packages

This is a monorepo. Install everything at once with `npx @ifi/oh-pi`, or pick individual packages.

| Package                                          | Description                        | Install                                |
| ------------------------------------------------ | ---------------------------------- | -------------------------------------- |
| [`@ifi/oh-pi`](./packages/oh-pi)                 | One-command installer for all pkgs | `npx @ifi/oh-pi`                       |
| [`@ifi/oh-pi-core`](./packages/core)             | Shared types, registries, i18n     | (library, not installed directly)      |
| [`@ifi/oh-pi-extensions`](./packages/extensions)          | 9 extensions (see below)                    | `pi install npm:@ifi/oh-pi-extensions`      |
| [`@ifi/oh-pi-ant-colony`](./packages/ant-colony)          | Multi-agent swarm extension                 | `pi install npm:@ifi/oh-pi-ant-colony`      |
| [`@ifi/pi-extension-subagents`](./packages/subagents)     | Full-featured subagent delegation extension | `pi install npm:@ifi/pi-extension-subagents` |
| [`@ifi/pi-plan`](./packages/plan)                         | Branch-aware planning mode extension        | `pi install npm:@ifi/pi-plan`               |
| [`@ifi/pi-shared-qna`](./packages/shared-qna)             | Shared Q&A TUI helpers                      | (library, not installed directly)           |
| [`@ifi/oh-pi-themes`](./packages/themes)                  | 6 color themes                              | `pi install npm:@ifi/oh-pi-themes`          |
| [`@ifi/oh-pi-prompts`](./packages/prompts)                | 10 prompt templates                         | `pi install npm:@ifi/oh-pi-prompts`         |
| [`@ifi/oh-pi-skills`](./packages/skills)                  | 12 skill packs                              | `pi install npm:@ifi/oh-pi-skills`          |
| [`@ifi/oh-pi-agents`](./packages/agents)                  | 5 AGENTS.md templates                       | (used by CLI only)                          |

### Installer Options

```bash
npx @ifi/oh-pi                      # install latest versions (global)
npx @ifi/oh-pi --version 0.2.13     # pin to a specific version
npx @ifi/oh-pi --local              # install to project .pi/settings.json
npx @ifi/oh-pi --remove             # uninstall all oh-pi packages from pi
```

---

## Extensions

### 🛡️ Safe Guard (`safe-guard`) — **default: off (opt-in)**

Intercepts dangerous commands before execution. Blocks `rm -rf`, `git push --force`, `DROP TABLE`,
`chmod 777`, and other destructive operations. Also protects configured paths from modification.

This extension is available in `@ifi/oh-pi-extensions` but is no longer enabled by default in
`@ifi/oh-pi`. Enable it explicitly via `pi config` if you want safety prompts.

**How it works:** Hooks into the `tool_call` event for `bash`, `edit`, and `write` tools. When a
dangerous pattern is detected, it prompts for confirmation or blocks outright.

```
Agent: bash rm -rf /
→ ⛔ BLOCKED: Destructive command detected. Confirm? [y/N]
```

### 📦 Git Guard (`git-guard`) — **default: on**

Prevents accidental code loss by auto-creating stash checkpoints before the agent makes changes.
Warns when the repo is dirty (uncommitted changes) and notifies when operations complete.

**How it works:** On `session_start`, checks `git status`. If dirty, creates `git stash` with a
timestamped name. On `tool_result` for write/edit operations, tracks changed files.

### 📝 Auto Session Name (`auto-session-name`) — **default: on**

Automatically names sessions based on the first user message. Instead of "Session
2025-03-04T10:33:35", you get "Refactor auth to JWT" or "Fix CI pipeline".

**How it works:** Listens for the first `turn_end` event, extracts a short title from the user's
initial prompt, and calls `pi.setSessionName()`.

### 📊 Custom Footer (`custom-footer`) — **default: on**

Replaces the default pi footer with a rich status bar showing real-time metrics:

```
◆ claude-sonnet-4 | 12.3k/8.1k $0.42 62% | ⏱3m12s | ⌂ projects/oh-pi | ⎇ main
```

**Shows:** Model name with thinking-level indicator, input/output tokens, accumulated cost, context
window %, elapsed time, working directory, and git branch.

**How it works:** Uses `ctx.ui.setFooter()` with a component that reads
`ctx.sessionManager.getBranch()` for token/cost data and `footerData.getGitBranch()` for git info.
Auto-refreshes every 30s.

### ⚡ Compact Header (`compact-header`) — **default: on**

Replaces the verbose default startup header with a dense one-liner showing model, provider, thinking
level, and extension count.

### 🔄 Auto Update (`auto-update`) — **default: on**

Checks npm for newer versions of oh-pi on startup. If an update is available, shows a notification
with the new version and install command. Never blocks — fully async.

**How it works:** On `session_start`, runs `npm view oh-pi version` in the background via
`pi.exec()`. Compares with the local version using semver.

### ⏳ Background Process (`bg-process`) — **default: off**

Automatically backgrounds long-running commands (dev servers, builds, test suites). When a command
exceeds a 10-second timeout, it's moved to the background and the agent gets the PID + log file
path.

**How it works:** Overrides the built-in `bash` tool. Spawns commands with a timer — if they're
still running after 10s, detaches them and writes output to `/tmp/oh-pi-bg-*.log`. Provides a
`bg_status` tool for listing, viewing logs, and stopping background processes.

```
Agent: bash npm run dev
→ Command still running after 10s, moved to background.
  PID: 12345 | Log: /tmp/oh-pi-bg-1709654321.log
  ⏳ You will be notified automatically when it finishes.
```

**Commands:** `bg_status list` | `bg_status log --pid 12345` | `bg_status stop --pid 12345`

### 💰 Usage Tracker (`usage-tracker`) — **default: off**

**CodexBar-inspired** rate limit and cost monitor. The main feature is showing **provider-level rate
limits** — how much of your weekly/session Claude and Codex quota remains, with reset countdowns.
Also tracks per-model token usage and session costs.

**How it works:** Probes the `claude` and `codex` CLIs (same approach as
[CodexBar](https://github.com/steipete/CodexBar)) to get real rate limit data. Tracks local token
usage from `AssistantMessage.usage` on every `turn_end` event. Alerts when session cost crosses
$0.50, $1, $2, $5, $10+ thresholds.

> Note: some newer Claude CLI builds no longer expose quota windows via `claude usage`, and some
> Codex environments require an interactive TTY for rate-limit output. In those cases, oh-pi still
> shows provider metadata (e.g. Claude account/plan from `claude auth status`) and clearly marks
> windows as unavailable.

**Widget** (always visible above editor):

```
Claude [████████░░░░] 67% ↻in 3d 2h │ 💰$0.42 │ 12.3k/8.1k
```

**`/usage` overlay** (`Ctrl+U`):

```
╭─ Usage Dashboard ──────────────────────────────────────╮

  ▸ Claude Rate Limits
    Weekly (all)   [████████████░░░░░░░░] 67% left (33% used) — resets in 3d 2h
      Pace: On pace | Expected 31% used | Lasts until reset
    Session        [████████████████░░░░] 82% left (18% used) — resets in 2h 5m
    Most constrained: Weekly (all) (67% left)

  ──────────────────────────────────────────────────────────
  Session │ 23m12s │ 14 turns │ $0.42
  Tokens  │ 45.2k in │ 18.7k out │ 63.9k total
  Avg     │ 4.6k tok/turn │ $0.030/turn
  Cache   │ 12.4k read │ 1.8k write │ 27% read/input

  Per-Model Breakdown
  ◆ claude-sonnet-4 (anthropic)
    [████████████] $0.38 │ 12 turns │ 40.1k in / 16.2k out │ 90% of cost
    avg 4.7k tok/turn
╰────────────────────────────────────────────────────────╯
```

| Command          | Shortcut | What it does                 |
| ---------------- | -------- | ---------------------------- |
| `/usage`         | `Ctrl+U` | Full dashboard overlay       |
| `/usage-toggle`  | —        | Show/hide the widget         |
| `/usage-refresh` | —        | Force re-probe provider CLIs |

The `usage_report` tool is LLM-callable — the agent can answer "how much quota do I have left?"
directly.

### 🐜 Ant Colony (`ant-colony`) — **default: off**

The headline feature. A multi-agent swarm modeled after real ant ecology — deeply integrated into
pi's SDK. See the [Ant Colony section](#-ant-colony-1) below for full documentation.

---

## 🐜 Ant Colony

A multi-agent swarm modeled after real ant ecology — deeply integrated into pi's SDK.

```
You: "Refactor auth from sessions to JWT"

oh-pi:
  🔍 Scout ants explore codebase (haiku — fast, cheap)
  📋 Task pool generated from discoveries
  ⚒️  Worker ants execute in parallel (sonnet — capable)
  🛡️ Soldier ants review all changes (sonnet — thorough)
  ✅ Done — report auto-injected into conversation
```

### Colony Lifecycle

`SCOUTING → (if needed) PLANNING_RECOVERY → WORKING → REVIEWING → DONE`

### Architecture

Each ant is an in-process `AgentSession` (pi SDK), not a child process:

```
pi (main process)
  └─ ant_colony tool
       └─ queen.ts → runColony()
            └─ spawnAnt() → createAgentSession()
                 ├─ session.subscribe() → real-time token stream
                 ├─ Zero startup overhead (shared process)
                 └─ Shared auth & model registry
```

### Why Ants?

| Real Ants             | oh-pi                                              |
| --------------------- | -------------------------------------------------- |
| Scout finds food      | Scout scans codebase, identifies targets           |
| Pheromone trail       | `.ant-colony/pheromone.jsonl` — shared discoveries |
| Worker carries food   | Worker executes task on assigned files             |
| Soldier guards nest   | Soldier reviews changes, requests fixes            |
| More food → more ants | More tasks → higher concurrency (auto-adapted)     |
| Pheromone evaporates  | 10-minute half-life — stale info fades             |

### Adaptive Concurrency

```
Cold start     →  ceil(max/2) ants (fast ramp-up)
Exploration    →  +1 each wave, monitoring throughput
Throughput ↓   →  lock optimal, stabilize
CPU > 85%      →  reduce immediately
429 rate limit →  -1 concurrency + backoff (2s→5s→10s cap)
Tasks done     →  scale down to minimum
```

### Real-time UI

- **Status bar** — tasks done, active ants, tool calls, output tokens, cost, elapsed time
- **Ctrl+Shift+A** — overlay panel with task list, active ant streams, colony log
- `/colony-stop` to abort a running colony

### Auto-trigger

The LLM automatically deploys the colony when appropriate:

- **≥3 files** need changes → colony
- **Parallel workstreams** possible → colony
- **Single file** change → direct execution (no overhead)

---

## Setup Modes

| Mode          | Steps | For                               |
| ------------- | ----- | --------------------------------- |
| 🚀 **Quick**  | 3     | Pick provider → enter key → done  |
| 📦 **Preset** | 2     | Choose a role profile → enter key |
| 🎛️ **Custom** | 6     | Pick everything yourself          |

### Presets

|                | Theme      | Thinking | Includes                                 |
| -------------- | ---------- | -------- | ---------------------------------------- |
| ⚫ Full Power  | oh-pi Dark | high     | Recommended extensions + bg-process + ant-colony (`safe-guard` stays opt-in) |
| 🔴 Clean       | Default    | off      | No extensions, just core                 |
| 🐜 Colony Only | oh-pi Dark | medium   | Ant-colony with minimal setup            |

### Providers

Anthropic · OpenAI · Google Gemini · Groq · OpenRouter · xAI · Mistral

---

## Skills

### 🔧 Tool Skills

| Skill        | What it does                               |
| ------------ | ------------------------------------------ |
| `context7`   | Query latest library docs via Context7 API |
| `web-search` | DuckDuckGo search (free, no key)           |
| `web-fetch`  | Extract webpage content as plain text      |

### 🎨 UI Design System Skills

| Skill           | Style                                       |
| --------------- | ------------------------------------------- |
| `liquid-glass`  | Apple WWDC 2025 translucent glass           |
| `glassmorphism` | Frosted glass blur + transparency           |
| `claymorphism`  | Soft 3D clay-like surfaces                  |
| `neubrutalism`  | Bold borders, offset shadows, high contrast |

### 🔄 Workflow Skills

| Skill                      | What it does                                        |
| -------------------------- | --------------------------------------------------- |
| `quick-setup`              | Detect project type, generate .pi/ config           |
| `debug-helper`             | Error analysis, log interpretation, profiling       |
| `git-workflow`             | Branching, commits, PRs, conflict resolution        |
| `rust-workspace-bootstrap` | Scaffold Rust workspaces with knope, devenv, CI/CD  |
| `flutter-serverpod-mvp`    | Scaffold full-stack Flutter + Serverpod MVPs        |

## Themes

| Theme               | Description                  |
| ------------------- | ---------------------------- |
| 🌙 oh-pi Dark       | Cyan + purple, high contrast |
| 🌙 Cyberpunk        | Neon magenta + electric cyan |
| 🌙 Nord             | Arctic blue palette          |
| 🌙 Catppuccin Mocha | Pastel on dark               |
| 🌙 Tokyo Night      | Blue + purple twilight       |
| 🌙 Gruvbox Dark     | Warm retro tones             |

## Prompt Templates

| Command     | Description                              |
| ----------- | ---------------------------------------- |
| `/review`   | Code review: bugs, security, performance |
| `/fix`      | Fix errors with minimal changes          |
| `/explain`  | Explain code, simple to detailed         |
| `/refactor` | Refactor preserving behavior             |
| `/test`     | Generate tests                           |
| `/commit`   | Conventional Commit message              |
| `/pr`       | Pull request description                 |
| `/security` | OWASP security audit                     |
| `/optimize` | Performance optimization                 |
| `/document` | Generate documentation                   |

---

## Development

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 10
- [knope](https://knope.tech) (for releases)

### Setup

```bash
git clone https://github.com/ifiokjr/oh-pi.git
cd oh-pi
pnpm install
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contributor workflow, changeset requirements, and PR guidelines.

### Commands

```bash
pnpm build          # Build core + cli (tsc)
pnpm typecheck      # Type check with tsgo (fast)
pnpm test           # Run all tests
pnpm lint           # Biome lint + format check
pnpm security:check # Dependency allowlist + vulnerability audits
pnpm lint:fix       # Auto-fix lint issues
pnpm format         # Format all files
```

### Changesets

**Every change must include a changeset.** This is enforced in CI.

```bash
knope document-change
```

This creates a file in `.changeset/` describing the change. Because this repo uses lockstep
versioning and a single knope `[package]`, changeset frontmatter must use **only** `default` as
the key:

```md
---
default: patch
---
```

Do not use package names like `@ifi/oh-pi` or `@ifi/oh-pi-extensions` in changeset frontmatter
here — knope ignores those entries in this repo.

Choose the change type:

- **`major`** — Breaking changes
- **`minor`** — New features
- **`patch`** — Bug fixes

### Releasing

Releases are done locally in two steps:

```bash
# 1. Release: bump versions, update CHANGELOG.md, tag, push
./scripts/release.sh

# 2. Publish: build and push all packages to npm
knope publish
```

The release script runs all CI/security checks (lint, security, typecheck, test, build) before
calling `knope release`. Use `--dry-run` to preview without making changes.

### Project Structure

```
oh-pi/
├── packages/
│   ├── core/                   Shared types, registry, i18n (compiled)
│   ├── cli/                    TUI configurator binary (compiled)
│   ├── extensions/             9 pi extensions (raw .ts)
│   ├── ant-colony/             Multi-agent swarm extension (raw .ts)
│   ├── subagents/              Subagent orchestration package (raw .ts)
│   ├── shared-qna/             Shared Q&A TUI helper library (raw .ts)
│   ├── plan/                   Planning mode extension (raw .ts)
│   ├── themes/                 6 JSON theme files
│   ├── prompts/                10 markdown prompt templates
│   ├── skills/                 12 skill directories
│   ├── agents/                 5 AGENTS.md templates
│   └── oh-pi/                  Installer CLI (npx @ifi/oh-pi)
├── docs/                  Full documentation
├── benchmarks/            Performance benchmarks
├── .changeset/            Pending changesets (knope)
├── CHANGELOG.md           Release history
├── knope.toml             Release automation config
└── biome.json             Linter + formatter config
```

## License

MIT
