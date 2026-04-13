# @ifi/oh-pi-themes

Color themes for pi.

This package is a curated theme pack. It does not change behavior; it only changes how pi looks.

## Install

```bash
pi install npm:@ifi/oh-pi-themes
```

Or install the full bundle:

```bash
npx @ifi/oh-pi
```

## What this package gives you

After installation, the JSON themes in `themes/` become available to pi's normal theme loading flow.

This package is useful when you want:
- a better default look without hand-authoring a theme
- a base theme to copy and customize
- a small curated set instead of building a theme from scratch

## Included themes

The package currently ships these theme files:

- `catppuccin-mocha`
- `cyberpunk`
- `gruvbox-dark`
- `nord`
- `oh-p-dark`
- `tokyo-night`

If you do not know which one to pick, read `docs/11-theme-chooser.md` instead of choosing blind from the filenames.

## Theme chooser in one table

| Theme | Short take |
| --- | --- |
| `oh-p-dark` | balanced default dark theme |
| `catppuccin-mocha` | soft pastel dark |
| `cyberpunk` | neon magenta/cyan high contrast |
| `gruvbox-dark` | warm earthy dark |
| `nord` | cool restrained dark |
| `tokyo-night` | blue-violet modern dark |

## How to use it

Typical workflow:

1. install the package
2. confirm the package is registered with `pi list`
3. use pi's normal theme selection/config flow to switch to one of the shipped themes

If you want to fork a theme, copy one of the JSON files and customize it rather than starting from zero.

## Package layout

```text
themes/
├── catppuccin-mocha.json
├── cyberpunk.json
├── gruvbox-dark.json
├── nord.json
├── oh-p-dark.json
└── tokyo-night.json
```

## Who should install this

Install this package when:
- you want visual polish without changing runtime behavior
- you already know you want a theme pack, not the full oh-pi bundle
- you want JSON theme files you can inspect and modify

Do **not** install this package expecting workflow features. Themes are presentation only.

## Related packages

- `@ifi/oh-pi-prompts` — prompt content
- `@ifi/oh-pi-skills` — skill content
- `@ifi/oh-pi-agents` — AGENTS.md templates
- `docs/08-package-selection.md` — package chooser
