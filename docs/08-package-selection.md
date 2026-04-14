# oh-pi Package Selection Guide

This repo ships many packages. That is flexibility, but it is also friction. If a new user has to guess which package they need, the docs failed.

Use this guide when you want the shortest path from "I need X" to the correct package.

## Start here

### I just want the full curated setup

Install:

```bash
npx @ifi/oh-pi
```

Use this when you want the default oh-pi experience without picking packages one by one.

You get:
- first-party extensions
- subagents
- ant-colony
- plan mode
- spec workflow
- prompts, skills, themes, and AGENTS templates

Choose this unless you have a specific reason not to.

---

### I only want interactive setup / package selection

Install or run:

```bash
npx @ifi/oh-pi-cli
```

Use this when you want a guided configurator but do not want the full bundle installed blindly.

---

### I want smarter runtime behavior inside pi

Install:

```bash
pi install npm:@ifi/oh-pi-extensions
```

Choose this for:
- adaptive routing
- scheduler reminders and follow-ups
- usage tracking
- watchdog / safe mode
- git guard
- background process helpers

If your problem is "make pi safer / smarter / more ergonomic", this is usually the package.

---

### I want delegated subagents

Install:

```bash
pi install npm:@ifi/pi-extension-subagents
```

Choose this for:
- `/run`, `/chain`, `/parallel`
- reusable agent definitions
- agent categories and delegated routing
- structured multi-step execution with explicit control

Pick this when you still want to stay in charge of the workflow.

---

### I want autonomous background swarm execution

Install:

```bash
pi install npm:@ifi/oh-pi-ant-colony
```

Choose this for:
- `ant_colony`
- `/colony`, `/colony-status`, `/colony-stop`, `/colony-resume`
- isolated worktree execution by default
- scout/worker/soldier style parallel execution

Pick this when the task is large enough that you want the system to decompose and run work in the background.

---

### I want explicit planning mode before execution

Install:

```bash
pi install npm:@ifi/pi-plan
```

Choose this for:
- `/plan`
- `Alt+P`
- plan files that survive the session
- planning-only tools such as `task_agents`, `request_user_input`, and `set_plan`

Pick this when your main problem is "slow down and plan first".

---

### I want a spec-driven workflow with tracked artifacts

Install:

```bash
pi install npm:@ifi/pi-spec
```

Choose this for:
- `/spec`
- `.specify/` state
- feature-specific spec folders under `specs/`
- a file-centric workflow for requirements, plans, and implementation artifacts

Pick this when you want durable project artifacts rather than only session-local planning.

---

### I want a remote browser UI for a live pi session

Install:

```bash
pi install npm:@ifi/pi-web-remote
```

Choose this for:
- `/remote`
- temporary browser access to a live session
- LAN or tunnel-backed connection URLs

This is the extension surface. If you need to build your own remote product instead of using the built-in command, look at the client/server packages below.

---

### I want to embed remote pi access in my own app

Server package:

```bash
pnpm add @ifi/pi-web-server
```

Client package:

```bash
pnpm add @ifi/pi-web-client
```

Choose these when you are building:
- a custom browser UI
- a mobile UI
- an internal remote control panel
- your own remote-sharing workflow

Do not install these if all you want is `/remote`. Use `@ifi/pi-web-remote` for that.

---

### I want additional providers, not workflow features

Provider packages:

```bash
pi install npm:@ifi/pi-provider-cursor
pi install npm:@ifi/pi-provider-ollama
```

Choose these when the missing piece is model access, not orchestration.

- `@ifi/pi-provider-cursor` — experimental Cursor OAuth + model discovery + direct streaming
- `@ifi/pi-provider-ollama` — local Ollama plus Ollama Cloud

These are intentionally separate from the main bundle because they are provider integrations, not core workflow packages.

---

### I want content packs only

Install the content package that matches what you need:

```bash
pi install npm:@ifi/oh-pi-prompts
pi install npm:@ifi/oh-pi-skills
pi install npm:@ifi/oh-pi-themes
pi install npm:@ifi/oh-pi-agents
```

Use these when you want reusable content without the heavier workflow packages.

- prompts → reusable slash-style prompt templates
- skills → on-demand capability packs
- themes → color themes
- agents → AGENTS.md templates

## Decision table

| If you want... | Install... |
| --- | --- |
| the default oh-pi experience | `@ifi/oh-pi` |
| guided setup only | `@ifi/oh-pi-cli` |
| safer/smarter pi runtime behavior | `@ifi/oh-pi-extensions` |
| explicit delegated agents | `@ifi/pi-extension-subagents` |
| autonomous swarm execution | `@ifi/oh-pi-ant-colony` |
| plan-first workflow | `@ifi/pi-plan` |
| spec-first workflow | `@ifi/pi-spec` |
| browser sharing for a live session | `@ifi/pi-web-remote` |
| embedded remote server | `@ifi/pi-web-server` |
| embedded remote client | `@ifi/pi-web-client` |
| Cursor provider integration | `@ifi/pi-provider-cursor` |
| Ollama provider integration | `@ifi/pi-provider-ollama` |
| prompt content only | `@ifi/oh-pi-prompts` |
| skill content only | `@ifi/oh-pi-skills` |
| theme content only | `@ifi/oh-pi-themes` |
| AGENTS.md templates only | `@ifi/oh-pi-agents` |

## Recommended installs by persona

### Solo developer on one machine

Use:
- `@ifi/oh-pi`

That is the sane default.

### Team lead who wants durable plans/specs

Use:
- `@ifi/oh-pi`
- or, if you want minimal install surface, `@ifi/pi-plan` + `@ifi/pi-spec`

### Power user who already knows pi and only wants routing/safety

Use:
- `@ifi/oh-pi-extensions`

### User who wants delegated execution but not autonomous swarms

Use:
- `@ifi/pi-extension-subagents`

### User who wants remote browser access, not local terminal-only use

Use:
- `@ifi/pi-web-remote`

### App developer building custom remote controls

Use:
- `@ifi/pi-web-server`
- `@ifi/pi-web-client`

## What not to do

### Do not install `@ifi/pi-web-client` because you want `/remote`

Wrong package. `@ifi/pi-web-client` is a library, not the in-pi command.

### Do not install `@ifi/pi-web-server` because you want a turnkey browser share command

Wrong package. That is what `@ifi/pi-web-remote` is for.

### Do not install provider packages expecting full workflow features

`@ifi/pi-provider-cursor` and `@ifi/pi-provider-ollama` solve model access. They do not replace `subagents`, `ant-colony`, `plan`, or `spec`.

### Do not install content packs expecting runtime automation

Prompts, skills, themes, and AGENTS templates are content packages. They do not add orchestration by themselves.

## Verification checklist

After installation, verify the package actually loaded.

### Full bundle

```bash
npx @ifi/oh-pi
pi list
```

Expect to see the oh-pi packages listed.

### Extensions

Inside pi, verify commands such as:
- `/route status`
- `/usage`
- `/watchdog`

### Subagents

Inside pi, verify:
- `/run`
- `/chain`
- `/parallel`
- `/agents`

### Ant-colony

Inside pi, verify:
- `/colony-count`
- `ant_colony`

### Plan mode

Inside pi, verify:
- `/plan`

### Spec mode

Inside pi, verify:
- `/spec`

### Remote sharing

Inside pi, verify:
- `/remote`

### Provider packages

Inside pi, verify:
- `/login cursor` or `/cursor status`
- `/login ollama-cloud` or `/ollama status`

## Related docs

- `packages/oh-pi/README.md` — full bundle installer
- `packages/extensions/README.md` — extensions overview
- `packages/subagents/README.md` — subagent workflows
- `packages/ant-colony/README.md` — ant-colony usage
- `packages/plan/README.md` — plan mode
- `packages/spec/README.md` — spec workflow
- `packages/web-remote/README.md` — `/remote`
- `packages/web-server/README.md` — embedded server
- `packages/web-client/README.md` — embedded client
