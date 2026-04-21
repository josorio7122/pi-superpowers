import { describe, expect, it, vi } from "vitest";
import { buildCommandHandler } from "./handler.js";

function makeCtx() {
  return {
    ui: {
      setEditorText: vi.fn(),
      notify: vi.fn(),
    },
  };
}

describe("buildCommandHandler", () => {
  it("sets editor text to the command body", async () => {
    const handler = buildCommandHandler({
      name: "brainstorm",
      description: "x",
      body: "Tell the user to use /skill:brainstorming.",
    });
    const ctx = makeCtx();
    await handler("", ctx);
    expect(ctx.ui.setEditorText).toHaveBeenCalledWith("Tell the user to use /skill:brainstorming.");
    expect(ctx.ui.notify).not.toHaveBeenCalled();
  });

  it("notifies when the command has an empty body", async () => {
    const handler = buildCommandHandler({ name: "bare", description: "x", body: "" });
    const ctx = makeCtx();
    await handler("", ctx);
    expect(ctx.ui.setEditorText).not.toHaveBeenCalled();
    expect(ctx.ui.notify).toHaveBeenCalledWith(expect.stringContaining("/bare"), "info");
  });
});
