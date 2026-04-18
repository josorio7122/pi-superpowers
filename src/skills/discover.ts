import { fileExists } from "../common/fs.js";
import { vendorSkillsDir } from "../common/paths.js";

export type DiscoverOptions = {
	skillsDir?: string;
};

export type DiscoverHandler = (
	event: { cwd: string; reason: string },
	ctx: unknown,
) => Promise<{ skillPaths?: string[] }>;

export function buildResourcesDiscoverHandler(opts: DiscoverOptions = {}): DiscoverHandler {
	const dir = opts.skillsDir ?? vendorSkillsDir();
	return async () => {
		if (!(await fileExists(dir))) return {};
		return { skillPaths: [dir] };
	};
}
