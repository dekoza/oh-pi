---
default: minor
---

Add explicit multiplier-aware scoring to adaptive routing.

- add `costs.modelMultipliers` and `costs.defaultMaxMultiplier` config support
- add per-intent `maxMultiplier` ceilings so routing can penalize over-budget models
- surface selected multiplier and budget details in `/route explain`
- document the distinction between ordered delegated candidates and unordered main-session `preferredModels`
