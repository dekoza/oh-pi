# @ifi/oh-pi

> All-in-one setup for pi-coding-agent — extensions, themes, prompts, skills, and ant-colony swarm.

## Install

```bash
npx @ifi/oh-pi
```

This registers all oh-pi packages with pi in one command. Each package is installed separately so pi
can load extensions with proper module resolution.

If you are not sure whether you want the full bundle or a narrower package, read `docs/08-package-selection.md` first. Most users should still start with `@ifi/oh-pi`.

### Options

```bash
npx @ifi/oh-pi                      # install latest versions (global)
npx @ifi/oh-pi --version 0.2.13     # pin to a specific version
npx @ifi/oh-pi --local              # install to project .pi/settings.json
npx @ifi/oh-pi --remove             # uninstall all oh-pi packages from pi
```

## Packages

| Package                 | Contents                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| `@ifi/oh-pi-extensions`      | safe-guard, git-guard, auto-session, custom-footer, compact-header, auto-update, bg-process, watchdog |
| `@ifi/oh-pi-ant-colony`       | Multi-agent swarm extension (`/colony`, colony commands)                                     |
| `@ifi/pi-extension-subagents` | Subagent orchestration extension (`subagent`, `subagent_status`, `/run`, `/chain`, `/parallel`) |
| `@ifi/pi-plan`                | Planning mode extension (`/plan`, `Alt+P`, `task_agents`, `set_plan`)                       |
| `@ifi/pi-spec`                | Native spec-driven workflow package with `/spec` and local `.specify/` scaffolding          |
| `@ifi/oh-pi-themes`           | cyberpunk, nord, gruvbox, tokyo-night, catppuccin, oh-p-dark                                 |
| `@ifi/oh-pi-prompts`          | review, fix, explain, refactor, test, commit, pr, and more                                  |
| `@ifi/oh-pi-skills`          | web-search, debug-helper, git-workflow, rust-workspace-bootstrap, and more                  |
| `@ifi/oh-pi-agents`          | AGENTS.md templates for common roles                                                        |

> **Note:** `safe-guard` is included in `@ifi/oh-pi-extensions` but disabled by default. Enable it
> via `pi config` if you want command/path safety prompts.

## Getting Started

```bash
npx @ifi/oh-pi
pi list
pi
```

Useful first checks after install:

- run `pi list` and confirm the oh-pi packages are registered
- start `pi`
- verify a few key surfaces exist:
  - `/route status`
  - `/agents`
  - `/colony-count`
  - `/plan`
  - `/spec`

## Who should install this

Install `@ifi/oh-pi` when you want the default curated experience and do not want to assemble packages by hand.

Do **not** start here only if you already know you want a narrow install such as:
- `@ifi/oh-pi-extensions` only
- `@ifi/pi-extension-subagents` only
- `@ifi/oh-pi-ant-colony` only
- `@ifi/pi-web-remote` only

## Common mistakes

- Installing `@ifi/pi-web-client` when you actually wanted the `/remote` command
- Installing provider packages and expecting workflow tools like `/chain` or `/colony`
- Installing only content packs (prompts/skills/themes/agents) and expecting runtime automation
