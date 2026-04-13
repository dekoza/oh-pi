# @ifi/pi-web-client

Platform-agnostic TypeScript client for remote pi sessions.

This is a **library**, not a pi extension. Install it when you want to build your own browser, desktop, or mobile UI on top of a remote pi session.

## When to use this package

Use `@ifi/pi-web-client` when you are building:
- a custom browser UI for pi
- an internal admin panel for remote sessions
- a React Native or Node.js client that talks to a remote pi host

Do **not** install this package if you only want the in-pi `/remote` command. That is `@ifi/pi-web-remote`.

## Install

```bash
pnpm add @ifi/pi-web-client
```

## What it exports

Verified from `src/index.ts`:
- `PiWebClient`
- `ReconnectManager`
- connection / RPC / event types from `src/types.ts`

## Quick start

```ts
import { PiWebClient } from "@ifi/pi-web-client";

const client = new PiWebClient({
	url: "ws://localhost:3100/ws",
	token: process.env.PI_WEB_TOKEN!,
	autoReconnect: true,
});

const info = await client.connect();
console.log("Connected to", info.instanceId, "session", info.sessionId);

client.on("message_update", (event) => {
	console.log("delta", event);
});

await client.prompt("Summarize the current repository");
```

## Connection model

The client:
1. opens a WebSocket connection to the remote server
2. immediately sends an auth message containing the token
3. waits for `auth_ok`
4. exposes session metadata through the returned `InstanceInfo`
5. sends RPC-style commands and receives both responses and event-stream updates

Connection states are:
- `disconnected`
- `connecting`
- `authenticating`
- `connected`
- `reconnecting`

## Common methods

### Session control

- `connect()`
- `disconnect()`
- `prompt(message, options?)`
- `steer(message)`
- `followUp(message)`
- `abort()`

### Session inspection

- `getState()`
- `getMessages()`
- `getSessionStats()`
- `getCommands()`
- `getAvailableModels()`

### Session mutation

- `setModel(provider, modelId)`
- `setThinkingLevel(level)`
- `compact(instructions?)`
- `newSession()`
- `respondToUI(requestId, response)`

## Event subscription

Use `client.on(eventName, handler)` to subscribe.

Typical event names include protocol events such as:
- `agent_start`
- `agent_end`
- `turn_start`
- `turn_end`
- `message_start`
- `message_update`
- `message_end`
- `tool_execution_start`
- `tool_execution_update`
- `tool_execution_end`
- `connection`
- `error`

Example:

```ts
const unsubscribe = client.on("connection", (state) => {
	console.log("connection state", state);
});

// Later
unsubscribe();
```

## Reconnect behavior

By default, the client auto-reconnects after an established connection closes.

You can control that with:
- `autoReconnect: false` to disable it
- `reconnectInterval` to change the retry delay passed to `ReconnectManager`

Use `autoReconnect: false` when you want strict request/response behavior in tests or scripts.

## Authentication

The client expects the server token up front:

```ts
const client = new PiWebClient({
	url: "ws://localhost:3100/ws",
	token: "<server-token>",
});
```

If the token is wrong, the server responds with `auth_error` and the client rejects the initial `connect()` call.

## Choosing the right package

- want a built-in pi command? use `@ifi/pi-web-remote`
- want to embed the server? use `@ifi/pi-web-server`
- want to build the custom client UI? use `@ifi/pi-web-client`

## Troubleshooting

### `connect()` fails with authentication error

Your token is wrong or does not match the running server.

### `connect()` succeeds but RPC commands fail

The remote server may be running without a session attached. That is a host-side wiring problem, not a client bug.

### Browser build has no global WebSocket

Pass a custom `webSocket` implementation in `PiWebClientOptions`.

## Related packages

- `@ifi/pi-web-server` — embeddable remote server
- `@ifi/pi-web-remote` — pi extension that starts/stops the remote server from inside pi
- `docs/08-package-selection.md` — choose the right remote package
