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

function asRecord(value: unknown): Record<string, unknown> | undefined {
	if (!value || typeof value !== "object") {
		return undefined;
	}
	return value as Record<string, unknown>;
}

function normalizeOptionalString(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeCategoryPolicy(policy: unknown): DelegatedCategoryPolicy | undefined {
	const current = asRecord(policy);
	if (!current) {
		return undefined;
	}
	return {
		taskClass: normalizeOptionalString(current.taskClass),
		fallbackGroup: normalizeOptionalString(current.fallbackGroup),
		defaultThinking: normalizeOptionalString(current.defaultThinking),
	};
}

function normalizeTaskClassPolicy(policy: unknown): DelegatedTaskClassPolicy | undefined {
	const current = asRecord(policy);
	if (!current) {
		return undefined;
	}
	const candidates = normalizeStringArray(current.candidates);
	if (candidates.length === 0) {
		return undefined;
	}
	return {
		candidates,
		fallbackGroup: normalizeOptionalString(current.fallbackGroup),
		defaultThinking: normalizeOptionalString(current.defaultThinking),
	};
}

function normalizeFallbackGroupPolicy(policy: unknown): DelegatedFallbackGroupPolicy | undefined {
	const current = asRecord(policy);
	if (!current) {
		return undefined;
	}
	const candidates = normalizeStringArray(current.candidates);
	if (candidates.length === 0) {
		return undefined;
	}
	return { candidates };
}

function normalizePolicyMap<T>(value: unknown, normalize: (policy: unknown) => T | undefined): Record<string, T> {
	const record = asRecord(value);
	if (!record) {
		return {};
	}

	const normalized: Record<string, T> = {};
	for (const [name, policy] of Object.entries(record)) {
		const next = normalize(policy);
		if (next) {
			normalized[name] = next;
		}
	}
	return normalized;
}

function normalizeDelegatedPolicy(raw: unknown): DelegatedRoutingPolicy {
	const cfg = asRecord(raw);
	const delegated = asRecord(cfg?.delegatedRouting);
	if (!(cfg && delegated)) {
		return EMPTY_POLICY;
	}

	return {
		enabled: delegated.enabled === true,
		categories: normalizePolicyMap(delegated.categories, normalizeCategoryPolicy),
		taskClasses: normalizePolicyMap(cfg.taskClasses, normalizeTaskClassPolicy),
		fallbackGroups: normalizePolicyMap(cfg.fallbackGroups, normalizeFallbackGroupPolicy),
		excludedModels: normalizeStringArray(asRecord(cfg.models)?.excluded),
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

export function resolveModelFullId(
	modelName: string | undefined,
	availableModels: AvailableModelRef[],
): string | undefined {
	if (!modelName) {
		return undefined;
	}
	if (modelName.includes("/")) {
		return modelName;
	}

	const colonIdx = modelName.lastIndexOf(":");
	const baseModel = colonIdx === -1 ? modelName : modelName.substring(0, colonIdx);
	const thinkingSuffix = colonIdx === -1 ? "" : modelName.substring(colonIdx);
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
		.filter(
			(reference) =>
				!excludedModels.some((excluded) => excluded === reference || excluded === reference.split("/").pop()),
		)
		.map((reference) => resolveModelFullId(reference, availableModels))
		.filter((reference): reference is string => Boolean(reference))
		.filter((reference) => availableModels.some((model) => matchesModelRef(reference, model)));
}

export function resolveDelegatedCategoryRoute(
	category: string | undefined,
	availableModels: AvailableModelRef[],
	policy = readDelegatedRoutingPolicy(),
): DelegatedCategoryRoute | undefined {
	if (!policy.enabled) {
		return undefined;
	}
	if (!category) {
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
