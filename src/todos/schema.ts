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
});
export type TodoItem = Static<typeof TodoItemSchema>;

export const TodoActionSchema = Type.Union([
	Type.Object({ action: Type.Literal("list") }),
	Type.Object({ action: Type.Literal("clear") }),
	Type.Object({ action: Type.Literal("replace"), items: Type.Array(TodoItemSchema) }),
	Type.Object({
		action: Type.Literal("add"),
		content: Type.String({ minLength: 1 }),
		priority: Type.Optional(TodoPrioritySchema),
	}),
	Type.Object({
		action: Type.Literal("update"),
		id: Type.String({ minLength: 1 }),
		content: Type.Optional(Type.String({ minLength: 1 })),
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
