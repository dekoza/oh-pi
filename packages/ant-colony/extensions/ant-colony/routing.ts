import { existsSync, readFileSync } from "node:fs";
import {
	getExtensionConfigPath,
	resolveDelegatedCategoryRoute,
	resolveModelFullId,
	type AvailableModelRef,
} from "@ifi/oh-pi-core";
import {
	DEFAULT_CASTE_ROUTING_CATEGORIES,
	DEFAULT_WORKER_CLASS_ROUTING_CATEGORIES,
	type AntCaste,
	type AntRoutingInfo,
	type ModelOverrides,
	type WorkerClass,
} from "./types.js";

interface AntColonyRoutingCategoriesConfig {
	castes?: Partial<Record<AntCaste, string>>;
	workerClasses?: Partial<Record<WorkerClass, string>>;
}

interface AntColonyRoutingConfigFile {
	routingCategories?: AntColonyRoutingCategoriesConfig;
}

function getAntColonyConfigPath(): string {
	return getExtensionConfigPath("ant-colony", "config.json", { env: process.env });
}

export interface ResolveAntModelSelectionOptions {
	caste: AntCaste;
	workerClass?: WorkerClass;
	modelOverrides?: ModelOverrides;
	currentModel?: string;
	availableModels: AvailableModelRef[];
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

function loadAntColonyRoutingCategories(): Required<AntColonyRoutingCategoriesConfig> {
	const categories: Required<AntColonyRoutingCategoriesConfig> = {
		castes: { ...DEFAULT_CASTE_ROUTING_CATEGORIES },
		workerClasses: { ...DEFAULT_WORKER_CLASS_ROUTING_CATEGORIES },
	};

	const configPath = getAntColonyConfigPath();
	if (!existsSync(configPath)) {
		return categories;
	}

	try {
		const parsed = JSON.parse(readFileSync(configPath, "utf-8")) as AntColonyRoutingConfigFile;
		const config = parsed.routingCategories;
		if (!config || typeof config !== "object") {
			return categories;
		}

		if (config.castes && typeof config.castes === "object") {
			for (const [caste, category] of Object.entries(config.castes)) {
				if (isNonEmptyString(category)) {
					categories.castes[caste as AntCaste] = category.trim();
				}
			}
		}

		if (config.workerClasses && typeof config.workerClasses === "object") {
			for (const [workerClass, category] of Object.entries(config.workerClasses)) {
				if (isNonEmptyString(category)) {
					categories.workerClasses[workerClass as WorkerClass] = category.trim();
				}
			}
		}
	} catch {
		return categories;
	}

	return categories;
}

function resolveOverride(
	caste: AntCaste,
	workerClass: WorkerClass | undefined,
	modelOverrides: ModelOverrides | undefined,
	availableModels: AvailableModelRef[],
): Pick<AntRoutingInfo, "selectedModel" | "overrideKey"> | undefined {
	const overrideKey = workerClass && modelOverrides?.[workerClass] ? workerClass : modelOverrides?.[caste] ? caste : undefined;
	if (!overrideKey) {
		return undefined;
	}
	const selectedModel = resolveModelFullId(modelOverrides?.[overrideKey], availableModels) ?? modelOverrides?.[overrideKey];
	if (!selectedModel) {
		return undefined;
	}
	return {
		selectedModel,
		overrideKey,
	};
}

function categoryRouteToAntRoutingInfo(
	routeSource: Extract<AntRoutingInfo["routeSource"], "worker-class-category" | "caste-category">,
	route: ReturnType<typeof resolveDelegatedCategoryRoute>,
): AntRoutingInfo | undefined {
	if (!route) {
		return undefined;
	}
	return {
		routeSource,
		requestedCategory: route.requestedCategory,
		normalizedCategory: route.normalizedCategory,
		selectedModel: route.selectedModel,
		fallbackGroup: route.fallbackGroup,
		candidateModels: route.candidateModels,
	};
}

export function resolveAntModelSelection(options: ResolveAntModelSelectionOptions): AntRoutingInfo {
	if (options.caste === "drone") {
		return { routeSource: "none" };
	}

	const override = resolveOverride(options.caste, options.workerClass, options.modelOverrides, options.availableModels);
	if (override) {
		return {
			routeSource: "model-override",
			selectedModel: override.selectedModel,
			overrideKey: override.overrideKey,
		};
	}

	const routingCategories = loadAntColonyRoutingCategories();
	const workerClassCategory = options.workerClass ? routingCategories.workerClasses[options.workerClass] : undefined;
	const workerClassRoute = categoryRouteToAntRoutingInfo(
		"worker-class-category",
		resolveDelegatedCategoryRoute(workerClassCategory, options.availableModels),
	);
	if (workerClassRoute) {
		return workerClassRoute;
	}

	const casteCategory = routingCategories.castes[options.caste];
	const casteRoute = categoryRouteToAntRoutingInfo(
		"caste-category",
		resolveDelegatedCategoryRoute(casteCategory, options.availableModels),
	);
	if (casteRoute) {
		return casteRoute;
	}

	const fallbackModel = resolveModelFullId(options.currentModel, options.availableModels) ?? options.currentModel;
	if (fallbackModel) {
		return {
			routeSource: "fallback-model",
			selectedModel: fallbackModel,
		};
	}

	return { routeSource: "none" };
}
