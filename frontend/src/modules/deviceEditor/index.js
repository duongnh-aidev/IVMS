import { createElement } from 'react';
import { DeviceEditorInteractor } from './DeviceEditorInteractor';
import { DeviceEditorPresenter } from './DeviceEditorPresenter';
import DeviceEditorView from './DeviceEditorView';

export function buildDeviceEditor({ devices, toast }) {
  const presenter = new DeviceEditorPresenter({ interactor: new DeviceEditorInteractor({ devices }), toast });
  return {
    presenter,
    input: { open: presenter.open },
    View: () => createElement(DeviceEditorView, { presenter }),
  };
}
