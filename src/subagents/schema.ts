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

// Flat Object schema for pi `registerTool` parameters — OpenAI function-calling
// requires top-level schema type:"object". Strict per-mode validation still happens
// inside executeSubagent via SubagentInputSchema.
export const SubagentToolParamsSchema = Type.Object(
	{
		agent: Type.Optional(Type.String({ description: "Agent name for single mode" })),
		task: Type.Optional(Type.String({ description: "Task for single mode" })),
		tasks: Type.Optional(Type.Array(SingleSubagentSchema, { description: "Array of {agent, task} for parallel mode" })),
		chain: Type.Optional(
			Type.Array(SingleSubagentSchema, {
				description: "Array of {agent, task} for chain mode. Use '{previous}' in task to reference prior step output.",
			}),
		),
	},
	{
		description:
			"Dispatch a named superpowers agent. Exactly one of: (agent+task), tasks[], chain[]. Modes detected automatically.",
	},
);

export type SubagentMode = "single" | "parallel" | "chain";

export function detectMode(input: unknown): SubagentMode | null {
	if (typeof input !== "object" || input === null) return null;
	const obj = input as Record<string, unknown>;
	if (Array.isArray(obj.chain)) return "chain";
	if (Array.isArray(obj.tasks)) return "parallel";
	if (typeof obj.agent === "string" && typeof obj.task === "string") return "single";
	return null;
}
