import type { CommandDescriptor } from "./loader.js";

export type CommandCtx = {
	ui: {
		setEditorText: (text: string) => void;
		notify: (message: string, level?: string) => void;
	};
};

export type CommandHandler = (args: string, ctx: CommandCtx) => Promise<void>;

export function buildCommandHandler(cmd: CommandDescriptor): CommandHandler {
	return async (_args, ctx) => {
		if (!cmd.body) {
			ctx.ui.notify(`/${cmd.name}: upstream command has no body`, "info");
			return;
		}
		ctx.ui.setEditorText(cmd.body);
	};
}
