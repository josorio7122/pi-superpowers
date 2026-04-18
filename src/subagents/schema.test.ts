import { Value } from "@sinclair/typebox/value";
import { describe, expect, it } from "vitest";
import { detectMode, ParallelSubagentSchema, SingleSubagentSchema, SubagentInputSchema } from "./schema.js";

describe("SingleSubagentSchema", () => {
	it("accepts valid single", () => {
		expect(Value.Check(SingleSubagentSchema, { agent: "x", task: "y" })).toBe(true);
	});
	it("rejects missing task", () => {
		expect(Value.Check(SingleSubagentSchema, { agent: "x" })).toBe(false);
	});
});

describe("ParallelSubagentSchema", () => {
	it("accepts valid parallel", () => {
		expect(Value.Check(ParallelSubagentSchema, { tasks: [{ agent: "r", task: "t" }] })).toBe(true);
	});
	it("rejects empty tasks", () => {
		expect(Value.Check(ParallelSubagentSchema, { tasks: [] })).toBe(false);
	});
});

describe("SubagentInputSchema union", () => {
	it("accepts single and parallel shapes", () => {
		expect(Value.Check(SubagentInputSchema, { agent: "a", task: "t" })).toBe(true);
		expect(Value.Check(SubagentInputSchema, { tasks: [{ agent: "a", task: "t" }] })).toBe(true);
	});
	it("rejects garbage", () => {
		expect(Value.Check(SubagentInputSchema, { foo: "bar" })).toBe(false);
	});
});

describe("detectMode", () => {
	it("returns single for agent+task", () => {
		expect(detectMode({ agent: "x", task: "y" })).toBe("single");
	});
	it("returns parallel for tasks[]", () => {
		expect(detectMode({ tasks: [{ agent: "x", task: "y" }] })).toBe("parallel");
	});
	it("returns null for unknown", () => {
		expect(detectMode({ foo: "bar" })).toBe(null);
		expect(detectMode(null)).toBe(null);
		expect(detectMode(42)).toBe(null);
	});
});
