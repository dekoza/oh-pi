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

describe("generateDefaultConfig", () => {
	it("generates a valid config with default categories from available models", () => {
		const config = generateDefaultConfig(allModels);

		expect(config.mode).toBe("shadow");
		expect(config.delegatedRouting.enabled).toBe(true);
		expect(Object.keys(config.delegatedRouting.categories).length).toBeGreaterThan(0);
	});

	it("creates scout/worker/soldier categories with correct model tiers", () => {
		const config = generateDefaultConfig(allModels);
		const { categories } = config.delegatedRouting;

		expect(categories.scout?.candidates).toBeDefined();
		expect(categories.worker?.candidates).toBeDefined();
		expect(categories.soldier?.candidates).toBeDefined();

		for (const cat of Object.values(categories)) {
			expect(cat.candidates!.length).toBeGreaterThan(0);
			for (const candidate of cat.candidates!) {
				expect(candidate).toContain("/");
			}
		}
	});

	it("assigns cheap models to scout and premium/peak models to soldier", () => {
		const config = generateDefaultConfig(allModels);
		const { categories } = config.delegatedRouting;

		expect(categories.scout?.candidates).toContain("google/gemini-2.5-flash");
		expect(categories.soldier?.candidates).toContain("openai/gpt-5.4");
	});

	it("sets appropriate thinking levels per category", () => {
		const config = generateDefaultConfig(allModels);
		const { categories } = config.delegatedRouting;

		expect(categories.scout?.defaultThinking).toBe("minimal");
		expect(categories.worker?.defaultThinking).toBe("medium");
		expect(categories.soldier?.defaultThinking).toBe("high");
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
		expect(json).toContain('"scout"');
		expect(json).toContain('"worker"');
		expect(json).toContain('"soldier"');
	});
});
