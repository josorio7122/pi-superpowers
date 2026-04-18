import { Value } from "@sinclair/typebox/value";
import { TodoDetailsSchema, type TodoItem } from "./schema.js";

/**
 * Accepts both pi's real SessionMessageEntry shape and a flat legacy shape.
 *
 * Real pi shape (verified from pi-coding-agent SessionMessageEntry + pi-ai ToolResultMessage):
 *   { type: "message", message: { role: "toolResult", toolName, details, ... } }
 *
 * Legacy flat shape (kept for backward compat — some tests use this):
 *   { tool, details }
 */
export type SessionEntryLike = {
	type?: string;
	message?: { role?: string; toolName?: string; details?: unknown };
	tool?: string;
	details?: unknown;
};

function entryToolName(entry: SessionEntryLike): string | undefined {
	if (entry.message?.role === "toolResult" && typeof entry.message.toolName === "string") {
		return entry.message.toolName;
	}
	if (entry.tool) return entry.tool;
	return undefined;
}

function entryDetails(entry: SessionEntryLike): unknown {
	if (entry.message?.role === "toolResult") return entry.message.details;
	return entry.details;
}

export function reconstructTodos(entries: SessionEntryLike[]): TodoItem[] {
	for (let i = entries.length - 1; i >= 0; i--) {
		const entry = entries[i];
		if (!entry) continue;
		if (entryToolName(entry) !== "superpowers_todo") continue;
		const details = entryDetails(entry);
		if (!Value.Check(TodoDetailsSchema, details)) return [];
		return details.todos;
	}
	return [];
}
