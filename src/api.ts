// Public API for pi-superpowers. Curated surface for consumers.
// Not a barrel — every export is explicit and intentional.

// biome-ignore-start lint/performance/noBarrelFile: api.ts is the designated public surface, mirrors pi-agents convention
export type { AddendumOptions } from "./bootstrap/addendum.js";
export { renderPiAddendum } from "./bootstrap/addendum.js";
export type {
	InjectCtx,
	InjectEvent,
	InjectHandler,
	InjectOptions,
	InjectResult,
} from "./bootstrap/inject.js";
export { buildInjectHandler } from "./bootstrap/inject.js";

export type { MarkerPayload } from "./common/markers.js";
export { writeMarker } from "./common/markers.js";

export type { ClaudeCodeToolName } from "./compat/tool-mapping.js";
export { renderToolMappingMarkdown, TOOL_MAPPING } from "./compat/tool-mapping.js";

export type { DiscoverHandler, DiscoverOptions } from "./skills/discover.js";
export { buildResourcesDiscoverHandler } from "./skills/discover.js";

export type { BuildCtx, PiAgentConfig } from "./subagents/agent-config-builder.js";
export { buildAgentConfig } from "./subagents/agent-config-builder.js";
export type { AgentFrontmatterLike } from "./subagents/frontmatter.js";
export { parseAgentMarkdown } from "./subagents/frontmatter.js";
export type { LoadAgentsOptions, LoadedAgents } from "./subagents/loader.js";
export { findAgent, loadAgents } from "./subagents/loader.js";
export type {
	CallHeaderProps,
	RenderMultiProps,
	RenderSingleProps,
	RunMetrics,
	RunResult,
} from "./subagents/render.js";
export { renderMultiResult, renderSingleResult, renderSubagentCallHeader } from "./subagents/render.js";
export type {
	MakeRunAgentProps,
	PiAgentsRunAgent,
	PiAgentsRunAgentParams,
	PiAgentsRunAgentResult,
	RunAgentFn,
} from "./subagents/run-agent-factory.js";
export { makeRunAgent } from "./subagents/run-agent-factory.js";
export type {
	ChainSubagent,
	ParallelSubagent,
	SingleSubagent,
	SubagentInput,
	SubagentMode,
} from "./subagents/schema.js";
export {
	ChainSubagentSchema,
	detectMode,
	ParallelSubagentSchema,
	SingleSubagentSchema,
	SubagentInputSchema,
} from "./subagents/schema.js";
export type { ExecuteSubagentProps, PiAgentsApi, SubagentToolCtx, SubagentToolResult } from "./subagents/tool.js";
export { executeSubagent } from "./subagents/tool.js";

export type { TodosCommandCtx, TodosCommandHandler } from "./todos/command.js";
export { buildTodosCommandHandler } from "./todos/command.js";
export type { RenderTodosCallHeaderProps, RenderTodosPanelProps } from "./todos/render.js";
export { renderTodosCallHeader, renderTodosPanel } from "./todos/render.js";
export type { TodoAction, TodoDetails, TodoItem, TodoPriority, TodoStatus } from "./todos/schema.js";
export { TodoActionSchema, TodoDetailsSchema, TodoItemSchema } from "./todos/schema.js";
export type { SessionEntryLike } from "./todos/state.js";
export { reconstructTodos } from "./todos/state.js";
export type { TodosToolCtx, TodosToolResult } from "./todos/tool.js";
export { executeTodos } from "./todos/tool.js";
export type { BadgeKind, BadgeProps, PanelProps } from "./ui/box.js";
export { badge, divider, panel } from "./ui/box.js";
export type { CompactTodoProps } from "./ui/compact-todo.js";
export { renderCompactTodo } from "./ui/compact-todo.js";
export type { ProgressBarProps, SpinnerProps } from "./ui/progress.js";
export { progressBar, spinnerFrame } from "./ui/progress.js";
export type { StatusCallProps } from "./ui/status.js";
export { clearSuperpowersStatus, setSuperpowersStatus } from "./ui/status.js";
export type { Theme, ThemeOptions } from "./ui/theme.js";
export { createTheme } from "./ui/theme.js";
export type {
	PickerKeyInput,
	RenderPickerProps,
	TodoPickerKey,
	TodoPickerProps,
	TodoPickerState,
} from "./ui/todo-picker.js";
export { createPickerState, onPickerKey, renderPicker } from "./ui/todo-picker.js";
export type { PiTuiComponent, TodoPickerComponentProps } from "./ui/todo-picker-component.js";
export { mapPiKeyToTodoPickerKey, TodoPickerComponent } from "./ui/todo-picker-component.js";
export { truncateEnd, truncateMiddle, visibleLength, wrapLines } from "./ui/truncate.js";
export type { WidgetCallProps, WidgetName } from "./ui/widget.js";
export { clearWidget, setWidget } from "./ui/widget.js";
// biome-ignore-end lint/performance/noBarrelFile: api.ts is the designated public surface, mirrors pi-agents convention
