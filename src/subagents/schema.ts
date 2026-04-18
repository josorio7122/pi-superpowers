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

export const SubagentInputSchema = Type.Union([SingleSubagentSchema, ParallelSubagentSchema]);
export type SubagentInput = Static<typeof SubagentInputSchema>;

export const SubagentToolParamsSchema = Type.Object(
	{
		agent: Type.Optional(Type.String({ description: "Agent name for single mode" })),
		task: Type.Optional(Type.String({ description: "Task for single mode" })),
		tasks: Type.Optional(Type.Array(SingleSubagentSchema, { description: "Array of {agent, task} for parallel mode" })),
	},
	{
		description:
			"Dispatch a named superpowers agent. Exactly one of: (agent+task), tasks[]. Modes detected automatically.",
	},
);

export type SubagentMode = "single" | "parallel";

export function detectMode(input: unknown): SubagentMode | null {
	if (typeof input !== "object" || input === null) return null;
	const obj = input as Record<string, unknown>;
	if (Array.isArray(obj.tasks)) return "parallel";
	if (typeof obj.agent === "string" && typeof obj.task === "string") return "single";
	return null;
}
