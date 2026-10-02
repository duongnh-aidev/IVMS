# IVMS frontend

React + Vite (JavaScript) client for IVMS, built with the **VIPER** architecture. The UI matches the design
prototypes in `design/` exactly. Data is still mocked.

## Run

```bash
npm install
npm run dev       # http://localhost:3000
npm test          # unit tests (Vitest)
npm run build     # production build -> dist/
npm run format    # prettier
```

From the repo root, `uv run poe dev` starts it together with the backend.

## Architecture: VIPER

Each feature is a module in `src/modules/<name>/` made of:

| Part           | File                | Responsibility                                                                                                                                            | Knows about            |
| -------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **View**       | `XView.jsx`         | Renders the view model. Turns DOM events (pointer position, element size) into plain values. No logic                                                     | its presenter          |
| **Interactor** | `XInteractor.js`    | Use cases and business data: load, validate, save. Talks to shared services (later: the backend API)                                                      | entities, services     |
| **Presenter**  | `XPresenter.js`     | Holds view state. Builds the view model in `present()`. Exposes intent methods (`pin(id)`, `submit()`, ...). **No DOM, no React**, so it is unit-testable | interactor, router     |
| **Entity**     | `shared/entities/*` | Plain domain data (`Device`, groups, ...)                                                                                                                 | —                      |
| **Router**     | `XRouter.js`        | Navigation: switching screens, opening another module, signing out                                                                                        | other modules' `input` |

`index.js` assembles a module and returns `{ presenter, View, input? }`. `input` is the public API that other
modules may call, for example `liveView.input.pin(id)`, `deviceEditor.input.open(id)` and `shell.input.show('playback')`.

```
src/
  main.jsx                 entry
  app/
    App.jsx                login <-> signed-in session
    AppNavigator.js        top-level routes (#/login, #/app)
    container.js           composition root: creates services, builds and wires all modules
  core/
    viper.js               Observable, Presenter base class, usePresenter() hook
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
user event -> View -> presenter.intent() -> interactor -> service (emits change)
                                         -> router -> other module's input
service/interactor change -> presenter.invalidate() -> usePresenter re-renders the View
```

- `Presenter.setState()` works like React's. `observe(...sources)` re-presents whenever an interactor or
  service emits a change.
- `attach()` / `detach()` run when the view mounts and unmounts. They start and stop timers (the playback
  clock, live metrics).
- A session (everything after sign-in) is built fresh by `createSession()`. Signing out discards all state.

### Adding a feature

1. Create `modules/foo/` with an Interactor, a Presenter (extends `Presenter`), a View (`usePresenter(presenter)`),
   a Router if the feature navigates, and an `index.js` builder.
2. Wire it in `app/container.js`. If it is a screen, also add it to `SCREENS` in `modules/shell/ShellPresenter.js`.
3. Test the presenter next to it (`FooPresenter.test.js`). No DOM is needed.

### Connecting the backend

Replace the in-memory services and interactors (`shared/services/*`, `*Interactor.js`) with API calls. Presenters
and views do not change. Async results go through the existing intent → `setState` path (see
`DeviceEditorPresenter.testConnection`).

## Styling

Styles are inline, as in the design. Hover and focus states are classes in `styles/interactions.css`
(`hover-bg-f4f4f4`, `focus-ring`, …). They use `!important` because they override inline styles.
