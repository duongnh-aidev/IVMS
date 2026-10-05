# IVMS frontend

React + Vite (JavaScript) client for IVMS, built with the **MVC** architecture. The UI matches the design
prototypes in `design/` exactly. Sign-in, devices and device groups use the real backend API; the other screens are still mocked.

## Run

```bash
npm install
npm run dev       # http://localhost:3000 (needs the backend on :8000, see below)
npm test          # unit tests (Vitest)
npm run build     # production build -> dist/
npm run format    # prettier
```

From the repo root, `uv run poe dev` starts it together with the backend.

## Architecture: MVC

Each feature is a module in `src/modules/<name>/` made of:

| Part           | File             | Responsibility                                                                                                                                                                                   | Knows about                   |
| -------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| **Model**      | `XModel.js`      | Use cases and business data: load, validate, save. Talks to shared services (later: the backend API)                                                                                             | entities, services            |
| **View**       | `XView.jsx`      | Renders the view model. Turns DOM events (pointer position, element size) into plain values. No logic                                                                                            | its controller                |
| **Controller** | `XController.js` | Holds view state. Builds the view model in `present()`. Exposes intent methods (`pin(id)`, `submit()`, ...), including navigation to other modules. **No DOM, no React**, so it is unit-testable | model, other modules' `input` |

Shared domain data (`Device`, groups, ...) lives in `shared/entities/*` and shared data sources in `shared/services/*`;
both are part of the model layer.

`index.js` assembles a module and returns `{ controller, View, input? }`. `input` is the public API that other
modules may call, for example `liveView.input.pin(id)`, `deviceEditor.input.open(id)` and `shell.input.show('playback')`.

```
src/
  main.jsx                 entry
  app/
    App.jsx                login <-> signed-in session
    AppNavigator.js        top-level routes (#/login, #/app)
    container.js           composition root: creates services, builds and wires all modules
  core/
    mvc.js                 Observable, Controller base class, useController() hook
    events.js              DOM event -> value adapters (withValue, prevented, stopped)
    useElementWidth.js     ResizeObserver hook for views
  modules/
    login/ shell/ liveView/ playback/ devices/ deviceEditor/ dashboard/
    recording/ storage/ users/ notifications/ settings/ help/ systemMonitor/
  shared/
    entities/              domain models
    services/              shared data sources (devices, notifications, metrics, archive, toast)
    ui/                    icons, segmented-control view-model builders
    utils/                 time formatting
  styles/                  fonts (self-hosted Inter), globals, hover/focus classes
```

### Data flow

```
user event -> View -> controller.intent() -> model -> service (emits change)
                                          -> other module's input (navigation)
service/model change -> controller.invalidate() -> useController re-renders the View
```

- `Controller.setState()` works like React's. `observe(...sources)` re-presents whenever a model or
  service emits a change.
- `attach()` / `detach()` run when the view mounts and unmounts. They start and stop timers (the playback
  clock, live metrics).
- A session (everything after sign-in) is built fresh by `createSession()`. Signing out discards all state.

### Adding a feature

1. Create `modules/foo/` with a Model, a Controller (extends `Controller`), a View (`useController(controller)`)
   and an `index.js` builder. Pass the other modules' `input` the controller navigates to (e.g. `shell`).
2. Wire it in `app/container.js`. If it is a screen, also add it to `SCREENS` in `modules/shell/ShellController.js`.
3. Test the controller next to it (`FooController.test.js`). No DOM is needed.

### Backend API

- `shared/api/client.js`: `ApiClient` calls `/api/v1/...` (the Vite dev server proxies `/api` to
  http://localhost:8000), sends `Authorization: Bearer <token>` and turns problem+json errors into `ApiError`
  (its `message` is the server's `detail`, shown to the user as is).
- `shared/services/authService.js`: `AuthService` signs in (`POST /auth/login`) and keeps the token in
  localStorage ("Remember me") or sessionStorage. When the token expires, or the server answers 401, the session
  ends and `AppNavigator` returns to the login screen.
- `shared/services/deviceService.js`: `DeviceService` loads devices and groups once per session and caches them,
  so controllers read them synchronously. Writes (`add`, `update`, `remove`) go to the API, then reload.
  Device ids are the server's UUIDs.

To sign in you need a user on the server: `uv run poe create-user admin` from the repo root.

Still mocked (in-memory services and models): notifications, recording archive, metrics, users, storage,
recording schedules, dashboard events. Replace them the same way. Async results go through intent → `setState`
(see `DeviceEditorController.submit`).

### Tests

Controllers are tested without a DOM or a server. `src/test/fakeApi.js` is an in-memory API with the same paths,
payloads and errors as the backend, seeded with the demo site in `src/test/fixtures.js` (13 cameras, the
Head Office / Warehouse group tree). `loadedDevices()` returns a `DeviceService` over it, already loaded.

## Styling

Styles are inline, as in the design. Hover and focus states are classes in `styles/interactions.css`
(`hover-bg-f4f4f4`, `focus-ring`, …). They use `!important` because they override inline styles.
