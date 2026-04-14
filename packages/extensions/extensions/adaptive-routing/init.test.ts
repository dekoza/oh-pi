import { describe, expect, it } from "vitest";
import { generateDefaultConfig, type InitModelInfo } from "./init.js";

const allModels: InitModelInfo[] = [
	{ provider: "google", id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", reasoning: true, cost: { input: 0 } },
	{ provider: "openai", id: "gpt-5-mini", name: "GPT-5 Mini", reasoning: true, cost: { input: 0.3 } },
	{ provider: "anthropic", id: "claude-sonnet-4.6", name: "Claude Sonnet 4.6", reasoning: true, cost: { input: 1 } },
	{ provider: "google", id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", reasoning: true, cost: { input: 0.8 } },
	{ provider: "openai", id: "gpt-5.4", name: "GPT-5.4", reasoning: true, cost: { input: 2 } },
	{ provider: "anthropic", id: "claude-opus-4.6", name: "Claude Opus 4.6", reasoning: true, cost: { input: 3 } },
];

const copilotModels: InitModelInfo[] = [
	{ provider: "github-copilot", id: "gpt-5-mini", name: "GPT-5 mini", reasoning: true, cost: { input: 0 } },
	{ provider: "github-copilot", id: "gpt-4.1", name: "GPT-4.1", reasoning: false, cost: { input: 0 } },
	{ provider: "github-copilot", id: "gemini-3-flash-preview", name: "Gemini 3 Flash", reasoning: true, cost: { input: 0.33 } },
	{ provider: "github-copilot", id: "claude-haiku-4.5", name: "Claude Haiku 4.5", reasoning: true, cost: { input: 0.33 } },
	{ provider: "github-copilot", id: "gpt-4o", name: "GPT-4o", reasoning: false, cost: { input: 0 } },
	{ provider: "github-copilot", id: "grok-code-fast-1", name: "Grok Code Fast 1", reasoning: true, cost: { input: 0.25 } },
	{ provider: "github-copilot", id: "claude-sonnet-4.6", name: "Claude Sonnet 4.6", reasoning: true, cost: { input: 1 } },
	{ provider: "github-copilot", id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", reasoning: true, cost: { input: 1 } },
	{ provider: "github-copilot", id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", reasoning: true, cost: { input: 1 } },
	{ provider: "github-copilot", id: "gpt-5.2-codex", name: "GPT-5.2 Codex", reasoning: true, cost: { input: 1 } },
	{ provider: "github-copilot", id: "gpt-5.3-codex", name: "GPT-5.3 Codex", reasoning: true, cost: { input: 1 } },
	{ provider: "github-copilot", id: "gpt-5.4", name: "GPT-5.4", reasoning: true, cost: { input: 1 } },
	{ provider: "github-copilot", id: "claude-opus-4.6", name: "Claude Opus 4.6", reasoning: true, cost: { input: 3 } },
	{ provider: "ollama", id: "qwen3-coder:30b", name: "Qwen3 Coder 30B", reasoning: true, cost: { input: 0 } },
	{ provider: "ollama", id: "deepseek-coder-v2:latest", name: "DeepSeek Coder V2", reasoning: true, cost: { input: 0 } },
	{ provider: "ollama", id: "glm-4.7-flash:latest", name: "GLM 4.7 Flash", reasoning: true, cost: { input: 0 } },
	{ provider: "ollama", id: "gemma3:12b", name: "Gemma 3 12B", reasoning: true, cost: { input: 0 } },
];

describe("generateDefaultConfig", () => {
	it("generates a valid config with default categories from available models", () => {
		const config = generateDefaultConfig(allModels);

		expect(config.mode).toBe("shadow");
		expect(config.delegatedRouting.enabled).toBe(true);
		expect(Object.keys(config.delegatedRouting.categories).length).toBeGreaterThan(0);
	});

	it("creates categories matching ant-colony default names", () => {
		const config = generateDefaultConfig(allModels);
		const { categories } = config.delegatedRouting;

		expect(categories["quick-discovery"]).toBeDefined();
		expect(categories["balanced-execution"]).toBeDefined();
		expect(categories["review-critical"]).toBeDefined();
		expect(categories["visual-engineering"]).toBeDefined();
		expect(categories["peak-reasoning"]).toBeDefined();

		for (const cat of Object.values(categories)) {
			expect(cat.candidates!.length).toBeGreaterThan(0);
			for (const candidate of cat.candidates!) {
				expect(candidate).toContain("/");
			}
		}
	});

	it("assigns cheap models to quick-discovery and premium/peak to review-critical", () => {
		const config = generateDefaultConfig(allModels);
		const { categories } = config.delegatedRouting;

		expect(categories["quick-discovery"]?.candidates).toContain("google/gemini-2.5-flash");
		expect(categories["review-critical"]?.candidates).toContain("openai/gpt-5.4");
	});

	it("prefers gemini-3.1-pro-preview for visual-engineering", () => {
		const modelsWithGemini = [
			...allModels,
			{ provider: "google", id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview", reasoning: true, cost: { input: 1 } },
		];
		const config = generateDefaultConfig(modelsWithGemini);
		const visual = config.delegatedRouting.categories["visual-engineering"];

		expect(visual?.candidates![0]).toBe("google/gemini-3.1-pro-preview");
	});

	it("sets appropriate thinking levels per category", () => {
		const config = generateDefaultConfig(allModels);
		const { categories } = config.delegatedRouting;

		expect(categories["quick-discovery"]?.defaultThinking).toBe("minimal");
		expect(categories["balanced-execution"]?.defaultThinking).toBe("medium");
		expect(categories["review-critical"]?.defaultThinking).toBe("high");
		expect(categories["visual-engineering"]?.defaultThinking).toBe("high");
		expect(categories["peak-reasoning"]?.defaultThinking).toBe("xhigh");
	});

	it("handles a single available model", () => {
		const config = generateDefaultConfig([allModels[0]]);
		const { categories } = config.delegatedRouting;

		for (const cat of Object.values(categories)) {
			expect(cat.candidates!.length).toBe(1);
			expect(cat.candidates![0]).toBe("google/gemini-2.5-flash");
		}
	});

	it("handles empty model list", () => {
		const config = generateDefaultConfig([]);

		expect(config.delegatedRouting.enabled).toBe(true);
		expect(Object.keys(config.delegatedRouting.categories).length).toBe(0);
	});

	it("does not duplicate models within a category", () => {
		const config = generateDefaultConfig(allModels);
		for (const cat of Object.values(config.delegatedRouting.categories)) {
			const unique = new Set(cat.candidates);
			expect(unique.size).toBe(cat.candidates!.length);
		}
	});

	it("formats config as pretty JSON for file output", () => {
		const config = generateDefaultConfig(allModels);
		const json = JSON.stringify(config, null, 2);

		expect(() => JSON.parse(json)).not.toThrow();
		expect(json).toContain('"quick-discovery"');
		expect(json).toContain('"balanced-execution"');
		expect(json).toContain('"review-critical"');
		expect(json).toContain('"visual-engineering"');
		expect(json).toContain('"peak-reasoning"');
	});

	it("generates a rich multiplier-aware config for github-copilot model sets", () => {
		const config = generateDefaultConfig(copilotModels);

		expect(config.routerModels).toEqual([
			"github-copilot/gpt-5-mini",
			"github-copilot/gpt-4.1",
			"github-copilot/gemini-3-flash-preview",
			"github-copilot/claude-haiku-4.5",
			"github-copilot/gpt-4o",
		]);
		expect(config.costs?.defaultMaxMultiplier).toBe(1);
		expect(config.costs?.modelMultipliers["github-copilot/gpt-5-mini"]).toBe(0);
		expect(config.costs?.modelMultipliers["github-copilot/claude-opus-4.6"]).toBe(3);
		expect(config.models?.excluded).toEqual(
			expect.arrayContaining(["github-copilot/raptor-mini", "github-copilot/goldeneye"]),
		);
		expect(config.intents?.architecture?.preferredModels?.[0]).toBe("github-copilot/gemini-3.1-pro-preview");
		expect(config.intents?.architecture?.maxMultiplier).toBe(1);
		expect(config.intents?.review?.preferredModels?.slice(0, 2)).toEqual([
			"github-copilot/claude-sonnet-4.6",
			"github-copilot/claude-opus-4.6",
		]);
	});

	it("generates delegated categories that match the revised copilot policy", () => {
		const config = generateDefaultConfig(copilotModels);
		const categories = config.delegatedRouting.categories;

		expect(categories["balanced-execution"]?.candidates?.slice(0, 3)).toEqual([
			"github-copilot/claude-sonnet-4.6",
			"github-copilot/gemini-3.1-pro-preview",
			"github-copilot/gpt-5.2-codex",
		]);
		expect(categories["review-critical"]?.candidates?.slice(0, 3)).toEqual([
			"github-copilot/claude-sonnet-4.6",
			"github-copilot/claude-opus-4.6",
			"github-copilot/gemini-3.1-pro-preview",
		]);
		expect(categories["visual-engineering"]?.candidates?.[0]).toBe("github-copilot/gemini-3.1-pro-preview");
		expect(categories["peak-reasoning"]?.candidates?.slice(0, 2)).toEqual([
			"github-copilot/gemini-3.1-pro-preview",
			"github-copilot/gpt-5.4",
		]);
	});
});
