import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveAntModelSelection } from "../extensions/ant-colony/routing.js";
import type { ModelOverrides } from "../extensions/ant-colony/types.js";

const availableModels = [
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

function writeConfigs(options?: { adaptiveRouting?: unknown; antColony?: unknown }) {
	const agentDir = mkdtempSync(join(tmpdir(), "oh-pi-ant-routing-"));
	tempDirs.push(agentDir);
	process.env.PI_CODING_AGENT_DIR = agentDir;

	if (options?.adaptiveRouting) {
		mkdirSync(join(agentDir, "extensions", "adaptive-routing"), { recursive: true });
		writeFileSync(
			join(agentDir, "extensions", "adaptive-routing", "config.json"),
			`${JSON.stringify(options.adaptiveRouting, null, 2)}\n`,
			"utf-8",
		);
	}

	if (options?.antColony) {
		mkdirSync(join(agentDir, "extensions", "ant-colony"), { recursive: true });
		writeFileSync(
			join(agentDir, "extensions", "ant-colony", "config.json"),
			`${JSON.stringify(options.antColony, null, 2)}\n`,
			"utf-8",
		);
	}
}

function delegatedAdaptiveRoutingConfig() {
	return {
		delegatedRouting: {
			enabled: true,
			categories: {
				"quick-discovery": { taskClass: "quick" },
				"balanced-execution": { fallbackGroup: "standard-coding" },
				"review-critical": { fallbackGroup: "peak-reasoning" },
				"visual-engineering": { fallbackGroup: "design-premium" },
			},
		},
		taskClasses: {
			quick: {
				candidates: ["google/gemini-2.5-flash", "anthropic/claude-sonnet-4.6"],
			},
		},
		fallbackGroups: {
			"standard-coding": {
				candidates: ["anthropic/claude-sonnet-4.6", "google/gemini-2.5-flash"],
			},
			"peak-reasoning": {
				candidates: ["openai/gpt-5.4", "anthropic/claude-sonnet-4.6"],
			},
			"design-premium": {
				candidates: ["openai/gpt-5.4"],
			},
		},
	};
}

afterEach(() => {
	delete process.env.PI_CODING_AGENT_DIR;
	for (const dir of tempDirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true });
	}
});

describe("resolveAntModelSelection", () => {
	it("prefers explicit worker-class model overrides over delegated categories", () => {
		writeConfigs({ adaptiveRouting: delegatedAdaptiveRoutingConfig() });
		const modelOverrides: ModelOverrides = {
			review: "anthropic/claude-opus-4.6",
			worker: "anthropic/claude-sonnet-4.6",
		};

		expect(
			resolveAntModelSelection({
				caste: "worker",
				workerClass: "review",
				modelOverrides,
				currentModel: "google/gemini-2.5-flash",
				availableModels,
			}),
		).toEqual({
			routeSource: "model-override",
			selectedModel: "anthropic/claude-opus-4.6",
			overrideKey: "review",
		});
	});

	it("uses worker-class delegated categories before caste categories", () => {
		writeConfigs({ adaptiveRouting: delegatedAdaptiveRoutingConfig() });

		expect(
			resolveAntModelSelection({
				caste: "worker",
				workerClass: "review",
				modelOverrides: {},
				currentModel: "google/gemini-2.5-flash",
				availableModels,
			}),
		).toEqual({
			routeSource: "worker-class-category",
			requestedCategory: "review-critical",
			normalizedCategory: "review-critical",
			selectedModel: "openai/gpt-5.4",
			fallbackGroup: "peak-reasoning",
			candidateModels: ["openai/gpt-5.4", "anthropic/claude-sonnet-4.6"],
		});
	});

	it("allows ant-colony config to override default caste categories", () => {
		writeConfigs({
			adaptiveRouting: delegatedAdaptiveRoutingConfig(),
			antColony: {
				routingCategories: {
					castes: {
						scout: "review-critical",
					},
				},
			},
		});

		expect(
			resolveAntModelSelection({
				caste: "scout",
				modelOverrides: {},
				currentModel: "google/gemini-2.5-flash",
				availableModels,
			}),
		).toEqual({
			routeSource: "caste-category",
			requestedCategory: "review-critical",
			normalizedCategory: "review-critical",
			selectedModel: "openai/gpt-5.4",
			fallbackGroup: "peak-reasoning",
			candidateModels: ["openai/gpt-5.4", "anthropic/claude-sonnet-4.6"],
		});
	});

	it("falls back to the current model when delegated routing cannot resolve a model", () => {
		writeConfigs({
			adaptiveRouting: {
				delegatedRouting: {
					enabled: false,
					categories: {
						"balanced-execution": { fallbackGroup: "standard-coding" },
					},
				},
				fallbackGroups: {
					"standard-coding": {
						candidates: ["anthropic/claude-sonnet-4.6"],
					},
				},
			},
		});

		expect(
			resolveAntModelSelection({
				caste: "worker",
				modelOverrides: {},
				currentModel: "google/gemini-2.5-flash",
				availableModels,
			}),
		).toEqual({
			routeSource: "fallback-model",
			selectedModel: "google/gemini-2.5-flash",
		});
	});
});
