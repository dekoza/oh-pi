---
default: minor
---

Improve delegated routing UX for subagents and ant-colony.

- show effective subagent route details in management detail output and the `/agents` detail panel
- warn when a subagent category is inactive because an explicit model override takes precedence
- surface subagent route summaries in execution rendering
- include active ant route details in `colony-status` output and stream state
