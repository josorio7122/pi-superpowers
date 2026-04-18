import type { Theme } from "./theme.js";
import { truncateEnd, visibleLength } from "./truncate.js";

export type PanelProps = {
	title: string;
	icon?: string;
	badge?: string;
	width: number;
	rows: string[];
	theme: Theme;
};

export function divider(width: number, char = "─"): string {
	return char.repeat(Math.max(0, width));
}

export function panel(props: PanelProps): string[] {
	const { title, icon, badge: badgeText, width, rows, theme } = props;
	const innerWidth = Math.max(4, width - 2);

	const titlePrefix = icon ? `${icon} ${title}` : title;
	const titleStr = theme.primary(titlePrefix);
	const badgeStr = badgeText ? ` ${theme.dim(badgeText)} ` : "";
	const titleVisible = visibleLength(titleStr);
	const badgeVisible = visibleLength(badgeStr);

	// Top border: ┌─ title ─…─ badge ─┐
	const dashBudget = innerWidth - titleVisible - badgeVisible - 2;
	const dashes = "─".repeat(Math.max(1, dashBudget));
	const top = `┌─ ${titleStr} ${dashes}${badgeStr}┐`;

	const body = rows.map((r) => {
		const truncated = truncateEnd(r, innerWidth - 2);
		const pad = " ".repeat(Math.max(0, innerWidth - 2 - visibleLength(truncated)));
		return `│ ${truncated}${pad} │`;
	});

	const bottom = `└${"─".repeat(innerWidth)}┘`;
	return [top, ...body, bottom];
}

export type BadgeKind = "success" | "warn" | "error" | "info";

export type BadgeProps = {
	kind: BadgeKind;
	text: string;
	theme: Theme;
};

export function badge(props: BadgeProps): string {
	const { kind, text, theme } = props;
	const paints = {
		success: theme.success,
		warn: theme.warn,
		error: theme.error,
		info: theme.accent,
	} as const;
	return paints[kind](`[${text}]`);
}
