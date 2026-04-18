import { readFileSafe } from "../common/fs.js";
import { vendorUsingSuperpowersSkill } from "../common/paths.js";
import { renderPiAddendum } from "./addendum.js";

export type InjectOptions = {
	usingSkillPath?: string;
	subagentAvailable: boolean;
};

export type InjectEvent = {
	prompt: string;
	images: unknown[];
	systemPrompt: string;
};

export type InjectCtx = {
	sessionManager: { getEntries: () => unknown[] };
	ui: {
		notify: (msg: string, level?: string) => void;
		setStatus: (id: string, text: string) => void;
	};
};

export type InjectResult = {
	message: {
		customType: string;
		content: string;
		display: boolean;
	};
};

export type InjectHandler = (event: InjectEvent, ctx: InjectCtx) => Promise<InjectResult | undefined>;

// Sentinel the E2E test looks for — proves before_agent_start fired and we
// returned a message on the first turn. Emitted on stderr because pi's
// setStatus/setWidget/notify are no-ops in print+JSON mode (per pi docs).
export const BOOTSTRAP_INJECTION_MARKER = "superpowers-bootstrap-injected";

function alreadyInjected(entries: unknown[]): boolean {
	// Look for a prior bootstrap message in session history. Matches on either
	// a stored `customType` field or the sentinel text embedded in `content`.
	for (const entry of entries) {
		if (typeof entry !== "object" || entry === null) continue;
		const asRec = entry as Record<string, unknown>;
		if (asRec.customType === "superpowers-bootstrap") return true;
		const content = asRec.content;
		if (typeof content === "string" && content.includes("You have superpowers")) return true;
	}
	return false;
}

export function buildInjectHandler(opts: InjectOptions): InjectHandler {
	const skillPath = opts.usingSkillPath ?? vendorUsingSuperpowersSkill();
	return async (_event, ctx) => {
		const entries = ctx.sessionManager.getEntries();
		if (alreadyInjected(entries)) return undefined;

		// Observable side-effect for E2E tests only. ctx.ui.setStatus/setWidget/notify
		// are no-ops in --mode json -p AND extension stderr is buffered by pi's process
		// tree. A file write is the only reliable signal. No-op unless the test env var
		// is set, so production pi sessions never touch the filesystem here.
		if (process.env.SUPERPOWERS_MARKER_FILE) {
			try {
				const { writeFile } = await import("node:fs/promises");
				await writeFile(process.env.SUPERPOWERS_MARKER_FILE, `${BOOTSTRAP_INJECTION_MARKER}\n${Date.now()}\n`);
			} catch {
				// Never let logging break injection.
			}
		}

		const skillBody = await readFileSafe(skillPath);
		const addendum = renderPiAddendum({ subagentAvailable: opts.subagentAvailable });

		const skillSection = skillBody
			? skillBody
			: "_Could not load using-superpowers skill; proceeding with addendum only._";

		const content = [
			"<EXTREMELY_IMPORTANT>",
			"You have superpowers.",
			"",
			"**Below is the full content of your 'superpowers:using-superpowers' skill — your introduction to using skills. For all other skills, use pi's `/skill:name` loader.**",
			"",
			skillSection,
			"",
			addendum,
			"</EXTREMELY_IMPORTANT>",
		].join("\n");

		return {
			message: {
				customType: "superpowers-bootstrap",
				content,
				display: false,
			},
		};
	};
}
