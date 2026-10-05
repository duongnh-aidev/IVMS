import { useMemo, useSyncExternalStore } from 'react';
import { createLogin, createSession } from './container';

/** Root: shows the login screen or a signed-in session, following the AppNavigator route. */
export default function App({ appNavigator, api, auth, sessionOptions }) {
  const route = useSyncExternalStore(appNavigator.subscribe, () => appNavigator.route());
  // A new login form / session each time the route is entered (sign out resets all state).
  const Screen = useMemo(
    () =>
      route === 'app'
        ? createSession({ appNavigator, api, auth, ...sessionOptions })
        : createLogin({ appNavigator, auth }),
    [route, appNavigator, api, auth, sessionOptions],
  );
  return <Screen />;
}
