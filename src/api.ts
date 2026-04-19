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

export type { PanelProps } from "./ui/box.js";
export { panel } from "./ui/box.js";
export type { ProgressBarProps, SpinnerProps } from "./ui/progress.js";
export { progressBar, spinnerFrame } from "./ui/progress.js";
export type { StatusCallProps } from "./ui/status.js";
export { clearSuperpowersStatus, setSuperpowersStatus } from "./ui/status.js";
export type { Theme, ThemeOptions } from "./ui/theme.js";
export { createTheme } from "./ui/theme.js";
export { truncateEnd, truncateMiddle, visibleLength, wrapLines } from "./ui/truncate.js";
export type { WidgetCallProps, WidgetName } from "./ui/widget.js";
export { clearWidget, setWidget } from "./ui/widget.js";
// biome-ignore-end lint/performance/noBarrelFile: api.ts is the designated public surface, mirrors pi-agents convention
