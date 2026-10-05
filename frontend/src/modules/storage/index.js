import { createElement } from 'react';
import { StorageModel } from './StorageModel';
import { StorageController } from './StorageController';
import StorageView from './StorageView';

export function buildStorage({ toast }) {
  const controller = new StorageController({ model: new StorageModel(), toast });
  return { controller, View: () => createElement(StorageView, { controller }) };
}
