---
default: minor
---

Add delegated model routing support for subagents.

- resolve subagent models by precedence: runtime override, explicit agent model, delegated category policy, then existing fallback behavior
- thread delegated route metadata through subagent execution results for later explanation and rendering surfaces
- show effective subagent route details in management views and warn when an explicit model makes category routing inactive
