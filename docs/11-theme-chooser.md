# Theme Chooser

The themes package used to be documented like a file listing. That was useless. This guide exists so users can choose a theme on purpose instead of guessing from names.

## Fast picks

### I want a calm dark default

Choose:
- `oh-p-dark`

Why:
- balanced dark palette
- not as loud as `cyberpunk`
- less stylized than `catppuccin-mocha`
- good default if you do not already know your taste

### I want a soft dark palette

Choose:
- `catppuccin-mocha`

Why:
- pastel accents
- warm, friendly look
- less aggressive than neon/high-contrast themes

### I want high-energy neon

Choose:
- `cyberpunk`

Why:
- magenta/cyan neon palette
- strongest visual personality in the pack
- good if you want style over restraint

### I want a warm terminal look

Choose:
- `gruvbox-dark`

Why:
- earthy warm colors
- classic editor aesthetic
- good if blue-heavy themes feel cold or sterile

### I want a cool low-drama palette

Choose:
- `nord`

Why:
- arctic blues and greys
- restrained contrast
- good if you want something calm and professional

### I want a modern blue-violet dark theme

Choose:
- `tokyo-night`

Why:
- cool blue/magenta palette
- stronger personality than `nord`
- cleaner and less playful than `catppuccin-mocha`

## Theme previews in words

| Theme | Best description | Good fit for |
| --- | --- | --- |
| `oh-p-dark` | balanced house dark theme | users who want the safest default |
| `catppuccin-mocha` | soft pastel dark | long sessions, lower visual harshness |
| `cyberpunk` | neon magenta/cyan high contrast | people who want a loud, stylized terminal |
| `gruvbox-dark` | warm earthy dark | classic editor users, amber/warm palettes |
| `nord` | cool arctic dark | restrained, low-drama environments |
| `tokyo-night` | blue-violet modern dark | users who want a vivid but not neon palette |

## What these descriptions are based on

The descriptions are grounded in the shipped theme variables, for example:
- `cyberpunk` uses neon/electric/hot/acid color names
- `gruvbox-dark` uses the expected warm `bg`/`fg` and red/green/yellow palette
- `nord` uses the familiar `nord0..nord9` cool palette
- `tokyo-night` centers on blue/cyan/magenta/orange/green accents
- `oh-p-dark` uses a balanced cyan/blue/purple/orange/green/red/yellow house palette
- `catppuccin-mocha` uses the standard pastel Catppuccin tones

This is still only a chooser. The real test is using the theme in your own terminal.

## How to compare themes sanely

1. install the themes package
2. switch to one theme
3. keep it for a real work session, not 20 seconds
4. pay attention to:
   - readability of dim text
   - warning/error visibility
   - visual fatigue over time
   - whether icons, diffs, and markdown remain readable in your terminal font
5. only then switch again

If you flip themes every minute, you are not evaluating anything useful.

## When themes look wrong

Sometimes the theme is fine and the terminal setup is bad.

Check:
- your terminal supports 24-bit color well
- your font renders emoji/icons correctly, or use plain icons
- your background is not being altered by terminal transparency settings in a way that kills contrast

For plain icons, see the root README plain-icons section.

## Related docs

- `packages/themes/README.md` — package overview
- `README.md` — root docs hub
- `docs/10-first-15-minutes.md` — beginner path
