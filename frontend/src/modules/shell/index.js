import { createElement } from 'react';
import { ShellInteractor } from './ShellInteractor';
import { ShellPresenter } from './ShellPresenter';
import { ShellRouter } from './ShellRouter';
import ShellView from './ShellView';

/** Assembles the main-window module. `views` are the other modules' bound views. */
export function buildShell({ notifications, toast, appNavigator, initialScreen }) {
  const interactor = new ShellInteractor({ notifications });
  const router = new ShellRouter({ appNavigator });
  const presenter = new ShellPresenter({ interactor, router, toast, initialScreen });
  return {
    presenter,
    input: { show: presenter.show },
    bindView: (views) => () => createElement(ShellView, { presenter, ...views }),
  };
}
