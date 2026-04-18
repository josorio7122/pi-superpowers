import { spawn } from "node:child_process";
import { describe, expect, it } from "vitest";
import { packageRoot } from "../common/paths.js";

const PI_BIN = process.env.PI_BIN;
// Opt-in: set E2E_BOOTSTRAP=1 AND PI_BIN to run this slow, model-dependent check.
// Normal test runs skip it — the injection logic is covered by inject.test.ts unit tests.
const ENABLED = process.env.E2E_BOOTSTRAP === "1" && !!PI_BIN;
const describeIfPi = ENABLED ? describe : describe.skip;

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

describeIfPi("bootstrap inject e2e", () => {
	it("first-turn response mentions pi tool mapping (TodoWrite -> superpowers_todo)", async () => {
		const output = await runPi({
			args: ["--mode", "json", "-p", "--no-session", "-e", "./src/index.ts"],
			prompt: "Tell me the pi equivalent of the Claude Code TodoWrite tool. Answer in one short line.",
			timeoutMs: 60_000,
		});
		expect(output.toLowerCase()).toContain("superpowers_todo");
	}, 90_000);
});
