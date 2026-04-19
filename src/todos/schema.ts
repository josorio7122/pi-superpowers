import { type Static, Type } from "@sinclair/typebox";

export const TodoStatusSchema = Type.Union([
	Type.Literal("pending"),
	Type.Literal("in_progress"),
	Type.Literal("completed"),
]);
export type TodoStatus = Static<typeof TodoStatusSchema>;

export const TodoPrioritySchema = Type.Union([Type.Literal("low"), Type.Literal("medium"), Type.Literal("high")]);
export type TodoPriority = Static<typeof TodoPrioritySchema>;

export const TodoItemSchema = Type.Object({
	id: Type.String({ minLength: 1 }),
	content: Type.String({ minLength: 1 }),
	status: TodoStatusSchema,
	priority: Type.Optional(TodoPrioritySchema),
	activeForm: Type.Optional(Type.String({ minLength: 1 })),
	startedAt: Type.Optional(Type.Number()),
});
export type TodoItem = Static<typeof TodoItemSchema>;

export const TodoActionSchema = Type.Union([
	Type.Object({ action: Type.Literal("list") }),
	Type.Object({ action: Type.Literal("clear") }),
	Type.Object({ action: Type.Literal("replace"), items: Type.Array(TodoItemSchema) }),
	Type.Object({
		action: Type.Literal("add"),
		content: Type.String({ minLength: 1 }),
		activeForm: Type.Optional(Type.String({ minLength: 1 })),
		priority: Type.Optional(TodoPrioritySchema),
	}),
	Type.Object({
		action: Type.Literal("update"),
		id: Type.String({ minLength: 1 }),
		content: Type.Optional(Type.String({ minLength: 1 })),
		activeForm: Type.Optional(Type.String({ minLength: 1 })),
		status: Type.Optional(TodoStatusSchema),
		priority: Type.Optional(TodoPrioritySchema),
	}),
	Type.Object({ action: Type.Literal("complete"), id: Type.String({ minLength: 1 }) }),
	Type.Object({ action: Type.Literal("remove"), id: Type.String({ minLength: 1 }) }),
]);
export type TodoAction = Static<typeof TodoActionSchema>;

export const TodoDetailsSchema = Type.Object({
	todos: Type.Array(TodoItemSchema),
	action: Type.String(),
});
export type TodoDetails = Static<typeof TodoDetailsSchema>;

// Flat Object schema used for pi `registerTool` parameters — OpenAI function-calling
// requires the top-level schema to be type:"object". Strict per-action validation
// still happens inside executeTodos via TodoActionSchema.
export const TodoToolParamsSchema = Type.Object(
	{
		action: Type.Union(
			[
				Type.Literal("list"),
				Type.Literal("clear"),
				Type.Literal("replace"),
				Type.Literal("add"),
				Type.Literal("update"),
				Type.Literal("complete"),
				Type.Literal("remove"),
			],
			{ description: "The action to perform" },
		),
		items: Type.Optional(Type.Array(TodoItemSchema, { description: "Required for action=replace" })),
		content: Type.Optional(Type.String({ description: "Required for action=add; optional for action=update" })),
		activeForm: Type.Optional(
			Type.String({
				description:
					"Present-continuous form of content (e.g. 'Building X…' for content 'Build X'). Shown in the header while the task is in_progress.",
			}),
		),
		id: Type.Optional(Type.String({ description: "Required for action=update/complete/remove" })),
		status: Type.Optional(TodoStatusSchema),
		priority: Type.Optional(TodoPrioritySchema),
	},
	{
		description: "Track session-scoped todos. Shape of params depends on action field.",
	},
);
