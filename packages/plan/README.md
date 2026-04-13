# @ifi/pi-plan

Planning mode extension for pi.

Built on top of the planning workflow from
[`sids/pi-extensions/plan-md`](https://github.com/sids/pi-extensions/tree/main/plan-md) and adapted for
oh-pi.

This package is for users who want a **plan-first workflow** before implementation starts.

## When to use this package

Use `@ifi/pi-plan` when:
- you want to slow down and write a plan before coding
- you want a persistent plan file tied to the session
- you want planning-only tools such as `task_agents`, `request_user_input`, and `set_plan`
- you want an explicit planning mode instead of free-form chat planning

Do **not** use this package when you actually want durable feature artifacts and a spec workflow. That is `@ifi/pi-spec`.

## Installation

```bash
pi install npm:@ifi/pi-plan
```

Or install it as part of the full oh-pi bundle:

```bash
npx @ifi/oh-pi
```

Or use the package installer directly:

```bash
npx @ifi/pi-plan
npx @ifi/pi-plan --local
```

To remove:

```bash
npx @ifi/pi-plan --remove
```

## Quick start

Inside pi:

```text
/plan
```

Then:
1. choose where planning should start if the session has branchable history
2. write or refine the plan in plan mode
3. use planning-only tools if needed
4. exit plan mode when the plan is ready
5. continue execution using the generated plan file

Shortcut:
- `Alt+P` runs the same plan-mode toggle flow as `/plan`

## What plan mode does

Verified from the extension behavior documented here:
- `/plan` starts planning when inactive and opens plan-mode actions when already active
- a start location picker can offer `Empty branch` or `Current branch`
- if a session plan already exists with content, startup can offer `Continue planning` or `Start fresh`
- `/plan [location]` accepts either an exact file path or a directory path
- plan mode shows a persistent banner with the active plan file path
- exiting plan mode can optionally summarize the branch
- exiting prefills the editor only when the active plan file has content
- after exit, pi shows `Plan mode ended.` with the plan file and an expandable preview when available

## Commands

- `/plan [location]`

## Typical workflows

### Start a new plan in the default session location

```text
/plan
```

Use this when you want one plan file per session with the default naming/location behavior.

### Start or move a plan to a specific file

```text
/plan docs/my-feature.plan.md
```

Use this when the plan file location matters and you do not want the default session-adjacent path.

### Point plan mode at a directory

```text
/plan docs/plans/
```

Plan mode creates a `<timestamp>-<sessionId>.plan.md` file inside that directory.

### Exit and keep the plan for later

Open `/plan` again while plan mode is active and choose one of the exit actions.

## Tools available only in plan mode

Plan mode adds planning-specific tools only while active:

- `task_agents` — run isolated research tasks using the bundled subagent runtime (concurrency: 1-4)
- `steer_task_agent` — rerun one task from a previous `task_agents` run with extra guidance
- `request_user_input` — ask clarifying questions with optional choices and optional freeform answers
- `set_plan` — overwrite the active plan file with the complete latest plan text

When plan mode ends, these tools are removed again.

## Default file behavior

By default:
- plan mode uses one plan file per session
- the file lives next to the session file
- the session extension is replaced with `.plan.md`

`/plan [location]` overrides that path resolution.

Plan files are intentionally kept after exit so planning can be resumed later.

## Prompt override

The default plan-mode prompt is stored in:

```text
packages/plan/prompts/PLAN.prompt.md
```

You can override it globally with:

```text
~/.pi/agent/PLAN.prompt.md
```

If the override file is missing or blank, the bundled prompt is used.

## Verification checklist

After installing the package:

1. start pi
2. run `/plan`
3. confirm the plan banner appears
4. confirm plan-only tools are available while active
5. exit plan mode and confirm pi reports the saved plan file

If `/plan` does nothing useful, the package is not installed or not enabled.

## Choosing the right package

- want plan-first workflow → `@ifi/pi-plan`
- want spec-first workflow with durable feature artifacts → `@ifi/pi-spec`
- want delegated execution → `@ifi/pi-extension-subagents`

See `docs/08-package-selection.md` for the broader chooser.

## Related packages

- `@ifi/oh-pi` — full bundle
- `@ifi/pi-spec` — spec-first workflow package
- `@ifi/pi-extension-subagents` — delegated research/execution runtime used by `task_agents`
- `docs/08-package-selection.md` — package chooser
