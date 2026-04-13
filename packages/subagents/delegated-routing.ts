import {
	resolveDelegatedCategoryRoute,
	resolveModelFullId,
	type AvailableModelRef,
} from "@ifi/oh-pi-core";
import type { AgentConfig } from "./agents.js";

export type { AvailableModelRef } from "@ifi/oh-pi-core";

export interface DelegatedRouteInfo {
	routeSource: "runtime-model-override" | "agent-model" | "agent-category" | "fallback-model" | "none";
	selectedModel?: string;
	requestedCategory?: string;
	normalizedCategory?: string;
	fallbackGroup?: string;
	candidateModels?: string[];
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

	const categoryRoute = resolveDelegatedCategoryRoute(agent.category, availableModels);
	if (categoryRoute) {
		return {
			routeSource: "agent-category",
			selectedModel: categoryRoute.selectedModel,
			requestedCategory: categoryRoute.requestedCategory,
			normalizedCategory: categoryRoute.normalizedCategory,
			fallbackGroup: categoryRoute.fallbackGroup,
			candidateModels: categoryRoute.candidateModels,
		};
	}

	if (options.fallbackModel) {
		return {
			routeSource: "fallback-model",
			selectedModel: resolveModelFullId(options.fallbackModel, availableModels) ?? options.fallbackModel,
		};
	}

	return { routeSource: "none" };
}
