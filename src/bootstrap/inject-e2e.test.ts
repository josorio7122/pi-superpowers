import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { packageRoot } from "../common/paths.js";

const PI_BIN = process.env.PI_BIN;
const describeIfPi = PI_BIN ? describe : describe.skip;

type RunPiProps = {
	args: string[];
	prompt: string;
	timeoutMs: number;
	env?: Record<string, string>;
};

function runPi(props: RunPiProps): Promise<{ stdout: string; stderr: string }> {
	const { args, prompt, timeoutMs, env } = props;
	return new Promise((resolve, reject) => {
		if (!PI_BIN) {
			reject(new Error("PI_BIN not set"));
			return;
		}
		const proc = spawn(PI_BIN, args, {
			cwd: packageRoot(),
			env: { ...process.env, ...(env ?? {}) },
		});
		let out = "";
		let err = "";
		proc.stdout.on("data", (d) => {
			out += d.toString();
		});
		proc.stderr.on("data", (d) => {
			err += d.toString();
		});
		const timer = setTimeout(() => {
			proc.kill("SIGTERM");
			reject(new Error(`pi timed out after ${timeoutMs}ms\nstderr: ${err}`));
		}, timeoutMs);
		proc.stdin.write(prompt);
		proc.stdin.end();
		proc.on("close", (code) => {
			clearTimeout(timer);
			if (code === 0) resolve({ stdout: out, stderr: err });
			else reject(new Error(`pi exited with code ${code}\nstderr: ${err}`));
		});
	});
}

describeIfPi("bootstrap inject e2e — verifies injection, not model behavior", () => {
	it("first-turn session writes the superpowers-bootstrap-injected marker file", async () => {
		const dir = await mkdtemp(join(tmpdir(), "pisup-e2e-"));
		const markerFile = join(dir, "marker");
		try {
			await runPi({
				args: ["--mode", "json", "-p", "--no-session", "-e", "./src/index.ts"],
				prompt: "Say exactly the word: ok.",
				timeoutMs: 60_000,
				env: { SUPERPOWERS_MARKER_FILE: markerFile },
			});
			const contents = await readFile(markerFile, "utf8");
			expect(contents).toContain("superpowers-bootstrap-injected");
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	}, 90_000);
});
