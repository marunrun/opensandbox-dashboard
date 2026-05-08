# AGENTS.md

Guidance for AI agents working on this codebase.

## Project Overview

OpenSandbox Dashboard is a Next.js 15 management UI for OpenSandbox instances. It uses the `@alibaba-group/opensandbox` SDK to interact with sandbox containers via a server-side API proxy.

## Key Conventions

- **Language**: TypeScript with strict mode
- **Framework**: Next.js 15 App Router, React 19
- **Runtime**: Server-side API routes use `runtime = "nodejs"` (required by the SDK)
- **Styling**: Plain CSS files (no CSS modules, no Tailwind)
- **Validation**: Zod schemas in `src/lib/opensandbox/schemas.ts`
- **No test framework**: No Jest/Vitest configured; `npm run test:sdk` is an integration check against a live API

## Architecture

### API Layer (`src/app/api/`)

Each API route reads OpenSandbox config from request headers (`x-opensandbox-*`) and delegates to SDK helpers in `src/lib/opensandbox/client.ts`.

- `withManager(request, fn)` — creates a `SandboxManager`, calls `fn`, then closes. Used for list operations.
- `withSandbox(request, sandboxId, fn)` — connects to a specific sandbox, calls `fn`, then closes. Used for per-sandbox operations.

### Config (`src/lib/opensandbox/config.ts`)

Config resolution order: request headers > environment variables > defaults. The browser dashboard stores user config in `localStorage` and sends it as headers on each API call.

### Frontend (`src/components/dashboard.tsx`)

Single client component with dialog-based interactions. No state management library — plain `useState`/`useEffect`. All API calls go through the `apiFetch()` helper which attaches config headers.

## Common Tasks

### Adding a new sandbox action

1. Create `src/app/api/sandboxes/[sandboxId]/<action>/route.ts`
2. Use `withSandbox` from `@/lib/opensandbox/client`
3. Add a dialog component in `dashboard.tsx` following existing patterns (e.g., `RenewDialog`)
4. Wire the dialog into the `dialog` state and the action button in the table

### Adding a new config field

1. Add to `OpenSandboxRuntimeConfig` type in `config.ts`
2. Add to `getOpenSandboxRuntimeConfig()` with env var fallback
3. Add to `getOpenSandboxRequestConfig()` for header-based override
4. Add to `OpenSandboxConfig` type in `dashboard.tsx`
5. Add to `ConfigDialog` and `apiFetch`

### Modifying API validation

Edit Zod schemas in `src/lib/opensandbox/schemas.ts`. All API routes parse input through these schemas.

## Build & Verify

```bash
npm run verify   # typecheck + build
npm run lint     # ESLint
```

Both must pass before committing.
