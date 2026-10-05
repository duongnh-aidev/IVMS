import { createElement } from 'react';
import { LiveViewModel } from './LiveViewModel';
import { LiveViewController } from './LiveViewController';
import LiveViewView from './LiveViewView';

export function buildLiveView({ devices, shell, deviceEditor }) {
  const controller = new LiveViewController({
    model: new LiveViewModel({ devices }),
    shell,
    deviceEditor,
  });
  return { controller, input: { pin: controller.pin }, View: () => createElement(LiveViewView, { controller }) };
}
