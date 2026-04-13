# @ifi/oh-pi-skills

On-demand skill packs for pi.

This package is for users who want reusable, triggerable workflow guidance without writing their own skills from scratch.

## What this package gives you

Skills are discovered by pi and loaded on demand when the task matches a skill description, or when you invoke them explicitly with `/skill:<name>`.

Verified from pi's skill docs:
- skills are discovered from package `skills/` directories
- each skill is defined by a `SKILL.md`
- the `description` field drives when the skill should load

## Install

```bash
pi install npm:@ifi/oh-pi-skills
```

Or install the full bundle:

```bash
npx @ifi/oh-pi
```

## How to use it

### Automatic loading

Just ask for the task naturally. If the skill description matches well enough, pi can load it automatically.

### Explicit loading

```text
/skill:web-search latest pnpm workspace docs
/skill:git-workflow help me clean up this branch
/skill:write-a-skill create a skill for Django migrations
```

## Included skills

| Skill | Use it for |
| --- | --- |
| `btw` | side-conversation workflow with `/btw` or `/qq` |
| `claymorphism` | soft, puffy clay-style UI design |
| `context7` | current library/framework docs via Context7 |
| `debug-helper` | debugging, log interpretation, profiling |
| `flutter-serverpod-mvp` | full-stack Flutter + Serverpod MVP scaffolding/evolution |
| `git-workflow` | branching, commits, PRs, conflict resolution |
| `glassmorphism` | frosted-glass UI design |
| `grill-me` | aggressive design/plan interrogation |
| `improve-codebase-architecture` | architecture review and refactor opportunities |
| `liquid-glass` | Apple-style translucent glass UI design |
| `neubrutalism` | bold, high-contrast neubrutalist UI design |
| `quick-setup` | detect project type and generate `.pi/` config |
| `request-refactor-plan` | create a staged refactor plan and issue-ready breakdown |
| `rust-workspace-bootstrap` | production-ready Rust workspace scaffolding |
| `web-fetch` | fetch a web page and extract readable text |
| `web-search` | web search via DuckDuckGo |
| `write-a-skill` | create a new skill with proper structure |

## Which skill should I reach for first?

Use:
- `debug-helper` when something is broken
- `context7` when the main problem is stale or missing library docs
- `web-search` when you need current public information
- `web-fetch` when you already know the page and just need its readable content
- `git-workflow` when the problem is branch/PR hygiene
- `quick-setup` when a repo has no useful `.pi/` configuration yet
- `write-a-skill` when you want to productize repeated guidance into a skill
- `grill-me` when you want your plan attacked instead of politely echoed

## Package layout

```text
skills/
├── btw/
├── claymorphism/
├── context7/
├── debug-helper/
├── flutter-serverpod-mvp/
├── git-workflow/
├── glassmorphism/
├── grill-me/
├── improve-codebase-architecture/
├── liquid-glass/
├── neubrutalism/
├── quick-setup/
├── request-refactor-plan/
├── rust-workspace-bootstrap/
├── web-fetch/
├── web-search/
└── write-a-skill/
```

## When not to use this package

Do not install this package expecting new commands like `/chain` or `/colony`. Skills are guidance content, not orchestration code.

If you need runtime features, look at the workflow packages instead.

## Related packages

- `@ifi/oh-pi-prompts` — prompt templates
- `@ifi/oh-pi-themes` — theme pack
- `@ifi/oh-pi-agents` — AGENTS.md templates
- `docs/08-package-selection.md` — package chooser
