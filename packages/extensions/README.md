# @ifi/oh-pi-extensions

Core first-party extensions for pi.

## Included extensions

This package includes extensions such as:
- adaptive-routing / route
- safe-guard
- git-guard
- auto-session-name
- custom-footer
- compact-header
- auto-update
- bg-process
- usage-tracker
- scheduler
- btw / qq
- watchdog / safe-mode

## Install

```bash
pi install npm:@ifi/oh-pi-extensions
```

Or install the full bundle:

```bash
npx @ifi/oh-pi
```

## What it provides

These extensions add commands, tools, UI widgets, safety checks, background process handling,
usage monitoring, adaptive model routing, scheduling features, and runtime performance protection (`/watchdog`, `/safe-mode`) to pi.

`git-guard` also blocks git bash invocations that are likely to open an interactive editor in agent environments (for example `git rebase --continue` without non-interactive editor overrides), preventing hangs before they happen.

## When to install this package

Install `@ifi/oh-pi-extensions` when the missing piece is smarter runtime behavior inside pi, not a new execution workflow.

Use it for:
- adaptive routing
- reminders and recurring follow-ups
- usage/cost visibility
- watchdog and safe mode
- non-interactive git safety
- background process tracking

Do **not** install this package expecting `/chain`, `/colony`, `/plan`, or `/spec`. Those come from other packages.

## Fastest way to verify it loaded

After install:

```bash
pi list
pi
```

Inside pi, verify a few surfaces such as:
- `/route status`
- `/usage`
- `/schedule` or `schedule_prompt`
- `/watchdog`

## Adaptive routing

Adaptive routing adds a user-friendly `/route` command set and an opt-in model-agnostic mode that can:

- classify prompts with a cheap router model
- choose model and thinking level before a turn starts
- respect provider reserve thresholds and fallback groups
- drive delegated category routing for subagents and ant-colony
- suggest routes in shadow mode before automatically applying them
- persist local-only telemetry and feedback under shared pi storage

**Configuration guide:** [`docs/guides/adaptive-routing-config.md`](../../docs/guides/adaptive-routing-config.md)

Quick setup: run `/route init` to generate a config from available models, then `/route on` to enable.

Key commands:

- `/route init`
- `/route status`
- `/route shadow`
- `/route auto`
- `/route off`
- `/route explain`
- `/route lock`
- `/route unlock`
- `/route feedback <category>`
- `/route stats`

### Adaptive routing quick start

Inside pi:

```text
/route status
/route shadow
/route auto
```

Recommended first pass:
1. start with `/route status`
2. enable shadow mode first to observe routing suggestions
3. switch to `/route auto` only after the suggestions look sane for your workload

### Delegated routing for subagents and ant-colony

Adaptive routing now also owns delegated category routing policy for:
- subagent `category` metadata
- ant-colony caste and worker-class categories

That means the workflow packages can ask for a category such as `quick-discovery` or `review-critical`, while adaptive routing resolves the actual model choice.

Illustrative config shape:

```json
{
  "delegatedRouting": {
    "enabled": true,
    "categories": {
      "quick-discovery": { "taskClass": "quick" },
      "balanced-execution": { "fallbackGroup": "standard-coding" },
      "review-critical": { "fallbackGroup": "peak-reasoning" }
    }
  }
}
```

Path:

```text
~/.pi/agent/extensions/adaptive-routing/config.json
```

Explicit model overrides still win over delegated category routing.

## Scheduler follow-ups

<!-- {=extensionsSchedulerOverview} -->

The scheduler extension adds recurring checks, one-time reminders, and the LLM-callable
`schedule_prompt` tool so pi can schedule future follow-ups like PR, CI, build, or deployment
checks. Tasks run only while pi is active and idle, and scheduler state is persisted in shared pi
storage using a workspace-mirrored path.

<!-- {/extensionsSchedulerOverview} -->

### Scheduler quick start

Examples of the intended usage pattern:

```text
/remind 30m check the deployment
/loop 10m watch CI until it passes
```

Tool-level example:

```json
{
  "action": "add",
  "kind": "once",
  "duration": "30m",
  "prompt": "Check whether the deployment finished"
}
```

Use workspace scope sparingly. Most reminders should stay instance-scoped.

## Package layout

```text
extensions/
```

Pi loads the raw TypeScript extensions from this directory.

## Scheduler ownership model

<!-- {=extensionsSchedulerOwnershipDocs} -->

The scheduler distinguishes between instance-scoped tasks and workspace-scoped tasks. Instance
scope is the default for `/loop`, `/remind`, and `schedule_prompt`, which means tasks stay owned by
one pi instance and other instances restore them for review instead of auto-running them.
Workspace scope is an explicit opt-in for shared CI/build/deploy monitors that should survive
instance changes in the same repository.

<!-- {/extensionsSchedulerOwnershipDocs} -->

When another live instance already owns scheduler activity for the workspace, pi prompts before taking over. You can also manage ownership explicitly with:

- `/schedule adopt <id|all>`
- `/schedule release <id|all>`
- `/schedule clear-foreign`

Use workspace scope sparingly for long-running shared checks like CI/build/deploy monitoring. For ordinary reminders and follow-ups, prefer the default instance scope.

## Usage tracker

### Usage tracker quick start

Inside pi:

```text
/usage
/usage-refresh
```

Use this when you need:
- current provider quota/rate-limit state
- per-model spend visibility
- session cost visibility including compatible background workflows such as ant-colony

<!-- {=extensionsUsageTrackerOverview} -->

The usage-tracker extension is a CodexBar-inspired provider quota and cost monitor for pi. It
shows provider-level rate limits for Anthropic, OpenAI, and Google using pi-managed auth, while
also tracking per-model token usage and session costs locally.

<!-- {/extensionsUsageTrackerOverview} -->

<!-- {=extensionsUsageTrackerPersistenceDocs} -->

Usage-tracker persists rolling 30-day cost history and the last known provider rate-limit snapshot
under the pi agent directory. That lets the widget and dashboard survive restarts and keep showing
recent subscription windows when a live provider probe is temporarily rate-limited or unavailable.

<!-- {/extensionsUsageTrackerPersistenceDocs} -->

<!-- {=extensionsUsageTrackerCommandsDocs} -->

Key usage-tracker surfaces:

- widget above the editor for at-a-glance quotas and session totals
- `/usage` for the full dashboard overlay
- `Ctrl+U` as a shortcut for the same overlay
- `/usage-toggle` to show or hide the widget
- `/usage-refresh` to force fresh provider probes
- `usage_report` so the agent can answer quota and spend questions directly

<!-- {/extensionsUsageTrackerCommandsDocs} -->

## Watchdog config

### Watchdog quick start

Inside pi:

```text
/watchdog
/safe-mode
```

Use watchdog when the runtime feels unstable, laggy, or resource-starved. Use safe mode when you want pi to back off on UI churn and other expensive behavior.

<!-- {=extensionsWatchdogConfigOverview} -->

The watchdog extension reads optional runtime protection settings from a JSON config file in the pi
agent directory. That config controls whether sampling is enabled, how frequently samples run, and
which CPU, memory, and event-loop thresholds trigger alerts or safe-mode escalation.

<!-- {/extensionsWatchdogConfigOverview} -->

<!-- {=extensionsWatchdogConfigPathDocs} -->

Path to the optional watchdog JSON config file under the pi agent directory. This is the default
location used for watchdog sampling, threshold overrides, and enable/disable settings.

<!-- {/extensionsWatchdogConfigPathDocs} -->

```text
~/.pi/agent/extensions/watchdog/config.json
```

Example:

```json
{
  "enabled": true,
  "sampleIntervalMs": 5000,
  "thresholds": {
    "cpuPercent": 85,
    "rssMb": 1200,
    "heapUsedMb": 768,
    "eventLoopP99Ms": 120,
    "eventLoopMaxMs": 250
  }
}
```

### Watchdog alert behavior

<!-- {=extensionsWatchdogAlertBehaviorDocs} -->

The watchdog samples CPU, memory, and event-loop lag on an interval, records recent samples and
alerts, and can escalate into safe mode automatically when repeated alerts indicate sustained UI
churn or lag. Toast notifications are intentionally capped per session; ongoing watchdog state is
kept visible in the status bar and the `/watchdog` overlay instead of repeatedly spamming the
terminal.

<!-- {/extensionsWatchdogAlertBehaviorDocs} -->

### Watchdog helper behavior

<!-- {=extensionsLoadWatchdogConfigDocs} -->

Load watchdog config from disk and return a safe object. Missing files, invalid JSON, or malformed
values all fall back to an empty config so runtime monitoring can continue safely.

<!-- {/extensionsLoadWatchdogConfigDocs} -->

<!-- {=extensionsResolveWatchdogThresholdsDocs} -->

Resolve the effective watchdog thresholds by merging optional config overrides onto the built-in
default thresholds.

<!-- {/extensionsResolveWatchdogThresholdsDocs} -->

<!-- {=extensionsResolveWatchdogSampleIntervalMsDocs} -->

Resolve the watchdog sampling interval in milliseconds, clamping configured values into the
supported range and falling back to the default interval when no valid override is provided.

<!-- {/extensionsResolveWatchdogSampleIntervalMsDocs} -->

## Notes

This package ships raw `.ts` extensions for pi to load directly.

## Related packages

- `@ifi/pi-extension-subagents` — delegated execution workflows that can consume adaptive delegated routing
- `@ifi/oh-pi-ant-colony` — background swarm execution that can consume adaptive delegated routing
- `@ifi/oh-pi` — full curated bundle
- `docs/08-package-selection.md` — package chooser
