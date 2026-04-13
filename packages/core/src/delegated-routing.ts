import { existsSync, readFileSync } from "node:fs";
import { getExtensionConfigPath } from "./agent-paths.js";

export interface AvailableModelRef {
	provider: string;
	id: string;
	fullId: string;
}

export interface DelegatedCategoryPolicy {
	taskClass?: string;
	fallbackGroup?: string;
	defaultThinking?: string;
}

export interface DelegatedTaskClassPolicy {
	candidates: string[];
	fallbackGroup?: string;
	defaultThinking?: string;
}

export interface DelegatedFallbackGroupPolicy {
	candidates: string[];
}

export interface DelegatedRoutingPolicy {
	enabled: boolean;
	categories: Record<string, DelegatedCategoryPolicy>;
	taskClasses: Record<string, DelegatedTaskClassPolicy>;
	fallbackGroups: Record<string, DelegatedFallbackGroupPolicy>;
	excludedModels: string[];
}

export interface DelegatedCategoryRoute {
	requestedCategory: string;
	normalizedCategory: string;
	selectedModel: string;
	fallbackGroup?: string;
	candidateModels: string[];
}

const EMPTY_POLICY: DelegatedRoutingPolicy = {
	enabled: false,
	categories: {},
	taskClasses: {},
	fallbackGroups: {},
	excludedModels: [],
};

function normalizeStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function normalizeDelegatedPolicy(raw: unknown): DelegatedRoutingPolicy {
	if (!raw || typeof raw !== "object") {
		return EMPTY_POLICY;
	}

	const cfg = raw as Record<string, unknown>;
	const delegatedRaw = cfg.delegatedRouting;
	if (!delegatedRaw || typeof delegatedRaw !== "object") {
		return EMPTY_POLICY;
	}

	const delegated = delegatedRaw as Record<string, unknown>;
	const categories: Record<string, DelegatedCategoryPolicy> = {};
	if (delegated.categories && typeof delegated.categories === "object") {
		for (const [name, policy] of Object.entries(delegated.categories as Record<string, unknown>)) {
			if (!policy || typeof policy !== "object") {
				continue;
			}
			const current = policy as Record<string, unknown>;
			categories[name] = {
				taskClass:
					typeof current.taskClass === "string" && current.taskClass.trim() ? current.taskClass.trim() : undefined,
				fallbackGroup:
					typeof current.fallbackGroup === "string" && current.fallbackGroup.trim()
						? current.fallbackGroup.trim()
						: undefined,
				defaultThinking:
					typeof current.defaultThinking === "string" && current.defaultThinking.trim()
						? current.defaultThinking.trim()
						: undefined,
			};
		}
	}

	const taskClasses: Record<string, DelegatedTaskClassPolicy> = {};
	if (cfg.taskClasses && typeof cfg.taskClasses === "object") {
		for (const [name, policy] of Object.entries(cfg.taskClasses as Record<string, unknown>)) {
			if (!policy || typeof policy !== "object") {
				continue;
			}
			const current = policy as Record<string, unknown>;
			const candidates = normalizeStringArray(current.candidates);
			if (candidates.length === 0) {
				continue;
			}
			taskClasses[name] = {
				candidates,
				fallbackGroup:
					typeof current.fallbackGroup === "string" && current.fallbackGroup.trim()
						? current.fallbackGroup.trim()
						: undefined,
				defaultThinking:
					typeof current.defaultThinking === "string" && current.defaultThinking.trim()
						? current.defaultThinking.trim()
						: undefined,
			};
		}
	}

	const fallbackGroups: Record<string, DelegatedFallbackGroupPolicy> = {};
	if (cfg.fallbackGroups && typeof cfg.fallbackGroups === "object") {
		for (const [name, policy] of Object.entries(cfg.fallbackGroups as Record<string, unknown>)) {
			if (!policy || typeof policy !== "object") {
				continue;
			}
			const current = policy as Record<string, unknown>;
			const candidates = normalizeStringArray(current.candidates);
			if (candidates.length === 0) {
				continue;
			}
			fallbackGroups[name] = { candidates };
		}
	}

	const excludedModels =
		cfg.models && typeof cfg.models === "object"
			? normalizeStringArray((cfg.models as Record<string, unknown>).excluded)
			: [];

	return {
		enabled: delegated.enabled === true,
		categories,
		taskClasses,
		fallbackGroups,
		excludedModels,
	};
}

export function readDelegatedRoutingPolicy(): DelegatedRoutingPolicy {
	const configPath = getExtensionConfigPath("adaptive-routing", "config.json", { env: process.env });
	if (!existsSync(configPath)) {
		return EMPTY_POLICY;
	}
	try {
		return normalizeDelegatedPolicy(JSON.parse(readFileSync(configPath, "utf-8")) as unknown);
	} catch {
		return EMPTY_POLICY;
	}
}

function matchesModelRef(reference: string, model: AvailableModelRef): boolean {
	const normalized = reference.trim();
	return normalized === model.fullId || normalized === model.id;
}

export function resolveModelFullId(modelName: string | undefined, availableModels: AvailableModelRef[]): string | undefined {
	if (!modelName) {
		return undefined;
	}
	if (modelName.includes("/")) {
		return modelName;
	}

	const colonIdx = modelName.lastIndexOf(":");
	const baseModel = colonIdx !== -1 ? modelName.substring(0, colonIdx) : modelName;
	const thinkingSuffix = colonIdx !== -1 ? modelName.substring(colonIdx) : "";
	const match = availableModels.find((model) => model.id === baseModel);
	if (!match) {
		return modelName;
	}
	return thinkingSuffix ? `${match.fullId}${thinkingSuffix}` : match.fullId;
}

function filterAvailableCandidates(
	candidateRefs: string[],
	availableModels: AvailableModelRef[],
	excludedModels: string[],
): string[] {
	return candidateRefs
		.filter((reference) => !excludedModels.some((excluded) => excluded === reference || excluded === reference.split("/").pop()))
		.map((reference) => resolveModelFullId(reference, availableModels))
		.filter((reference): reference is string => Boolean(reference))
		.filter((reference) => availableModels.some((model) => matchesModelRef(reference, model)));
}

export function resolveDelegatedCategoryRoute(
	category: string | undefined,
	availableModels: AvailableModelRef[],
	policy = readDelegatedRoutingPolicy(),
): DelegatedCategoryRoute | undefined {
	if (!policy.enabled || !category) {
		return undefined;
	}

	const categoryPolicy = policy.categories[category];
	if (!categoryPolicy) {
		return undefined;
	}

	const taskClass = categoryPolicy.taskClass ? policy.taskClasses[categoryPolicy.taskClass] : undefined;
	const fallbackGroupName = categoryPolicy.fallbackGroup ?? taskClass?.fallbackGroup;
	const fallbackGroup = fallbackGroupName ? policy.fallbackGroups[fallbackGroupName] : undefined;
	const candidateRefs = taskClass?.candidates ?? fallbackGroup?.candidates ?? [];
	const candidateModels = filterAvailableCandidates(candidateRefs, availableModels, policy.excludedModels);
	if (candidateModels.length === 0) {
		return undefined;
	}

	return {
		requestedCategory: category,
		normalizedCategory: categoryPolicy.taskClass ?? category,
		selectedModel: candidateModels[0],
		fallbackGroup: fallbackGroupName,
		candidateModels,
	};
}
