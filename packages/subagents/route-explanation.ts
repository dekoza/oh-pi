import type { AvailableModelRef } from "@ifi/oh-pi-core";
import type { AgentConfig } from "./agents.js";
import { resolveDelegatedModelSelection, type DelegatedRouteInfo } from "./delegated-routing.js";

export interface AvailableModelLike {
	provider: string;
	id: string;
	fullId?: string;
}

export interface AgentRouteExplanation {
	effectiveRoute: string;
	warnings: string[];
}

export function normalizeAvailableModels(models: AvailableModelLike[]): AvailableModelRef[] {
	return models.map((model) => ({
		provider: model.provider,
		id: model.id,
		fullId: model.fullId ?? `${model.provider}/${model.id}`,
	}));
}

export function formatDelegatedRouteSummary(route: DelegatedRouteInfo | undefined): string | undefined {
	if (!route?.selectedModel) {
		return undefined;
	}

	if (route.routeSource === "runtime-model-override") {
		return `runtime override → ${route.selectedModel}`;
	}
	if (route.routeSource === "agent-model") {
		return `explicit model → ${route.selectedModel}`;
	}
	if (route.routeSource === "agent-category") {
		const extras: string[] = [];
		if (route.normalizedCategory && route.normalizedCategory !== route.requestedCategory) {
			extras.push(`normalized: ${route.normalizedCategory}`);
		}
		if (route.fallbackGroup) {
			extras.push(`fallback: ${route.fallbackGroup}`);
		}
		const suffix = extras.length > 0 ? ` (${extras.join(", ")})` : "";
		return `category ${route.requestedCategory} → ${route.selectedModel}${suffix}`;
	}
	if (route.routeSource === "fallback-model") {
		return `session default → ${route.selectedModel}`;
	}
	return undefined;
}

export function explainAgentRoute(agent: Pick<AgentConfig, "model" | "category">, models: AvailableModelLike[]): AgentRouteExplanation {
	const availableModels = normalizeAvailableModels(models);
	const route = resolveDelegatedModelSelection(agent, availableModels, {});
	const warnings: string[] = [];

	if (agent.model && agent.category) {
		warnings.push(`category '${agent.category}' is inactive because explicit model '${agent.model}' takes precedence`);
	}
	if (!agent.model && agent.category && availableModels.length > 0 && route.routeSource !== "agent-category") {
		warnings.push(
			`category '${agent.category}' did not resolve to any available model with the current delegated routing policy`,
		);
	}

	if (!agent.model && agent.category && availableModels.length === 0) {
		return {
			effectiveRoute: `category ${agent.category} (resolution unavailable: no models in registry)`,
			warnings,
		};
	}

	return {
		effectiveRoute: formatDelegatedRouteSummary(route) ?? "session default",
		warnings,
	};
}
