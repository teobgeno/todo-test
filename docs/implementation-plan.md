# Todo App — Implementation Plan

## Context

This is a learning and reference project: a full-stack Todo application (React+TS frontend, NestJS+TS REST backend, PostgreSQL, Dockerized dev environment) built to practice AI-assisted software development and to serve as a clean reference for future projects. The working directory is currently empty except for a `CLAUDE.md`, an `.claudeignore`, and a `notes.md` containing an older, much larger brainstorm (RabbitMQ, AWS deployment, CI/CD, a multi-phase mentor curriculum, auth). That brainstorm is **not** what's being built now — the requirements below are the deliberately scoped-down spec the user gave directly, and they take precedence.

Explicitly **out of scope** for this plan: authentication/authorization (single-user local app, no login), RabbitMQ or any async messaging, CI/CD pipelines, AWS deployment, microservices. These are listed as future improvements in §10 but nothing about the plan below builds toward them prematurely.

---

## 1. Recommended Project Architecture

**Single plain-folder monorepo, no monorepo tooling** (no Nx/Turborepo/Lerna, no npm/pnpm workspaces).

One git repo containing `frontend/` and `backend/` as two independent npm projects (own `package.json`, own `node_modules`, own lint/test config), tied together only by a root `docker-compose.yml`. Frontend and backend share no code (the frontend keeps its own hand-written TS types mirroring the API — see §7), so there's no build-graph or cross-package versioning problem that would justify workspace tooling. Two separate repos would be pure friction here (can't `docker compose up` both together, harder to keep the API contract in sync, two PRs for one logical change).

**No custom repository abstraction on the backend.** The requirement for a "repository layer if appropriate" is satisfied by TypeORM's own `Repository<Todo>`, injected via `@InjectRepository(Todo)` — that object already encapsulates persistence/query logic behind an interface distinct from the service's business logic. A hand-rolled `ITodoRepository` interface with a `TypeOrmTodoRepository` implementation would only be justified if there were a real second implementation coming (a different ORM, a different data store) or a need to mock a narrower interface than TypeORM already provides. Neither applies to a single table behind a single ORM in a single-developer project — that extra layer would be a speculative abstraction with no second caller, ever.

So the flow is: **Controller → Service → `Repository<Todo>`**. Business rules (e.g. "throw 404 if not found") live in the service.

---

## 2. Repository Folder Structure

```
enterprise_learn/
├── .gitignore
├── .env.example                  # POSTGRES_* vars + ports, for docker-compose
├── README.md                     # setup + run instructions for the whole stack
├── notes.md                      # existing brainstorm, left untouched
├── docker-compose.yml
├── backend/
│   ├── src/
│   │   ├── main.ts                       # bootstraps Nest, global ValidationPipe, Swagger setup
│   │   ├── app.module.ts
│   │   ├── todos/
│   │   │   ├── todos.module.ts
│   │   │   ├── todos.controller.ts
│   │   │   ├── todos.service.ts
│   │   │   ├── todos.service.spec.ts     # colocated unit test
│   │   │   ├── entities/
│   │   │   │   └── todo.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-todo.dto.ts
│   │   │       ├── update-todo.dto.ts
│   │   │       └── todo-response.dto.ts
│   │   └── database/
│   │       ├── data-source.ts            # TypeORM DataSource used by CLI for migrations
│   │       └── migrations/
│   │           └── <timestamp>-CreateTodosTable.ts
│   ├── test/
│   │   └── todos.e2e-spec.ts             # supertest happy-path e2e test
│   ├── Dockerfile                        # multi-stage: deps / dev / build / runtime
│   ├── .env.example
│   ├── nest-cli.json
│   ├── tsconfig.json
│   ├── package.json
│   ├── eslint.config.mjs
│   └── .prettierrc
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── TodoForm.tsx
│   │   │   ├── TodoList.tsx
│   │   │   └── TodoItem.tsx
│   │   ├── hooks/
│   │   │   └── useTodos.ts               # React Query hooks (query + 3 mutations)
│   │   ├── api/
│   │   │   ├── client.ts                 # fetch wrapper, base URL from env
│   │   │   └── todos.ts                  # getTodos/createTodo/updateTodo/deleteTodo
│   │   └── types/
│   │       └── todo.ts
│   ├── index.html
│   ├── Dockerfile                        # deps / dev (vite) — no build/runtime stage; reverse proxy lives in root nginx/ instead
│   ├── .env.example                      # VITE_API_URL
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── eslint.config.mjs
│   └── .prettierrc
```

---

## 3. Technology Choices and Justification

**ORM: TypeORM** (confirmed). Nest's official `@nestjs/typeorm` integration injects `Repository<Todo>` directly via DI, matching Nest's decorator-heavy idiom (entities are classes with decorators, same style as DTOs/controllers) and directly satisfying §1's repository requirement with no wrapper needed. Migrations run via the TypeORM CLI against `database/data-source.ts`, committed as files. **No `synchronize: true`, in any environment** — explicit migrations only, since that workflow is part of what this project is meant to demonstrate.

**Frontend state management: TanStack (React) Query** — not Redux, not plain fetch+useState.
- Redux is unjustified: a single-resource CRUD screen has no cross-cutting client state or need for a global store/reducers/actions.
- Plain `fetch` + `useState` was considered but rejected: with 4 mutating operations (create/update/delete/toggle) plus a list query, you'd hand-write loading/error state per operation and manually refetch after every mutation — more code, not less, than `useQuery`/`useMutation` + `invalidateQueries`.
- Server state lives entirely in the React Query cache; only ephemeral UI state (form input value, "which item is being edited") uses local `useState`.

**Validation:** `class-validator` + `class-transformer`, wired via Nest's global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` — the standard, minimal-boilerplate choice.

**Build tooling:**
- Backend: Nest CLI (`nest build` / `nest start --watch`) — no custom webpack config.
- Frontend: Vite (`react-ts` template) — simpler than CRA, no ejecting needed.
- Plain `npm` in each of the two projects — no monorepo build tool, consistent with §1.
- ESLint + Prettier configured separately per project (frontend needs `eslint-plugin-react-hooks`; backend needs `@typescript-eslint` + Nest's recommended rules) — not shared, since the two runtimes differ enough that a shared config would add indirection without real benefit at this size.

---

## 4. Development Phases

Each phase is independently verifiable; complete and verify one before starting the next.

1. **Repo & tooling scaffolding** — `git init`, root `.gitignore`/`README.md` stub, `nest new backend`, `npm create vite@latest frontend -- --template react-ts`, ESLint+Prettier in both.
   *Verify:* `npm run lint` passes in both projects; initial commit made.

2. **Backend: database & migrations** — add `typeorm`, `@nestjs/typeorm`, `pg`; configure `data-source.ts` from env vars; write the `Todo` entity and the initial migration (§5); run it against a real local Postgres.
   *Verify:* migration applies cleanly, `\d todos` matches the schema, re-running is a no-op.

3. **Backend: Todos REST API** — build `TodosModule` (controller/service/DTOs), global `ValidationPipe`, Nest's built-in exceptions for errors, implement all endpoints (§6), add `@nestjs/swagger` and expose `/docs`.
   *Verify:* every endpoint exercised via Swagger UI/curl; correct status codes for happy path, validation errors, and 404s.

4. **Backend: tests** — unit tests for `TodosService` against a mocked `Repository` (create/find/update-not-found/delete-not-found); one e2e spec covering create→list→update→delete against a real test DB.
   *Verify:* `npm test` and `npm run test:e2e` pass.

5. **Frontend: scaffold & API layer** — install `@tanstack/react-query`, define the `Todo` type, write `api/client.ts` and `api/todos.ts`.
   *Verify:* app fetches and renders the raw todo list from the running backend.

6. **Frontend: UI** — build `TodoForm`, `TodoList`, `TodoItem` (checkbox toggle, inline title edit, delete) and the hooks in `hooks/useTodos.ts`.
   *Verify:* manual browser pass — create/edit/complete/delete all work end-to-end.

7. **Frontend: tests** — Vitest + React Testing Library for `TodoForm` (rejects empty title) and `TodoItem` (toggle/delete callbacks fire), API layer mocked.
   *Verify:* `npm test` passes.

8. **Dockerize** — write backend/frontend Dockerfiles (multi-stage, §8) and root `docker-compose.yml` wiring postgres+backend+frontend.
   *Verify:* `docker compose up` from a clean checkout brings up all three services; full CRUD works through the browser and persists in Postgres.

9. **Docs & polish** — root `README.md` (architecture overview, prerequisites, `docker compose up`, how to run migrations, Swagger link, how to run tests); finalize `.env.example` files.
   *Verify:* a fresh clone + documented steps produces a working stack with no undocumented manual steps.

---

## 5. Database Schema Proposal

Single table, no `users` table.

```sql
CREATE TABLE todos (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    completed   BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- **`id`**: plain `SERIAL` integer, not UUID. No enumeration/multi-tenant concern in a single-user local app, and `SERIAL` avoids pulling in a Postgres extension purely for cosmetic reasons.
- **`title`**: required, length-bounded as a DB-level sanity constraint (real validation lives in the API layer, §6). No `description`/`priority`/`due_date`/`tags` — none were requested; easy to add later via migration if actually needed (§10).
- **`completed`**: boolean, defaults false — a binary flag is sufficient, no separate status enum needed.
- **`created_at`/`updated_at`**: standard audit columns; `updated_at` maintained at the ORM level (`@UpdateDateColumn()`), not a DB trigger — simpler, adequate at this scale.
- **Indexes**: none beyond the primary key. A personal todo list will hold at most a few hundred rows; indexing `completed`/`created_at` now would optimize for a scale this app won't reach.
- **`users` table: deliberately excluded from v1.** The app is single-user/no-auth; adding `users` + a `todos.user_id` FK now would build for a multi-tenant future with no auth layer to back it. That's the right place to introduce it if/when auth is added later (§10) — not before.

---

## 6. API Endpoint Design

Base path: `/todos`. All bodies/responses are JSON.

| Method | Route | Purpose | Success | Errors |
|---|---|---|---|---|
| GET | `/todos` | List all todos | 200, `TodoResponseDto[]` | — |
| POST | `/todos` | Create a todo | 201, `TodoResponseDto` | 400 (validation) |
| GET | `/todos/:id` | Get one todo | 200, `TodoResponseDto` | 404 |
| PATCH | `/todos/:id` | Update title and/or completed | 200, `TodoResponseDto` | 400, 404 |
| DELETE | `/todos/:id` | Delete a todo | 204, no body | 404 |

No separate "complete" endpoint (e.g. `PATCH /todos/:id/complete`) — toggling completion is a partial update of the `completed` field, so it reuses the generic `PATCH`. `GET /todos/:id` is kept for REST completeness and costs nothing extra since `PATCH`/`DELETE` already need a "find or 404" lookup internally.

DTO shapes:

```ts
// CreateTodoDto
{ title: string }               // @IsString() @IsNotEmpty() @MaxLength(255)

// UpdateTodoDto  (PartialType(CreateTodoDto) + completed, all optional)
{ title?: string; completed?: boolean }

// TodoResponseDto
{
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;   // ISO timestamp
  updatedAt: string;
}
```

Error handling relies on Nest's built-ins: `NotFoundException` → 404 with `{ statusCode, message, error }`; the global `ValidationPipe` → 400 with per-field messages. No custom exception filter unless a different error shape is specifically wanted later.

---

## 7. Frontend Component Structure

```
App.tsx
 └─ TodoForm            (create new todo; local useState for input value)
 └─ TodoList            (useQuery(['todos'], getTodos); loading/error/empty states)
     └─ TodoItem × N    (checkbox → toggle mutation; title → inline edit on click;
                          delete button → delete mutation)
```

- **API calls** live exclusively in `api/todos.ts` (raw fetch functions) and `hooks/useTodos.ts` (React Query wrappers: `useTodosQuery`, `useCreateTodoMutation`, `useUpdateTodoMutation`, `useDeleteTodoMutation`). Components call the hooks, never `fetch` directly.
- **State flow**: React Query's `['todos']` cache is the single source of truth for server data; every mutation's `onSuccess` calls `invalidateQueries(['todos'])`, triggering an automatic refetch and re-render — no manual state syncing between components. Local `useState` is reserved for ephemeral UI-only state (form input, per-item edit-mode flag). The tree is only 3 levels deep, so there's no prop-drilling problem to justify Context or a global store.
- **Editing UX**: inline edit inside `TodoItem` (click title → becomes text input → Enter/blur saves, Escape cancels) rather than a modal or route — the simplest option that satisfies "edit."

---

## 8. Docker Strategy

Per-service **multi-stage Dockerfiles** using a build `target` to select dev vs. build/runtime (avoids maintaining separate `Dockerfile.dev`/`Dockerfile.prod`):

- `backend/Dockerfile`: `deps` (npm ci) → `dev` (`nest start --watch`, source bind-mounted) → `build` (`npm run build`) → `runtime` (copies `dist` + prod `node_modules`, `CMD node dist/main.js`). Compose uses `target: dev`.
- `frontend/Dockerfile`: `deps` → `dev` (`vite --host 0.0.0.0`, source bind-mounted, HMR works through the container) only. An earlier `build`/`runtime` (`nginx:alpine` serving `dist/`) stage was dropped once a root-level `nginx` service was added to `docker-compose.yml` as the single reverse proxy for both `frontend` and `backend` — keeping a second, dormant nginx baked into the frontend image was redundant. The frontend now reaches the API via that proxy (`VITE_API_URL=/api`, relative) instead of a hardcoded backend URL.

**`docker-compose.yml`** (single file — no prod compose variant, since deployment is out of scope):

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env_file: .env
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck: pg_isready
    ports: ["5432:5432"]     # convenience for local psql/DBeaver access

  backend:
    build: { context: ./backend, target: dev }
    env_file: [.env, ./backend/.env]
    volumes:
      - ./backend:/app
      - /app/node_modules      # anonymous volume, prevents host node_modules clobbering
    ports: ["3000:3000"]
    depends_on: { postgres: { condition: service_healthy } }

  frontend:
    build: { context: ./frontend, target: dev }
    env_file: ./frontend/.env
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports: ["5173:5173"]
    depends_on: [backend]

volumes:
  pgdata:
```

- **Migrations** run as an explicit, documented command (`docker compose exec backend npm run migration:run`) rather than auto-running on every container start — more transparent for a reference project and avoids accidental migration runs on every `docker compose up`.
- **Env vars**: root `.env` (gitignored, `.env.example` committed) holds `POSTGRES_USER/PASSWORD/DB`; `backend/.env.example` documents `DATABASE_URL` (or discrete host/port/user/pass/db via `@nestjs/config`) plus `PORT`; `frontend/.env.example` documents `VITE_API_URL=http://localhost:3000`.
- **Volumes**: named `pgdata` for Postgres persistence; bind mounts for both app source trees for hot reload; anonymous `node_modules` volumes per service so the container's installed deps aren't shadowed by host `node_modules`.

---

## 9. Testing Strategy

**Backend**
- **Highest value**: `TodosService` unit tests against a mocked `Repository` — this is where the actual business logic lives (not-found → throw, create/update/delete happy paths).
- **Lower value**: dedicated controller unit tests, since controllers are thin pass-throughs to the service. A couple can stay as reference examples of the pattern, but aren't treated as required coverage.
- **DTO validation**: not worth re-testing decorator-by-decorator; one e2e assertion that an empty-title POST returns 400 confirms the pipe is wired correctly.
- **E2E — minimal but warranted**: one supertest spec covering create→list→update→delete against a real test Postgres. Cheap to write, and the only thing that actually proves module wiring + ValidationPipe + DB round-trip work together.

**Frontend**
- **Worth testing**: `TodoForm` (won't submit empty title), `TodoItem` (checkbox/delete fire the right callback/mutation), with the API layer mocked so no network call happens.
- **Not warranted for v1**: browser E2E tests (Playwright/Cypress) — disproportionate setup/maintenance cost for a small reference CRUD app versus component tests + manual verification in Phases 6/8. Listed as a deliberate omission, not an oversight (see §10).

---

## 10. Possible Future Improvements (explicitly deferred)

- **Auth**: multi-user support, login, JWT/session handling, plus the `users` table + `todos.user_id` FK excluded in §5.
- **RabbitMQ** / async event-driven features — carried over from the original brainstorm, not needed for a single-user CRUD app.
- **CI/CD pipeline** (GitHub Actions running lint/test/build on PRs, automated deploys).
- **AWS deployment** — the Docker `runtime` stages in §8 are written so this stays possible later without rework, but no deployment tooling is built now.
- **Additional todo features**: due dates, priorities, tags/categories, filtering/sorting, pagination — add only once there's an actual need.
- **AI features** (natural-language entry, smart suggestions) — from the old notes.md brainstorm, unrelated to this scoped plan.
- **Production-hardened Compose** (reverse proxy, TLS, prod-specific compose file) beyond the dev setup in §8.
- **Browser E2E tests** (Playwright/Cypress) if the app's surface area grows enough to justify it.

---

## Verification Summary

End-to-end confidence that the plan was executed correctly comes from: `npm run lint` clean in both projects; `npm test` / `npm run test:e2e` passing in the backend; `npm test` passing in the frontend; and — the definitive check — `docker compose up` from a clean checkout, then using the browser UI at `http://localhost:5173` to create, edit, complete, and delete a todo, confirming each change persists in Postgres (e.g. by restarting the containers and seeing data survive) and is visible via Swagger at `http://localhost:3000/docs`.
