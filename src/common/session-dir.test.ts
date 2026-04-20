import { access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { resolveSessionDir } from "./session-dir.js";

describe("resolveSessionDir", () => {
	it("returns the input unchanged when it is a non-empty absolute path", async () => {
		const result = await resolveSessionDir("/some/real/dir");
		expect(result).toBe("/some/real/dir");
	});

	it("returns a tmpdir-backed fallback path when sessionDir is empty", async () => {
		const result = await resolveSessionDir("");
		expect(result.startsWith(tmpdir())).toBe(true);
		expect(result).toContain("pi-superpowers-ephemeral");
		await expect(access(result)).resolves.toBeUndefined();
	});

	it("returns two distinct fallback dirs across two calls with empty input", async () => {
		const a = await resolveSessionDir("");
		const b = await resolveSessionDir("");
		expect(a).not.toBe(b);
	});
});
