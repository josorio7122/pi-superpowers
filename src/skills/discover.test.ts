import { describe, expect, it } from "vitest";
import { vendorSkillsDir } from "../common/paths.js";
import { buildResourcesDiscoverHandler } from "./discover.js";

describe("buildResourcesDiscoverHandler", () => {
  it("returns a handler that contributes the vendored skills path", async () => {
    const handler = buildResourcesDiscoverHandler();
    const result = await handler({ cwd: "/tmp", reason: "startup" }, {});
    expect(result.skillPaths).toContain(vendorSkillsDir());
  });

  it("returns empty skillPaths when vendor dir is missing", async () => {
    const handler = buildResourcesDiscoverHandler({ skillsDir: "/nonexistent/path/xyz" });
    const result = await handler({ cwd: "/tmp", reason: "startup" }, {});
    expect(result.skillPaths ?? []).toEqual([]);
  });
});
