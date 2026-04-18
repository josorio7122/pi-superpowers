import { describe, expect, it } from "vitest";
import { renderPiAddendum } from "./addendum.js";

describe("renderPiAddendum", () => {
	it("contains the pi tool-mapping table", () => {
		const text = renderPiAddendum({ subagentAvailable: true });
		expect(text).toContain("| `Read` | `read` |");
		expect(text).toContain("| `TodoWrite` | `superpowers_todo` |");
		expect(text).toContain("| `Task` | `superpowers_subagent` |");
	});

	it("mentions pi-native /skill:name", () => {
		expect(renderPiAddendum({ subagentAvailable: true })).toContain("/skill:");
	});

	it("warns when subagent is unavailable", () => {
		const text = renderPiAddendum({ subagentAvailable: false });
		expect(text.toLowerCase()).toContain("subagent");
		expect(text.toLowerCase()).toContain("unavailable");
	});

	it("does not warn when subagent is available", () => {
		const text = renderPiAddendum({ subagentAvailable: true });
		expect(text.toLowerCase()).not.toContain("unavailable");
	});
});
