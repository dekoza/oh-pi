import { describe, expect, it, vi } from "vitest";

vi.mock("@mariozechner/pi-coding-agent", () => ({
	getMarkdownTheme: () => ({}),
}));

vi.mock("@mariozechner/pi-tui", () => ({
	Container: class {
		children: unknown[] = [];
		addChild(child: unknown) {
			this.children.push(child);
		}
	},
	Markdown: class {
		constructor(public text: string) {}
	},
	Spacer: class {},
	Text: class {
		constructor(public text: string) {}
	},
	truncateToWidth: (text: string, width: number) => text.slice(0, width),
	visibleWidth: (text: string) => text.length,
}));

vi.mock("../formatters.js", () => ({
	formatTokens: (value: number) => `${value}`,
	formatUsage: () => "usage",
	formatDuration: (value: number) => `${value}ms`,
	formatToolCall: () => "tool",
	shortenPath: (value: string) => value,
}));

vi.mock("../utils.js", () => ({
	getFinalOutput: () => "",
	getDisplayItems: () => [],
	getOutputTail: () => ["line a", "line b"],
	getLastActivity: () => "recent activity",
}));

import { renderSubagentResult, renderWidget } from "../render.js";
import { WIDGET_KEY } from "../types.js";

function createCtx() {
	const widgets = new Map<string, unknown>();
	return {
		hasUI: true,
		ui: {
			theme: {
				fg: (_color: string, text: string) => text,
			},
			setWidget(key: string, value: unknown) {
				widgets.set(key, value);
			},
		},
		_widgets: widgets,
	};
}

describe("subagent async widget rendering", () => {
	it("suppresses the widget when safe mode requests suppression", () => {
		const ctx = createCtx();
		renderWidget(
			ctx as any,
			[
				{
					asyncId: "abc123",
					asyncDir: "/tmp/run",
					status: "running",
					mode: "single",
					updatedAt: Date.now(),
					startedAt: Date.now() - 1000,
				},
			],
			{ suppressed: true },
		);

		expect(ctx._widgets.get(WIDGET_KEY)).toBeUndefined();
	});

	it("renders active jobs when not suppressed", () => {
		const ctx = createCtx();
		renderWidget(ctx as any, [
			{
				asyncId: "abc123",
				asyncDir: "/tmp/run",
				status: "running",
				mode: "single",
				agents: ["scout"],
				updatedAt: Date.now(),
				startedAt: Date.now() - 1000,
				outputFile: "/tmp/out.log",
				totalTokens: { input: 10, output: 5, total: 15 },
			},
		]);

		const lines = ctx._widgets.get(WIDGET_KEY) as string[];
		expect(lines[0]).toContain("Async subagents");
		expect(lines.join("\n")).toContain("recent activity");
	});
});

describe("renderSubagentResult route summaries", () => {
	it("shows the delegated route summary for single-agent results", () => {
		const widget: any = renderSubagentResult(
			{
				content: [{ type: "text", text: "done" }],
				details: {
					mode: "single",
					results: [
						{
							agent: "scout",
							task: "scan repo",
							exitCode: 0,
							messages: [],
							usage: { input: 1, output: 2, total: 3 },
							route: {
								routeSource: "agent-category",
								selectedModel: "google/gemini-2.5-flash",
								requestedCategory: "quick-discovery",
								normalizedCategory: "quick",
								fallbackGroup: "cheap-router",
							},
						},
					],
				},
			} as any,
			{ expanded: true },
			{
				fg: (_color: string, text: string) => text,
				bold: (text: string) => text,
			} as any,
		);

		const texts = widget.children
			.filter((child: any) => typeof child?.text === "string")
			.map((child: any) => child.text)
			.join("\n");
		expect(texts).toContain("Route: category quick-discovery → google/gemini-2.5-flash");
		expect(texts).toContain("fallback: cheap-router");
	});
});
