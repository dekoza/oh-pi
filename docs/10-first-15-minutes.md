# First 15 Minutes with oh-pi

This is the shortest sane path from zero to a working oh-pi setup.

If you are looking for exhaustive reference, this is the wrong file. This is the beginner path.

## Before you start

You need:
- Node.js installed
- `pi-coding-agent` available or installable through the normal flow
- at least one provider credential you can use with pi

If you do not know which oh-pi package you want, read `docs/08-package-selection.md` first.

For most users, the right answer is still the full bundle:

```bash
npx @ifi/oh-pi
```

## Minute 0-2: install the default bundle

Run:

```bash
npx @ifi/oh-pi
```

What this should do:
- register the curated oh-pi packages with pi
- make extensions, subagents, ant-colony, plan mode, spec mode, prompts, skills, and themes available

If you intentionally want a narrower install, stop here and use `docs/08-package-selection.md` instead of copying the rest blindly.

## Minute 2-3: verify installation

Run:

```bash
pi list
```

You should see the oh-pi packages listed.

If you do not, the install did not stick. Do not continue pretending it worked.

## Minute 3-5: start pi and sanity-check the loaded surfaces

Run:

```bash
pi
```

Inside pi, check a few commands:

```text
/route status
/agents
/colony-count
/plan
/spec
```

You are not trying to master them yet. You are only verifying that the expected package surfaces actually loaded.

If one of these is missing, go back to `pi list` and the package selection guide instead of debugging random behavior.

## Minute 5-7: run one small delegated task

Inside pi:

```text
/run scout summarize this repository
```

Why this step matters:
- proves subagents are installed
- proves your current model can execute delegated work
- gives you a visible success case quickly

If this fails, do not jump to ant-colony or spec mode yet. Fix the basics first.

## Minute 7-9: inspect the agent library

Inside pi:

```text
/agents
```

Look for:
- builtin agents such as `scout`, `planner`, `worker`, `reviewer`
- detail view
- route explanation surfaces

You do not need to edit anything yet. Just confirm the manager exists and the package is wired.

## Minute 9-11: try one workflow package on purpose

Pick **one** of these, not all of them at once.

### Option A — plan-first

```text
/plan
```

Choose this if you want explicit planning before implementation.

### Option B — spec-first

```text
/spec
```

Choose this if you want durable feature artifacts and a stricter workflow.

### Option C — swarm execution

```text
/colony Add tests for the auth module and fix failures
```

Choose this only if the task is large enough to justify decomposition and background execution.

## Minute 11-13: check routing and usage visibility

Inside pi:

```text
/route status
/usage
```

Why this matters:
- `adaptive-routing` is one of the most useful oh-pi additions
- `usage-tracker` tells you whether the runtime is actually seeing provider/session cost state

If you later enable delegated routing for subagents or ant-colony, this extension package owns that policy.

## Minute 13-15: choose your next path deliberately

At this point, decide what you actually want.

### I want explicit agent-based delegation

Read:
- `packages/subagents/README.md`

### I want background swarm execution

Read:
- `packages/ant-colony/README.md`

### I want planning discipline

Read:
- `packages/plan/README.md`

### I want a spec workflow

Read:
- `packages/spec/README.md`

### I want safer/smarter runtime behavior

Read:
- `packages/extensions/README.md`

## Common mistakes in the first 15 minutes

### Installing provider packages when the real issue is workflow

`@ifi/pi-provider-cursor` and `@ifi/pi-provider-ollama` solve provider access, not orchestration.

### Installing the remote client/server when you just wanted `/remote`

If you want the in-pi sharing command, you wanted `@ifi/pi-web-remote`.

### Trying ant-colony before basic delegated execution works

If `/run scout ...` fails, ant-colony is not your next step.

### Reading upstream pi reference docs when the problem is package choice

Use:
- `docs/08-package-selection.md`
- `docs/09-docs-map.md`

first.

## What success looks like

A successful first 15 minutes means:
- `npx @ifi/oh-pi` completed
- `pi list` shows the installed packages
- `pi` starts normally
- `/run scout ...` works
- `/agents` opens
- at least one of `/plan`, `/spec`, or `/colony` is available and understandable

That is enough. Do not try to master the entire repo in one sitting.

## Next docs

- `docs/08-package-selection.md` — choose the right package
- `docs/09-docs-map.md` — understand repo docs vs imported pi reference
- `packages/extensions/README.md` — runtime extensions
- `packages/subagents/README.md` — delegated execution
- `packages/ant-colony/README.md` — swarm execution
- `packages/plan/README.md` — planning mode
- `packages/spec/README.md` — spec workflow
