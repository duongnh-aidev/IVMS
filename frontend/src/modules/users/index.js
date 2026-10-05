import { createElement } from 'react';
import { UsersModel } from './UsersModel';
import { UsersController } from './UsersController';
import UsersView from './UsersView';

export function buildUsers({ toast }) {
  const controller = new UsersController({ model: new UsersModel(), toast });
  return { controller, View: () => createElement(UsersView, { controller }) };
}
