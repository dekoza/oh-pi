import { existsSync, readFileSync } from "node:fs";
import { getExtensionConfigPath } from "@ifi/oh-pi-core";
import type { AgentConfig } from "./agents.js";

export interface AvailableModelRef {
	provider: string;
	id: string;
	fullId: string;
}

interface DelegatedCategoryPolicy {
	taskClass?: string;
	fallbackGroup?: string;
	defaultThinking?: string;
}

interface DelegatedTaskClassPolicy {
	candidates: string[];
	fallbackGroup?: string;
	defaultThinking?: string;
}

interface DelegatedFallbackGroupPolicy {
	candidates: string[];
}

interface DelegatedRoutingPolicy {
	enabled: boolean;
	categories: Record<string, DelegatedCategoryPolicy>;
	taskClasses: Record<string, DelegatedTaskClassPolicy>;
	fallbackGroups: Record<string, DelegatedFallbackGroupPolicy>;
	excludedModels: string[];
}

export interface DelegatedRouteInfo {
	routeSource: "runtime-model-override" | "agent-model" | "agent-category" | "fallback-model" | "none";
	selectedModel?: string;
	requestedCategory?: string;
	normalizedCategory?: string;
	fallbackGroup?: string;
	candidateModels?: string[];
}

const EMPTY_POLICY: DelegatedRoutingPolicy = {
	enabled: false,
	categories: {},
	taskClasses: {},
	fallbackGroups: {},
	excludedModels: [],
};

function matchesModelRef(reference: string, model: AvailableModelRef): boolean {
	const normalized = reference.trim();
	return normalized === model.fullId || normalized === model.id;
}

function resolveModelFullId(modelName: string | undefined, availableModels: AvailableModelRef[]): string | undefined {
	if (!modelName) return undefined;
	if (modelName.includes("/")) return modelName;

	const colonIdx = modelName.lastIndexOf(":");
	const baseModel = colonIdx !== -1 ? modelName.substring(0, colonIdx) : modelName;
	const thinkingSuffix = colonIdx !== -1 ? modelName.substring(colonIdx) : "";
	const match = availableModels.find((model) => model.id === baseModel);
	if (!match) return modelName;
	return thinkingSuffix ? `${match.fullId}${thinkingSuffix}` : match.fullId;
}

function normalizeCsv(value: unknown): string[] {
	if (typeof value !== "string") return [];
	return value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

function normalizeStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function normalizeDelegatedPolicy(raw: unknown): DelegatedRoutingPolicy {
	if (!raw || typeof raw !== "object") return EMPTY_POLICY;
	const cfg = raw as Record<string, unknown>;
	const delegatedRaw = cfg.delegatedRouting;
	const categories: Record<string, DelegatedCategoryPolicy> = {};
	if (delegatedRaw && typeof delegatedRaw === "object") {
		const delegated = delegatedRaw as Record<string, unknown>;
		const categoryEntries = delegated.categories;
		if (categoryEntries && typeof categoryEntries === "object") {
			for (const [name, policy] of Object.entries(categoryEntries as Record<string, unknown>)) {
				if (!policy || typeof policy !== "object") continue;
				const p = policy as Record<string, unknown>;
				categories[name] = {
					taskClass: typeof p.taskClass === "string" && p.taskClass.trim() ? p.taskClass.trim() : undefined,
					fallbackGroup:
						typeof p.fallbackGroup === "string" && p.fallbackGroup.trim() ? p.fallbackGroup.trim() : undefined,
					defaultThinking:
						typeof p.defaultThinking === "string" && p.defaultThinking.trim() ? p.defaultThinking.trim() : undefined,
				};
			}
		}
		const taskClassesRaw = cfg.taskClasses;
		const taskClasses: Record<string, DelegatedTaskClassPolicy> = {};
		if (taskClassesRaw && typeof taskClassesRaw === "object") {
			for (const [name, policy] of Object.entries(taskClassesRaw as Record<string, unknown>)) {
				if (!policy || typeof policy !== "object") continue;
				const p = policy as Record<string, unknown>;
				const candidates = normalizeStringArray(p.candidates);
				if (candidates.length === 0) continue;
				taskClasses[name] = {
					candidates,
					fallbackGroup:
						typeof p.fallbackGroup === "string" && p.fallbackGroup.trim() ? p.fallbackGroup.trim() : undefined,
					defaultThinking:
						typeof p.defaultThinking === "string" && p.defaultThinking.trim() ? p.defaultThinking.trim() : undefined,
				};
			}
		}
		const fallbackGroupsRaw = cfg.fallbackGroups;
		const fallbackGroups: Record<string, DelegatedFallbackGroupPolicy> = {};
		if (fallbackGroupsRaw && typeof fallbackGroupsRaw === "object") {
			for (const [name, policy] of Object.entries(fallbackGroupsRaw as Record<string, unknown>)) {
				if (!policy || typeof policy !== "object") continue;
				const p = policy as Record<string, unknown>;
				const candidates = normalizeStringArray(p.candidates);
				if (candidates.length === 0) continue;
				fallbackGroups[name] = { candidates };
			}
		}
		const modelsRaw = cfg.models;
		let excludedModels: string[] = [];
		if (modelsRaw && typeof modelsRaw === "object") {
			excludedModels = normalizeStringArray((modelsRaw as Record<string, unknown>).excluded);
		}
		return {
			enabled: delegated.enabled === true,
			categories,
			taskClasses,
			fallbackGroups,
			excludedModels,
		};
	}
	return EMPTY_POLICY;
}

function readDelegatedRoutingPolicy(): DelegatedRoutingPolicy {
	const configPath = getExtensionConfigPath("adaptive-routing");
	if (!existsSync(configPath)) {
		return EMPTY_POLICY;
	}
	try {
		return normalizeDelegatedPolicy(JSON.parse(readFileSync(configPath, "utf-8")) as unknown);
	} catch {
		return EMPTY_POLICY;
	}
}

function filterAvailableCandidates(candidateRefs: string[], availableModels: AvailableModelRef[], excludedModels: string[]): string[] {
	return candidateRefs
		.filter((reference) => !excludedModels.some((excluded) => excluded === reference || excluded === reference.split("/").pop()))
		.map((reference) => resolveModelFullId(reference, availableModels))
		.filter((reference): reference is string => Boolean(reference))
		.filter((reference) => availableModels.some((model) => matchesModelRef(reference, model)));
}

export function resolveDelegatedModelSelection(
	agent: Pick<AgentConfig, "model" | "category">,
	availableModels: AvailableModelRef[],
	options: {
		runtimeModel?: string;
		fallbackModel?: string;
	},
): DelegatedRouteInfo {
	if (options.runtimeModel) {
		return {
			routeSource: "runtime-model-override",
			selectedModel: resolveModelFullId(options.runtimeModel, availableModels) ?? options.runtimeModel,
		};
	}

	if (agent.model) {
		return {
			routeSource: "agent-model",
			selectedModel: resolveModelFullId(agent.model, availableModels) ?? agent.model,
		};
	}

	const policy = readDelegatedRoutingPolicy();
	if (policy.enabled && agent.category) {
		const categoryPolicy = policy.categories[agent.category];
		if (categoryPolicy) {
			const taskClass = categoryPolicy.taskClass ? policy.taskClasses[categoryPolicy.taskClass] : undefined;
			const fallbackGroupName = categoryPolicy.fallbackGroup ?? taskClass?.fallbackGroup;
			const fallbackGroup = fallbackGroupName ? policy.fallbackGroups[fallbackGroupName] : undefined;
			const candidateRefs = taskClass?.candidates ?? fallbackGroup?.candidates ?? [];
			const availableCandidates = filterAvailableCandidates(candidateRefs, availableModels, policy.excludedModels);
			if (availableCandidates.length > 0) {
				return {
					routeSource: "agent-category",
					selectedModel: availableCandidates[0],
					requestedCategory: agent.category,
					normalizedCategory: categoryPolicy.taskClass ?? agent.category,
					fallbackGroup: fallbackGroupName,
					candidateModels: availableCandidates,
				};
			}
		}
	}

	if (options.fallbackModel) {
		return {
			routeSource: "fallback-model",
			selectedModel: resolveModelFullId(options.fallbackModel, availableModels) ?? options.fallbackModel,
		};
	}

	return { routeSource: "none" };
}
