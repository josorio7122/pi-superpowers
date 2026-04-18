import { Value } from "@sinclair/typebox/value";
import { TodoDetailsSchema, type TodoItem } from "./schema.js";

export type SessionEntryLike = {
	tool?: string;
	details?: unknown;
};

export function reconstructTodos(entries: SessionEntryLike[]): TodoItem[] {
	for (let i = entries.length - 1; i >= 0; i--) {
		const entry = entries[i];
		if (!entry || entry.tool !== "superpowers_todo") continue;
		if (!Value.Check(TodoDetailsSchema, entry.details)) return [];
		return entry.details.todos;
	}
	return [];
}
