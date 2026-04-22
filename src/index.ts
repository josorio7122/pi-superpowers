// Thin pi extension entrypoint. Consumes pi-tasks + pi-agents raw.

import { createAgentTool } from "pi-agents";
import { createTasksTool } from "pi-tasks";
import { buildInjectHandler } from "./bootstrap/inject.js";
import { buildCommandHandler } from "./commands/handler.js";
import { loadCommands } from "./commands/loader.js";
import { vendorRoot } from "./common/paths.js";
import { resolveSessionDir } from "./common/session-dir.js";
import { buildResourcesDiscoverHandler } from "./skills/discover.js";
import { buildAllAgentConfigs } from "./subagents/build-all-configs.js";
import { loadAgents } from "./subagents/loader.js";
import { clearSuperpowersStatus, setSuperpowersStatus } from "./ui/status.js";

type ExtensionAPI = {
  on: (event: string, handler: (...args: unknown[]) => unknown) => void;
  registerTool: (tool: unknown) => void;
  registerCommand: (name: string, spec: unknown) => void;
};

export default async function superpowersExtension(pi: ExtensionAPI): Promise<void> {
  const { agents } = await loadAgents();

  const inject = buildInjectHandler({
    subagentAvailable: true,
    availableAgents: agents.map((a) => a.name),
  });
  const discover = buildResourcesDiscoverHandler();

  pi.on("before_agent_start", inject as never);
  pi.on("resources_discover", discover as never);

  const commands = await loadCommands(vendorRoot());
  for (const cmd of commands) {
    pi.registerCommand(cmd.name, {
      description: cmd.description,
      handler: buildCommandHandler(cmd) as unknown as (args: string, ctx: unknown) => Promise<void>,
    });
  }

  pi.on("session_start", (async (_event: unknown, ctx: unknown) => {
    setSuperpowersStatus(ctx as never, { text: "Superpowers · 14 skills · tasks + agents" });
    setTimeout(() => {
      clearSuperpowersStatus(ctx as never);
    }, 3000);
  }) as never);

  // Register pi-tasks' `task` tool RAW with superpowers brand.
  pi.registerTool(createTasksTool({ brand: "🦸" }));

  // Register pi-agents' `agent` tool RAW once sessionDir is known.
  pi.on("session_start", (async (_event: unknown, ctx: unknown) => {
    const anyCtx = ctx as {
      cwd: string;
      sessionManager: { getSessionDir: () => string };
      modelRegistry: unknown;
    };
    const rawSessionDir = anyCtx.sessionManager.getSessionDir();
    const sessionDir = await resolveSessionDir(rawSessionDir);
    if (rawSessionDir === "") {
      console.error(`[superpowers] --no-session detected; using ephemeral dir: ${sessionDir}`);
    }
    const { configs, diagnostics } = await buildAllAgentConfigs({ agents, sessionDir });
    for (const d of diagnostics) {
      console.error(`[superpowers] agent validation ${d.level}: ${d.filePath}: ${d.message}`);
    }
    pi.registerTool(
      createAgentTool({
        agents: configs,
        modelRegistry: anyCtx.modelRegistry as never,
        cwd: anyCtx.cwd,
        sessionDir,
      }),
    );
  }) as never);
}
