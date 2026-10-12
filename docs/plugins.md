# Plugins

A plugin is a separately installed Python package that adds features to IVMS. Plugins **only add**:
new routes, permissions, features and database tables in their own schema. They never change or replace
what the core (or another plugin) provides, so the core UI and API look the same with or without them.
The core refuses to start (or migrate) when a plugin breaks that rule.

The backend contract and plugin migrations below are implemented. The event bus and frontend plugins come next.

## Publishing a plugin

Expose a `Plugin` object under the `ivms.plugins` entry point group:

```toml
# pyproject.toml of the plugin package
[project.entry-points."ivms.plugins"]
acme = "acme_ivms:plugin"
```

```python
# acme_ivms/__init__.py
from pathlib import Path

from ivms.plugins import PLUGIN_API_VERSION, Plugin

from . import detections, licence

plugin = Plugin(
    name="acme",
    api_version=PLUGIN_API_VERSION,
    routers=[detections.router],      # mounted under /api/v1, after the core routers
    permissions=["rules"],            # new permission keys, usable with require("rules")
    migrations=Path(__file__).parent / "migrations",  # optional, see "Database" below
    lifespan=detections.lifespan,     # optional async context manager, gets the FastAPI app
    features=licence.enabled,         # () -> feature keys enabled right now
    edition="Enterprise",             # shown while at least one feature is enabled
)
```

When IVMS starts, `create_app()` loads every installed plugin. A plugin that fails to import, is not a
`Plugin`, or targets another `api_version` is logged and skipped, and the app runs without it.

## Rules (checked at startup)

| Rule | On violation |
| ---- | ------------ |
| Plugin names are unique | `PluginError` |
| A permission key is defined once (core keys: `docs/backend-api.md` §5) | `PluginError` |
| A method + path is defined once. `/devices/{id}` and `/devices/{device_id}` count as the same path | `PluginError` |
| Every `require(...)` key is a core or plugin permission | `ValueError` |

## Features and editions

`features` is called on every check, so a plugin can turn features on or off at runtime, for example when
a licence key is entered. No restart is needed.

- Guard a route with `require_feature("acme.detections")`. While the feature is off, the route answers
  `403` problem+json.
- `GET /api/v1/system/info` (public) returns `{ version, edition, features }`. The UI reads it to decide
  which plugin screens to show, and reads it again after a licence change.
- `edition` is `Community` unless a plugin with an `edition` has at least one feature enabled. A plugin
  with no enabled features (for example, no licence) leaves IVMS looking exactly like the Community edition.

## Database

`migrations` is a folder laid out like the core's: `<timestamp>_<name>/migration.sql`, plain SQL, applied in
name order. `python -m ivms migrate` (also run by the Docker image and the desktop app) applies the core
migrations first, then each plugin's, every migration in its own transaction.

```sql
-- acme_ivms/migrations/20261012090000_init/migration.sql
CREATE SCHEMA acme;
CREATE TABLE acme.detections (
    id        BIGSERIAL PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE
);
```

- Keep every table, type and function in a schema named after the plugin. Referencing core tables
  (foreign keys, joins) is fine.
- **Never change the `public` schema** (core tables, columns, indexes, constraints, triggers, types). A
  migration that does is rolled back and `migrate` fails with `changes the core schema: ...`.
- Applied plugin migrations are recorded in `ivms_plugins.migrations`, not in Prisma's
  `_prisma_migrations`. Prisma only manages `public`, so it reports no drift and `prisma migrate dev` keeps
  working in the core repository.
- As with core migrations, never edit one that has been applied: `migrate` refuses to run.
- Removing a plugin leaves its schema in place; drop it by hand if the data is no longer needed.

## Lifespan

A plugin's `lifespan(app)` is entered after the core resources (`app.state.pool`, the MediaMTX client)
are open and exited before they close. Plugins are entered in load order and exited in reverse.

## API plugins may use

`ivms.plugins` is the stable contract (`PLUGIN_API_VERSION` goes up when it breaks). Plugins may also
import `ivms.core.db.Conn`, `ivms.core.deps.require` / `CurrentUserId`, `ivms.core.errors` and
`ivms.core.schemas`. Everything else is internal and can change in any release.

## Packaging

PyInstaller does not bundle entry point metadata by default. A desktop build that includes a plugin
must add `copy_metadata("<plugin distribution name>")` to its spec's `datas`, or the plugin is not found.
