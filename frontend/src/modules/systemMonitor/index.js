import { createElement } from 'react';
import { SystemMonitorModel } from './SystemMonitorModel';
import { SystemMonitorController } from './SystemMonitorController';
import SystemMonitorView from './SystemMonitorView';

export function buildSystemMonitor({ metrics }) {
  const controller = new SystemMonitorController({ model: new SystemMonitorModel({ metrics }) });
  return { controller, View: () => createElement(SystemMonitorView, { controller }) };
}
