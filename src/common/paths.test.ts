import { describe, expect, it } from "vitest";
import {
	packageRoot,
	vendorAgentsDir,
	vendorCommandsDir,
	vendorRoot,
	vendorSkillsDir,
	vendorUsingSuperpowersSkill,
} from "./paths.js";

describe("packageRoot", () => {
	it("resolves to an absolute directory containing package.json", () => {
		const root = packageRoot();
		expect(root.startsWith("/")).toBe(true);
		expect(root.endsWith("/pi-superpowers")).toBe(true);
	});
});

describe("vendor helpers", () => {
	it("vendorSkillsDir ends with vendor/superpowers/skills", () => {
		expect(vendorSkillsDir().endsWith("/vendor/superpowers/skills")).toBe(true);
	});

	it("vendorAgentsDir ends with vendor/superpowers/agents", () => {
		expect(vendorAgentsDir().endsWith("/vendor/superpowers/agents")).toBe(true);
	});

	it("vendorUsingSuperpowersSkill points at SKILL.md", () => {
		expect(vendorUsingSuperpowersSkill().endsWith("/vendor/superpowers/skills/using-superpowers/SKILL.md")).toBe(true);
	});
});

describe("vendorCommandsDir", () => {
	it("resolves to <vendorRoot>/commands", () => {
		expect(vendorCommandsDir()).toBe(`${vendorRoot()}/commands`);
	});
});
