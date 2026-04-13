import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { classifyPromptHeuristically } from "./classifier.js";
import { DEFAULT_ADAPTIVE_ROUTING_CONFIG } from "./defaults.js";
import { decideRoute } from "./engine.js";
import { normalizeRouteCandidates } from "./normalize.js";

type CorpusEntry = {
	name: string;
	prompt: string;
	intent: string;
	expectedModel: string;
	expectedThinking: string;
};

const candidates = normalizeRouteCandidates([
	{
		provider: "anthropic",
		id: "claude-opus-4.6",
		name: "Claude Opus 4.6",
		api: "anthropic-messages",
		baseUrl: "https://api.anthropic.com",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 200000,
		maxTokens: 16384,
	},
	{
		provider: "openai",
		id: "gpt-5.4",
		name: "GPT-5.4",
		api: "openai-responses",
		baseUrl: "https://api.openai.com/v1",
		reasoning: true,
		input: ["text"],
		cost: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 200000,
		maxTokens: 32768,
	},
	{
		provider: "google",
		id: "gemini-2.5-flash",
		name: "Gemini 2.5 Flash",
		api: "google-generative-ai",
		baseUrl: "https://generativelanguage.googleapis.com",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 1048576,
		maxTokens: 65536,
	},
] as never);

const multiplierCandidates = normalizeRouteCandidates([
	{
		provider: "github-copilot",
		id: "gpt-5-mini",
		name: "GPT-5 mini",
		api: "openai-responses",
		baseUrl: "https://api.githubcopilot.com",
		reasoning: true,
		input: ["text"],
		cost: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 200000,
		maxTokens: 32768,
	},
	{
		provider: "github-copilot",
		id: "gpt-4.1",
		name: "GPT-4.1",
		api: "openai-responses",
		baseUrl: "https://api.githubcopilot.com",
		reasoning: false,
		input: ["text"],
		cost: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 128000,
		maxTokens: 16384,
	},
	{
		provider: "github-copilot",
		id: "claude-haiku-4.5",
		name: "Claude Haiku 4.5",
		api: "anthropic-messages",
		baseUrl: "https://api.githubcopilot.com",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 200000,
		maxTokens: 16384,
	},
	{
		provider: "github-copilot",
		id: "claude-sonnet-4.6",
		name: "Claude Sonnet 4.6",
		api: "anthropic-messages",
		baseUrl: "https://api.githubcopilot.com",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 200000,
		maxTokens: 16384,
	},
	{
		provider: "github-copilot",
		id: "claude-opus-4.6",
		name: "Claude Opus 4.6",
		api: "anthropic-messages",
		baseUrl: "https://api.githubcopilot.com",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 200000,
		maxTokens: 16384,
	},
	{
		provider: "github-copilot",
		id: "gpt-5.4",
		name: "GPT-5.4",
		api: "openai-responses",
		baseUrl: "https://api.githubcopilot.com",
		reasoning: true,
		input: ["text"],
		cost: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 200000,
		maxTokens: 32768,
	},
] as never);

describe("adaptive routing engine", () => {
	it("routes design-heavy prompts toward Claude premium models", () => {
		const classification = classifyPromptHeuristically(
			"Design a polished dashboard with stronger hierarchy and visual tone.",
		);
		const decision = decideRoute({
			config: {
				...DEFAULT_ADAPTIVE_ROUTING_CONFIG,
				models: {
					ranked: ["openai/gpt-5.4", "anthropic/claude-opus-4.6"],
					excluded: [],
				},
			},
			candidates,
			classification,
			currentThinking: "medium",
			usage: {
				providers: {
					anthropic: { confidence: "authoritative", remainingPct: 55 },
					openai: { confidence: "authoritative", remainingPct: 55 },
				},
				updatedAt: Date.now(),
			},
		});

		expect(decision?.selectedModel).toBe("anthropic/claude-opus-4.6");
		expect(decision?.explanation.codes).toContain("intent_design_bias");
	});

	it("protects low-quota providers when reserve thresholds are crossed", () => {
		const classification = classifyPromptHeuristically(
			"Think deeply about a cross-provider architecture migration strategy.",
		);
		const decision = decideRoute({
			config: {
				...DEFAULT_ADAPTIVE_ROUTING_CONFIG,
				providerReserves: {
					...DEFAULT_ADAPTIVE_ROUTING_CONFIG.providerReserves,
					openai: {
						...DEFAULT_ADAPTIVE_ROUTING_CONFIG.providerReserves.openai,
						allowOverrideForPeak: false,
					},
				},
			},
			candidates,
			classification,
			usage: {
				providers: {
					openai: { confidence: "authoritative", remainingPct: 5 },
					anthropic: { confidence: "authoritative", remainingPct: 40 },
				},
				updatedAt: Date.now(),
			},
		});

		expect(decision?.selectedModel).not.toBe("openai/gpt-5.4");
		expect(decision?.explanation.codes).toContain("premium_reserved");
	});

	it("prefers in-budget premium models over over-budget expensive models", () => {
		const classification = classifyPromptHeuristically(
			"Design a polished dashboard and refine the visual hierarchy across the app.",
		);
		const decision = decideRoute({
			config: {
				...DEFAULT_ADAPTIVE_ROUTING_CONFIG,
				models: {
					ranked: ["github-copilot/claude-opus-4.6", "github-copilot/gpt-5.4"],
					excluded: [],
				},
				costs: {
					modelMultipliers: {
						"github-copilot/claude-opus-4.6": 3,
						"github-copilot/gpt-5.4": 1,
					},
					defaultMaxMultiplier: 1,
				},
				intents: {
					...DEFAULT_ADAPTIVE_ROUTING_CONFIG.intents,
					design: {
						preferredTier: "premium",
						defaultThinking: "high",
						preferredModels: ["github-copilot/claude-opus-4.6", "github-copilot/gpt-5.4"],
						maxMultiplier: 1,
					},
				},
			},
			candidates: multiplierCandidates.filter((candidate) =>
				["github-copilot/claude-opus-4.6", "github-copilot/gpt-5.4"].includes(candidate.fullId),
			),
			classification,
		});

		if (!decision) {
			throw new Error("expected route decision");
		}
		expect(decision.selectedModel).toBe("github-copilot/gpt-5.4");
		expect(decision.explanation.cost).toEqual({ selectedMultiplier: 1, maxMultiplier: 1 });
		expect(decision.explanation.codes).toContain("cost_budget_applied");
	});

	it("honors a zero-multiplier budget for quick questions", () => {
		const classification = classifyPromptHeuristically("Where is the CLI entrypoint defined?");
		const decision = decideRoute({
			config: {
				...DEFAULT_ADAPTIVE_ROUTING_CONFIG,
				models: {
					ranked: [
						"github-copilot/claude-haiku-4.5",
						"github-copilot/gpt-5-mini",
						"github-copilot/gpt-4.1",
					],
					excluded: [],
				},
				costs: {
					modelMultipliers: {
						"github-copilot/claude-haiku-4.5": 0.33,
						"github-copilot/gpt-5-mini": 0,
						"github-copilot/gpt-4.1": 0,
					},
					defaultMaxMultiplier: 0,
				},
				intents: {
					...DEFAULT_ADAPTIVE_ROUTING_CONFIG.intents,
					"quick-qna": {
						preferredTier: "cheap",
						defaultThinking: "minimal",
						preferredModels: [
							"github-copilot/claude-haiku-4.5",
							"github-copilot/gpt-5-mini",
							"github-copilot/gpt-4.1",
						],
						maxMultiplier: 0,
					},
				},
			},
			candidates: multiplierCandidates.filter((candidate) =>
				[
					"github-copilot/claude-haiku-4.5",
					"github-copilot/gpt-5-mini",
					"github-copilot/gpt-4.1",
				].includes(candidate.fullId),
			),
			classification,
		});

		if (!decision) {
			throw new Error("expected route decision");
		}
		expect([
			"github-copilot/gpt-5-mini",
			"github-copilot/gpt-4.1",
		]).toContain(decision.selectedModel);
		expect(decision.selectedModel).not.toBe("github-copilot/claude-haiku-4.5");
		expect(decision.explanation.cost).toEqual({ selectedMultiplier: 0, maxMultiplier: 0 });
		expect(decision.explanation.codes).toContain("cost_free_bias");
	});

	it("prefers larger-context models for large-context architecture work", () => {
		const largeContextCandidates = normalizeRouteCandidates([
			{
				provider: "github-copilot",
				id: "claude-sonnet-4.6",
				name: "Claude Sonnet 4.6",
				api: "anthropic-messages",
				baseUrl: "https://api.githubcopilot.com",
				reasoning: true,
				input: ["text", "image"],
				cost: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 },
				contextWindow: 200000,
				maxTokens: 16384,
			},
			{
				provider: "github-copilot",
				id: "gemini-3.1-pro-preview",
				name: "Gemini 3.1 Pro",
				api: "google-generative-ai",
				baseUrl: "https://api.githubcopilot.com",
				reasoning: true,
				input: ["text", "image"],
				cost: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 },
				contextWindow: 1048576,
				maxTokens: 65536,
			},
		] as never);
		const decision = decideRoute({
			config: {
				...DEFAULT_ADAPTIVE_ROUTING_CONFIG,
				models: {
					ranked: ["github-copilot/claude-sonnet-4.6", "github-copilot/gemini-3.1-pro-preview"],
					excluded: [],
				},
				costs: {
					modelMultipliers: {
						"github-copilot/claude-sonnet-4.6": 1,
						"github-copilot/gemini-3.1-pro-preview": 1,
					},
					defaultMaxMultiplier: 1,
				},
				intents: {
					...DEFAULT_ADAPTIVE_ROUTING_CONFIG.intents,
					architecture: {
						preferredTier: "peak",
						defaultThinking: "xhigh",
						preferredModels: [
							"github-copilot/gemini-3.1-pro-preview",
							"github-copilot/claude-sonnet-4.6",
						],
						maxMultiplier: 1,
					},
				},
			},
			candidates: largeContextCandidates,
			classification: {
				intent: "architecture",
				complexity: 5,
				risk: "high",
				expectedTurns: "many",
				toolIntensity: "high",
				contextBreadth: "large",
				recommendedTier: "peak",
				recommendedThinking: "xhigh",
				confidence: 0.9,
				reason: "large-context architecture task",
				classifierMode: "heuristic",
			},
		});

		if (!decision) {
			throw new Error("expected route decision");
		}
		expect(decision.selectedModel).toBe("github-copilot/gemini-3.1-pro-preview");
		expect(decision.explanation.codes).toContain("context_window_fit");
	});

	it("evaluates the routing corpus fixtures", () => {
		const corpus = JSON.parse(
			readFileSync(new URL("./fixtures.route-corpus.json", import.meta.url), "utf-8"),
		) as CorpusEntry[];
		for (const fixture of corpus) {
			const classification = classifyPromptHeuristically(fixture.prompt);
			const decision = decideRoute({
				config: DEFAULT_ADAPTIVE_ROUTING_CONFIG,
				candidates,
				classification,
				usage: {
					providers: {
						anthropic: { confidence: "authoritative", remainingPct: 60 },
						openai: { confidence: "authoritative", remainingPct: 60 },
						google: { confidence: "unknown", remainingPct: undefined },
					},
					updatedAt: Date.now(),
				},
			});

			expect(classification.intent, fixture.name).toBe(fixture.intent);
			expect(decision?.selectedModel, fixture.name).toBe(fixture.expectedModel);
			expect(decision?.selectedThinking, fixture.name).toBe(fixture.expectedThinking);
		}
	});
});
