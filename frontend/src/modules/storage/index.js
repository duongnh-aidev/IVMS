import { createElement } from 'react';
import { StorageInteractor } from './StorageInteractor';
import { StoragePresenter } from './StoragePresenter';
import StorageView from './StorageView';

export function buildStorage({ toast }) {
  const presenter = new StoragePresenter({ interactor: new StorageInteractor(), toast });
  return { presenter, View: () => createElement(StorageView, { presenter }) };
}
