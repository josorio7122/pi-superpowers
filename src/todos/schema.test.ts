import { Value } from "@sinclair/typebox/value";
import { describe, expect, it } from "vitest";
import { TodoActionSchema, TodoItemSchema } from "./schema.js";

describe("TodoItemSchema", () => {
	it("accepts valid item", () => {
		expect(Value.Check(TodoItemSchema, { id: "1", content: "x", status: "pending" })).toBe(true);
	});
	it("accepts priority when present", () => {
		expect(Value.Check(TodoItemSchema, { id: "1", content: "x", status: "pending", priority: "high" })).toBe(true);
	});
	it("rejects missing id", () => {
		expect(Value.Check(TodoItemSchema, { content: "x", status: "pending" })).toBe(false);
	});
	it("rejects unknown status", () => {
		expect(Value.Check(TodoItemSchema, { id: "1", content: "x", status: "bogus" })).toBe(false);
	});
});

describe("TodoActionSchema", () => {
	it("accepts list", () => {
		expect(Value.Check(TodoActionSchema, { action: "list" })).toBe(true);
	});
	it("accepts clear", () => {
		expect(Value.Check(TodoActionSchema, { action: "clear" })).toBe(true);
	});
	it("accepts replace with items", () => {
		expect(
			Value.Check(TodoActionSchema, {
				action: "replace",
				items: [{ id: "1", content: "x", status: "pending" }],
			}),
		).toBe(true);
	});
	it("accepts add with content", () => {
		expect(Value.Check(TodoActionSchema, { action: "add", content: "x" })).toBe(true);
	});
	it("accepts update with id", () => {
		expect(Value.Check(TodoActionSchema, { action: "update", id: "1", status: "completed" })).toBe(true);
	});
	it("accepts complete with id", () => {
		expect(Value.Check(TodoActionSchema, { action: "complete", id: "1" })).toBe(true);
	});
	it("accepts remove with id", () => {
		expect(Value.Check(TodoActionSchema, { action: "remove", id: "1" })).toBe(true);
	});
	it("rejects unknown action", () => {
		expect(Value.Check(TodoActionSchema, { action: "bogus" })).toBe(false);
	});
	it("rejects add without content", () => {
		expect(Value.Check(TodoActionSchema, { action: "add" })).toBe(false);
	});
});
