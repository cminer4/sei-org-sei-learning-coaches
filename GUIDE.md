# SEI Assessment Coach — Contributor Guide

## Where to start

1. Read [CLAUDE.md](CLAUDE.md) — project constitution, routes, and constraints.
2. Feature work starts from a spec in `specs/features/` (see templates in `specs/templates/`).
3. Regressions and follow-ups go in [specs/BUG-REGISTRY.md](specs/BUG-REGISTRY.md).

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development server |
| `npm run dev:safe` | Same as `dev` (use when you want the documented alias; see [docs/NEXTJS-DEV-BUILD-SETUP.md](docs/NEXTJS-DEV-BUILD-SETUP.md)) |
| `npm run lint` | ESLint |
| `npm run verify:dev` | Lint (quick health check before UI testing) |
| `npm run build` | Production build |
| `npm run build:clean` | Remove `.next` then build (fixes stale cache issues) |
| `npm run verify:build` | Same as `build` |
| `npm run ensure:build` | Lint then build |
| `npm run pr:readiness` | SEI-53: `ensure:build` + tests + architecture grep (see [README](README.md) PR readiness checklist) |

## Docs

- [docs/NEXTJS-DEV-BUILD-SETUP.md](docs/NEXTJS-DEV-BUILD-SETUP.md) — local dev and build hygiene
