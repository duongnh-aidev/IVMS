import { createElement } from 'react';
import { SystemMonitorInteractor } from './SystemMonitorInteractor';
import { SystemMonitorPresenter } from './SystemMonitorPresenter';
import SystemMonitorView from './SystemMonitorView';

export function buildSystemMonitor({ metrics }) {
  const presenter = new SystemMonitorPresenter({ interactor: new SystemMonitorInteractor({ metrics }) });
  return { presenter, View: () => createElement(SystemMonitorView, { presenter }) };
}
