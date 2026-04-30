# AGENTS.md

## Project overview

Tauri v2 desktop app ("FarmStack Tally Demo") that syncs business data (sales, purchases, suppliers, customers, products) with **Tally ERP** via HTTP/XML. Frontend: React 19 + TypeScript + Tailwind. Backend: Rust with `reqwest` (Tally HTTP client) and `sqlite` (local persistence).

## Two runtimes, one app

| Layer | Stack | Entry point |
|-------|-------|-------------|
| Frontend | React 19 / TS / Vite / Tailwind | `src/main.tsx` → `src/App.tsx` |
| Backend (Tauri shell) | Rust | `src-tauri/src/lib.rs` → `run()` |

The Vite dev server serves the frontend on **port 1420** (fixed, `strictPort: true`). The Tauri shell wraps it as a native desktop window.

## Commands

```bash
npm run tauri dev        # Full dev: starts Vite (port 1420) + Tauri native shell
npm run dev              # Frontend-only Vite dev server (no native shell)
npm run build            # Frontend: tsc typecheck → vite build → dist/
npm run tauri build      # Full production build (Rust + frontend bundled)
npm run tauri            # Passthrough to @tauri-apps/cli
```

**Always use `npm run tauri dev`** for development. `npm run dev` alone only runs the web frontend without the Tauri runtime (Rust commands, SQLite, etc. will not work).

## Key architecture

### Tauri commands (Rust → Frontend via `@tauri-apps/api`)

Defined in `src-tauri/src/lib.rs`:

| Command | Purpose |
|---------|---------|
| `check_tally_connection(host?, port?)` | GET to Tally, default `localhost:9000` |
| `send_xml_to_tally(xml, host?, port?)` | POST XML to Tally, parses success/error from response |

### SQLite (frontend-side via `@tauri-apps/plugin-sql`)

- Initialized in `src/lib/db.ts` on app mount
- Database loads before UI renders (`dbReady` guard in `App.tsx`)
- Permissions configured in `src-tauri/capabilities/default.json`

### Tally integration (frontend XML builder)

- `src/tally/xml-builder.ts` constructs Tally-compatible XML
- Templates in `src/tally/xml-templates/`
- Tally listens on `http://localhost:9000` by default

### Pages / components

Single-page app with sidebar navigation. Pages are in `src/components/`:
- **Business flows**: `Sales.tsx`, `Purchase.tsx`
- **Admin**: `Suppliers.tsx`, `Customers.tsx`, `Products.tsx`, `ProductTypes.tsx`
- **Sync**: `XMLPreview.tsx`, `SyncLogs.tsx`
- **Config**: `Settings.tsx`, `Dashboard.tsx`

## TypeScript config

Strict mode enabled. Notable: `noUnusedLocals: true`, `noUnusedParameters: true`. Vite config has `references` to `tsconfig.node.json` for node-side config files.

## No tests or CI

No test framework, no CI workflow, no pre-commit hooks currently configured.
