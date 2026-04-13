# Adaptive Routing Configuration Guide

Adaptive routing automatically selects the best model and thinking level for each task based on
user-defined policies, provider quota, and model availability.

This guide covers three things:

1. How to set up routing from scratch
2. How the config file is structured
3. How to attach routing categories to agents

## Quick Start

Run `/route init` inside pi. This detects your available models and generates a working config file
at `~/.pi/agent/extensions/adaptive-routing/config.json` with default categories.

After init, enable routing:

```
/route on
```

That's it. Routing is active.

## Concepts

### Categories

A **category** is a label that describes what kind of work an agent does. Categories control which
models are eligible and what thinking level to use.

Built-in defaults after `/route init`:

| Category | Purpose | Thinking | Typical models |
|----------|---------|----------|----------------|
| `quick-discovery` | Cheap exploration, broad search | `minimal` | Flash, Mini |
| `balanced-execution` | Implementation and task execution | `medium` | Sonnet, Pro |
| `review-critical` | Review, criticism, quality checks | `high` | Opus, GPT-5.4 |
| `visual-engineering` | UI/visual design work | `high` | Gemini 3.1 Pro, Gemini 2.5 Pro |
| `peak-reasoning` | Architecture, autonomous planning | `xhigh` | Opus, GPT-5.4 |

These names match the ant-colony caste and worker-class defaults, so colony routing works
out of the box without extra configuration.

### Candidates

Each category has an ordered list of **candidates** — model IDs in priority order. The routing
engine picks the first available candidate.

### Thinking levels

Each category has a **default thinking level**: `off`, `minimal`, `low`, `medium`, `high`, or
`xhigh`.

## Config File

Location: `~/.pi/agent/extensions/adaptive-routing/config.json`

### Minimal working config

This is the smallest config that routes agents:

```json
{
  "mode": "shadow",
  "delegatedRouting": {
    "enabled": true,
    "categories": {
      "quick-discovery": {
        "candidates": ["google/gemini-2.5-flash", "openai/gpt-5-mini"],
        "defaultThinking": "minimal"
      },
      "balanced-execution": {
        "candidates": ["anthropic/claude-sonnet-4.6", "google/gemini-2.5-pro"],
        "defaultThinking": "medium"
      },
      "review-critical": {
        "candidates": ["openai/gpt-5.4", "anthropic/claude-opus-4.6"],
        "defaultThinking": "high"
      },
      "visual-engineering": {
        "candidates": ["google/gemini-3.1-pro-preview", "google/gemini-2.5-pro", "anthropic/claude-opus-4.6"],
        "defaultThinking": "high"
      },
      "peak-reasoning": {
        "candidates": ["openai/gpt-5.4", "anthropic/claude-opus-4.6"],
        "defaultThinking": "xhigh"
      }
    }
  }
}
```

Each category maps directly to an ordered model list. First available model wins.

These category names align with the ant-colony defaults:

| Colony role | Maps to category |
|---|---|
| scout caste | `quick-discovery` |
| worker caste | `balanced-execution` |
| soldier caste | `review-critical` |
| design worker | `visual-engineering` |
| backend worker | `balanced-execution` |
| review worker | `review-critical` |
| multimodal worker | `quick-discovery` |

### Routing modes

| Mode | Behavior |
|------|----------|
| `"off"` | Routing disabled |
| `"shadow"` | Suggests routes without applying them (safe to start with) |
| `"auto"` | Automatically switches model and thinking level per task |

Start with `"shadow"` to see what the router would choose. Switch to `"auto"` when you trust it.

## Attaching Categories to Agents

### Subagent frontmatter

Add `category:` to an agent definition:

```md
---
name: scout
description: Fast codebase recon
category: scout
---

You are a fast exploration agent...
```

### Ant colony castes

Colony castes (scout, worker, soldier) map to categories by default. Override in config if needed.

### Precedence order

When a subagent runs, model selection follows this order:

1. **Runtime override** — `subagent(..., model="provider/id")` always wins
2. **Explicit agent model** — `model:` in frontmatter
3. **Category routing** — `category:` resolved through `delegatedRouting.categories`
4. **Session default** — current session model as fallback

If an agent has both `model:` and `category:`, the explicit model wins and the category is ignored.

## Recipes

### "I want scouts on cheap models, workers on balanced, soldiers on premium"

```json
{
  "mode": "auto",
  "delegatedRouting": {
    "enabled": true,
    "categories": {
      "quick-discovery": {
        "candidates": ["google/gemini-2.5-flash", "openai/gpt-5-mini"],
        "defaultThinking": "minimal"
      },
      "balanced-execution": {
        "candidates": ["anthropic/claude-sonnet-4.6", "google/gemini-2.5-pro", "openai/gpt-5-mini"],
        "defaultThinking": "medium"
      },
      "review-critical": {
        "candidates": ["openai/gpt-5.4", "anthropic/claude-opus-4.6"],
        "defaultThinking": "high"
      },
      "visual-engineering": {
        "candidates": ["google/gemini-3.1-pro-preview", "google/gemini-2.5-pro", "anthropic/claude-opus-4.6"],
        "defaultThinking": "high"
      },
      "peak-reasoning": {
        "candidates": ["openai/gpt-5.4", "anthropic/claude-opus-4.6"],
        "defaultThinking": "xhigh"
      }
    }
  }
}
```

### "I only have Anthropic models"

```json
{
  "mode": "auto",
  "delegatedRouting": {
    "enabled": true,
    "categories": {
      "quick-discovery": {
        "candidates": ["anthropic/claude-sonnet-4.6"],
        "defaultThinking": "minimal"
      },
      "balanced-execution": {
        "candidates": ["anthropic/claude-sonnet-4.6"],
        "defaultThinking": "medium"
      },
      "review-critical": {
        "candidates": ["anthropic/claude-opus-4.6", "anthropic/claude-sonnet-4.6"],
        "defaultThinking": "high"
      },
      "visual-engineering": {
        "candidates": ["google/gemini-3.1-pro-preview", "anthropic/claude-opus-4.6"],
        "defaultThinking": "high"
      },
      "peak-reasoning": {
        "candidates": ["anthropic/claude-opus-4.6"],
        "defaultThinking": "xhigh"
      }
    }
  }
}
```

### "I want a custom category for design work"

```json
{
  "mode": "auto",
  "delegatedRouting": {
    "enabled": true,
    "categories": {
      "quick-discovery": {
        "candidates": ["google/gemini-2.5-flash"],
        "defaultThinking": "minimal"
      },
      "balanced-execution": {
        "candidates": ["anthropic/claude-sonnet-4.6"],
        "defaultThinking": "medium"
      },
      "review-critical": {
        "candidates": ["openai/gpt-5.4"],
        "defaultThinking": "high"
      },
      "visual-engineering": {
        "candidates": ["google/gemini-3.1-pro-preview", "anthropic/claude-opus-4.6", "anthropic/claude-sonnet-4.6"],
        "defaultThinking": "high"
      },
      "peak-reasoning": {
        "candidates": ["openai/gpt-5.4"],
        "defaultThinking": "xhigh"
      },
      "my-custom-design": {
        "candidates": ["anthropic/claude-opus-4.6"],
        "defaultThinking": "high"
      }
    }
  }
}
```

Then create an agent with `category: my-custom-design`:

```md
---
name: artist
description: UI and visual design specialist
category: my-custom-design
---

You are a design-focused agent...
```

## Advanced: Shared Model Pools

For complex setups where multiple categories should share the same pool of models, you can use
`taskClasses` and `fallbackGroups` instead of (or alongside) inline `candidates`.

```json
{
  "mode": "auto",
  "delegatedRouting": {
    "enabled": true,
    "categories": {
      "quick-discovery": { "taskClass": "quick" },
      "balanced-execution": { "fallbackGroup": "standard-coding", "defaultThinking": "medium" },
      "review-critical": { "fallbackGroup": "peak-reasoning", "defaultThinking": "high" },
      "visual-engineering": { "fallbackGroup": "design-premium", "defaultThinking": "high" },
      "peak-reasoning": { "taskClass": "peak", "defaultThinking": "xhigh" }
    }
  },
  "taskClasses": {
    "quick": {
      "candidates": ["google/gemini-2.5-flash", "openai/gpt-5-mini"],
      "defaultThinking": "minimal",
      "fallbackGroup": "cheap-router"
    }
  },
  "fallbackGroups": {
    "cheap-router": {
      "candidates": ["google/gemini-2.5-flash", "openai/gpt-5-mini"]
    },
    "standard-coding": {
      "candidates": ["anthropic/claude-sonnet-4.6", "openai/gpt-5-mini", "google/gemini-2.5-pro"]
    },
    "peak-reasoning": {
      "candidates": ["openai/gpt-5.4", "anthropic/claude-opus-4.6"]
    }
  }
}
```

Resolution order for each category:

1. **Inline `candidates`** — used if present on the category
2. **`taskClass`** — looks up `taskClasses[name].candidates`
3. **`fallbackGroup`** — looks up `fallbackGroups[name].candidates`

Most users should use inline `candidates` directly. The indirection is only useful when multiple
categories need to share and maintain the same model pool in one place.

## Commands

| Command | Effect |
|---------|--------|
| `/route init` | Generate a default config from available models |
| `/route on` or `/route auto` | Enable auto-routing |
| `/route off` | Disable routing |
| `/route shadow` | Suggest routes without applying |
| `/route status` | Show current routing state |
| `/route explain` | Show why the last route was chosen |
| `/route lock` | Lock current model (skip routing) |
| `/route unlock` | Clear lock |
| `/route refresh` | Reload config and usage data |
| `/route feedback good\|bad\|...` | Record feedback on last route |
| `/route stats` | Show routing statistics |

## Troubleshooting

### "My agent ignores its category"

Check precedence: if the agent has an explicit `model:` in frontmatter, that wins over `category:`.
Remove the `model:` line to let category routing take effect.

### "Category routing does nothing"

Verify `delegatedRouting.enabled` is `true` in config. Run `/route status` to confirm routing is
active.

### "Wrong model gets picked"

The router picks the **first available** candidate. Reorder the `candidates` array to change
priority. Run `/route explain` after a decision to see scoring details.

### "I changed the config but nothing happened"

Run `/route refresh` to reload the config file without restarting pi.

## Full Config Reference

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `mode` | `"off" \| "shadow" \| "auto"` | `"shadow"` | Routing mode |
| `delegatedRouting.enabled` | `boolean` | `false` | Enable category-based routing for agents |
| `delegatedRouting.categories` | `Record<string, CategoryPolicy>` | `{}` | Category definitions |
| `delegatedRouting.categories.*.candidates` | `string[]` | — | Ordered model IDs for this category |
| `delegatedRouting.categories.*.defaultThinking` | `ThinkingLevel` | — | Default thinking level |
| `delegatedRouting.categories.*.taskClass` | `string` | — | Reference to a shared taskClass (advanced) |
| `delegatedRouting.categories.*.fallbackGroup` | `string` | — | Reference to a shared fallbackGroup (advanced) |
| `routerModels` | `string[]` | `["google/gemini-2.5-flash"]` | Models used for prompt classification |
| `stickyTurns` | `number` | `1` | Keep the same route for N turns |
| `models.ranked` | `string[]` | `[]` | Global model preference ranking |
| `models.excluded` | `string[]` | `[]` | Models to never route to |
| `telemetry.mode` | `"off" \| "local" \| "export"` | `"local"` | Telemetry storage mode |
| `telemetry.privacy` | `"minimal" \| "redacted" \| "full-local"` | `"minimal"` | Privacy level for telemetry |
