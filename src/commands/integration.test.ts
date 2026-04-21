import { describe, expect, it, vi } from "vitest";
import { vendorRoot } from "../common/paths.js";
import { buildCommandHandler } from "./handler.js";
import { loadCommands } from "./loader.js";

describe("commands integration", () => {
  it("loads the three upstream deprecated commands", async () => {
    const commands = await loadCommands(vendorRoot());
    const names = commands.map((c) => c.name).sort();
    expect(names).toEqual(["brainstorm", "execute-plan", "write-plan"]);
  });

  it("each upstream command handler pre-fills the editor", async () => {
    const commands = await loadCommands(vendorRoot());
    for (const cmd of commands) {
      const handler = buildCommandHandler(cmd);
      const ctx = { ui: { setEditorText: vi.fn(), notify: vi.fn() } };
      await handler("", ctx);
      expect(ctx.ui.setEditorText).toHaveBeenCalledTimes(1);
      const firstCall = ctx.ui.setEditorText.mock.calls[0];
      const [text] = firstCall ?? [];
      expect(text).toMatch(/skill/i);
    }
  });
});
