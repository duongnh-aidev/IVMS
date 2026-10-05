import { createElement } from 'react';
import { HelpModel } from './HelpModel';
import { HelpController } from './HelpController';
import HelpView from './HelpView';

export function buildHelp({ toast }) {
  const controller = new HelpController({ model: new HelpModel(), toast });
  return { controller, View: () => createElement(HelpView, { controller }) };
}
