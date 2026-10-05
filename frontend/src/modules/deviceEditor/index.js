import { createElement } from 'react';
import { DeviceEditorModel } from './DeviceEditorModel';
import { DeviceEditorController } from './DeviceEditorController';
import DeviceEditorView from './DeviceEditorView';

export function buildDeviceEditor({ devices, toast }) {
  const controller = new DeviceEditorController({ model: new DeviceEditorModel({ devices }), toast });
  return {
    controller,
    input: { open: controller.open },
    View: () => createElement(DeviceEditorView, { controller }),
  };
}
