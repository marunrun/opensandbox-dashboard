# OpenSandbox Dashboard

Next.js management dashboard for [OpenSandbox](https://www.npmjs.com/package/@alibaba-group/opensandbox) instances.

## Features

- List, create, pause, resume, and delete sandboxes
- Execute commands and view output
- Read/write files inside sandboxes
- Resolve sandbox endpoints
- View resource metrics
- Renew sandbox TTL
- Browser-persisted connection config (domain, API key, protocol)

## Prerequisites

- Node.js 18+
- Access to an OpenSandbox-compatible API server

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. On first visit you'll be prompted to enter your OpenSandbox connection details (domain, API key, protocol). Config is stored in `localStorage`.

## Environment Variables (optional)

Set these to provide defaults so the server-side proxy can connect without browser headers:

| Variable | Default | Description |
|---|---|---|
| `OPENSANDBOX_DOMAIN` | `localhost:8080` | API server host:port |
| `OPENSANDBOX_API_KEY` | — | API key |
| `OPENSANDBOX_PROTOCOL` | `https` | `http` or `https` |
| `OPENSANDBOX_REQUEST_TIMEOUT_SECONDS` | `300` | Request timeout |
| `OPENSANDBOX_USE_SERVER_PROXY` | `true` | Proxy sandbox endpoints through the Next.js server |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run verify` | Typecheck + build |
| `npm run test:sdk` | SDK integration verification |

## SDK Verification

```bash
# List sandboxes
npm run test:sdk -- --list-only

# Create a sandbox and exercise all operations
npm run test:sdk

# Connect to an existing sandbox
npm run test:sdk -- --sandbox-id=<id>

# Clean up dashboard-created sandboxes
npm run test:sdk -- --cleanup-dashboard
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── config/route.ts          # Config endpoint
│   │   └── sandboxes/
│   │       ├── route.ts             # List / Create
│   │       └── [sandboxId]/
│   │           ├── route.ts          # Get / Delete
│   │           ├── pause/route.ts
│   │           ├── resume/route.ts
│   │           ├── renew/route.ts
│   │           ├── command/route.ts
│   │           ├── files/route.ts
│   │           ├── endpoint/route.ts
│   │           ├── egress/route.ts
│   │           └── metrics/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── dashboard.tsx                # Main dashboard UI
│   └── dashboard.css
└── lib/
    └── opensandbox/
        ├── client.ts                # SDK helpers (withManager, withSandbox)
        ├── config.ts                # Connection config from env/headers
        ├── errors.ts                # Error serialization
        ├── schemas.ts               # Zod validation schemas
        └── serialize.ts             # SandboxInfo -> JSON response
```

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **SDK**: `@alibaba-group/opensandbox`
- **Validation**: Zod
- **Icons**: Lucide React
- **Language**: TypeScript
