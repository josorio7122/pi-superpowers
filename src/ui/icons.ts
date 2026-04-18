// Semantic icon tokens. Every entry has an ASCII fallback.

export const ICONS = {
	brand: "🦸",
	todo: "📝",
	agent: "🤖",
	bullet: "●",
	branch: "⎿",
	pending: "☐",
	inProgress: "◐",
	done: "☒",
	ok: "✓",
	err: "✗",
	warn: "⚠",
	paused: "⏸",
} as const;

export const ASCII_FALLBACK: Record<keyof typeof ICONS, string> = {
	brand: "[SP]",
	todo: "[TODO]",
	agent: "[AGENT]",
	bullet: "*",
	branch: "-",
	pending: "[ ]",
	inProgress: "[*]",
	done: "[x]",
	ok: "OK",
	err: "X",
	warn: "!",
	paused: "||",
};

export const SPINNER_FRAMES = ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"] as const;
export const SPINNER_ASCII = ["|", "/", "-", "\\"] as const;
