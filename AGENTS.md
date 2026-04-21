# Agent Instructions

Rules for AI agents (and humans) editing this repo. Short and enforced — read before writing code.

## Package manager

Use **npm**: `npm install`, `npm test`, `npm run check`.

## File-scoped commands

| Task | Command |
|------|---------|
| Typecheck | `npx tsc --noEmit` |
| Lint | `npx biome check path/to/file.ts` |
| Lint fix | `npx biome check --fix path/to/file.ts` |
| Test file | `npx vitest run path/to/file.test.ts` |
| Test watch | `npx vitest path/to/file.test.ts` |
| Blank-line check | `bash scripts/check-blank-lines.sh` |
| Parity check | `npm run parity-check` |
| All checks | `npm run check` |
| E2E (gated) | `PI_BIN=$(which pi) npm run test:e2e` |

## Dependency layout (pi-superpowers-specific)

Unlike `pi-agents` / `pi-tasks`, this repo ships `pi-agents`, `pi-tasks`, `@sinclair/typebox`, `chalk`, and `gray-matter` as **`dependencies`**, not `peerDependencies`. Rationale: pi-superpowers bundles them for install-time self-containment (`pi install git:github.com/josorio7122/pi-superpowers`). The only `peerDependency` is `@mariozechner/pi-coding-agent`. Do not reshuffle these into peer deps without a deliberate discussion.

## Vendor directory (read-only)

`vendor/superpowers/` is a mirror of [obra/superpowers](https://github.com/obra/superpowers). **Never hand-edit files under `vendor/`.** To pick up upstream changes, run `./scripts/sync-upstream.sh vX.Y.Z` and then `npm run parity-check`. The parity-check script fails loudly if upstream adds a surface we don't handle.

## Strings

The rule targets *literal* string assembly, not variable concatenation.

- **Never build a string by joining string literals with `+`.** Use a template literal.
- **Never build a string by pushing literals into an array and `.join()`-ing it.** Same anti-pattern.
- **`a + b` with variables is fine.**
- **`.join()` is fine when the array IS the domain type** — e.g. widget lines.

## Pi compliance (non-negotiable)

- **Never shadow pi's types.** Import `Theme`, `ThemeColor`, `ToolDefinition`, `ExtensionContext`, `AgentToolResult`, `ExtensionAPI` directly from `@mariozechner/pi-coding-agent`.
- **No raw ANSI escapes (`\x1b[...]`) in production code.** Use `theme.fg(slot, text)`, `theme.bold(text)`.
- **Canonical `ThemeColor` slots only:** `accent`, `muted`, `dim`, `text`, `success`, `error`, `warning`.
- **Peer dep `@mariozechner/pi-coding-agent` uses `"*"`** per pi's `docs/packages.md`.

## TypeScript

- **No classes.** Factory functions + closures for stateful behavior.
- **Typebox for schemas**, not zod.
- **No `any`**, **no non-null assertions (`!`)**, **no barrel files except `src/api.ts`**. Enforced by biome.
- **No nested ternaries.** Enforced by biome. Use early returns or a helper.
- **Max 2 params per function.** Options object for anything longer.
- **Blank line between consecutive multi-line blocks at the same scope.** Enforced via `scripts/check-blank-lines.sh`, wired into `npm run check` as `lint:blanks`.
- **File size target: < 200 LOC.** Split by responsibility when exceeded.
- **ESM-only.** `.js` extensions on relative imports. `verbatimModuleSyntax` is on — use `import type` / `export type`.

## Tests

- **Co-locate:** `foo.ts` → `foo.test.ts`.
- **E2E tests use the `-e2e.test.ts` suffix** and run via `vitest.e2e.config.ts`. Gated on `PI_BIN`.
- **Prefer `vi.spyOn` over `vi.mock`** — `vi.mock` is last resort.
- **Prefer fakes and real objects over mocks.**
- `npm run check` before commit; `PI_BIN=$(which pi) npm run test:e2e` for E2E.

## Git

- **Conventional commits:** `type(scope): description`. Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `ci`, `style`.
- **No `Co-Authored-By` trailers.** No AI attribution.
- **Breaking changes use `!`:** `feat(bootstrap)!: rename addendum config`.
- **Branch protection is on `main`** — CI (`check`) must pass before merge. Squash-merge only.

## Docs discipline

- Specs and plans live under `docs/specs/` and `docs/plans/` and **are committed** (maintainer preference for this repo).
- Filename convention: `YYYY-MM-DD-<short-name>.md`.
- **Keep docs current** — when adding/removing/changing files, APIs, or behavior, update `README.md`, `docs/`, JSDoc, `AGENTS.md`, `CHANGELOG.md`.

## When in doubt

See `CONTRIBUTING.md` for the human-facing version. When the two disagree, `AGENTS.md` wins.
