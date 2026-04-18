import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// This module lives at <root>/src/common/paths.ts — climb two dirs up.
const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "..", "..");

export function packageRoot(): string {
	return ROOT;
}

export function vendorRoot(): string {
	return resolve(ROOT, "vendor", "superpowers");
}

export function vendorSkillsDir(): string {
	return resolve(vendorRoot(), "skills");
}

export function vendorAgentsDir(): string {
	return resolve(vendorRoot(), "agents");
}

export function vendorUsingSuperpowersSkill(): string {
	return resolve(vendorSkillsDir(), "using-superpowers", "SKILL.md");
}

export function vendorCommandsDir(): string {
	return resolve(vendorRoot(), "commands");
}
