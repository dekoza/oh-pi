import { describe, expect, it } from "vitest";
import { renderDetail } from "../agent-manager-detail.js";

const theme = {
	fg: (_color: string, text: string) => text,
	bold: (text: string) => text,
} as any;

describe("agent manager detail routing display", () => {
	it("shows effective route and routing warnings", () => {
		const lines = renderDetail(
			{ resolved: false, scrollOffset: 0, recentRuns: [] },
			{
				name: "scout",
				description: "Fast recon",
				source: "user",
				filePath: "/tmp/scout.md",
				systemPrompt: "Prompt",
				model: "anthropic/claude-sonnet-4.6",
				category: "quick-discovery",
			},
			"/tmp",
			80,
			theme,
			[{ provider: "anthropic", id: "claude-sonnet-4.6", fullId: "anthropic/claude-sonnet-4.6" }],
		).join("\n");

		expect(lines).toContain("Route:");
		expect(lines).toContain("explicit model → anthropic/claude-sonnet-4.6");
		expect(lines).toContain("Warning:");
		expect(lines).toContain("category 'quick-discovery' is inactive");
	});
});
