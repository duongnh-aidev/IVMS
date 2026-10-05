# IVMS backend: REST API design

Status: draft · Owner: backend · Implements the data the frontend modules mock today
(`frontend/src/shared/services/*`, `frontend/src/modules/*/…Model.js`).

## 1. Architecture

```
Browser (React)  ──REST /api/v1──▶  Backend (FastAPI, Python)  ──SQL──▶  PostgreSQL (schema: db/prisma)
      │                                │   │                     ──────▶  Redis (cache only)
      │ WebRTC / HLS                   │   └── Control API ─────────────▶  MediaMTX (stream relay)
      └────────────────────────────────┼──────────────────────────────▶  MediaMTX
                                       └── internal events ◀──────────  AI service
```

- **Backend** owns all business data and is the only writer to PostgreSQL.
- **Video never goes through the backend.** The backend registers each camera as a MediaMTX path
  and hands the browser a WebRTC/HLS URL; the AI service reads the same path over RTSP.
- **Prisma is the migration tool only** (`db/prisma/schema.prisma`). The backend uses `asyncpg`
  with hand-written SQL inside each feature's model.

### Stack

| Concern        | Choice                                                        |
| -------------- | ------------------------------------------------------------- |
| HTTP framework | FastAPI + Uvicorn                                             |
| Validation     | Pydantic v2 (camelCase JSON, snake_case Python)               |
| Database       | asyncpg connection pool, raw SQL per model                    |
| Cache          | Redis (dashboard aggregates, MediaMTX status, rate limits)    |
| Auth           | JWT access token (HS256, `ACCESS_TOKEN_TTL_SECONDS`, default 30 min), Argon2id password hashes. No refresh token: when it expires the user signs in again |
| Secrets        | Camera passwords encrypted with Fernet (`SECRET_KEY`)         |
| Outbound HTTP  | httpx (MediaMTX Control API)                                  |

## 2. Code structure: MVC, one package per feature

```
backend/ivms/
├── __main__.py            # `python -m ivms` → uvicorn
├── app.py                 # create_app(): middleware, error handlers, mounts feature routers
├── core/                  # cross-cutting, feature-agnostic
│   ├── config.py          # Settings from env / .env
│   ├── db.py              # asyncpg pool, `Conn` dependency, transactions
│   ├── errors.py          # AppError hierarchy → application/problem+json
│   ├── schemas.py         # ApiModel (camelCase), Page[T]
│   ├── crypto.py          # encrypt/decrypt stored secrets
│   └── deps.py            # shared FastAPI dependencies (current user, permission checks)
└── features/
    ├── devices/           # reference implementation (done)
    │   ├── __init__.py    # exports `router` (public API of the feature)
    │   ├── model.py       # Model: data access, SQL only
    │   ├── view.py        # View: request/response representation (Pydantic, camelCase on the wire)
    │   └── controller.py  # Controller: business rules + orchestration (class), then the HTTP routes
    ├── device_groups/
    ├── streams/           # MediaMTX client + live stream URLs
    ├── auth/
    ├── users/             # users, roles, permissions, scopes
    ├── audit/
    ├── recording/
    ├── storage/
    ├── playback/          # recordings timeline, bookmarks, exports
    ├── events/            # AI events
    ├── notifications/
    ├── dashboard/
    └── system/            # health, version/licence, preferences
```

Rules:

1. **Layers point one way:** `controller → model`, and the controller returns `view` objects. The
   controller class holds the rules and has no HTTP; the route functions under it only parse the
   request, call the class and shape the response. Models never raise HTTP errors.
2. **Features talk through controllers or small interfaces, never through another feature's
   model.** Example: `devices.controller` depends on a `StreamRelay` protocol that
   `streams.mediamtx` implements, so devices can be unit-tested with a fake.
3. A feature is mounted in `app.py` with one line. Deleting a feature folder plus that line removes it.
4. Tests mirror the layout: `tests/unit/features/<feature>/`, `tests/integration/features/<feature>/`.

## 3. API conventions

| Topic          | Convention |
| -------------- | ---------- |
| Base path      | `/api/v1`. Breaking changes → `/api/v2`. |
| Resources      | Plural kebab-case nouns: `/devices`, `/device-groups`, `/audit-logs`. |
| IDs            | UUID (`gen_random_uuid()`). Human-readable codes (`CAM-01`) are separate read-only fields. |
| JSON           | camelCase fields; timestamps ISO 8601 UTC (`2026-10-03T09:12:00Z`); dates `YYYY-MM-DD`. |
| Methods        | `GET` read · `POST` create (201 + `Location`) · `PATCH` partial update · `PUT` replace a whole sub-resource (schedule, permissions) · `DELETE` (204). |
| Actions        | When a verb does not map to CRUD, use a sub-resource: `POST /devices/probe`, `POST /events/{id}/acknowledge`. |
| Lists          | `?limit=50&offset=0` → `{ "items": [...], "total": 123, "limit": 50, "offset": 0 }`. Max `limit` 200. |
| Large lists    | Events and audit logs use cursor pagination: `?limit=&cursor=` → `{ items, nextCursor }`. |
| Filter / sort  | Query params named after fields (`?status=online&groupId=…&q=lobby`), `?sort=-createdAt`. |
| Errors         | RFC 9457 `application/problem+json`: `{ type, title, status, detail, errors? }`. Validation → 422 with `errors: [{ field, message }]`. |
| Long jobs      | `202 Accepted` + job resource (`/exports/{id}`) the client polls or receives over WebSocket. |
| Auth           | `Authorization: Bearer <access token>` on every route except `/auth/login` (later also `/system/health`). Missing, invalid or expired token → 401 problem+json with `WWW-Authenticate: Bearer`; an expired token's `detail` is "Session expired, please sign in again". |
| Authorization  | Each route declares one permission key (see §5); device-scoped routes also filter by the role's device groups. |
| Realtime       | Out of REST scope: `GET /api/v1/ws` (WebSocket) pushes `device.status`, `event.created`, `notification.created`, `export.updated`. |

Status codes used: 200, 201, 202, 204, 400, 401, 403, 404, 409 (conflict, e.g. duplicate name or
deleting a non-empty group), 422, 423 (account locked), 429, 502 (MediaMTX/camera unreachable).

## 4. Features and endpoints

Legend: **Perm** is the permission key required (see §5). `—` = any signed-in user.
**Screen** is the frontend module that consumes the endpoint.

### 4.1 auth · screen: login, settings

| Method | Path | Perm | Purpose |
| ------ | ---- | ---- | ------- |
| POST | `/auth/login` | public | ✅ `{ username, password }` → `{ accessToken, tokenType: "bearer", expiresIn, user }`. Username is case-insensitive. 401 "Wrong username or password" (same for unknown user), 401 for a non-`active` account. Later: `remainingAttempts`, 423 after 5 failures. |
| GET | `/auth/me` | — | ✅ Current user. Later: + role, effective permissions and scopes. |
| POST | `/auth/password` | — | Change own password `{ currentPassword, newPassword }`. |

### 4.2 users · screen: users

| Method | Path | Perm | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/users` | users | `?role=&status=&q=` |
| POST | `/users` | users | Invite `{ name, username, email, role }` → status `invited`. |
| GET | `/users/{id}` | users | |
| PATCH | `/users/{id}` | users | Name, role, `status: active \| locked`. |
| DELETE | `/users/{id}` | users | Cannot delete yourself or the last admin (409). |
| POST | `/users/{id}/invitation` | users | Resend invite. |
| GET | `/permissions` | users | Catalogue: `[{ key, label, description }]`. |
| GET | `/roles` | users | `[{ key, name, locked, userCount, permissions[], scopes[] }]` |
| PUT | `/roles/{key}/permissions` | users | Replace permission keys. 409 for `admin` (locked). |
| PUT | `/roles/{key}/scopes` | users | Replace device-group IDs the role can see. |

### 4.3 audit · screen: users → activity

| Method | Path | Perm | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/audit-logs` | users | `?category=signin\|export\|change&userId=&from=&to=&cursor=` → `{ time, user, action, target, ip }` |

Written by other features through `audit.service.record(...)`, never via HTTP.

### 4.4 device-groups · screen: devices (sidebar tree), users (scopes)

| Method | Path | Perm | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/device-groups` | live | Flat list `{ id, name, parentId, depth, deviceCount }`, ordered for a tree. |
| POST | `/device-groups` | devices | `{ name, parentId? }` |
| PATCH | `/device-groups/{id}` | devices | Rename / move (no cycles: 409). |
| DELETE | `/device-groups/{id}` | devices | 409 if it still has devices or children. |

### 4.5 devices · screen: devices, deviceEditor, liveView, dashboard  ✅ implemented

| Method | Path | Perm | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/devices` | live | `?groupId=` (includes sub-groups) `&status=online\|offline\|error&q=&sort=&limit=&offset=` |
| POST | `/devices` | devices | `{ name, host, port=554, path, username, password, groupId? }` → 201. Registers the MediaMTX path. |
| GET | `/devices/{id}` | live | |
| PATCH | `/devices/{id}` | devices | Any subset of the create fields; omit `password` to keep it, `""` clears it. Connection change → MediaMTX path updated. |
| DELETE | `/devices/{id}` | devices | Removes the MediaMTX path. Recordings are kept until retention expires. |
| POST | `/devices/probe` | devices | Test an RTSP connection (RTSP DESCRIBE, Basic/Digest auth): `{ host, port, path, username, password?, deviceId? }` → `{ reachable, codec, error }`. With `deviceId` and no `password`, the stored password is used (edit form). Resolution/fps need ffprobe: later. |

Device response:

```json
{
  "id": "6f1c…", "code": "CAM-01", "name": "Front Gate",
  "host": "192.168.1.101", "port": 554, "path": "/Streaming/Channels/101",
  "username": "admin", "hasPassword": true,
  "groupId": "…", "model": "IPC-D2140", "firmware": "V2.3.1",
  "status": "online", "lastSeenAt": "2026-10-03T09:12:00Z",
  "createdAt": "…", "updatedAt": "…"
}
```

The password is write-only: stored encrypted (it must be decryptable to build the RTSP URL for
MediaMTX) and never returned.

### 4.6 streams · screen: liveView

| Method | Path | Perm | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/devices/{id}/stream` | live | `{ webrtcUrl, hlsUrl, quality: main\|sub }` (`?quality=sub` for grid view). |
| GET | `/devices/{id}/snapshot` | live | `image/jpeg` of the current frame. |
| POST | `/devices/{id}/ptz` | ptz | `{ action: pan\|tilt\|zoom\|stop\|preset, speed, preset? }` (ONVIF, later phase). |

Device `status` is refreshed by a background task that polls MediaMTX `/v3/paths/list`
(cached in Redis) and pushes `device.status` over WebSocket.

### 4.7 recording · screen: recording

| Method | Path | Perm | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/recording/templates` | playback | `[{ name, grid }]` (Business hours, 24/7, Motion only, Nights & weekends). |
| GET | `/recording/schedules/{target}` | playback | `target` = `all`, a group ID or a device ID. Falls back to the nearest parent. |
| PUT | `/recording/schedules/{target}` | record | `{ grid: 7×24 of "C"\|"M"\|"O", preEventSec, postEventSec, stream: main\|sub }` |
| DELETE | `/recording/schedules/{target}` | record | Back to inheriting from the parent. |
| GET | `/recording/holidays` | playback | |
| POST | `/recording/holidays` | record | `{ date, name, mode }` |
| DELETE | `/recording/holidays/{id}` | record | |

### 4.8 storage · screen: storage, dashboard

| Method | Path | Perm | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/storage/locations` | record | `{ id, name, kind: local\|smb\|nfs, path, role: recording\|backup, capacityBytes, usedBytes, status }` |
| POST | `/storage/locations` | record | Validates the path is writable (400 otherwise). |
| PATCH | `/storage/locations/{id}` | record | |
| DELETE | `/storage/locations/{id}` | record | 409 if it is the last recording location. |
| GET | `/storage/summary` | record | `{ totalBytes, usedBytes, daysAvailable }` |
| GET | `/storage/policy` | record | `{ retentionDays, onFull: overwrite\|stop }` |
| PUT | `/storage/policy` | record | |

### 4.9 playback · screen: playback

| Method | Path | Perm | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/recordings/calendar` | playback | `?deviceIds=&month=2026-10` → dates that have footage. |
| GET | `/devices/{id}/recordings` | playback | `?date=2026-10-01` → `{ segments: [{ start, end }] }` |
| GET | `/devices/{id}/playback` | playback | `?start=…` → `{ url }` (MediaMTX playback server). |
| GET | `/bookmarks` | playback | `?date=&deviceId=` |
| POST | `/bookmarks` | playback | `{ time, deviceIds[], note }` |
| PATCH / DELETE | `/bookmarks/{id}` | playback | Own bookmarks only. |
| POST | `/exports` | export | `{ deviceId, start, end, format: mp4\|avi, includeOverlay }` → 202 + export job. |
| GET | `/exports` | export | Own jobs: `{ id, status: queued\|running\|done\|failed, progress, sizeBytes }` |
| GET | `/exports/{id}` | export | |
| GET | `/exports/{id}/download` | export | The file (`Content-Disposition: attachment`). |
| DELETE | `/exports/{id}` | export | Cancel or delete. |

### 4.10 events (AI analytics) · screen: playback, dashboard

| Method | Path | Perm | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/events` | playback | `?deviceId=&type=&severity=&from=&to=&acknowledged=&cursor=` |
| GET | `/events/{id}` | playback | Includes `snapshotUrl`, bounding boxes, rule/zone. |
| GET | `/events/{id}/snapshot` | playback | `image/jpeg` |
| POST | `/events/{id}/acknowledge` | ack | `{ note? }` |
| POST | `/internal/events` | service token | Ingest from the AI service (not exposed publicly). |

Event types: `motion`, `line_crossing`, `intrusion`, `tampering`, `signal_loss`, `recording_error`.
Severity: `info`, `warning`, `critical` (tampering, signal loss → critical).

### 4.11 notifications · screen: notifications, shell (badge)

| Method | Path | Perm | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/notifications` | — | `?unread=true&cursor=` → `{ id, time, title, description, kind, target, read }` |
| GET | `/notifications/unread-count` | — | `{ count }` |
| PATCH | `/notifications/{id}` | — | `{ read: true }` |
| POST | `/notifications/read-all` | — | |

Created by `events`, `devices` (offline), `storage` (almost full) and `system` (update available),
filtered by the user's notification preferences and device scopes.

### 4.12 dashboard · screen: dashboard

| Method | Path | Perm | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/dashboard/summary` | live | `?date=` → `{ deviceHealth: { total, online, offline, error }, eventsPerHour[24], recentEvents[], disks[] }`. Cached in Redis 15 s. |

### 4.13 system · screen: settings, help

| Method | Path | Perm | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/system/health` | public | `{ status, database, redis, mediamtx }` (used by Docker / load balancer). |
| GET | `/system/info` | — | `{ version, edition, licence: { validUntil, channels }, latestVersion }` |
| GET | `/me/preferences` | — | Language, start screen, time format, stream quality, notification toggles. |
| PATCH | `/me/preferences` | — | Partial update. |

## 5. Authorization model

Permission keys (match `PERMISSIONS` in `frontend/src/modules/users/UsersModel.js`):

| Key | Grants |
| --- | ------ |
| `live` | Live view, device and group lists, dashboard |
| `playback` | Recordings, events, bookmarks, schedules (read) |
| `export` | Clip export |
| `ptz` | PTZ control |
| `ack` | Acknowledge events |
| `devices` | Create / edit / delete devices and groups |
| `record` | Recording schedules, holidays, storage |
| `users` | Users, roles, audit log |

- Roles: `admin` (locked: every permission, every device), `operator`, `viewer`; editable lists.
- **Scopes:** a role lists device-group IDs; a user sees devices in those groups and their
  descendants. Applied in repositories as a `group_id = ANY($scope_ids)` filter, so list endpoints
  never leak out-of-scope devices, and a direct `GET /devices/{id}` outside scope returns 404, not 403.

## 6. Data model (PostgreSQL)

| Table | Key columns | Feature |
| ----- | ----------- | ------- |
| `device_groups` | id, name, parent_id → device_groups | device_groups |
| `devices` | id, seq (→ code), name, host, port, path, username, password_enc, group_id, model, firmware, status, last_seen_at | devices |
| `users` | ✅ id, name, username ⓤ (lowercase), password_hash, status, last_login_at. Later: email, role_key, failed_logins | auth (→ users) |
| `roles` | key, name, locked | users |
| `role_permissions` | role_key, permission | users |
| `role_scopes` | role_key, group_id | users |
| `audit_logs` | id, at, user_id, action, category, target, ip | audit |
| `recording_schedules` | target ⓤ, grid (jsonb), pre_event_sec, post_event_sec, stream | recording |
| `recording_holidays` | id, date ⓤ, name, mode | recording |
| `storage_locations` | id, name, kind, path, role, capacity_bytes, used_bytes, status | storage |
| `recording_segments` | id, device_id, location_id, started_at, ended_at, file_path, size_bytes | playback |
| `bookmarks` | id, user_id, at, device_ids uuid[], note | playback |
| `exports` | id, user_id, device_id, start_at, end_at, format, status, progress, file_path | playback |
| `events` | id, device_id, type, severity, at, data (jsonb), snapshot_path, acknowledged_by, acknowledged_at | events |
| `notifications` | id, user_id, kind, title, description, target, created_at, read_at | notifications |
| `settings` | key ⓤ, value (jsonb): storage policy, licence, … | system / storage |
| `user_preferences` | user_id ⓤ, value (jsonb) | system |

`events`, `recording_segments` and `audit_logs` grow fast: index on `(device_id, at)` / `(at)` and
partition by month once volume needs it.

## 7. Delivery order

1. ✅ Core (config, DB pool, errors, schemas) + **devices** + **device-groups** + MediaMTX sync.
2. ✅ **auth** (sign-in, JWT on every route; users created with `uv run poe create-user <username>`).
   Next: **users** (CRUD, roles, scopes) → then `core/deps.require()` also checks the permission.
3. **streams** (live URLs, status polling) → frontend Live View on real cameras.
4. **events** ingest from the AI service + **notifications** + WebSocket.
5. **recording** + **storage** + **playback** (segments, bookmarks, exports).
6. **dashboard**, **audit**, **system**.

Each step: Prisma migration → model → controller (unit tests with fakes) → routes (integration
tests against the compose stack) → swap the matching frontend mock service for an API client.
