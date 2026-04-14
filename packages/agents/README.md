# @ifi/oh-pi-agents

AGENTS.md templates for pi.

This package is a content pack of starter `AGENTS.md` files. It is for users who want a faster starting point for project instructions instead of writing everything from scratch.

## Install

Most users should get these templates through the full bundle or the configurator:

```bash
npx @ifi/oh-pi
npx @ifi/oh-pi-cli
```

This package is content, not a runtime pi extension.

## What this package gives you

This package ships reusable markdown templates under `agents/`.

They are intended to be:
- copied into a project as `AGENTS.md`
- adapted to a team or repository
- used by the oh-pi installer/configurator as starter content

They are not runtime orchestration code.

## Included templates

| Template | Intended use |
| --- | --- |
| `general-developer` | broad project guidelines and coding standards |
| `fullstack-developer` | full-stack application work across frontend and backend |
| `security-researcher` | authorized security research / lab-style work |
| `data-ai-engineer` | data pipelines, ML/AI systems, and data engineering workflows |
| `colony-operator` | ant-colony style delegated swarm operation |

## How to use it

Typical workflow:

1. choose the closest template
2. copy it into your repo as `AGENTS.md`
3. delete rules that do not fit your team
4. add project-specific constraints, commands, and test expectations

Example:

```bash
cp ~/.pi/agent/npm/@ifi/oh-pi-agents/agents/general-developer.md ./AGENTS.md
```

Then edit the file until it matches your actual project. A bad copied template is worse than no template.

## Template index

### `general-developer`

Title: **Project Guidelines**

Use when you want a broad default instruction set emphasizing consistency, readable code, and sane engineering habits.

### `fullstack-developer`

Title: **Full-Stack Development**

Use when the repo spans frontend and backend and you want a stack-aware default template.

### `security-researcher`

Title: **Security Research Environment**

Use for authorized local/lab/CTF security work. Do not use it as a generic software template.

### `data-ai-engineer`

Title: **Data & AI Engineering**

Use for data pipelines, schema evolution, validation-heavy systems, and AI engineering projects.

### `colony-operator`

Title: **Ant Colony Operator**

Use when the operator is expected to delegate large jobs to ant-colony rather than doing everything manually.

## Package layout

```text
agents/
├── colony-operator.md
├── data-ai-engineer.md
├── fullstack-developer.md
├── general-developer.md
└── security-researcher.md
```

## When not to use this package

Do not install this package expecting executable agent orchestration. These are templates, not runnable subagents.

If you want executable multi-agent behavior, use:
- `@ifi/pi-extension-subagents`
- `@ifi/oh-pi-ant-colony`

## Related packages

- `@ifi/oh-pi` — full bundle installer
- `@ifi/oh-pi-cli` — interactive configurator
- `docs/08-package-selection.md` — package chooser
