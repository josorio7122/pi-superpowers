import { type Static, Type } from "@sinclair/typebox";

export const SingleSubagentSchema = Type.Object({
	agent: Type.String({ minLength: 1 }),
	task: Type.String({ minLength: 1 }),
});
export type SingleSubagent = Static<typeof SingleSubagentSchema>;

export const ParallelSubagentSchema = Type.Object({
	tasks: Type.Array(SingleSubagentSchema, { minItems: 1 }),
});
export type ParallelSubagent = Static<typeof ParallelSubagentSchema>;

export const ChainSubagentSchema = Type.Object({
	chain: Type.Array(SingleSubagentSchema, { minItems: 1 }),
});
export type ChainSubagent = Static<typeof ChainSubagentSchema>;

export const SubagentInputSchema = Type.Union([SingleSubagentSchema, ParallelSubagentSchema, ChainSubagentSchema]);
export type SubagentInput = Static<typeof SubagentInputSchema>;

export type SubagentMode = "single" | "parallel" | "chain";

export function detectMode(input: unknown): SubagentMode | null {
	if (typeof input !== "object" || input === null) return null;
	const obj = input as Record<string, unknown>;
	if (Array.isArray(obj.chain)) return "chain";
	if (Array.isArray(obj.tasks)) return "parallel";
	if (typeof obj.agent === "string" && typeof obj.task === "string") return "single";
	return null;
}
