---
default: minor
---

Replace CLI-based rate limit probing with direct API calls using pi-managed auth tokens. The usage-tracker extension no longer shells out to external `claude` or `codex` CLI tools. Instead, it reads OAuth credentials from `~/.pi/agent/auth.json` and queries provider APIs directly (Anthropic, OpenAI, Google). Adds Google provider support. Updates `/usage` overlay, widget, and `Ctrl+U` dashboard to probe all configured providers.
