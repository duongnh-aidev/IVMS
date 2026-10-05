import { createElement } from 'react';
import { DevicesModel } from './DevicesModel';
import { DevicesController } from './DevicesController';
import DevicesView from './DevicesView';

export function buildDevices({ devices, toast, shell, liveView, deviceEditor }) {
  const controller = new DevicesController({
    model: new DevicesModel({ devices }),
    toast,
    shell,
    liveView,
    deviceEditor,
  });
  return { controller, View: () => createElement(DevicesView, { controller }) };
}
