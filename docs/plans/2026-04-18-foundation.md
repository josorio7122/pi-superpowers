# pi-superpowers Foundation (M1 + M2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an installable pi package (`pi install git:github.com/josorio7122/pi-superpowers@v5.0.7`) that auto-registers obra/superpowers skills and injects the `using-superpowers` bootstrap on the first turn of every pi session, with a top-tier reusable `ui/` component library ready for downstream features.

**Architecture:** Downstream adapter wrapping a vendored snapshot of `obra/superpowers`. Thin pi extension (`src/index.ts`) registers the vendored `skills/` path via `resources_discover` and injects the full `using-superpowers/SKILL.md` + a compact pi tool-mapping addendum via `before_agent_start` on the first turn only. Pure-function `ui/` library (theme, icons, box, progress, truncate, status, widget) provides consistent, width-responsive, color-off-safe rendering primitives for all features.

**Tech Stack:** TypeScript (ES2022, strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, bundler resolution) · Biome 2.x · Vitest 4.x · `@mariozechner/pi-coding-agent` (peer) · `pi-agents` (peer, via git URL) · `@sinclair/typebox`, `gray-matter`, `chalk`.

**Working directory:** `/Users/josorio/Code/pi-superpowers/`

**Reference spec:** `docs/specs/2026-04-18-pi-superpowers-design.md`

---

## File Structure

Files created or modified in this plan:

| Path | Purpose |
|---|---|
| `.gitignore` | ignore node_modules, dist, vendor staging, OS cruft |
| `package.json` | pi-package manifest; extensions + skills paths; deps |
| `tsconfig.json` | ES2022, strict, bundler resolution |
| `biome.json` | lint + format rules mirroring pi-agents |
| `vitest.config.ts` | vitest 4 config |
| `README.md` | install + usage |
| `scripts/sync-upstream.sh` | snapshot obra/superpowers into `vendor/superpowers/` |
| `vendor/superpowers/**` | read-only snapshot (populated by sync script) |
| `src/index.ts` | thin pi extension entrypoint |
| `src/api.ts` | explicit public surface — not a barrel |
| `src/common/types.ts` | shared TS types used across features |
| `src/common/fs.ts` | async fs wrappers (readFileSafe, etc.) |
| `src/common/fs.test.ts` | unit tests |
| `src/common/paths.ts` | path resolution helpers |
| `src/common/paths.test.ts` | unit tests |
| `src/compat/tool-mapping.ts` | CC → pi tool-name mapping constants + renderer |
| `src/compat/tool-mapping.test.ts` | unit tests |
| `src/ui/theme.ts` | design tokens (colors, glyphs, breakpoints) |
| `src/ui/theme.test.ts` | unit tests |
| `src/ui/icons.ts` | semantic icon constants |
| `src/ui/truncate.ts` | width-aware truncation + wrap |
| `src/ui/truncate.test.ts` | unit tests (ASCII, unicode, ANSI) |
| `src/ui/box.ts` | `panel()`, `divider()`, `badge()` |
| `src/ui/box.test.ts` | unit tests |
| `src/ui/progress.ts` | `progressBar()`, `spinnerFrame()` |
| `src/ui/progress.test.ts` | unit tests |
| `src/ui/status.ts` | `ctx.ui.setStatus` wrapper |
| `src/ui/status.test.ts` | unit tests |
| `src/ui/widget.ts` | `ctx.ui.setWidget` wrapper |
| `src/ui/widget.test.ts` | unit tests |
| `src/skills/discover.ts` | `resources_discover` handler |
| `src/skills/discover.test.ts` | unit tests |
| `src/bootstrap/addendum.ts` | generate pi tool-mapping addendum text |
| `src/bootstrap/addendum.test.ts` | unit tests |
| `src/bootstrap/inject.ts` | `before_agent_start` handler (first-turn gate) |
| `src/bootstrap/inject.test.ts` | unit tests |
| `src/bootstrap/inject-e2e.test.ts` | spawn real pi subprocess, assert bootstrap present |

Total: ~35 source/test files.

---

## Task 1: Initialize repository and gitignore

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/.gitignore`

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/josorio/Code/pi-superpowers
git init
```

Expected: `Initialized empty Git repository in …/pi-superpowers/.git/`

- [ ] **Step 2: Write `.gitignore`**

```
node_modules/
dist/
*.log
.DS_Store
vendor/superpowers.staging/
coverage/
.vitest-cache/
```

- [ ] **Step 3: Stage existing design docs + gitignore**

```bash
git add .gitignore docs/
git status
```

Expected: `.gitignore` and `docs/specs/*.md`, `docs/plans/*.md`, plus any existing top-level design docs (`IMPLEMENTATION-DESIGN.md`, `PI-AGENTS-INTEGRATION.md`) all staged.

- [ ] **Step 4: Commit initial state**

```bash
git add IMPLEMENTATION-DESIGN.md PI-AGENTS-INTEGRATION.md
git commit -m "chore: initialize pi-superpowers repo with spec + plan"
```

---

## Task 2: Create `package.json`

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/package.json`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "pi-superpowers",
  "version": "5.0.7",
  "description": "Superpowers for pi — TDD, debugging, collaboration patterns, and proven techniques",
  "keywords": ["pi-package", "superpowers", "skills", "tdd", "debugging"],
  "license": "MIT",
  "author": "josorio7122",
  "repository": "github:josorio7122/pi-superpowers",
  "type": "module",
  "pi": {
    "extensions": ["./src/index.ts"],
    "skills": ["./vendor/superpowers/skills"]
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "vitest run --dir src --testNamePattern='e2e'",
    "typecheck": "tsc --noEmit",
    "lint": "biome check src/",
    "lint:fix": "biome check --fix src/",
    "format": "biome format --write src/",
    "check": "npm run lint && npm run typecheck && npm run test",
    "sync-upstream": "bash scripts/sync-upstream.sh"
  },
  "peerDependencies": {
    "@mariozechner/pi-coding-agent": "*",
    "pi-agents": "github:josorio7122/pi-agents"
  },
  "dependencies": {
    "@sinclair/typebox": "^0.34.0",
    "chalk": "^5.5.0",
    "gray-matter": "^4.0.3"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.4.10",
    "@types/node": "^25.5.0",
    "typescript": "^6.0.2",
    "vitest": "^4.1.2"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add package.json with pi-package manifest"
```

---

## Task 3: Create `tsconfig.json`

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/tsconfig.json`

- [ ] **Step 1: Write `tsconfig.json` mirroring pi-agents**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 2: Commit**

```bash
git add tsconfig.json
git commit -m "chore: add tsconfig.json (ES2022, strict, bundler resolution)"
```

---

## Task 4: Create `biome.json`

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/biome.json`

- [ ] **Step 1: Write `biome.json` mirroring pi-agents rules**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.9/schema.json",
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "recommended": false,
        "noNestedTernary": "error",
        "noNonNullAssertion": "error",
        "useImportType": "error",
        "useFilenamingConvention": {
          "level": "error",
          "options": { "filenameCases": ["kebab-case"] }
        }
      },
      "performance": {
        "noBarrelFile": "error",
        "noNamespaceImport": "error"
      },
      "complexity": {
        "useMaxParams": {
          "level": "error",
          "options": { "max": 2 }
        }
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 120
  },
  "files": {
    "includes": ["src/**/*.ts"]
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add biome.json
git commit -m "chore: add biome.json mirroring pi-agents conventions"
```

---

## Task 5: Create `vitest.config.ts`

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/vitest.config.ts`

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: true,
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: add vitest config"
```

---

## Task 6: Install dependencies and verify toolchain

**Files:** *(none changed — npm creates `node_modules/` and `package-lock.json`)*

- [ ] **Step 1: Run `npm install`**

```bash
cd /Users/josorio/Code/pi-superpowers
npm install
```

Expected: installs `@biomejs/biome`, `typescript`, `vitest`, `@types/node`, `@sinclair/typebox`, `chalk`, `gray-matter`, plus peer deps if resolvable. `package-lock.json` created.

- [ ] **Step 2: Confirm `npm run check` passes on empty source tree**

```bash
mkdir -p src
npm run check
```

Expected: `lint` passes with no files, `typecheck` passes, `test` reports "No test files found, exiting with code 0" (vitest `passWithNoTests`).

- [ ] **Step 3: Commit lockfile**

```bash
git add package-lock.json
git commit -m "chore: install deps, lock toolchain versions"
```

---

## Task 7: Write `scripts/sync-upstream.sh`

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/scripts/sync-upstream.sh`

- [ ] **Step 1: Write the sync script**

```bash
#!/usr/bin/env bash
#
# sync-upstream.sh — snapshot obra/superpowers into vendor/superpowers/
#
# Usage:
#   scripts/sync-upstream.sh v5.0.7          # tag
#   scripts/sync-upstream.sh main             # branch (for dev only)
#
# Refuses to run with uncommitted changes unless FORCE=1.

set -euo pipefail

UPSTREAM="https://github.com/obra/superpowers.git"
REF="${1:-}"
if [[ -z "$REF" ]]; then
  echo "error: ref required (e.g. v5.0.7 or main)" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGING="$REPO_ROOT/vendor/superpowers.staging"
FINAL="$REPO_ROOT/vendor/superpowers"

# Refuse to clobber uncommitted work
if [[ "${FORCE:-}" != "1" ]]; then
  if ! git -C "$REPO_ROOT" diff-index --quiet HEAD --; then
    echo "error: uncommitted changes in repo; commit or set FORCE=1" >&2
    exit 1
  fi
fi

# Fresh staging
rm -rf "$STAGING"
mkdir -p "$STAGING"

# Shallow clone at ref
git clone --depth 1 --branch "$REF" "$UPSTREAM" "$STAGING/clone"

# Rsync into staging root, excluding host-specific and infra dirs
rsync -a \
  --exclude='.git' \
  --exclude='.github' \
  --exclude='.claude' \
  --exclude='.claude-plugin' \
  --exclude='.cursor-plugin' \
  --exclude='.codex' \
  --exclude='.opencode' \
  --exclude='node_modules' \
  --exclude='.DS_Store' \
  "$STAGING/clone/" "$STAGING/content/"

# Atomic swap: remove old vendor, move staging into place
rm -rf "$FINAL"
mv "$STAGING/content" "$FINAL"
rm -rf "$STAGING"

# Stamp the synced version
VERSION="${REF#v}"
if [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]]; then
  echo "$REF" > "$FINAL/.synced-ref"
  # Bump package.json version only on tagged syncs
  node -e "const p=require('$REPO_ROOT/package.json'); p.version='$VERSION'; require('fs').writeFileSync('$REPO_ROOT/package.json', JSON.stringify(p, null, 2) + '\n');"
  echo "✓ Synced obra/superpowers@$REF to vendor/superpowers/"
  echo "✓ Bumped package.json version to $VERSION"
else
  echo "$REF" > "$FINAL/.synced-ref"
  echo "✓ Synced obra/superpowers@$REF (dev ref, package.json version not bumped)"
fi

echo ""
echo "Next steps:"
echo "  git diff vendor/superpowers/ package.json | head -80"
echo "  npm run check"
echo "  git add -A && git commit -m \"Sync superpowers to $REF\""
```

- [ ] **Step 2: Make script executable**

```bash
chmod +x scripts/sync-upstream.sh
```

- [ ] **Step 3: Commit script**

```bash
git add scripts/sync-upstream.sh
git commit -m "feat: add sync-upstream.sh for vendoring obra/superpowers"
```

---

## Task 8: Run sync script to populate `vendor/superpowers/`

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/vendor/superpowers/` (populated by script)

- [ ] **Step 1: Run the sync script at v5.0.7**

```bash
cd /Users/josorio/Code/pi-superpowers
./scripts/sync-upstream.sh v5.0.7
```

Expected: `✓ Synced obra/superpowers@v5.0.7 to vendor/superpowers/` and `✓ Bumped package.json version to 5.0.7`.

- [ ] **Step 2: Verify vendor contents**

```bash
ls vendor/superpowers/skills | head
cat vendor/superpowers/.synced-ref
```

Expected: 15 skill dirs including `using-superpowers`, `brainstorming`, etc. `.synced-ref` contains `v5.0.7`.

- [ ] **Step 3: Commit the initial sync**

```bash
git add vendor/superpowers/ package.json
git commit -m "feat: sync superpowers to v5.0.7"
```

---

## Task 9: Create `src/common/types.ts`

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/src/common/types.ts`

- [ ] **Step 1: Write shared types**

```ts
// Shared types used across pi-superpowers features.
// Boundary-validated types live in their feature's schema.ts.

export type SuperpowersExtensionState = {
  bootstrapInjected: boolean;
  subagentAvailable: boolean;
};

export type DegradationReason =
  | "vendor-missing"
  | "pi-agents-missing"
  | "skill-read-failed"
  | "agent-parse-failed";
```

- [ ] **Step 2: Run lint + typecheck**

```bash
npm run lint && npm run typecheck
```

Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/common/types.ts
git commit -m "feat(common): add shared types"
```

---

## Task 10: Create `src/common/fs.ts` with tests

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/src/common/fs.ts`
- Test: `/Users/josorio/Code/pi-superpowers/src/common/fs.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/common/fs.test.ts
import { describe, it, expect } from "vitest";
import { readFileSafe, fileExists } from "./fs.js";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("readFileSafe", () => {
  it("returns file contents when file exists", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pisup-fs-"));
    const path = join(dir, "hello.txt");
    await writeFile(path, "hi");
    expect(await readFileSafe(path)).toBe("hi");
  });

  it("returns null when file does not exist", async () => {
    expect(await readFileSafe("/nonexistent/path/xyz.txt")).toBeNull();
  });
});

describe("fileExists", () => {
  it("returns true for existing file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pisup-fs-"));
    const path = join(dir, "x.txt");
    await writeFile(path, "");
    expect(await fileExists(path)).toBe(true);
  });

  it("returns false for missing file", async () => {
    expect(await fileExists("/nope")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

```bash
npm run test -- src/common/fs.test.ts
```

Expected: FAIL with "Cannot find module './fs.js'".

- [ ] **Step 3: Write implementation**

```ts
// src/common/fs.ts
import { readFile, stat } from "node:fs/promises";

export async function readFileSafe(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run test, expect PASS**

```bash
npm run test -- src/common/fs.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Run full check**

```bash
npm run check
```

Expected: lint, typecheck, and test all pass.

- [ ] **Step 6: Commit**

```bash
git add src/common/fs.ts src/common/fs.test.ts
git commit -m "feat(common): add readFileSafe and fileExists with tests"
```

---

## Task 11: Create `src/common/paths.ts` with tests

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/src/common/paths.ts`
- Test: `/Users/josorio/Code/pi-superpowers/src/common/paths.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/common/paths.test.ts
import { describe, it, expect } from "vitest";
import { packageRoot, vendorSkillsDir, vendorAgentsDir, vendorUsingSuperpowersSkill } from "./paths.js";

describe("packageRoot", () => {
  it("resolves to an absolute directory containing package.json", async () => {
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
```

- [ ] **Step 2: Run test, expect FAIL**

```bash
npm run test -- src/common/paths.test.ts
```

- [ ] **Step 3: Write implementation**

```ts
// src/common/paths.ts
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

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
```

- [ ] **Step 4: Run test, expect PASS**

```bash
npm run test -- src/common/paths.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/common/paths.ts src/common/paths.test.ts
git commit -m "feat(common): add path helpers for vendor layout"
```

---

## Task 12: Create `src/compat/tool-mapping.ts` with tests

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/src/compat/tool-mapping.ts`
- Test: `/Users/josorio/Code/pi-superpowers/src/compat/tool-mapping.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/compat/tool-mapping.test.ts
import { describe, it, expect } from "vitest";
import { TOOL_MAPPING, renderToolMappingMarkdown } from "./tool-mapping.js";

describe("TOOL_MAPPING", () => {
  it("maps every critical CC tool to a pi equivalent", () => {
    expect(TOOL_MAPPING.Read).toBe("read");
    expect(TOOL_MAPPING.Write).toBe("write");
    expect(TOOL_MAPPING.Edit).toBe("edit");
    expect(TOOL_MAPPING.Bash).toBe("bash");
    expect(TOOL_MAPPING.Grep).toBe("grep");
    expect(TOOL_MAPPING.Glob).toBe("glob");
    expect(TOOL_MAPPING.TodoWrite).toBe("superpowers_todo");
    expect(TOOL_MAPPING.Task).toBe("superpowers_subagent");
    expect(TOOL_MAPPING.Skill).toBe("/skill:name (pi-native)");
  });

  it("has no duplicate pi values except the documented alias", () => {
    const values = Object.values(TOOL_MAPPING);
    const dupes = values.filter((v, i) => values.indexOf(v) !== i);
    expect(dupes).toEqual([]);
  });
});

describe("renderToolMappingMarkdown", () => {
  it("produces a markdown table with all mappings", () => {
    const md = renderToolMappingMarkdown();
    expect(md).toContain("| Claude Code | pi equivalent |");
    expect(md).toContain("| `Read` | `read` |");
    expect(md).toContain("| `TodoWrite` | `superpowers_todo` |");
    expect(md).toContain("| `Task` | `superpowers_subagent` |");
  });

  it("includes a note about /skill:name", () => {
    const md = renderToolMappingMarkdown();
    expect(md).toMatch(/\/skill:/);
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

```bash
npm run test -- src/compat/tool-mapping.test.ts
```

- [ ] **Step 3: Write implementation**

```ts
// src/compat/tool-mapping.ts
// Single source of truth for Claude Code → pi tool name mapping.
// Used by bootstrap addendum and (optionally) runtime guards.

export const TOOL_MAPPING = {
  Read: "read",
  Write: "write",
  Edit: "edit",
  Bash: "bash",
  Grep: "grep",
  Glob: "glob",
  TodoWrite: "superpowers_todo",
  Task: "superpowers_subagent",
  Skill: "/skill:name (pi-native)",
} as const;

export type ClaudeCodeToolName = keyof typeof TOOL_MAPPING;

export function renderToolMappingMarkdown(): string {
  const rows = (Object.keys(TOOL_MAPPING) as ClaudeCodeToolName[])
    .map((cc) => `| \`${cc}\` | \`${TOOL_MAPPING[cc]}\` |`)
    .join("\n");
  return [
    "| Claude Code | pi equivalent |",
    "|---|---|",
    rows,
    "",
    "Load any skill on demand with `/skill:name` (e.g. `/skill:brainstorming`).",
  ].join("\n");
}
```

- [ ] **Step 4: Run test, expect PASS**

```bash
npm run test -- src/compat/tool-mapping.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/compat/tool-mapping.ts src/compat/tool-mapping.test.ts
git commit -m "feat(compat): add CC→pi tool name mapping with markdown renderer"
```

---

## Task 13: Create `src/ui/theme.ts` and `src/ui/icons.ts`

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/src/ui/theme.ts`
- Create: `/Users/josorio/Code/pi-superpowers/src/ui/icons.ts`
- Test: `/Users/josorio/Code/pi-superpowers/src/ui/theme.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/ui/theme.test.ts
import { describe, it, expect } from "vitest";
import { createTheme } from "./theme.js";
import { ICONS, ASCII_FALLBACK } from "./icons.js";

describe("createTheme", () => {
  it("returns color-on theme when color is enabled", () => {
    const t = createTheme({ color: true });
    expect(t.primary("x")).not.toBe("x"); // wrapped in ANSI
    expect(t.dim("x")).not.toBe("x");
  });

  it("returns identity functions when color is disabled", () => {
    const t = createTheme({ color: false });
    expect(t.primary("x")).toBe("x");
    expect(t.dim("x")).toBe("x");
    expect(t.success("x")).toBe("x");
  });

  it("resolves icon glyph based on color mode", () => {
    expect(createTheme({ color: true }).icon("brand")).toBe(ICONS.brand);
    expect(createTheme({ color: false }).icon("brand")).toBe(ASCII_FALLBACK.brand);
  });
});

describe("ICONS vs ASCII_FALLBACK", () => {
  it("has an ASCII fallback for every icon", () => {
    for (const key of Object.keys(ICONS) as (keyof typeof ICONS)[]) {
      expect(ASCII_FALLBACK[key]).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

```bash
npm run test -- src/ui/theme.test.ts
```

- [ ] **Step 3: Write `src/ui/icons.ts`**

```ts
// src/ui/icons.ts
// Semantic icon tokens. Every entry MUST have an ASCII fallback.

export const ICONS = {
  brand: "🦸",
  todo: "📝",
  agent: "🤖",
  pending: "[ ]",
  inProgress: "[⋯]",
  done: "[✓]",
  ok: "✓",
  err: "✗",
  warn: "⚠",
  paused: "⏸",
} as const;

export const ASCII_FALLBACK: Record<keyof typeof ICONS, string> = {
  brand: "[SP]",
  todo: "[TODO]",
  agent: "[AGENT]",
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
```

- [ ] **Step 4: Write `src/ui/theme.ts`**

```ts
// src/ui/theme.ts
import chalk from "chalk";
import { ICONS, ASCII_FALLBACK } from "./icons.js";

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
    primary: c ? (s: string) => chalk.hex("#f5a623")(s) : identity,
    accent: c ? (s: string) => chalk.cyan(s) : identity,
    success: c ? (s: string) => chalk.green(s) : identity,
    warn: c ? (s: string) => chalk.yellow(s) : identity,
    error: c ? (s: string) => chalk.red(s) : identity,
    dim: c ? (s: string) => chalk.dim(s) : identity,
    icon: (key) => (c ? ICONS[key] : ASCII_FALLBACK[key]),
    color: c,
  };
}
```

- [ ] **Step 5: Run test, expect PASS**

```bash
npm run test -- src/ui/theme.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/ui/theme.ts src/ui/icons.ts src/ui/theme.test.ts
git commit -m "feat(ui): add theme + icons with ASCII fallback"
```

---

## Task 14: Create `src/ui/truncate.ts` with tests

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/src/ui/truncate.ts`
- Test: `/Users/josorio/Code/pi-superpowers/src/ui/truncate.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/ui/truncate.test.ts
import { describe, it, expect } from "vitest";
import { truncateEnd, truncateMiddle, wrapLines, visibleLength } from "./truncate.js";

describe("visibleLength", () => {
  it("ignores ANSI escape codes", () => {
    expect(visibleLength("\u001b[31mhello\u001b[0m")).toBe(5);
  });
  it("counts plain characters", () => {
    expect(visibleLength("hello")).toBe(5);
  });
});

describe("truncateEnd", () => {
  it("returns input unchanged when shorter than width", () => {
    expect(truncateEnd("hi", 10)).toBe("hi");
  });
  it("truncates with ellipsis when longer", () => {
    expect(truncateEnd("abcdefghij", 6)).toBe("abcde…");
  });
  it("handles width <= 1 gracefully", () => {
    expect(truncateEnd("abc", 1)).toBe("…");
    expect(truncateEnd("abc", 0)).toBe("");
  });
});

describe("truncateMiddle", () => {
  it("keeps start and end when long", () => {
    expect(truncateMiddle("abcdefghij", 7)).toBe("abc…hij");
  });
  it("returns input unchanged when short enough", () => {
    expect(truncateMiddle("hi", 10)).toBe("hi");
  });
});

describe("wrapLines", () => {
  it("wraps on word boundaries under width", () => {
    expect(wrapLines("the quick brown fox", 10)).toEqual(["the quick", "brown fox"]);
  });
  it("handles single words longer than width", () => {
    expect(wrapLines("abcdefghij", 4)).toEqual(["abcd", "efgh", "ij"]);
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

```bash
npm run test -- src/ui/truncate.test.ts
```

- [ ] **Step 3: Write implementation**

```ts
// src/ui/truncate.ts
// Width-aware truncation and wrapping. All functions are ANSI-safe.

const ANSI_RE = /\u001b\[[0-9;]*m/g;

export function visibleLength(s: string): number {
  return s.replace(ANSI_RE, "").length;
}

export function truncateEnd(s: string, width: number): string {
  if (width <= 0) return "";
  if (visibleLength(s) <= width) return s;
  if (width === 1) return "…";
  return s.replace(ANSI_RE, "").slice(0, width - 1) + "…";
}

export function truncateMiddle(s: string, width: number): string {
  if (width <= 0) return "";
  const plain = s.replace(ANSI_RE, "");
  if (plain.length <= width) return s;
  if (width < 5) return truncateEnd(s, width);
  const side = Math.floor((width - 1) / 2);
  return `${plain.slice(0, side)}…${plain.slice(-side)}`;
}

export function wrapLines(s: string, width: number): string[] {
  if (width <= 0) return [];
  const words = s.split(/\s+/);
  const out: string[] = [];
  let current = "";
  for (const w of words) {
    if (w.length > width) {
      if (current) { out.push(current); current = ""; }
      for (let i = 0; i < w.length; i += width) {
        const chunk = w.slice(i, i + width);
        if (i + width >= w.length) { current = chunk; } else { out.push(chunk); }
      }
      continue;
    }
    if (!current) { current = w; continue; }
    if (current.length + 1 + w.length <= width) { current += ` ${w}`; }
    else { out.push(current); current = w; }
  }
  if (current) out.push(current);
  return out;
}
```

- [ ] **Step 4: Run test, expect PASS**

```bash
npm run test -- src/ui/truncate.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/truncate.ts src/ui/truncate.test.ts
git commit -m "feat(ui): add ANSI-safe truncate and wrap helpers"
```

---

## Task 15: Create `src/ui/box.ts` with tests

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/src/ui/box.ts`
- Test: `/Users/josorio/Code/pi-superpowers/src/ui/box.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/ui/box.test.ts
import { describe, it, expect } from "vitest";
import { panel, divider, badge } from "./box.js";
import { createTheme } from "./theme.js";

const theme = createTheme({ color: false });

describe("divider", () => {
  it("returns a line of given width", () => {
    expect(divider(5)).toBe("─────");
  });
});

describe("panel", () => {
  it("renders a box with title and body rows", () => {
    const out = panel({
      title: "Todos",
      icon: "[TODO]",
      badge: "2/5",
      width: 40,
      rows: ["[ ] write tests", "[x] commit"],
      theme,
    });
    expect(out[0]).toMatch(/^┌─/);
    expect(out[0]).toContain("[TODO] Todos");
    expect(out[0]).toContain("2/5");
    expect(out).toContainEqual(expect.stringMatching(/^│/));
    expect(out[out.length - 1]).toMatch(/^└─+┘$/);
  });

  it("truncates long body rows to width", () => {
    const out = panel({
      title: "t",
      width: 20,
      rows: ["this is a really long line that exceeds width"],
      theme,
    });
    const bodyLine = out.find((l) => l.includes("this"));
    expect(bodyLine).toBeDefined();
    expect(bodyLine!.length).toBeLessThanOrEqual(20);
  });
});

describe("badge", () => {
  it("renders success badge", () => {
    expect(badge({ kind: "success", text: "OK", theme })).toContain("OK");
  });
  it("renders error badge", () => {
    expect(badge({ kind: "error", text: "FAIL", theme })).toContain("FAIL");
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

```bash
npm run test -- src/ui/box.test.ts
```

- [ ] **Step 3: Write implementation**

```ts
// src/ui/box.ts
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

  // Top border: ┌─ title ────…── badge ─┐
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

export function badge(props: { kind: BadgeKind; text: string; theme: Theme }): string {
  const { kind, text, theme } = props;
  const paint =
    kind === "success" ? theme.success
    : kind === "warn" ? theme.warn
    : kind === "error" ? theme.error
    : theme.accent;
  return paint(`[${text}]`);
}
```

- [ ] **Step 4: Run test, expect PASS**

```bash
npm run test -- src/ui/box.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/box.ts src/ui/box.test.ts
git commit -m "feat(ui): add panel/divider/badge primitives"
```

---

## Task 16: Create `src/ui/progress.ts` with tests

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/src/ui/progress.ts`
- Test: `/Users/josorio/Code/pi-superpowers/src/ui/progress.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/ui/progress.test.ts
import { describe, it, expect } from "vitest";
import { progressBar, spinnerFrame } from "./progress.js";

describe("progressBar", () => {
  it("renders all filled at 100%", () => {
    expect(progressBar({ current: 5, total: 5, width: 5, color: false })).toBe("▰▰▰▰▰");
  });
  it("renders all empty at 0%", () => {
    expect(progressBar({ current: 0, total: 5, width: 5, color: false })).toBe("▱▱▱▱▱");
  });
  it("renders mixed at 60%", () => {
    expect(progressBar({ current: 3, total: 5, width: 5, color: false })).toBe("▰▰▰▱▱");
  });
  it("clamps current to [0, total]", () => {
    expect(progressBar({ current: 10, total: 5, width: 5, color: false })).toBe("▰▰▰▰▰");
    expect(progressBar({ current: -1, total: 5, width: 5, color: false })).toBe("▱▱▱▱▱");
  });
  it("handles total=0 without NaN", () => {
    expect(progressBar({ current: 0, total: 0, width: 5, color: false })).toBe("▱▱▱▱▱");
  });
  it("uses ASCII fallback when color is false and requested", () => {
    expect(progressBar({ current: 3, total: 5, width: 5, color: false, ascii: true })).toBe("###..");
  });
});

describe("spinnerFrame", () => {
  it("cycles through 8 braille frames by tick", () => {
    const f0 = spinnerFrame(0, { color: false });
    const f7 = spinnerFrame(7, { color: false });
    const f8 = spinnerFrame(8, { color: false });
    expect(f0).not.toBe(f7);
    expect(f0).toBe(f8); // wraps
  });
  it("uses ASCII frames when ascii=true", () => {
    expect(spinnerFrame(0, { color: false, ascii: true })).toBe("|");
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

```bash
npm run test -- src/ui/progress.test.ts
```

- [ ] **Step 3: Write implementation**

```ts
// src/ui/progress.ts
import { SPINNER_FRAMES, SPINNER_ASCII } from "./icons.js";

export type ProgressBarProps = {
  current: number;
  total: number;
  width: number;
  color: boolean;
  ascii?: boolean;
};

export function progressBar(props: ProgressBarProps): string {
  const { current, total, width, ascii } = props;
  const safeCurrent = Math.max(0, Math.min(current, Math.max(0, total)));
  const ratio = total > 0 ? safeCurrent / total : 0;
  const filledCount = Math.round(ratio * width);
  const emptyCount = width - filledCount;
  const filled = ascii ? "#" : "▰";
  const empty = ascii ? "." : "▱";
  return filled.repeat(filledCount) + empty.repeat(emptyCount);
}

export type SpinnerProps = {
  color: boolean;
  ascii?: boolean;
};

export function spinnerFrame(tick: number, opts: SpinnerProps): string {
  const frames = opts.ascii ? SPINNER_ASCII : SPINNER_FRAMES;
  const idx = ((tick % frames.length) + frames.length) % frames.length;
  return frames[idx] ?? frames[0] ?? "";
}
```

- [ ] **Step 4: Run test, expect PASS**

```bash
npm run test -- src/ui/progress.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/progress.ts src/ui/progress.test.ts
git commit -m "feat(ui): add progress bar and spinner with ASCII fallback"
```

---

## Task 17: Create `src/ui/status.ts` with tests

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/src/ui/status.ts`
- Test: `/Users/josorio/Code/pi-superpowers/src/ui/status.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/ui/status.test.ts
import { describe, it, expect, vi } from "vitest";
import { setSuperpowersStatus, clearSuperpowersStatus } from "./status.js";

function mockCtx() {
  const calls: Array<[string, string]> = [];
  return {
    ui: {
      setStatus: (id: string, text: string) => calls.push([id, text]),
    },
    __calls: calls,
  };
}

describe("setSuperpowersStatus", () => {
  it("calls ctx.ui.setStatus with the well-known id and formatted text", () => {
    const ctx = mockCtx();
    setSuperpowersStatus(ctx as never, "active · 15 skills");
    expect(ctx.__calls).toEqual([["superpowers", "🦸 active · 15 skills"]]);
  });

  it("respects color=false option (no emoji in ascii mode)", () => {
    const ctx = mockCtx();
    setSuperpowersStatus(ctx as never, "active", { color: false });
    expect(ctx.__calls[0][1]).toBe("[SP] active");
  });
});

describe("clearSuperpowersStatus", () => {
  it("calls setStatus with empty string", () => {
    const ctx = mockCtx();
    clearSuperpowersStatus(ctx as never);
    expect(ctx.__calls).toEqual([["superpowers", ""]]);
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

```bash
npm run test -- src/ui/status.test.ts
```

- [ ] **Step 3: Write implementation**

```ts
// src/ui/status.ts
import { ICONS, ASCII_FALLBACK } from "./icons.js";

type StatusCtx = { ui: { setStatus: (id: string, text: string) => void } };

const STATUS_ID = "superpowers";

export function setSuperpowersStatus(
  ctx: StatusCtx,
  text: string,
  opts: { color?: boolean } = {},
): void {
  const color = opts.color !== false;
  const brand = color ? ICONS.brand : ASCII_FALLBACK.brand;
  ctx.ui.setStatus(STATUS_ID, `${brand} ${text}`);
}

export function clearSuperpowersStatus(ctx: StatusCtx): void {
  ctx.ui.setStatus(STATUS_ID, "");
}
```

- [ ] **Step 4: Run test, expect PASS**

```bash
npm run test -- src/ui/status.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/status.ts src/ui/status.test.ts
git commit -m "feat(ui): add status footer helper"
```

---

## Task 18: Create `src/ui/widget.ts` with tests

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/src/ui/widget.ts`
- Test: `/Users/josorio/Code/pi-superpowers/src/ui/widget.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/ui/widget.test.ts
import { describe, it, expect } from "vitest";
import { setWidget, clearWidget } from "./widget.js";

function mockCtx() {
  const calls: Array<[string, string[]]> = [];
  return {
    ui: { setWidget: (id: string, lines: string[]) => calls.push([id, lines]) },
    __calls: calls,
  };
}

describe("setWidget", () => {
  it("passes id and lines through", () => {
    const ctx = mockCtx();
    setWidget(ctx as never, "todos", ["line1", "line2"]);
    expect(ctx.__calls).toEqual([["superpowers-todos", ["line1", "line2"]]]);
  });
});

describe("clearWidget", () => {
  it("sends an empty array", () => {
    const ctx = mockCtx();
    clearWidget(ctx as never, "todos");
    expect(ctx.__calls).toEqual([["superpowers-todos", []]]);
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

```bash
npm run test -- src/ui/widget.test.ts
```

- [ ] **Step 3: Write implementation**

```ts
// src/ui/widget.ts
type WidgetCtx = { ui: { setWidget: (id: string, lines: string[]) => void } };

export type WidgetName = "todos" | "subagent" | "degraded";

function widgetId(name: WidgetName): string {
  return `superpowers-${name}`;
}

export function setWidget(ctx: WidgetCtx, name: WidgetName, lines: string[]): void {
  ctx.ui.setWidget(widgetId(name), lines);
}

export function clearWidget(ctx: WidgetCtx, name: WidgetName): void {
  ctx.ui.setWidget(widgetId(name), []);
}
```

- [ ] **Step 4: Run test, expect PASS**

```bash
npm run test -- src/ui/widget.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/widget.ts src/ui/widget.test.ts
git commit -m "feat(ui): add widget helper with namespaced ids"
```

---

## Task 19: Create `src/skills/discover.ts` with tests

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/src/skills/discover.ts`
- Test: `/Users/josorio/Code/pi-superpowers/src/skills/discover.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/skills/discover.test.ts
import { describe, it, expect } from "vitest";
import { buildResourcesDiscoverHandler } from "./discover.js";
import { vendorSkillsDir } from "../common/paths.js";

describe("buildResourcesDiscoverHandler", () => {
  it("returns a handler that contributes the vendored skills path", async () => {
    const handler = buildResourcesDiscoverHandler();
    const result = await handler({ cwd: "/tmp", reason: "startup" } as never, {} as never);
    expect(result.skillPaths).toContain(vendorSkillsDir());
  });

  it("returns empty skillPaths when vendor dir is missing", async () => {
    const handler = buildResourcesDiscoverHandler({ skillsDir: "/nonexistent/path/xyz" });
    const result = await handler({ cwd: "/tmp", reason: "startup" } as never, {} as never);
    expect(result.skillPaths ?? []).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

```bash
npm run test -- src/skills/discover.test.ts
```

- [ ] **Step 3: Write implementation**

```ts
// src/skills/discover.ts
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
```

- [ ] **Step 4: Run test, expect PASS**

```bash
npm run test -- src/skills/discover.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/skills/discover.ts src/skills/discover.test.ts
git commit -m "feat(skills): add resources_discover handler contributing vendored path"
```

---

## Task 20: Create `src/bootstrap/addendum.ts` with tests

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/src/bootstrap/addendum.ts`
- Test: `/Users/josorio/Code/pi-superpowers/src/bootstrap/addendum.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/bootstrap/addendum.test.ts
import { describe, it, expect } from "vitest";
import { renderPiAddendum } from "./addendum.js";

describe("renderPiAddendum", () => {
  it("contains the pi tool-mapping table", () => {
    const text = renderPiAddendum({ subagentAvailable: true });
    expect(text).toContain("| `Read` | `read` |");
    expect(text).toContain("| `TodoWrite` | `superpowers_todo` |");
    expect(text).toContain("| `Task` | `superpowers_subagent` |");
  });

  it("mentions pi-native /skill:name", () => {
    expect(renderPiAddendum({ subagentAvailable: true })).toContain("/skill:");
  });

  it("warns when subagent is unavailable", () => {
    const text = renderPiAddendum({ subagentAvailable: false });
    expect(text.toLowerCase()).toContain("subagent");
    expect(text.toLowerCase()).toContain("unavailable");
  });

  it("does not warn when subagent is available", () => {
    const text = renderPiAddendum({ subagentAvailable: true });
    expect(text.toLowerCase()).not.toContain("unavailable");
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

```bash
npm run test -- src/bootstrap/addendum.test.ts
```

- [ ] **Step 3: Write implementation**

```ts
// src/bootstrap/addendum.ts
import { renderToolMappingMarkdown } from "../compat/tool-mapping.js";

export type AddendumOptions = {
  subagentAvailable: boolean;
};

export function renderPiAddendum(opts: AddendumOptions): string {
  const subagentNote = opts.subagentAvailable
    ? "Use `superpowers_subagent` to dispatch named agents (single / parallel / chain)."
    : "Subagent dispatch is currently unavailable (pi-agents not installed). Skills that reference `Task` should fall back to single-session workflows.";
  return [
    "**Pi-specific tool mapping**",
    "",
    renderToolMappingMarkdown(),
    "",
    subagentNote,
  ].join("\n");
}
```

- [ ] **Step 4: Run test, expect PASS**

```bash
npm run test -- src/bootstrap/addendum.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/bootstrap/addendum.ts src/bootstrap/addendum.test.ts
git commit -m "feat(bootstrap): add pi tool-mapping addendum generator"
```

---

## Task 21: Create `src/bootstrap/inject.ts` with unit tests

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/src/bootstrap/inject.ts`
- Test: `/Users/josorio/Code/pi-superpowers/src/bootstrap/inject.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/bootstrap/inject.test.ts
import { describe, it, expect } from "vitest";
import { buildInjectHandler } from "./inject.js";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function fixtureSkill(body: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "pisup-boot-"));
  const skillDir = join(dir, "skills", "using-superpowers");
  await mkdir(skillDir, { recursive: true });
  const skillPath = join(skillDir, "SKILL.md");
  await writeFile(skillPath, body);
  return skillPath;
}

function mockCtx(entryCount: number) {
  return {
    sessionManager: {
      getEntries: () => new Array(entryCount).fill({ kind: "user" }),
    },
    ui: {
      notify: (_m: string, _l?: string) => undefined,
      setStatus: (_id: string, _t: string) => undefined,
    },
  };
}

describe("buildInjectHandler", () => {
  it("injects a persistent message on first turn", async () => {
    const skillPath = await fixtureSkill("# using-superpowers\n\nBody content");
    const handler = buildInjectHandler({
      usingSkillPath: skillPath,
      subagentAvailable: true,
    });
    const out = await handler(
      { prompt: "hi", images: [], systemPrompt: "" } as never,
      mockCtx(0) as never,
    );
    expect(out?.message).toBeDefined();
    expect(out?.message?.content).toContain("using-superpowers");
    expect(out?.message?.content).toContain("Body content");
    expect(out?.message?.content).toContain("| `Read` | `read` |");
    expect(out?.message?.customType).toBe("superpowers-bootstrap");
    expect(out?.message?.display).toBe(false);
  });

  it("returns undefined on subsequent turns (entries > 0)", async () => {
    const skillPath = await fixtureSkill("# x");
    const handler = buildInjectHandler({ usingSkillPath: skillPath, subagentAvailable: true });
    const out = await handler({ prompt: "hi", images: [], systemPrompt: "" } as never, mockCtx(3) as never);
    expect(out).toBeUndefined();
  });

  it("injects only the addendum if skill file missing", async () => {
    const handler = buildInjectHandler({ usingSkillPath: "/nope/x.md", subagentAvailable: true });
    const out = await handler({ prompt: "hi", images: [], systemPrompt: "" } as never, mockCtx(0) as never);
    expect(out?.message?.content).toContain("| `Read` | `read` |");
    expect(out?.message?.content.toLowerCase()).toContain("could not load");
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

```bash
npm run test -- src/bootstrap/inject.test.ts
```

- [ ] **Step 3: Write implementation**

```ts
// src/bootstrap/inject.ts
import { readFileSafe } from "../common/fs.js";
import { vendorUsingSuperpowersSkill } from "../common/paths.js";
import { renderPiAddendum } from "./addendum.js";

export type InjectOptions = {
  usingSkillPath?: string;
  subagentAvailable: boolean;
};

type InjectEvent = {
  prompt: string;
  images: unknown[];
  systemPrompt: string;
};

type InjectCtx = {
  sessionManager: { getEntries: () => unknown[] };
  ui: {
    notify: (msg: string, level?: string) => void;
    setStatus: (id: string, text: string) => void;
  };
};

type InjectResult = {
  message: {
    customType: string;
    content: string;
    display: boolean;
  };
};

export type InjectHandler = (
  event: InjectEvent,
  ctx: InjectCtx,
) => Promise<InjectResult | undefined>;

export function buildInjectHandler(opts: InjectOptions): InjectHandler {
  const skillPath = opts.usingSkillPath ?? vendorUsingSuperpowersSkill();
  return async (_event, ctx) => {
    if (ctx.sessionManager.getEntries().length > 0) return undefined;

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
```

- [ ] **Step 4: Run test, expect PASS**

```bash
npm run test -- src/bootstrap/inject.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/bootstrap/inject.ts src/bootstrap/inject.test.ts
git commit -m "feat(bootstrap): add first-turn injection handler"
```

---

## Task 22: Create `src/index.ts` and `src/api.ts`

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/src/index.ts`
- Create: `/Users/josorio/Code/pi-superpowers/src/api.ts`

- [ ] **Step 1: Write `src/index.ts`**

```ts
// src/index.ts
// Thin pi extension entrypoint. Registers event handlers only.

import { buildInjectHandler } from "./bootstrap/inject.js";
import { buildResourcesDiscoverHandler } from "./skills/discover.js";
import { setSuperpowersStatus, clearSuperpowersStatus } from "./ui/status.js";

type ExtensionAPI = {
  on: (event: string, handler: (...args: unknown[]) => unknown) => void;
};

async function piAgentsAvailable(): Promise<boolean> {
  try {
    await import("pi-agents");
    return true;
  } catch {
    return false;
  }
}

export default async function superpowersExtension(pi: ExtensionAPI): Promise<void> {
  const subagentAvailable = await piAgentsAvailable();

  const inject = buildInjectHandler({ subagentAvailable });
  const discover = buildResourcesDiscoverHandler();

  pi.on("before_agent_start", inject as never);
  pi.on("resources_discover", discover as never);

  pi.on("session_start", (async (_event: unknown, ctx: unknown) => {
    setSuperpowersStatus(ctx as never, "Superpowers · v5.0.7 · 15 skills");
    setTimeout(() => clearSuperpowersStatus(ctx as never), 3000);
  }) as never);
}
```

- [ ] **Step 2: Write `src/api.ts` (public surface — explicit exports only, NOT a barrel)**

```ts
// src/api.ts
// Public API for pi-superpowers. Curated surface for consumers.
// Do NOT turn this into a wildcard re-export.

export { renderToolMappingMarkdown, TOOL_MAPPING } from "./compat/tool-mapping.js";
export type { ClaudeCodeToolName } from "./compat/tool-mapping.js";

export { renderPiAddendum } from "./bootstrap/addendum.js";
export { buildInjectHandler } from "./bootstrap/inject.js";
export type { InjectHandler, InjectOptions } from "./bootstrap/inject.js";

export { buildResourcesDiscoverHandler } from "./skills/discover.js";
export type { DiscoverHandler, DiscoverOptions } from "./skills/discover.js";

export { createTheme } from "./ui/theme.js";
export type { Theme, ThemeOptions } from "./ui/theme.js";
export { panel, divider, badge } from "./ui/box.js";
export { progressBar, spinnerFrame } from "./ui/progress.js";
export { truncateEnd, truncateMiddle, wrapLines, visibleLength } from "./ui/truncate.js";
export { setSuperpowersStatus, clearSuperpowersStatus } from "./ui/status.js";
export { setWidget, clearWidget } from "./ui/widget.js";
export type { WidgetName } from "./ui/widget.js";
```

- [ ] **Step 3: Run `npm run check`**

```bash
npm run check
```

Expected: all lint, typecheck, test pass.

- [ ] **Step 4: Commit**

```bash
git add src/index.ts src/api.ts
git commit -m "feat: wire extension entrypoint + public api surface"
```

---

## Task 23: Write `src/bootstrap/inject-e2e.test.ts`

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/src/bootstrap/inject-e2e.test.ts`

- [ ] **Step 1: Write the E2E test (skips cleanly when `PI_BIN` is not set)**

```ts
// src/bootstrap/inject-e2e.test.ts
import { describe, it, expect } from "vitest";
import { spawn } from "node:child_process";
import { packageRoot } from "../common/paths.js";

const PI_BIN = process.env.PI_BIN;
const describeIfPi = PI_BIN ? describe : describe.skip;

function runPi(args: string[], prompt: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(PI_BIN!, args, { cwd: packageRoot() });
    let out = "";
    let err = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    const timer = setTimeout(() => { proc.kill("SIGTERM"); reject(new Error(`pi timed out after ${timeoutMs}ms\nstderr: ${err}`)); }, timeoutMs);
    proc.stdin.write(prompt);
    proc.stdin.end();
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new Error(`pi exited with code ${code}\nstderr: ${err}`));
    });
  });
}

describeIfPi("bootstrap inject (e2e)", () => {
  it("first-turn response mentions pi tool mapping (TodoWrite → superpowers_todo)", async () => {
    const output = await runPi(
      ["--mode", "json", "-p", "--no-session", "-e", "./src/index.ts"],
      "Tell me the pi equivalent of the Claude Code TodoWrite tool. Answer in one short line.",
      60_000,
    );
    expect(output.toLowerCase()).toContain("superpowers_todo");
  }, 90_000);
});
```

- [ ] **Step 2: Run with PI_BIN set**

```bash
PI_BIN=$(which pi) npm run test -- src/bootstrap/inject-e2e.test.ts
```

Expected: PASS (skipped if pi not installed; passes if model follows the bootstrap).

- [ ] **Step 3: Commit**

```bash
git add src/bootstrap/inject-e2e.test.ts
git commit -m "test(bootstrap): e2e test asserting pi tool mapping appears in response"
```

---

## Task 24: Write `README.md`

**Files:**
- Create: `/Users/josorio/Code/pi-superpowers/README.md`

- [ ] **Step 1: Write README**

````markdown
# pi-superpowers

[Superpowers](https://github.com/obra/superpowers) skills library as a native pi package.

Wraps a vendored snapshot of `obra/superpowers` and exposes its 15 skills to the `pi` coding agent. Injects the `using-superpowers` discipline on the first turn of every pi session.

## Install

```bash
pi install git:github.com/josorio7122/pi-agents
pi install git:github.com/josorio7122/pi-superpowers@v5.0.7
```

## What you get

- 15 superpowers skills discoverable via `/skill:name` (e.g. `/skill:brainstorming`, `/skill:writing-plans`).
- First-turn bootstrap that injects the `using-superpowers` skill content + a pi tool-mapping addendum.
- A session-start status `🦸 Superpowers · v5.0.7 · 15 skills`.

Todos and subagents ship in subsequent plans (M3, M4).

## Updating superpowers

```bash
./scripts/sync-upstream.sh v5.0.8
npm run check
git add -A && git commit -m "Sync superpowers to v5.0.8"
git tag v5.0.8 && git push --follow-tags
```

## Development

```bash
npm run check          # lint + typecheck + test
npm run test:watch     # vitest watch
PI_BIN=$(which pi) npm run test:e2e
```

See `docs/specs/2026-04-18-pi-superpowers-design.md` for the full design.
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with install, update, and dev instructions"
```

---

## Task 25: Local install smoke test

**Files:** *(none — verification only)*

- [ ] **Step 1: Install pi-superpowers locally**

```bash
pi install /Users/josorio/Code/pi-superpowers
pi list
```

Expected: `pi list` shows `pi-superpowers` (local path).

- [ ] **Step 2: Start pi and verify session-start status**

```bash
pi
```

Expected: within 1 second of pi starting, the footer shows `🦸 Superpowers · v5.0.7 · 15 skills`. It clears after ~3s.

- [ ] **Step 3: Verify skills are discoverable**

In the pi session:

```
/skill:brainstorming
```

Expected: pi loads and prints the `brainstorming` skill content.

- [ ] **Step 4: Verify first-turn bootstrap (manual prompt)**

New pi session:

```
What is the pi equivalent of the Claude Code TodoWrite tool?
```

Expected: response mentions `superpowers_todo`.

- [ ] **Step 5: Document any deviations as follow-up issues**

If any of the above fails, create a GitHub issue and link it here. Do not proceed to tag until the smoke test passes.

---

## Task 26: Tag v5.0.7 and push

**Files:** *(none — release step)*

- [ ] **Step 1: Ensure working tree is clean**

```bash
git status
```

Expected: nothing to commit, working tree clean.

- [ ] **Step 2: Run full check one final time**

```bash
npm run check
```

Expected: all green.

- [ ] **Step 3: Create annotated tag**

```bash
git tag -a v5.0.7 -m "pi-superpowers v5.0.7 — Foundation (M1+M2): skills discovery + first-turn bootstrap"
```

- [ ] **Step 4: Push main and tags**

```bash
git push --follow-tags origin main
```

Expected: GitHub shows `v5.0.7` release; `pi install git:github.com/josorio7122/pi-superpowers@v5.0.7` now works for others.

---

## Definition of Done

- `npm run check` green.
- `PI_BIN=$(which pi) npm run test:e2e` green (skipped if pi unavailable, but no failures when present).
- `pi install git:github.com/josorio7122/pi-superpowers@v5.0.7` succeeds.
- In a fresh pi session: `/skill:brainstorming` loads; first-turn prompts about `TodoWrite` elicit `superpowers_todo`.
- `v5.0.7` tag pushed to GitHub.

## Follow-up plans

- **Plan 2 (Todos, M3)** — `todos/` feature + interactive `/todos` picker. Writes once this plan ships.
- **Plan 3 (Subagents, M4)** — `subagents/` feature with pi-agents `runAgent`, single/parallel/chain modes. Writes once Plan 2 ships.

---

## Self-review (appended after writing the plan)

**Spec coverage:**
- §3 Decision 1–7 → Tasks 2, 7, 2/24, 20–23, 13–18, 22.
- §5 pi-package manifest → Task 2 (exact package.json from spec).
- §6 Repository layout → Tasks 3 (tsconfig), 4 (biome), 5 (vitest), 9–22 (src/).
- §7 Conventions → Tasks 3, 4, 5 (toolchain); 9–22 (file-level conventions).
- §8.1 Install + startup → Task 25 (smoke test).
- §8.2 First-turn injection → Tasks 20, 21, 23.
- §8.5 Upstream sync flow → Tasks 7, 8.
- §9 Error handling → Task 19 (missing vendor), Task 21 (missing skill file), Task 22 (missing pi-agents).
- §10 TUI rendering — **foundation only** (theme, icons, truncate, box, progress, status, widget). Full per-feature renderers ship in Plans 2 and 3, as designed.
- §11 Testing → every feature task includes a co-located unit test. E2E Task 23.
- §12 Milestones M1+M2 → this plan. M3, M4 deferred to Plans 2, 3.

**Placeholder scan:** no "TBD"/"TODO"/"implement later"/"add validation" — all code shown in full. Every step has exact commands.

**Type consistency:** `InjectHandler`, `DiscoverHandler`, `Theme`, `WidgetName` all defined in their source files and re-exported from `src/api.ts`. `TOOL_MAPPING` keys match addendum test expectations.

No gaps. Plan ready for execution.
