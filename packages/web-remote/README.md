# @ifi/pi-web-remote

Pi extension that adds the `/remote` command for starting and stopping the remote web server from inside pi.

This package is the **in-pi command wrapper** around the remote server lifecycle. It is not the lower-level client or server library.

## When to use this package

Use `@ifi/pi-web-remote` when you want:
- a simple `/remote` command inside pi
- connection URLs shown directly in the terminal UI
- automatic LAN URL selection
- best-effort tunnel startup when `cloudflared` or `tailscale` is installed

Do **not** use this package when you need to build your own remote UI or embed remote pi access into another app. Use `@ifi/pi-web-server` and `@ifi/pi-web-client` for that.

## Install

```bash
pi install npm:@ifi/pi-web-remote
```

## Commands

### `/remote`

Behavior verified from `index.ts`:
- starts the remote server if it is not already running
- tries to start a tunnel automatically when a supported tunnel provider is available
- shows a connection URL
- stores a footer status entry (`🌐 Remote: <n> client(s)`)
- subscribes to client connect/disconnect events and shows notifications

If the server is already running, `/remote` shows the current status instead of starting a second server.

### `/remote stop`

Stops the running remote server, clears the footer status, and removes the connection listeners.

## Connection URL behavior

The extension chooses the connect URL in this order:

1. tunnel-backed hosted UI URL using `https://pi-remote.dev?...` when a tunnel is active
2. LAN URL such as `http://<lan-ip>:<port>?t=<token>` when a LAN IP is available
3. direct local server URL such as `http://localhost:<port>?t=<token>`

## Quick start

Inside pi:

```text
/remote
```

Then:
- copy the printed URL
- open it in a browser on the same network, or use the tunnel-backed URL if one was created
- run `/remote` again later to inspect status
- run `/remote stop` when done

## Verification checklist

After `/remote`, expect all of these:
- a `Starting remote access...` notification
- a `Remote active` notification with an instance ID and URL
- a footer status entry beginning with `🌐 Remote:`

If a client connects, the extension emits `Client connected` / `Client disconnected` notifications.

## Tunnel support

Tunnel startup is best-effort.

Supported providers are detected in this order:
- `cloudflared`
- `tailscale`

If tunnel startup fails, the extension keeps running with a LAN or local URL instead of aborting the whole flow.

## Choosing the right package

- want `/remote` inside pi? use `@ifi/pi-web-remote`
- want to embed the server in your own app? use `@ifi/pi-web-server`
- want to build a custom browser/mobile client? use `@ifi/pi-web-client`

## Troubleshooting

### `/remote` says remote is active but the URL is local-only

No tunnel provider was available, or tunnel startup failed. Install `cloudflared` or `tailscale` if you need an externally reachable URL.

### `/remote stop` says remote access is not active

There is no live server in the current pi process. Start one with `/remote` first.

### I need more control than this command gives me

That is not a bug in this package. It is the wrong layer. Drop to `@ifi/pi-web-server` and `@ifi/pi-web-client`.

## Related packages

- `@ifi/pi-web-server` — remote server implementation
- `@ifi/pi-web-client` — client library for custom UIs
- `docs/08-package-selection.md` — choose the right remote package
