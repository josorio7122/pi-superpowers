// Semantic icon tokens. Every entry has an ASCII fallback.

export const ICONS = {
	brand: "🦸",
	todo: "📝",
	bullet: "●",
	branch: "⎿",
	pending: "☐",
	inProgress: "◐",
	done: "☒",
	ok: "✓",
	err: "✗",
} as const;

export const ASCII_FALLBACK: Record<keyof typeof ICONS, string> = {
	brand: "[SP]",
	todo: "[TODO]",
	bullet: "*",
	branch: "-",
	pending: "[ ]",
	inProgress: "[*]",
	done: "[x]",
	ok: "OK",
	err: "X",
};

export const SPINNER_FRAMES = ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"] as const;
export const SPINNER_ASCII = ["|", "/", "-", "\\"] as const;
