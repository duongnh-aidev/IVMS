import { createElement } from 'react';
import { UsersInteractor } from './UsersInteractor';
import { UsersPresenter } from './UsersPresenter';
import UsersView from './UsersView';

export function buildUsers({ toast }) {
  const presenter = new UsersPresenter({ interactor: new UsersInteractor(), toast });
  return { presenter, View: () => createElement(UsersView, { presenter }) };
}
