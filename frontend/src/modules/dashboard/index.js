import { createElement } from 'react';
import { DashboardInteractor } from './DashboardInteractor';
import { DashboardPresenter } from './DashboardPresenter';
import { DashboardRouter } from './DashboardRouter';
import DashboardView from './DashboardView';

export function buildDashboard({ devices, shell }) {
  const presenter = new DashboardPresenter({
    interactor: new DashboardInteractor({ devices }),
    router: new DashboardRouter({ shell }),
  });
  return { presenter, View: () => createElement(DashboardView, { presenter }) };
}
