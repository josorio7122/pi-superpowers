import { describe, expect, it } from "vitest";
import { reconstructTodos, type SessionEntryLike } from "./state.js";

describe("reconstructTodos", () => {
	it("returns [] on empty entries", () => {
		expect(reconstructTodos([])).toEqual([]);
	});

	it("returns [] when no superpowers_todo entries exist", () => {
		const entries: SessionEntryLike[] = [{ tool: "read", details: { path: "x" } }];
		expect(reconstructTodos(entries)).toEqual([]);
	});

	it("returns latest todos from most recent entry", () => {
		const entries: SessionEntryLike[] = [
			{ tool: "superpowers_todo", details: { todos: [{ id: "1", content: "old", status: "pending" }], action: "add" } },
			{ tool: "read", details: {} },
			{
				tool: "superpowers_todo",
				details: {
					todos: [
						{ id: "1", content: "new", status: "in_progress" },
						{ id: "2", content: "next", status: "pending" },
					],
					action: "update",
				},
			},
		];
		const todos = reconstructTodos(entries);
		expect(todos).toHaveLength(2);
		expect(todos[0]?.content).toBe("new");
		expect(todos[0]?.status).toBe("in_progress");
	});

	it("returns [] when latest entry has malformed details", () => {
		const entries: SessionEntryLike[] = [
			{ tool: "superpowers_todo", details: { todos: "not-an-array", action: "add" } },
		];
		expect(reconstructTodos(entries)).toEqual([]);
	});

	it("ignores entries missing tool field", () => {
		const entries: SessionEntryLike[] = [{ details: { todos: [] } }];
		expect(reconstructTodos(entries)).toEqual([]);
	});
});
