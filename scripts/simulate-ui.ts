/**
 * Simulates pi-superpowers TUI rendering with ANSI colors and streaming updates.
 * Usage: npx tsx scripts/simulate-ui.ts
 *
 * Note: the task widget lives in pi-tasks (v0.2+). Run `npm run simulate` from
 * the pi-tasks repo to see the four-tool widget evolution. This harness is
 * retained for pi-superpowers-only panel simulations as they get added.
 */
import { clearAndPrint, sleep, theme as bannerTheme } from "./simulate-helpers.js";
import { createTheme } from "../src/ui/theme.js";

const _theme = createTheme({ color: true });

function banner(text: string): void {
	console.log(bannerTheme.fg("accent", `\n━━━ ${text} ━━━\n`));
}

async function main() {
	banner("pi-superpowers TUI simulator");
	console.log(
		"Task widget rendering is owned by pi-tasks (v0.2+ four-tool flow).\n" +
			"Run `npm run simulate` in the pi-tasks repo to preview it.\n" +
			"Add pi-superpowers-only panel simulations here as needed.",
	);
	await sleep(500);
	console.log("\n");
}

void main();
