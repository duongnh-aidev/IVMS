import { createElement } from 'react';
import { DashboardModel } from './DashboardModel';
import { DashboardController } from './DashboardController';
import DashboardView from './DashboardView';

export function buildDashboard({ devices, shell }) {
  const controller = new DashboardController({
    model: new DashboardModel({ devices }),
    shell,
  });
  return { controller, View: () => createElement(DashboardView, { controller }) };
}
