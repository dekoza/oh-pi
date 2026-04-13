# @ifi/pi-web-server

Embeddable HTTP + WebSocket server for remote pi session management.

This package is the **server-side library** behind remote pi access. It is not the `/remote` command wrapper.

## When to use this package

Use `@ifi/pi-web-server` when you want to:
- embed remote pi access in your own app or service
- expose a live pi session over HTTP + WebSocket
- build a custom browser or mobile UI together with `@ifi/pi-web-client`
- run the standalone `pi-web` daemon for testing or internal tools

Do **not** install this package if all you want is the in-pi `/remote` command. Use `@ifi/pi-web-remote` for that.

## Install

```bash
pnpm add @ifi/pi-web-server
```

## What it exports

Verified from `src/index.ts`:
- `PiWebServer`
- `createPiWebServer()`
- token helpers (`generateToken`, `generateInstanceId`, `loadOrCreateToken`, `validateToken`)
- tunnel helpers (`detectTunnelProvider`, `startTunnel`)
- WebSocket session types/helpers (`handleWebSocketConnection`, `AgentSessionLike`, `WsHandlerOptions`, `WsSession`)

## Fastest way to try it

The package ships a CLI daemon:

```bash
npx @ifi/pi-web-server serve
```

Useful flags:

```bash
npx @ifi/pi-web-server serve --port 3200 --token-file ~/.config/pi-web/token
npx @ifi/pi-web-server serve --no-tunnel
```

What the CLI does today:
- starts the HTTP + WebSocket server
- chooses a free port starting at `3100`
- loads or creates a token file
- tries to start a tunnel with `cloudflared` or `tailscale` unless `--no-tunnel` is set
- prints the connection URL and instance ID

## Programmatic example

```ts
import { createPiWebServer } from "@ifi/pi-web-server";
import type { AgentSessionLike } from "@ifi/pi-web-server";

const session: AgentSessionLike = getYourSessionAdapterSomehow();

const server = createPiWebServer({
	port: 3100,
	tokenFile: `${process.env.HOME}/.config/pi-web/token`,
});

server.attachSession(session);

const started = await server.start();
console.log(started.url, started.instanceId);
```

The server is only useful for live session control if you attach an `AgentSessionLike` implementation.

## Required session adapter surface

The attached session must provide the methods and fields expected by `AgentSessionLike`, including:
- `prompt()`
- `steer()`
- `followUp()`
- `abort()`
- `compact()`
- `setModel()`
- `setThinkingLevel()`
- `subscribe()`
- `newSession()`
- state such as `messages`, `model`, `thinkingLevel`, `sessionId`, `sessionFile`, and `isStreaming`

If your host cannot supply that interface, the server can still run, but authenticated requests that need a session will fail with `No session attached`.

## HTTP API

Verified from `src/routes.ts`.

### No auth required

- `GET /api/health`

### Requires `Authorization: Bearer <token>`

- `GET /api/instance`
- `GET /api/session/state`
- `GET /api/session/messages`
- `GET /api/session/stats`
- `GET /api/models`

Example:

```bash
curl http://localhost:3100/api/health
curl -H "Authorization: Bearer $PI_WEB_TOKEN" http://localhost:3100/api/instance
```

## WebSocket protocol

The WebSocket handler requires an auth handshake before any RPC command.

First message from the client must be:

```json
{ "type": "auth", "token": "<server-token>" }
```

After successful auth, the server sends `auth_ok` and begins relaying session events.

If auth fails, the server responds with `auth_error` and closes the socket.

## Tokens and instance IDs

The server supports three token modes:
- explicit `token`
- persisted `tokenFile`
- generated in-memory token when neither is supplied

`instanceId` is derived from the token and remains stable when the same token file is reused.

## Tunnel behavior

Verified from `src/tunnel.ts` and the CLI:
- `cloudflared` is preferred when available
- `tailscale` is the second fallback
- if neither exists, the server still works locally/LAN-only
- tunnel startup times out after 30 seconds

## Important implementation note

The exported `PiWebServerOptions` type currently includes fields such as `tunnel`, `tls`, `staticDir`, and `hostedUiUrl`, but the runtime implementation in `src/server.ts` only wires through the core host/port/token/max-client settings today.

Do not assume every type-level option already has runtime behavior.

## Troubleshooting

### Clients authenticate but cannot control the session

Your server has no attached session adapter. The server is alive, but it cannot proxy session commands.

### Token works for HTTP but the client still fails

Check that the WebSocket client sends the auth message first. The server rejects unauthenticated sockets immediately.

### Tunnel never appears

Install either:
- `cloudflared`
- `tailscale`

If neither is available, the server will stay local/LAN-only.

## Related packages

- `@ifi/pi-web-client` — remote client library
- `@ifi/pi-web-remote` — pi extension wrapper around the remote server lifecycle
- `docs/08-package-selection.md` — choose the right remote package
