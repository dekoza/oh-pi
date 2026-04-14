# oh-pi Docs Map: Repo Docs vs Imported pi Reference

This repo has two different kinds of documentation.

If readers do not understand that split, they will overestimate what is documented for oh-pi itself.

## The split

### A. Repo-specific oh-pi docs

These explain this repository, its packages, and its workflows.

Start here when your question is:
- which package should I install?
- what does this repo add on top of pi?
- how do `subagents`, `ant-colony`, `plan`, `spec`, or the provider packages work?

Primary entry points:
- `docs/08-package-selection.md`
- package READMEs under `packages/*/README.md`
- oh-pi-specific design/plan docs under `docs/plans/`

### B. Imported pi reference docs

These are repo-local copies/summaries of upstream `pi-coding-agent` documentation.

Start here when your question is:
- how does pi itself work?
- what does the extension API look like?
- what are the CLI flags, settings, prompt-template rules, or TUI APIs?

Primary entry points:
- `docs/01-overview.md`
- `docs/02-interactive-mode.md`
- `docs/03-sessions.md`
- `docs/04-extensions.md`
- `docs/05-skills-prompts-themes-packages.md`
- `docs/06-settings-sdk-rpc-tui.md`
- `docs/07-cli-reference.md`

## Fast decision guide

### I need to install the right package

Read:
- `docs/08-package-selection.md`

### I need to use an oh-pi package

Read the matching package README under `packages/*/README.md`.

Examples:
- `packages/subagents/README.md`
- `packages/ant-colony/README.md`
- `packages/extensions/README.md`
- `packages/plan/README.md`
- `packages/spec/README.md`

### I need pi platform reference

Read the imported reference docs in `docs/01-07`.

### I need implementation rationale or RFC history

Read:
- `docs/plans/*`
- selected design notes such as `docs/DESIGN.md`

## What this split prevents

Without this distinction, readers make three bad assumptions:

1. that upstream pi reference docs are package how-to docs for oh-pi
2. that package READMEs should explain every pi platform concept again
3. that the repo has better end-user coverage than it really does

This file exists to stop those mistakes.
