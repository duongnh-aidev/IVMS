# IVMS
Turning ordinary IP cameras into smart cameras: an IVMS that runs AI analytics on any RTSP stream, no hardware upgrade required.


## Install

Download IVMS from the [Releases page](https://github.com/duongnh-aidev/IVMS/releases/latest) and follow the guide for your system: [Linux](docs/install/linux.md), [macOS](docs/install/macos.md) or [Windows](docs/install/windows.md). Overview: [docs/install](docs/install/README.md).

## Development

Requirements: [uv](https://docs.astral.sh/uv/), Node.js (LTS), Docker.

```bash
uv run poe setup   # install deps, git hooks, create .env
uv run poe infra   # start supporting services (docker-compose.yml)
uv run poe dev     # run backend + frontend
```

Run `uv run poe` to list all tasks (`test`, `lint`, `infra-down`, ...).

### Backend API

- Python / FastAPI in [backend/ivms/](backend/ivms/), MVC with one package per feature under `features/` (`model.py`, `view.py`, `controller.py`). Design and endpoint list: [docs/backend-api.md](docs/backend-api.md).
- Runs on http://localhost:8000 (`uv run poe dev backend`); interactive docs at http://localhost:8000/api/v1/docs. The Vite dev server proxies `/api` to it.
- Every route needs `Authorization: Bearer <token>` from `POST /api/v1/auth/login`. Create the first user with `uv run poe create-user admin` (after `poe db-deploy`). Tokens last `ACCESS_TOKEN_TTL_SECONDS` (30 min); set it to `5` in `.env` to test expiry. In the API docs, use **Authorize** and paste the token.

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

### Streaming

- **MediaMTX** (`docker/mediamtx/mediamtx.yml`): stream relay. It pulls each camera once and serves it to the AI service (RTSP) and the browser (WebRTC/HLS). The backend adds and removes cameras through its Control API (`MEDIAMTX_API_URL`, default `http://localhost:9997`).
  - Test stream without a camera: `rtsp://localhost:8554/demo`. Open http://localhost:8889/demo for WebRTC.
- **AI analytics** is a separate service and is not part of this repository. Any analytics service can read the camera streams from MediaMTX over RTSP (`MEDIAMTX_RTSP_URL`) and send events back to the backend.

If a port is already in use, change the matching `*_PORT` **and** URL in `.env`.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow, checks and commit conventions.
