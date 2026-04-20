import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Resolves a usable session-scoped directory. When pi runs with `--no-session`
// (or any caller uses `SessionManager.inMemory()`), `getSessionDir()` returns
// the empty string. That flows into path construction and produces either an
// absolute `/superpowers/...` (crash when the process can't write to fs root)
// or a relative `superpowers/...` under cwd (silent cwd pollution). Neither is
// acceptable — fall back to a freshly created tmpdir so downstream consumers
// always see a valid absolute path.
export async function resolveSessionDir(sessionDir: string): Promise<string> {
	if (sessionDir !== "") return sessionDir;
	return mkdtemp(join(tmpdir(), "pi-superpowers-ephemeral-"));
}
