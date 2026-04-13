# @ifi/oh-pi-prompts

Prompt templates for pi.

This package is for users who want reusable slash-style prompt starters without installing a heavier workflow package.

## What this package gives you

After installation, pi discovers the markdown templates in `prompts/` and exposes them through pi's normal prompt-template flow.

Verified from pi's prompt-template docs:
- filename becomes the command name (`review.md` → `/review`)
- prompt templates support arguments such as `$1`, `$2`, and `$@`
- package-level prompt directories are discovered automatically

## Install

```bash
pi install npm:@ifi/oh-pi-prompts
```

Or install the full bundle:

```bash
npx @ifi/oh-pi
```

## How to use it

Inside pi, invoke a template by name:

```text
/review
/fix
/explain auth middleware
```

Templates can accept arguments. For example, pi supports positional placeholders like `$1` and `$@`.

## Included prompts

| Prompt | Purpose |
| --- | --- |
| `/commit` | Generate a Conventional Commit message for staged changes |
| `/document` | Generate or update documentation |
| `/explain` | Explain code or a concept clearly, from simple to detailed |
| `/fix` | Fix the current error or bug with minimal changes |
| `/optimize` | Optimize code for performance |
| `/pr` | Generate a pull request description |
| `/refactor` | Refactor code while preserving behavior |
| `/review` | Review code for bugs, security issues, and improvements |
| `/security` | Run a security audit following OWASP-style concerns |
| `/test` | Generate tests for the specified code |

## Which prompt should I use?

Use:
- `/review` when you want defects and risks called out
- `/fix` when you already know something is broken and want a repair prompt
- `/explain` when you need understanding before changing code
- `/refactor` when behavior should stay the same but structure should improve
- `/test` when the missing artifact is coverage, not implementation
- `/document` when the code may be fine but the docs are weak
- `/commit` or `/pr` when you are packaging finished work for git review
- `/security` when normal review is too broad and you want a security-first pass
- `/optimize` when the issue is speed, memory, or waste

## Cookbook

### Review a risky change before touching it

```text
/review
```

Use this first when you are not sure whether the current code is wrong, dangerous, or just ugly.

### Fix a known bug and then add tests

```text
/fix
/test
```

Use this when the defect is already known and you want the follow-up artifact immediately.

### Understand first, then document

```text
/explain auth middleware
/document auth middleware
```

Use this when the missing piece is understanding before writing docs.

### Refactor safely

```text
/refactor payment state machine
/test payment state machine
```

Use this when structure needs work but behavior should stay stable.

### Package finished work for git review

```text
/commit
/pr
```

Use this after the code and tests are already in shape.

## Example workflow

A sane review/fix loop:

```text
/review
/fix
/test
```

A documentation pass:

```text
/explain
/document
```

A change-packaging pass:

```text
/commit
/pr
```

## Package layout

```text
prompts/
├── commit.md
├── document.md
├── explain.md
├── fix.md
├── optimize.md
├── pr.md
├── refactor.md
├── review.md
├── security.md
└── test.md
```

## When not to use this package

Do not install this package expecting runtime orchestration. Prompt templates are content only.

If you want actual runtime features, look at:
- `@ifi/oh-pi-extensions`
- `@ifi/pi-extension-subagents`
- `@ifi/oh-pi-ant-colony`
- `@ifi/pi-plan`
- `@ifi/pi-spec`

## Related packages

- `@ifi/oh-pi-skills` — on-demand skill packs
- `@ifi/oh-pi-themes` — theme pack
- `@ifi/oh-pi-agents` — AGENTS.md templates
- `docs/08-package-selection.md` — choose the right package before installing more than you need
