import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { type AvailableModelRef, resolveDelegatedCategoryRoute } from "./delegated-routing.js";

const availableModels: AvailableModelRef[] = [
	{
		provider: "google",
		id: "gemini-2.5-flash",
		fullId: "google/gemini-2.5-flash",
	},
	{
		provider: "anthropic",
		id: "claude-sonnet-4.6",
		fullId: "anthropic/claude-sonnet-4.6",
	},
	{
		provider: "openai",
		id: "gpt-5.4",
		fullId: "openai/gpt-5.4",
	},
];

const tempDirs: string[] = [];

function writeAdaptiveRoutingConfig(config: unknown): string {
	const agentDir = mkdtempSync(join(tmpdir(), "oh-pi-core-routing-"));
	tempDirs.push(agentDir);
	mkdirSync(join(agentDir, "extensions", "adaptive-routing"), { recursive: true });
	writeFileSync(
		join(agentDir, "extensions", "adaptive-routing", "config.json"),
		`${JSON.stringify(config, null, 2)}\n`,
		"utf-8",
	);
	process.env.PI_CODING_AGENT_DIR = agentDir;
	return agentDir;
}

afterEach(() => {
	process.env.PI_CODING_AGENT_DIR = undefined;
	for (const dir of tempDirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true });
	}
});

describe("resolveDelegatedCategoryRoute", () => {
	it("selects the first available candidate for the requested category", () => {
		writeAdaptiveRoutingConfig({
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
				"cheap-router": {
					candidates: ["google/gemini-2.5-flash"],
				},
			},
		});

		expect(resolveDelegatedCategoryRoute("quick-discovery", availableModels)).toEqual({
			requestedCategory: "quick-discovery",
			normalizedCategory: "quick",
			selectedModel: "google/gemini-2.5-flash",
			fallbackGroup: "cheap-router",
			candidateModels: ["google/gemini-2.5-flash", "anthropic/claude-sonnet-4.6"],
		});
	});

	it("returns no route when delegated routing is disabled", () => {
		writeAdaptiveRoutingConfig({
			delegatedRouting: {
				enabled: false,
				categories: {
					"review-critical": { fallbackGroup: "peak-reasoning" },
				},
			},
			fallbackGroups: {
				"peak-reasoning": {
					candidates: ["openai/gpt-5.4"],
				},
			},
		});

		expect(resolveDelegatedCategoryRoute("review-critical", availableModels)).toBeUndefined();
	});
});
