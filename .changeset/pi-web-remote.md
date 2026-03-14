---
default: major
---

Add remote web management for pi instances.

Introduces three new packages for controlling a pi session from any browser or mobile device:

- `@ifi/pi-web-server` — Embeddable HTTP + WebSocket server that bridges a pi `AgentSession` to remote clients with token-based auth, auto-tunnel detection (cloudflared/tailscale), and QR code generation.
- `@ifi/pi-web-remote` — Pi extension that registers the `/remote` command. One command, zero config: starts the server, auto-detects connectivity, and displays a QR code to scan.
- `@ifi/pi-web-client` — Platform-agnostic TypeScript client library (zero dependencies) that works in browsers, React Native, and Node.js.

Also includes a headless daemon mode (`pi-web serve`) for long-running always-on instances.
