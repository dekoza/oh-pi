---
default: minor
---

Improve adaptive routing defaults for GitHub Copilot model sets.

- teach `/route init` to generate a richer Copilot-aware policy with router models, ranked models, explicit multiplier metadata, and per-intent budget ceilings
- update delegated category defaults to match the revised Copilot policy, including Gemini 3.1 Pro first for `visual-engineering` and `peak-reasoning`
- add context-window-aware scoring so large-context tasks can prefer larger-window models during main-session routing
- document the new init behavior and context-aware scoring in the routing guide
