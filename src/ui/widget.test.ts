import { describe, expect, it } from "vitest";
import { clearWidget, setWidget } from "./widget.js";

function mockCtx() {
	const calls: Array<[string, string[]]> = [];
	return {
		ui: {
			setWidget: (id: string, lines: string[]) => {
				calls.push([id, lines]);
			},
		},
		__calls: calls,
	};
}

describe("setWidget", () => {
	it("passes id and lines through with namespaced prefix", () => {
		const ctx = mockCtx();
		setWidget(ctx as never, { name: "todos", lines: ["line1", "line2"] });
		expect(ctx.__calls).toEqual([["superpowers-todos", ["line1", "line2"]]]);
	});
});

describe("clearWidget", () => {
	it("sends an empty array", () => {
		const ctx = mockCtx();
		clearWidget(ctx as never, "todos");
		expect(ctx.__calls).toEqual([["superpowers-todos", []]]);
	});
});
