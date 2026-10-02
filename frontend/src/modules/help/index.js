import { createElement } from 'react';
import { HelpInteractor } from './HelpInteractor';
import { HelpPresenter } from './HelpPresenter';
import { HelpRouter } from './HelpRouter';
import HelpView from './HelpView';

export function buildHelp({ toast }) {
  const presenter = new HelpPresenter({ interactor: new HelpInteractor(), router: new HelpRouter(), toast });
  return { presenter, View: () => createElement(HelpView, { presenter }) };
}
