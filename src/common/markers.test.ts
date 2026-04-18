import { mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { writeMarker } from "./markers.js";

describe("writeMarker", () => {
	beforeEach(() => {
		delete process.env.SUPERPOWERS_MARKER_DIR;
	});

	it("no-ops when SUPERPOWERS_MARKER_DIR is unset", async () => {
		await writeMarker("no-op", { foo: 1 });
	});

	it("writes a json-payload file under the marker dir", async () => {
		const dir = await mkdtemp(join(tmpdir(), "pisup-mk-"));
		process.env.SUPERPOWERS_MARKER_DIR = dir;
		await writeMarker("bootstrap-inject", { ts: 42 });
		const files = await readdir(dir);
		const match = files.find((f) => f.startsWith("bootstrap-inject"));
		expect(match).toBeDefined();
		if (match) {
			const payload = JSON.parse(await readFile(join(dir, match), "utf8"));
			expect(payload.name).toBe("bootstrap-inject");
			expect(payload.payload).toEqual({ ts: 42 });
			expect(typeof payload.ts).toBe("number");
		}
	});

	it("accumulates multiple calls into distinct files", async () => {
		const dir = await mkdtemp(join(tmpdir(), "pisup-mk-"));
		process.env.SUPERPOWERS_MARKER_DIR = dir;
		await writeMarker("a", {});
		await writeMarker("a", {});
		await writeMarker("b", {});
		const files = await readdir(dir);
		expect(files.filter((f) => f.startsWith("a-")).length).toBe(2);
		expect(files.filter((f) => f.startsWith("b-")).length).toBe(1);
	});
});
