import { createElement } from 'react';
import { ShellModel } from './ShellModel';
import { ShellController } from './ShellController';
import ShellView from './ShellView';

/** Assembles the main-window module. `views` are the other modules' bound views. */
export function buildShell({ notifications, toast, auth, initialScreen }) {
  const model = new ShellModel({ notifications });
  const controller = new ShellController({ model, auth, toast, initialScreen });
  return {
    controller,
    input: { show: controller.show },
    bindView: (views) => () => createElement(ShellView, { controller, ...views }),
  };
}
