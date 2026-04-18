import { spawn } from "node:child_process";
import { describe, expect, it } from "vitest";
import { packageRoot } from "../common/paths.js";

const PI_BIN = process.env.PI_BIN;
const ENABLED = process.env.E2E_SUBAGENTS === "1" && !!PI_BIN;
const describeIfEnabled = ENABLED ? describe : describe.skip;

type RunPiProps = {
	args: string[];
	prompt: string;
	timeoutMs: number;
};

function runPi(props: RunPiProps): Promise<string> {
	const { args, prompt, timeoutMs } = props;
	return new Promise((resolve, reject) => {
		if (!PI_BIN) {
			reject(new Error("PI_BIN not set"));
			return;
		}
		const proc = spawn(PI_BIN, args, { cwd: packageRoot() });
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
			if (code === 0) resolve(out);
			else reject(new Error(`pi exited with code ${code}\nstderr: ${err}`));
		});
	});
}

describeIfEnabled("superpowers_subagent e2e", () => {
	it("dispatches code-reviewer via a user-prompted tool call", async () => {
		const output = await runPi({
			args: ["--mode", "json", "-p", "--no-session", "-e", "./src/index.ts"],
			prompt:
				'Use the superpowers_subagent tool with input { agent: "code-reviewer", task: "Say the single word: ok" }. Then print what it returned.',
			timeoutMs: 90_000,
		});
		expect(output.toLowerCase()).toContain("code-reviewer");
	}, 120_000);
});
