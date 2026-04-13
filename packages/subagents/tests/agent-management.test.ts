import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { discoverAgents } from "../agents.js";
import { formatAgentDetail, handleCreate, handleUpdate } from "../agent-management.js";

const tempDirs: string[] = [];
let savedHome: string | undefined;
let savedUserProfile: string | undefined;
let savedPiAgentDir: string | undefined;

function unsetEnv(key: keyof NodeJS.ProcessEnv): void {
	Reflect.deleteProperty(process.env, key);
}

function createTempDir(prefix: string): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
	tempDirs.push(dir);
	return dir;
}

beforeEach(() => {
	savedHome = process.env.HOME;
	savedUserProfile = process.env.USERPROFILE;
	savedPiAgentDir = process.env.PI_CODING_AGENT_DIR;
});

afterEach(() => {
	if (savedHome === undefined) unsetEnv("HOME");
	else process.env.HOME = savedHome;

	if (savedUserProfile === undefined) unsetEnv("USERPROFILE");
	else process.env.USERPROFILE = savedUserProfile;

	if (savedPiAgentDir === undefined) unsetEnv("PI_CODING_AGENT_DIR");
	else process.env.PI_CODING_AGENT_DIR = savedPiAgentDir;

	while (tempDirs.length > 0) {
		const dir = tempDirs.pop();
		if (!dir) continue;
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

describe("agent management category support", () => {
	it("creates an agent with category metadata", () => {
		const homeDir = createTempDir("subagents-management-home-");
		const projectDir = createTempDir("subagents-management-project-");
		process.env.HOME = homeDir;
		process.env.USERPROFILE = homeDir;

		const ctx = {
			cwd: projectDir,
			modelRegistry: { getAvailable: () => [] },
		};

		const result = handleCreate(
			{
				config: {
					name: "Scout",
					description: "Fast recon",
					scope: "user",
					category: "quick-discovery",
				},
			},
			ctx,
		);

		expect(result.isError).toBe(false);
		expect(result.content[0]?.text).toContain("Created agent 'scout'");

		const scout = discoverAgents(projectDir, "both").agents.find((agent) => agent.name === "scout");
		expect(scout?.category).toBe("quick-discovery");
		expect(scout?.extraFields?.category).toBeUndefined();
	});

	it("updates category metadata on an existing user agent", () => {
		const homeDir = createTempDir("subagents-management-home-");
		const projectDir = createTempDir("subagents-management-project-");
		process.env.HOME = homeDir;
		process.env.USERPROFILE = homeDir;
		const agentDir = path.join(homeDir, ".pi", "agent", "agents");
		fs.mkdirSync(agentDir, { recursive: true });
		fs.writeFileSync(
			path.join(agentDir, "scout.md"),
			"---\nname: scout\ndescription: Fast recon\n---\n\nPrompt\n",
			"utf-8",
		);

		const ctx = {
			cwd: projectDir,
			modelRegistry: { getAvailable: () => [] },
		};

		const result = handleUpdate(
			{
				agent: "scout",
				config: {
					category: "quick-discovery",
				},
			},
			ctx,
		);

		expect(result.isError).toBe(false);
		expect(result.content[0]?.text).toContain("Updated agent 'scout'");

		const scout = discoverAgents(projectDir, "both").agents.find((agent) => agent.name === "scout");
		expect(scout?.category).toBe("quick-discovery");
	});

	it("includes category in formatted agent detail output", () => {
		const detail = formatAgentDetail({
			name: "scout",
			description: "Fast recon",
			category: "quick-discovery",
			systemPrompt: "Prompt",
			source: "user",
			filePath: "/tmp/scout.md",
		});

		expect(detail).toContain("Category: quick-discovery");
	});

	it("warns when an explicit model makes category routing inactive", () => {
		const homeDir = createTempDir("subagents-management-home-");
		const projectDir = createTempDir("subagents-management-project-");
		process.env.HOME = homeDir;
		process.env.USERPROFILE = homeDir;
		process.env.PI_CODING_AGENT_DIR = path.join(homeDir, ".pi", "agent");

		const ctx = {
			cwd: projectDir,
			modelRegistry: {
				getAvailable: () => [{ provider: "anthropic", id: "claude-sonnet-4.6", fullId: "anthropic/claude-sonnet-4.6" }],
			},
		};

		const result = handleCreate(
			{
				config: {
					name: "Scout",
					description: "Fast recon",
					scope: "user",
					model: "anthropic/claude-sonnet-4.6",
					category: "quick-discovery",
				},
			},
			ctx,
		);

		expect(result.isError).toBe(false);
		expect(result.content[0]?.text).toContain("Category 'quick-discovery' is inactive because explicit model 'anthropic/claude-sonnet-4.6' takes precedence.");
	});

	it("includes effective delegated route details when category routing resolves", () => {
		const homeDir = createTempDir("subagents-management-home-");
		const projectDir = createTempDir("subagents-management-project-");
		const agentDir = path.join(homeDir, ".pi", "agent");
		process.env.HOME = homeDir;
		process.env.USERPROFILE = homeDir;
		process.env.PI_CODING_AGENT_DIR = agentDir;
		fs.mkdirSync(path.join(agentDir, "extensions", "adaptive-routing"), { recursive: true });
		fs.writeFileSync(
			path.join(agentDir, "extensions", "adaptive-routing", "config.json"),
			JSON.stringify(
				{
					delegatedRouting: {
						enabled: true,
						categories: {
							"quick-discovery": { taskClass: "quick" },
						},
					},
					taskClasses: {
						quick: {
							candidates: ["google/gemini-2.5-flash", "anthropic/claude-sonnet-4.6"],
							fallbackGroup: "cheap-router",
						},
					},
					fallbackGroups: {
						"cheap-router": { candidates: ["google/gemini-2.5-flash", "anthropic/claude-sonnet-4.6"] },
					},
				},
				null,
				2,
			),
			"utf-8",
		);

		const detail = formatAgentDetail(
			{
				name: "scout",
				description: "Fast recon",
				category: "quick-discovery",
				systemPrompt: "Prompt",
				source: "user",
				filePath: path.join(projectDir, "scout.md"),
			},
			[{ provider: "google", id: "gemini-2.5-flash", fullId: "google/gemini-2.5-flash" }],
		);

		expect(detail).toContain("Effective Route: category quick-discovery → google/gemini-2.5-flash");
		expect(detail).toContain("normalized: quick");
		expect(detail).toContain("fallback: cheap-router");
	});
});
