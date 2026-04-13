---
default: minor
---

Add inline candidates, /route init, and configuration guide for adaptive routing.

- allow `delegatedRouting.categories` entries to specify `candidates` directly, bypassing taskClass/fallbackGroup indirection for simple setups
- add `/route init` command that generates a default config.json from available models with scout/worker/soldier categories
- add `docs/guides/adaptive-routing-config.md` covering quick start, config structure, category attachment, recipes, and full reference
