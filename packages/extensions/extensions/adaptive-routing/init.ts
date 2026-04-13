import type { AdaptiveRoutingConfig, DelegatedCategoryPolicy, RouteThinkingLevel } from "./types.js";

export interface InitModelInfo {
	provider: string;
	id: string;
	name: string;
	reasoning: boolean;
	cost: { input: number };
}

type ModelTier = "cheap" | "balanced" | "premium" | "peak";

function classifyModelTier(model: InitModelInfo): ModelTier {
	const id = model.id.toLowerCase();
	if (id.includes("gpt-5.4") || id.includes("opus-4.6") || id.includes("opus-4-6")) {
		return "peak";
	}
	if (id.includes("opus") || id.includes("sonnet") || id.includes("pro") || id.includes("gpt-5")) {
		return "premium";
	}
	if (id.includes("flash") || id.includes("mini")) {
		return "cheap";
	}
	return "balanced";
}

function toFullId(model: InitModelInfo): string {
	return `${model.provider}/${model.id}`;
}

interface CategorySpec {
	tiers: ModelTier[];
	thinking: RouteThinkingLevel;
}

const CATEGORY_SPECS: Record<string, CategorySpec> = {
	"quick-discovery": { tiers: ["cheap", "balanced"], thinking: "minimal" },
	"balanced-execution": { tiers: ["balanced", "premium", "cheap"], thinking: "medium" },
	"review-critical": { tiers: ["premium", "peak", "balanced"], thinking: "high" },
	"visual-engineering": { tiers: ["premium", "peak"], thinking: "high" },
	"peak-reasoning": { tiers: ["peak", "premium"], thinking: "xhigh" },
};

function selectCandidates(models: InitModelInfo[], preferredTiers: ModelTier[]): string[] {
	const tierBuckets = new Map<ModelTier, string[]>();
	for (const model of models) {
		const tier = classifyModelTier(model);
		const bucket = tierBuckets.get(tier) ?? [];
		bucket.push(toFullId(model));
		tierBuckets.set(tier, bucket);
	}

	const candidates: string[] = [];
	const seen = new Set<string>();
	for (const tier of preferredTiers) {
		for (const fullId of tierBuckets.get(tier) ?? []) {
			if (!seen.has(fullId)) {
				candidates.push(fullId);
				seen.add(fullId);
			}
		}
	}

	if (candidates.length === 0) {
		for (const model of models) {
			const fullId = toFullId(model);
			if (!seen.has(fullId)) {
				candidates.push(fullId);
				seen.add(fullId);
			}
		}
	}

	return candidates;
}

export function generateDefaultConfig(
	availableModels: InitModelInfo[],
): Pick<AdaptiveRoutingConfig, "mode" | "delegatedRouting"> {
	if (availableModels.length === 0) {
		return {
			mode: "shadow",
			delegatedRouting: { enabled: true, categories: {} },
		};
	}

	const categories: Record<string, DelegatedCategoryPolicy> = {};
	for (const [name, spec] of Object.entries(CATEGORY_SPECS)) {
		const candidates = selectCandidates(availableModels, spec.tiers);
		categories[name] = {
			candidates,
			defaultThinking: spec.thinking,
		};
	}

	return {
		mode: "shadow",
		delegatedRouting: { enabled: true, categories },
	};
}
