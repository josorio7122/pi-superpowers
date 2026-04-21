import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fileExists, readFileSafe } from "./fs.js";

describe("readFileSafe", () => {
  it("returns file contents when file exists", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pisup-fs-"));
    const path = join(dir, "hello.txt");
    await writeFile(path, "hi");
    expect(await readFileSafe(path)).toBe("hi");
  });

  it("returns null when file does not exist", async () => {
    expect(await readFileSafe("/nonexistent/path/xyz.txt")).toBeNull();
  });
});

describe("fileExists", () => {
  it("returns true for existing file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pisup-fs-"));
    const path = join(dir, "x.txt");
    await writeFile(path, "");
    expect(await fileExists(path)).toBe(true);
  });

  it("returns false for missing file", async () => {
    expect(await fileExists("/nope")).toBe(false);
  });
});
