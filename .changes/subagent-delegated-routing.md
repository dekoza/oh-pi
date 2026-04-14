---
default: minor
---

Add delegated model routing support for subagents.

- add adaptive-routing delegated-routing config support for category-based delegated model selection
- resolve subagent models by precedence: runtime override, explicit agent model, delegated category policy, then existing fallback behavior
- thread delegated route metadata through subagent execution results for later explanation surfaces
- add the initial delegated category defaults for `quick-discovery`, `balanced-execution`, `review-critical`, `peak-reasoning`, and `visual-engineering`
