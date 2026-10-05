# Contributing to IVMS

Thanks for your interest in IVMS! Bug reports, fixes, features, docs and tests are all welcome.

IVMS is licensed under the [GNU AGPL-3.0](LICENSE). Before your first pull request can be merged, you need to accept
the [Contributor License Agreement](CLA.md) (CLA). You keep the copyright in your work; the CLA lets the maintainer
also distribute it under other license terms. A bot comments on your pull request with the sentence to post; you
only do this once.

## Before you start

- **Bugs**: open an issue with steps to reproduce, what you expected, what happened, and your OS / browser / camera model if relevant.
- **Features or larger changes**: open an issue first to discuss the idea, so you don't spend time on something that may not be merged.
- **Small fixes** (typos, docs, obvious bugs): just send a pull request.
- **Security issues**: do not open a public issue. Report them privately through the repository's **Security** tab (*Report a vulnerability*).

## Set up your environment

Requirements: [uv](https://docs.astral.sh/uv/), Node.js (LTS), Docker.

```bash
git clone https://github.com/<your-user>/IVMS.git   # your fork
cd IVMS
uv run poe setup          # install deps, git hooks, create .env
uv run poe infra          # start PostgreSQL, Redis, MediaMTX (docker compose)
uv run poe db-deploy      # apply database migrations
uv run poe create-user admin
uv run poe dev            # backend on :8000, frontend on :3000
```

Run `uv run poe` to list every task. See the [README](README.md) for details on the database and streaming.

## Project layout

| Path               | What                                                                 | More                                   |
| ------------------ | -------------------------------------------------------------------- | -------------------------------------- |
| `backend/ivms/`    | Python / FastAPI API, one package per feature under `features/`      | [docs/backend-api.md](docs/backend-api.md) |
| `frontend/`        | React + Vite client, one module per feature under `src/modules/`     | [frontend/README.md](frontend/README.md) |
| `db/prisma/`       | Database schema and migrations (Prisma is used for migrations only)  | [README](README.md#database--cache)    |
| `tests/`           | Backend tests: `unit/` (no services) and `integration/` (needs `poe infra`) |                                 |
| `scripts/`, `packaging/`, `deploy/` | Dev tasks, desktop (macOS / Windows) and Docker builds, install bundles | [docs/install](docs/install/README.md) |

Both backend and frontend follow **MVC**. Please keep new code in the same shape:

- **Backend**: `features/<name>/model.py` (data access), `view.py` (request / response schemas), `controller.py` (routes and logic).
- **Frontend**: `src/modules/<name>/XModel.js`, `XView.jsx`, `XController.js`, assembled in `index.js`. Controllers have no DOM or React code so they can be unit tested.

## Making changes

1. Branch from `develop` (not `main`): `git checkout -b feat/short-description develop`.
2. Keep each pull request focused on one change. Match the style of the surrounding code.
3. Add or update tests for what you change:
   - backend: `tests/unit/...` with pytest (use fakes, no real services), `tests/integration/...` when the database is involved;
   - frontend: `*.test.js` next to the controller, with Vitest.
4. Database changes: edit `db/prisma/schema.prisma`, then `uv run poe db-migrate --name <change>` and commit the generated migration. Never edit a migration that is already merged.
5. Update the docs (`README.md`, `docs/`, `frontend/README.md`) when behavior, endpoints or setup change.
6. Never commit secrets or `.env`. Add new settings to `.env.example` with a safe default.

## Check before pushing

These are the same checks CI runs on every pull request:

```bash
uv run poe lint               # pre-commit: ruff, prettier, clang-format, trailing whitespace, secret scan
uv run poe test-unit          # backend unit tests
uv run poe test-integration   # backend integration tests (needs `poe infra`)
cd frontend && npm test && npm run build
```

The git hooks installed by `poe setup` run the lint step on each commit. Ruff fixes most Python issues automatically;
for the frontend, `npm run format` applies prettier.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short summary in the imperative>
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`, `ci`, `build`. Examples:

```
feat(devices): add ONVIF discovery
fix(auth): reject expired tokens on refresh
docs: explain MediaMTX port settings
```

## Pull requests

- Open the pull request against `develop`.
- Describe **what** changed and **why**, and link the related issue (`Closes #123`).
- Add screenshots or a short recording for UI changes.
- Accept the [CLA](CLA.md) when the bot asks (first pull request only), and make sure CI is green. A maintainer will review it; please answer review comments with new commits instead of force-pushing during review.
- Once approved, the maintainer squash-merges it. `develop` is merged into `main` for releases.

## Releases (maintainers)

1. On `develop`, set the new `version` in `pyproject.toml` (for example `0.2.0`, or `0.2.0-rc.1` for a pre-release),
   run `uv lock`, and merge `develop` into `main`.
2. Tag `main` and push the tag:

   ```bash
   git checkout main && git pull
   git tag v0.2.0 && git push origin v0.2.0
   ```

The [Release workflow](.github/workflows/release.yml) builds the Docker image (pushed to `ghcr.io`), the macOS `.dmg`
files and the Windows installer, and publishes them as a GitHub Release. To test the builds without publishing, run
the workflow manually from the Actions tab. Local builds: `scripts/build_docker.sh`, `scripts/build_macos.sh`,
`scripts/build_windows.ps1`.

## Code of conduct

Be respectful and constructive. Assume good intent, keep feedback about the code, and help newcomers get started.
