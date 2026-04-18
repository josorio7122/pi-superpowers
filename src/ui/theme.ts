import { Chalk } from "chalk";
import { ASCII_FALLBACK, ICONS } from "./icons.js";

const coloredChalk = new Chalk({ level: 3 });

export type Theme = {
	primary: (s: string) => string;
	accent: (s: string) => string;
	success: (s: string) => string;
	warn: (s: string) => string;
	error: (s: string) => string;
	dim: (s: string) => string;
	icon: (key: keyof typeof ICONS) => string;
	color: boolean;
};

export type ThemeOptions = {
	color: boolean;
};

const identity = (s: string): string => s;

export function createTheme(opts: ThemeOptions): Theme {
	const c = opts.color;
	return {
		primary: c ? (s: string) => coloredChalk.hex("#f5a623")(s) : identity,
		accent: c ? (s: string) => coloredChalk.cyan(s) : identity,
		success: c ? (s: string) => coloredChalk.green(s) : identity,
		warn: c ? (s: string) => coloredChalk.yellow(s) : identity,
		error: c ? (s: string) => coloredChalk.red(s) : identity,
		dim: c ? (s: string) => coloredChalk.dim(s) : identity,
		icon: (key) => (c ? ICONS[key] : ASCII_FALLBACK[key]),
		color: c,
	};
}
