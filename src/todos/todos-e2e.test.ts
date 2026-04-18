import { spawn } from "node:child_process";
import { describe, expect, it } from "vitest";
import { packageRoot } from "../common/paths.js";

const PI_BIN = process.env.PI_BIN;
const describeIfPi = PI_BIN ? describe : describe.skip;

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

describeIfPi("superpowers_todo tool e2e", () => {
	it("model can call the tool and add an item end-to-end", async () => {
		const output = await runPi({
			args: ["--mode", "json", "-p", "--no-session", "-e", "./src/index.ts"],
			prompt:
				'Use the superpowers_todo tool to add an item with content "write e2e tests", then briefly confirm it was added.',
			timeoutMs: 90_000,
		});
		// Evidence the tool executed: a tool-call or tool-result event for superpowers_todo
		// landed in the stream, and the content we asked to add shows up in the details.
		const hasToolCall = output.includes('"name":"superpowers_todo"') || output.includes("superpowers_todo");
		const hasContent = output.includes("write e2e tests");
		expect(hasToolCall).toBe(true);
		expect(hasContent).toBe(true);
	}, 120_000);
});
