# TestHub

Local-first test management tool. Lightweight alternative to cloud testing platforms.

Let AI agents auto-generate test cases via API, then review and execute them in a clean Web UI.

## Quick Start

```bash
npx testhub-app
```

Open `http://localhost:4010` in your browser. Done.

Data is stored in `~/.testhub/` by default (SQLite database + API token).

## Features

- **Zero config** — One command to start. No database setup, no Docker, no cloud account.
- **Full REST API** — CRUD for projects, test cases, plans, and execution. Automate everything.
- **Web UI** — Organize test cases in directories with tags, execute test plans, track results.
- **Agent-friendly** — Built-in `/skill.md` guide and OpenAPI spec (`/api/docs`) for AI agent integration.
- **Local-first** — All data stays on your machine in SQLite. No network dependency.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4010` | Server port |
| `HOST` | `127.0.0.1` | Bind address |
| `TESTHUB_DATA_DIR` | `~/.testhub` | Data directory (database + API token) |
| `TESTHUB_DB_PATH` | `<data_dir>/testhub.db` | Full path to SQLite database file |
| `TESTHUB_API_TOKEN` | (auto-generated) | Fixed API authentication token |

```bash
# Custom port
PORT=3000 npx testhub-app

# Custom data directory
TESTHUB_DATA_DIR=./my-project-tests npx testhub-app
```

## API Authentication

All `/api/v1/*` endpoints require the `x-testhub-token` header.

The token is printed to the console on startup and saved in `~/.testhub/api-token`.

```bash
curl http://localhost:4010/api/v1/projects \
  -H "x-testhub-token: <TOKEN>"
```

Optional headers:
- `x-testhub-operator` — Operator identifier (default: `web-user`)
- `x-testhub-source` — Source tag: `api` | `ui` | `system` (default: `api`)

## AI Agent Integration

After starting the server, send the skill guide URL to your AI agent:

```
http://localhost:4010/skill.md
```

The guide includes data models, workflow examples, and ready-to-use curl commands with the current server address and token injected.

- **Swagger UI**: `http://localhost:4010/api/docs`
- **OpenAPI Spec**: `http://localhost:4010/api/docs/json`

## API Overview

Prefix: `/api/v1`

```
Projects       GET/POST        /projects
Libraries      GET/POST        /projects/:id/libraries
Directories    GET/POST        /libraries/:id/directories     (tree structure)
Cases          GET/POST        /libraries/:id/cases
Cases (batch)  POST            /libraries/:id/cases/batch
Tags           GET/POST        /libraries/:id/tags
Plans          GET/POST        /projects/:id/plans
Plan Cases     GET/POST/PATCH  /plans/:id/cases
```

## Quick API Example

```bash
# 1. Create a project
curl -X POST http://localhost:4010/api/v1/projects \
  -H "x-testhub-token: <TOKEN>" \
  -H "content-type: application/json" \
  -d '{"name":"My Project"}'

# 2. Create a test library
curl -X POST http://localhost:4010/api/v1/projects/1/libraries \
  -H "x-testhub-token: <TOKEN>" \
  -H "content-type: application/json" \
  -d '{"name":"Core Tests","code":"CORE"}'

# 3. Batch create test cases
curl -X POST http://localhost:4010/api/v1/libraries/1/cases/batch \
  -H "x-testhub-token: <TOKEN>" \
  -H "content-type: application/json" \
  -d '{"cases":[{"title":"Login works","priority":"P1","caseType":"functional","contentType":"text","textContent":"Enter valid credentials and verify login"}]}'

# 4. Create a test plan and add cases
curl -X POST http://localhost:4010/api/v1/projects/1/plans \
  -H "x-testhub-token: <TOKEN>" \
  -H "content-type: application/json" \
  -d '{"name":"v1.0 Regression","status":"in_progress"}'
```

## Development

```bash
git clone <repo-url>
cd testhub
pnpm install
pnpm dev          # Hot-reload dev mode (Vite + Fastify)
pnpm build        # Build all packages
pnpm test         # Run all tests
pnpm typecheck    # TypeScript type check
```

Tech stack: Fastify + React + SQLite (Drizzle ORM) + TypeScript monorepo (pnpm + Turborepo).

See [CLAUDE.md](./CLAUDE.md) for full project documentation.

## Requirements

- Node.js >= 20

## License

[MIT](./LICENSE)
