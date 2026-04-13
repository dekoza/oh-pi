import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveDelegatedCategoryRoute, type AvailableModelRef } from "./delegated-routing.js";

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
	writeFileSync(join(agentDir, "extensions", "adaptive-routing", "config.json"), `${JSON.stringify(config, null, 2)}\n`, "utf-8");
	process.env.PI_CODING_AGENT_DIR = agentDir;
	return agentDir;
}

afterEach(() => {
	delete process.env.PI_CODING_AGENT_DIR;
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

	it("resolves inline candidates directly on a category", () => {
		writeAdaptiveRoutingConfig({
			delegatedRouting: {
				enabled: true,
				categories: {
					"quick-discovery": {
						candidates: ["google/gemini-2.5-flash", "openai/gpt-5.4"],
						defaultThinking: "minimal",
					},
				},
			},
		});

		expect(resolveDelegatedCategoryRoute("quick-discovery", availableModels)).toEqual({
			requestedCategory: "quick-discovery",
			normalizedCategory: "quick-discovery",
			selectedModel: "google/gemini-2.5-flash",
			fallbackGroup: undefined,
			candidateModels: ["google/gemini-2.5-flash", "openai/gpt-5.4"],
		});
	});

	it("prefers inline candidates over taskClass candidates", () => {
		writeAdaptiveRoutingConfig({
			delegatedRouting: {
				enabled: true,
				categories: {
					"balanced-execution": {
						candidates: ["anthropic/claude-sonnet-4.6"],
						taskClass: "quick",
					},
				},
			},
			taskClasses: {
				quick: { candidates: ["google/gemini-2.5-flash"] },
			},
		});

		const result = resolveDelegatedCategoryRoute("balanced-execution", availableModels);
		expect(result?.selectedModel).toBe("anthropic/claude-sonnet-4.6");
		expect(result?.candidateModels).toEqual(["anthropic/claude-sonnet-4.6"]);
	});

	it("falls through to taskClass when inline candidates are empty", () => {
		writeAdaptiveRoutingConfig({
			delegatedRouting: {
				enabled: true,
				categories: {
					"balanced-execution": {
						candidates: [],
						taskClass: "quick",
					},
				},
			},
			taskClasses: {
				quick: {
					candidates: ["google/gemini-2.5-flash"],
					fallbackGroup: "cheap-router",
				},
			},
			fallbackGroups: {
				"cheap-router": { candidates: ["google/gemini-2.5-flash"] },
			},
		});

		const result = resolveDelegatedCategoryRoute("balanced-execution", availableModels);
		expect(result?.selectedModel).toBe("google/gemini-2.5-flash");
		expect(result?.normalizedCategory).toBe("quick");
	});

	it("works with a minimal inline-only config", () => {
		writeAdaptiveRoutingConfig({
			delegatedRouting: {
				enabled: true,
				categories: {
					scout: { candidates: ["google/gemini-2.5-flash"] },
					worker: { candidates: ["anthropic/claude-sonnet-4.6", "openai/gpt-5.4"] },
					soldier: { candidates: ["openai/gpt-5.4"] },
				},
			},
		});

		expect(resolveDelegatedCategoryRoute("scout", availableModels)?.selectedModel).toBe("google/gemini-2.5-flash");
		expect(resolveDelegatedCategoryRoute("worker", availableModels)?.selectedModel).toBe("anthropic/claude-sonnet-4.6");
		expect(resolveDelegatedCategoryRoute("soldier", availableModels)?.selectedModel).toBe("openai/gpt-5.4");
	});
});
