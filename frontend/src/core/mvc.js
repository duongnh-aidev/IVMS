import { useEffect, useSyncExternalStore } from 'react';

/** Minimal change notifier shared by services, models and controllers. */
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
 * Base controller: owns the view state, turns its model's data into a view model in
 * `present()`, and exposes intent methods the view calls (including navigation to
 * other modules). Controllers never touch the DOM, so they can be unit-tested without React.
 */
export class Controller extends Observable {
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

  /** Re-present when any of these observables (services, models) change. */
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

/** Binds a view to its controller: re-renders on every view-model change. */
export function useController(controller) {
  useEffect(() => {
    controller.attach();
    return () => controller.detach();
  }, [controller]);
  return useSyncExternalStore(controller.subscribe, controller.getViewModel, controller.getViewModel);
}
