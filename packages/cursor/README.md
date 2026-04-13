# @ifi/pi-provider-cursor

Experimental Cursor provider for pi.

This package is for users who want Cursor-hosted models inside pi. It is **not** a general workflow package and it is **not** part of the default `@ifi/oh-pi` bundle.

## When to use this package

Use `@ifi/pi-provider-cursor` when:
- you already use Cursor and want its model catalog inside pi
- you want `/login cursor` OAuth login instead of managing a separate API key
- you want Cursor model discovery stored with the OAuth credential

Do **not** install this package if your real problem is workflow orchestration. This package adds a provider, not features like `/chain`, `/colony`, `/plan`, or `/spec`.

## What it does

This package:
- registers a `cursor` provider via `pi.registerProvider(...)`
- adds `/login cursor` OAuth support through pi's provider login flow
- discovers usable Cursor models and stores them with the OAuth credential
- streams responses through Cursor's `AgentService/Run` transport
- preserves in-memory runtime state for active runs, conversation checkpoints, and MCP-style tool bridges
- adds `/cursor status`, `/cursor refresh-models`, and `/cursor clear-state`

## Install

```bash
pi install npm:@ifi/pi-provider-cursor
```

This package is intentionally separate from `@ifi/oh-pi`.

## Quick start

1. Install the package.
2. Start pi.
3. Run:

```text
/login cursor
```

4. Complete the browser login.
5. Open `/model` and select one of the discovered `cursor/...` models.
6. Optionally run `/cursor status` to confirm auth + runtime state.

## What the login flow does

The Cursor login flow is PKCE-based.

During `/login cursor`, pi:
- generates a PKCE verifier/challenge pair
- opens a Cursor browser login URL with a CLI redirect target
- polls Cursor auth until access + refresh tokens are available
- refreshes the Cursor model catalog immediately after login
- stores the OAuth credential and discovered model list in pi auth storage

If live model discovery fails, the package keeps working by falling back to a bundled Cursor model catalog.

## Commands

### `/cursor status`

Shows:
- whether Cursor auth is configured
- how many models are available on the credential
- approximate access-token expiry in minutes
- runtime state counts (`activeRuns`, `checkpoints`)

### `/cursor refresh-models`

Refreshes the discovered Cursor model catalog.

Behavior:
- if the stored token is expired, it refreshes the token first
- otherwise it refreshes model discovery directly
- it writes the updated OAuth credential back to auth storage
- it refreshes the model registry so `/model` sees the latest list

### `/cursor clear-state`

Clears in-memory provider runtime state.

Use this when you want to drop:
- active run bookkeeping
- cached conversation checkpoints
- pending tool-bridge state

This does **not** remove the stored OAuth credential.

## How model discovery works

The provider keeps two model sources:

1. **Live credential models** — discovered from Cursor after login or refresh
2. **Fallback models** — bundled defaults used when live discovery is unavailable

The credential always prefers live discovered models when present. When discovery fails, the package preserves the previous model list if possible instead of collapsing to zero models.

## Verification checklist

After installing and logging in, verify all of these:

1. `/cursor status` shows `Cursor auth: configured`
2. `/cursor status` shows a non-zero model count
3. `/model` includes `cursor/...` entries
4. selecting a Cursor model works for a normal prompt

If step 3 fails, run `/cursor refresh-models`.

## Limitations

This integration is intentionally labeled **experimental** because the risk is real:
- it uses unofficial Cursor endpoints
- upstream API behavior may change without notice
- runtime state bridging is more fragile than stable API-key providers
- multimodal/image input is not advertised yet; models are currently registered as text-first until real integration proves otherwise

It is also a pi-native provider integration. It does **not** expose an OpenAI-compatible local proxy.

## Troubleshooting

### `/cursor status` says you are not logged in

Run:

```text
/login cursor
```

If you already logged in before, your auth storage may be missing or invalid.

### Login opens the browser but never completes

The package polls Cursor auth repeatedly and times out if the exchange never finishes. Common causes:
- browser login was not completed
- network issues during polling
- Cursor auth endpoint behavior changed

Retry the login flow first. If repeated attempts fail, treat the provider as temporarily broken rather than assuming the local pi install is wrong.

### Models are missing or stale

Run:

```text
/cursor refresh-models
```

If discovery still fails, the provider may fall back to the bundled model catalog. That means the provider can still appear usable even when live discovery is degraded.

### Runtime feels wedged after interrupted tool calls

Run:

```text
/cursor clear-state
```

That clears in-memory run/checkpoint/tool-bridge state without deleting the login credential.

## Test and debug hooks

These environment variables exist mainly for tests and local debugging:

- `PI_CURSOR_API_URL`
- `PI_CURSOR_LOGIN_URL`
- `PI_CURSOR_POLL_URL`
- `PI_CURSOR_REFRESH_URL`
- `PI_CURSOR_CLIENT_VERSION`

Legacy `CURSOR_*` environment variable names are also accepted for compatibility with earlier iterations of the provider.

## Related packages

- `@ifi/oh-pi` — full curated oh-pi bundle
- `@ifi/pi-provider-ollama` — alternative provider package for local/cloud Ollama
- `docs/08-package-selection.md` — install the right package for the job
