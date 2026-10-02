import { Presenter } from '../../core/viper';
import { darkOption } from '../../shared/ui/options';
import { ACTIVITY_FILTERS, PERMISSIONS, ROLES, SCOPES } from './UsersInteractor';

const STATUS_STYLE = {
  Active: ['#E8F5EC', '#1E7A3C'],
  Locked: ['#FCEDED', '#C62828'],
  Invited: ['#F4F4F4', '#5C5E62'],
};
const TABS = [
  ['users', 'Users'],
  ['roles', 'Roles & permissions'],
  ['log', 'Activity log'],
];

const initials = (name) =>
  name
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('');

export class UsersPresenter extends Presenter {
  constructor({ interactor, toast }) {
    super();
    this.interactor = interactor;
    this.toast = toast;
    this.state = { tab: 'users', role: 'Operator', logFilter: 'All' };
    this.observe(interactor);
  }

  selectTab = (tab) => this.setState({ tab });
  selectRole = (role) => this.setState({ role });
  setLogFilter = (logFilter) => this.setState({ logFilter });
  invite = () => this.toast.ok(this.interactor.invite());

  present() {
    const { tab, role, logFilter } = this.state;
    const i = this.interactor;
    const locked = i.isLocked(role);
    const granted = i.permissions(role);
    return {
      uTab: tab,
      uTabUsers: tab === 'users',
      uTabRoles: tab === 'roles',
      uTabLog: tab === 'log',
      uTabs: TABS.map(([k, label]) => ({
        label,
        weight: tab === k ? 600 : 400,
        color: tab === k ? '#171A20' : '#5C5E62',
        line: tab === k ? 'inset 0 -2px 0 #171A20' : 'none',
        onClick: () => this.selectTab(k),
      })),
      uAdd: this.invite,
      uRows: i.users().map((u) => ({
        ...u,
        initials: initials(u.name),
        sBg: STATUS_STYLE[u.status][0],
        sColor: STATUS_STYLE[u.status][1],
      })),
      uRoleList: ROLES.map((n) => {
        const c = i.countWithRole(n);
        return {
          name: n,
          count: c + (c === 1 ? ' user' : ' users'),
          bg: role === n ? '#E4E5E8' : 'transparent',
          weight: role === n ? 600 : 400,
          onClick: () => this.selectRole(n),
        };
      }),
      uRoleName: role,
      uPerms: PERMISSIONS.map((p) => {
        const on = granted.includes(p.key);
        return {
          label: p.label,
          desc: p.desc,
          track: on ? '#3E6AE1' : '#D0D1D2',
          justify: on ? 'flex-end' : 'flex-start',
          locked,
          opacity: locked ? 0.55 : 1,
          title: locked ? 'Admins always have full access' : '',
          onClick: () => i.togglePermission(role, p.key),
        };
      }),
      uScope: SCOPES.map(([k, label, depth]) => {
        const on = i.hasScope(role, k);
        return {
          label,
          pad: depth * 20 + 'px',
          on,
          box: on ? '#3E6AE1' : '#FFFFFF',
          border: on ? '#3E6AE1' : '#C4C6C9',
          onClick: () => i.toggleScope(role, k),
        };
      }),
      uLogFilters: Object.keys(ACTIVITY_FILTERS).map((l) =>
        darkOption(l, logFilter === l, () => this.setLogFilter(l), '#F4F4F4'),
      ),
      uLog: i.activity(logFilter),
    };
  }
}
