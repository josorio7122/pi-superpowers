import { readFileSafe } from "../common/fs.js";
import { writeMarker } from "../common/markers.js";
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

function alreadyInjected(entries: unknown[]): boolean {
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

		await writeMarker("bootstrap-inject", {});

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
