# syntax=docker/dockerfile:1
# IVMS app image: API + built web UI, migrations applied on start. Multi-arch (linux/amd64, linux/arm64):
# build with scripts/build_docker.sh. Postgres and MediaMTX run next to it (deploy/docker/compose.yml).

# ---- Web UI: built once on the build machine's arch (output is plain JS/CSS) ----
FROM --platform=$BUILDPLATFORM node:22-alpine AS frontend
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---- API ----
FROM python:3.11-slim-bookworm AS app
COPY --from=ghcr.io/astral-sh/uv:0.10 /uv /bin/uv
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    UV_PROJECT_ENVIRONMENT=/app/.venv
WORKDIR /app

# Dependencies first: cached until pyproject.toml / uv.lock change
COPY pyproject.toml uv.lock README.md ./
RUN --mount=type=cache,target=/root/.cache/uv uv sync --locked --no-dev --no-install-project
COPY backend ./backend
RUN --mount=type=cache,target=/root/.cache/uv uv sync --locked --no-dev --no-editable

COPY db/prisma/migrations ./migrations
COPY --from=frontend /src/frontend/dist ./web

RUN useradd --system --uid 10001 --no-create-home ivms
USER ivms

ENV PATH=/app/.venv/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    API_HOST=0.0.0.0 \
    API_PORT=8000 \
    API_RELOAD=false \
    MIGRATIONS_DIR=/app/migrations \
    FRONTEND_DIST=/app/web
EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/v1/system/health', timeout=4)"]

# Apply pending migrations, then serve (exec: uvicorn receives SIGTERM from `docker stop`)
CMD ["sh", "-c", "python -m ivms migrate && exec python -m ivms serve"]
