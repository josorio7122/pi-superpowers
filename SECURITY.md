# Security Policy

## Supported versions

Only the latest minor version is supported. Security fixes are released as patch versions against that line.

| Version | Supported |
|---------|-----------|
| 5.6.x   | ✅        |
| < 5.6   | ❌        |

## Reporting a vulnerability

Please report security issues privately via GitHub's security advisory feature:

[Report a vulnerability →](https://github.com/josorio7122/pi-superpowers/security/advisories/new)

You can also email: josorio7122@gmail.com

I'll acknowledge within 72 hours and provide a fix timeline within 7 days. Do not open a public issue for security reports.

## Scope

In scope:
- The bootstrap injector (`src/bootstrap/`) — what gets injected into pi sessions and how.
- The subagent dispatcher (`src/subagents/`) — agent config building, frontmatter parsing, loader boundary.
- The skill broadcaster (`src/skills/`) — skill discovery, frontmatter expansion.
- The multi-session coordinator (`src/multi-session/`) — cross-session state and tmpdir handling.
- The public API (`src/api.ts`).

Out of scope:
- Vulnerabilities in pi's own runtime (`@mariozechner/pi-coding-agent`) — report upstream at [pi-mono](https://github.com/badlogic/pi-mono).
- Upstream Superpowers skills under `vendor/superpowers/` — report at [obra/superpowers](https://github.com/obra/superpowers).
- Dependency vulnerabilities in `gray-matter` / `chalk` / typebox without a pi-superpowers-specific attack vector.
