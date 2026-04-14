# @ifi/oh-pi-cli

Interactive TUI configurator for `pi-coding-agent` and oh-pi packages.

This package exists for users who want a guided setup flow instead of editing config files or installing packages by hand.

## When to use this package

Use `@ifi/oh-pi-cli` when:
- you want an interactive configurator
- you are setting up pi for the first time
- you want to choose providers, models, extensions, prompts, skills, themes, and templates from a TUI
- you do **not** want to install the full bundle blindly

Do **not** use this package if you already know you want the curated full install. In that case, use `@ifi/oh-pi`.

## What it does

Verified from the package role and repo structure, this CLI is the setup/configuration surface for oh-pi content and install targets.

It helps configure:
- providers and auth
- models
- extensions
- prompts
- skills
- themes
- AGENTS template content
- installer presets

## Usage

Run the CLI directly:

```bash
npx @ifi/oh-pi-cli
```

If you want the full curated install instead:

```bash
npx @ifi/oh-pi
```

## What to expect

The CLI is a compiled Node.js TUI package.

Use it when you want a guided selection flow rather than manually deciding:
- which packages to install
- which providers to enable
- which content packs to register
- which presets make sense for your environment

## Quick workflow

Typical first-run flow:

1. start the configurator
2. choose auth/providers
3. choose models
4. choose which oh-pi packages/content to install
5. finish setup
6. run `pi list` to confirm the installed packages
7. start `pi`

## Verification checklist

After using the configurator, verify:

```bash
pi list
pi
```

Inside pi, sanity-check a few commands relevant to what you selected, for example:
- `/route status`
- `/agents`
- `/colony-count`
- `/plan`
- `/spec`

If those surfaces are missing, the configurator did not install what you thought it did.

## Which package should I pick instead?

- want the full default oh-pi experience → `@ifi/oh-pi`
- want only runtime extensions → `@ifi/oh-pi-extensions`
- want only delegated subagents → `@ifi/pi-extension-subagents`
- want only background swarms → `@ifi/oh-pi-ant-colony`

See `docs/08-package-selection.md` for the full chooser.

## Development

```bash
pnpm --filter @ifi/oh-pi-cli build
pnpm --filter @ifi/oh-pi-cli typecheck
```

## Related packages

- `@ifi/oh-pi` — one-command curated installer
- `@ifi/oh-pi-core` — shared registries and types
- `docs/08-package-selection.md` — choose the right package before installing
