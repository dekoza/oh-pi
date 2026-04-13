import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveDelegatedModelSelection } from "../delegated-routing.js";

const tempDirs: string[] = [];
let savedHome: string | undefined;
let savedUserProfile: string | undefined;
let savedAgentDir: string | undefined;

function unsetEnv(key: keyof NodeJS.ProcessEnv): void {
	Reflect.deleteProperty(process.env, key);
}

function createTempDir(prefix: string): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
	tempDirs.push(dir);
	return dir;
}

function writeAdaptiveRoutingConfig(agentDir: string, config: unknown): void {
	const filePath = path.join(agentDir, "extensions", "adaptive-routing", "config.json");
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, `${JSON.stringify(config, null, 2)}\n`, "utf-8");
}

beforeEach(() => {
	savedHome = process.env.HOME;
	savedUserProfile = process.env.USERPROFILE;
	savedAgentDir = process.env.PI_CODING_AGENT_DIR;
});

afterEach(() => {
	if (savedHome === undefined) unsetEnv("HOME");
	else process.env.HOME = savedHome;

	if (savedUserProfile === undefined) unsetEnv("USERPROFILE");
	else process.env.USERPROFILE = savedUserProfile;

	if (savedAgentDir === undefined) unsetEnv("PI_CODING_AGENT_DIR");
	else process.env.PI_CODING_AGENT_DIR = savedAgentDir;

	while (tempDirs.length > 0) {
		const dir = tempDirs.pop();
		if (!dir) continue;
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

describe("resolveDelegatedModelSelection", () => {
	it("prefers an explicit runtime override over category routing", () => {
		const homeDir = createTempDir("subagents-routing-home-");
		const agentDir = path.join(homeDir, ".pi", "agent");
		process.env.HOME = homeDir;
		process.env.USERPROFILE = homeDir;
		process.env.PI_CODING_AGENT_DIR = agentDir;
		writeAdaptiveRoutingConfig(agentDir, {
			delegatedRouting: {
				enabled: true,
				categories: {
					"quick-discovery": { taskClass: "quick" },
				},
			},
			taskClasses: {
				quick: { candidates: ["google/gemini-2.5-flash"] },
			},
			fallbackGroups: {},
			models: { excluded: [] },
		});

		const decision = resolveDelegatedModelSelection(
			{ model: undefined, category: "quick-discovery" },
			[
				{ provider: "google", id: "gemini-2.5-flash", fullId: "google/gemini-2.5-flash" },
				{ provider: "anthropic", id: "claude-sonnet-4.6", fullId: "anthropic/claude-sonnet-4.6" },
			],
			{ runtimeModel: "anthropic/claude-sonnet-4.6", fallbackModel: "openai/gpt-5-mini" },
		);

		expect(decision).toMatchObject({
			selectedModel: "anthropic/claude-sonnet-4.6",
			routeSource: "runtime-model-override",
		});
	});

	it("selects the first available delegated-routing candidate for a category", () => {
		const homeDir = createTempDir("subagents-routing-home-");
		const agentDir = path.join(homeDir, ".pi", "agent");
		process.env.HOME = homeDir;
		process.env.USERPROFILE = homeDir;
		process.env.PI_CODING_AGENT_DIR = agentDir;
		writeAdaptiveRoutingConfig(agentDir, {
			delegatedRouting: {
				enabled: true,
				categories: {
					"quick-discovery": { taskClass: "quick" },
				},
			},
			taskClasses: {
				quick: { candidates: ["google/gemini-2.5-flash", "openai/gpt-5-mini"], fallbackGroup: "cheap-router" },
			},
			fallbackGroups: {
				"cheap-router": { candidates: ["google/gemini-2.5-flash", "openai/gpt-5-mini"] },
			},
			models: { excluded: [] },
		});

		const decision = resolveDelegatedModelSelection(
			{ model: undefined, category: "quick-discovery" },
			[
				{ provider: "google", id: "gemini-2.5-flash", fullId: "google/gemini-2.5-flash" },
				{ provider: "openai", id: "gpt-5-mini", fullId: "openai/gpt-5-mini" },
			],
			{ fallbackModel: "anthropic/claude-sonnet-4.6" },
		);

		expect(decision).toMatchObject({
			selectedModel: "google/gemini-2.5-flash",
			routeSource: "agent-category",
			requestedCategory: "quick-discovery",
			normalizedCategory: "quick",
			fallbackGroup: "cheap-router",
			candidateModels: ["google/gemini-2.5-flash", "openai/gpt-5-mini"],
		});
	});

	it("falls back to the current model when delegated routing is disabled", () => {
		const homeDir = createTempDir("subagents-routing-home-");
		const agentDir = path.join(homeDir, ".pi", "agent");
		process.env.HOME = homeDir;
		process.env.USERPROFILE = homeDir;
		process.env.PI_CODING_AGENT_DIR = agentDir;
		writeAdaptiveRoutingConfig(agentDir, {
			delegatedRouting: {
				enabled: false,
				categories: {
					"quick-discovery": { taskClass: "quick" },
				},
			},
			taskClasses: {
				quick: { candidates: ["google/gemini-2.5-flash"] },
			},
			fallbackGroups: {},
			models: { excluded: [] },
		});

		const decision = resolveDelegatedModelSelection(
			{ model: undefined, category: "quick-discovery" },
			[{ provider: "google", id: "gemini-2.5-flash", fullId: "google/gemini-2.5-flash" }],
			{ fallbackModel: "openai/gpt-5-mini" },
		);

		expect(decision).toMatchObject({
			selectedModel: "openai/gpt-5-mini",
			routeSource: "fallback-model",
		});
	});

	it("resolves inline candidates on a category without taskClass or fallbackGroup", () => {
		const homeDir = createTempDir("subagents-routing-home-");
		const agentDir = path.join(homeDir, ".pi", "agent");
		process.env.HOME = homeDir;
		process.env.USERPROFILE = homeDir;
		process.env.PI_CODING_AGENT_DIR = agentDir;
		writeAdaptiveRoutingConfig(agentDir, {
			delegatedRouting: {
				enabled: true,
				categories: {
					"quick-discovery": {
						candidates: ["google/gemini-2.5-flash", "openai/gpt-5-mini"],
						defaultThinking: "minimal",
					},
				},
			},
			models: { excluded: [] },
		});

		const decision = resolveDelegatedModelSelection(
			{ model: undefined, category: "quick-discovery" },
			[
				{ provider: "google", id: "gemini-2.5-flash", fullId: "google/gemini-2.5-flash" },
				{ provider: "openai", id: "gpt-5-mini", fullId: "openai/gpt-5-mini" },
			],
			{ fallbackModel: "anthropic/claude-sonnet-4.6" },
		);

		expect(decision).toMatchObject({
			selectedModel: "google/gemini-2.5-flash",
			routeSource: "agent-category",
			requestedCategory: "quick-discovery",
			candidateModels: ["google/gemini-2.5-flash", "openai/gpt-5-mini"],
		});
	});

	it("uses explicit agent model before delegated category routing", () => {
		const homeDir = createTempDir("subagents-routing-home-");
		const agentDir = path.join(homeDir, ".pi", "agent");
		process.env.HOME = homeDir;
		process.env.USERPROFILE = homeDir;
		process.env.PI_CODING_AGENT_DIR = agentDir;
		writeAdaptiveRoutingConfig(agentDir, {
			delegatedRouting: {
				enabled: true,
				categories: {
					"quick-discovery": { taskClass: "quick" },
				},
			},
			taskClasses: {
				quick: { candidates: ["google/gemini-2.5-flash"] },
			},
			fallbackGroups: {},
			models: { excluded: [] },
		});

		const decision = resolveDelegatedModelSelection(
			{ model: "anthropic/claude-sonnet-4.6", category: "quick-discovery" },
			[
				{ provider: "google", id: "gemini-2.5-flash", fullId: "google/gemini-2.5-flash" },
				{ provider: "anthropic", id: "claude-sonnet-4.6", fullId: "anthropic/claude-sonnet-4.6" },
			],
			{ fallbackModel: "openai/gpt-5-mini" },
		);

		expect(decision).toMatchObject({
			selectedModel: "anthropic/claude-sonnet-4.6",
			routeSource: "agent-model",
		});
	});
});
