# IVMS
Turning ordinary IP cameras into smart cameras: an IVMS that runs AI analytics on any RTSP stream, no hardware upgrade required.


## Development

Requirements: [uv](https://docs.astral.sh/uv/), Node.js (LTS), Docker.

```bash
uv run poe setup   # install deps, git hooks, create .env
uv run poe infra   # start supporting services (docker-compose.yml)
uv run poe dev     # run backend + frontend
```

Run `uv run poe` to list all tasks (`test`, `lint`, `infra-down`, ...).

### Backend API

- Python / FastAPI in [backend/ivms/](backend/ivms/), one package per feature under `features/`. Design and endpoint list: [docs/backend-api.md](docs/backend-api.md).
- Runs on http://localhost:8000 (`uv run poe dev backend`); interactive docs at http://localhost:8000/api/v1/docs. The Vite dev server proxies `/api` to it.

### Database & cache

- **PostgreSQL 17**: main database. URL: `DATABASE_URL` in `.env`.
- **Redis 7**: cache only (no persistence, LRU eviction). URL: `REDIS_URL` in `.env`.
- **Prisma** (`db/`): migration tool only. The backend does not use Prisma Client.

The schema lives in [db/prisma/schema.prisma](db/prisma/schema.prisma); migrations go in `db/prisma/migrations/` (commit them).

```bash
uv run poe db-migrate --name add_cameras   # edit schema.prisma first; creates + applies a migration
uv run poe db-deploy                       # apply pending migrations (CI / staging / prod)
uv run poe db-status                       # what is applied
uv run poe db-reset                        # drop local DB and re-apply everything
uv run poe db-studio                       # browse data
```

### Streaming & AI

- **MediaMTX** (`docker/mediamtx/mediamtx.yml`): stream relay. It pulls each camera once and serves it to the AI service (RTSP) and the browser (WebRTC/HLS). The backend adds and removes cameras through its Control API (`MEDIAMTX_API_URL`, default `http://localhost:9997`).
  - Test stream without a camera: `rtsp://localhost:8554/demo`. Open http://localhost:8889/demo for WebRTC.
- **AI service** ([ai/](ai/README.md)): C++ / DeepStream inference on the GPU. Needs an NVIDIA GPU on Linux or a Jetson, so it is not started by `poe infra`. Run it with `uv run poe ai`.

If a port is already in use, change the matching `*_PORT` **and** URL in `.env`.
