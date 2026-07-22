# Todo App

A full-stack Todo application built as a learning and reference project for AI-assisted development.

- **Frontend**: React + TypeScript, Vite, TanStack React Query
- **Backend**: NestJS + TypeScript, REST API, TypeORM, class-validator, Swagger
- **Database**: PostgreSQL, with explicit TypeORM migrations (no `synchronize`)
- **Infrastructure**: Docker Compose (Postgres + backend + frontend)

See [docs/implementation-plan.md](docs/implementation-plan.md) for the full architecture, phased build plan, database schema, API design, and Docker strategy.

## Project structure

```
backend/    NestJS API (src/todos, src/config, src/database/migrations)
frontend/   React app (src/components, src/hooks, src/api, src/types)
docs/       Implementation plan
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for the Compose workflow below)
- Node.js 24+ and npm (only needed for local, non-Docker development)

## Quick start (Docker Compose)

This is the recommended way to run the whole stack.

1. Copy the example env files:

   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. Build and start everything:

   ```bash
   docker compose up --build
   ```

   This starts Postgres, the NestJS API (`http://localhost:3000`), and the React app (`http://localhost:5173`), with source directories bind-mounted for hot reload.

3. Run the database migrations (first run only, or after pulling new migrations):

   ```bash
   docker compose exec backend npm run migration:run
   ```

4. Open the app at **http://localhost:5173**. API docs (Swagger) are at **http://localhost:3000/docs**.

To stop everything:

```bash
docker compose down          # stop and remove containers
docker compose down -v       # also delete the Postgres data volume
```

## Running tests

**Backend** (needs a reachable Postgres — either the Compose one, port-forwarded to `localhost:5432`, or your own):

```bash
cd backend
npm install
npm test          # unit tests (mocked repository, no DB needed)
npm run test:e2e  # e2e tests against a real database; clears the todos table between tests
```

**Frontend**:

```bash
cd frontend
npm install
npm test           # Vitest + React Testing Library, API layer mocked
```

## Local development without Docker

Each service can also run directly on the host against the Dockerized (or any local) Postgres instance:

```bash
# Postgres only, via Compose
docker compose up -d postgres

# Backend
cd backend && npm install && npm run migration:run && npm run start:dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

Copy the relevant `.env.example` files as in the Quick start above first. `backend/.env`'s `DB_HOST=localhost` is correct for this host-based workflow; `docker-compose.yml` overrides it to `postgres` when the backend itself runs in a container.

## Linting and formatting

Both `backend/` and `frontend/` have their own ESLint + Prettier setup:

```bash
npm run lint    # in either directory
npm run format  # in either directory
```
