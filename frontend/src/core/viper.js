import { useEffect, useSyncExternalStore } from 'react';

/** Minimal change notifier shared by services, interactors and presenters. */
export class Observable {
  #listeners = new Set();

  subscribe = (listener) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  emit() {
    for (const listener of [...this.#listeners]) listener();
  }
}

/**
 * Base presenter: owns the view state, turns entities (via its interactor) into a
 * view model in `present()`, and exposes intent methods the view calls.
 * Presenters never touch the DOM, so they can be unit-tested without React.
 */
export class Presenter extends Observable {
  state = {};
  #viewModel = null;
  #sources = [];

  /** Same semantics as React's setState: object patch, or updater returning a patch / null. */
  setState(update) {
    const patch = typeof update === 'function' ? update(this.state) : update;
    if (patch == null) return;
    this.state = { ...this.state, ...patch };
    this.invalidate();
  }

  /** Re-present when any of these observables (services, interactors) change. */
  observe(...sources) {
    this.#sources.push(...sources.map((source) => source.subscribe(() => this.invalidate())));
  }

  invalidate() {
    this.#viewModel = null;
    this.emit();
  }

  getViewModel = () => (this.#viewModel ??= this.present());

  /** Builds the view model. Override. */
  present() {
    return {};
  }

  /** View lifecycle hooks (start / stop timers). Override. */
  attach() {}
  detach() {}
}

/** Binds a view to its presenter: re-renders on every view-model change. */
export function usePresenter(presenter) {
  useEffect(() => {
    presenter.attach();
    return () => presenter.detach();
  }, [presenter]);
  return useSyncExternalStore(presenter.subscribe, presenter.getViewModel, presenter.getViewModel);
}
