import { useMemo, useSyncExternalStore } from 'react';
import { createLogin, createSession } from './container';

/** Root: shows the login screen or a signed-in session, following the AppNavigator route. */
export default function App({ appNavigator, sessionOptions }) {
  const route = useSyncExternalStore(appNavigator.subscribe, () => appNavigator.route());
  // A new login form / session each time the route is entered (sign out resets all state).
  const Screen = useMemo(
    () => (route === 'app' ? createSession({ appNavigator, ...sessionOptions }) : createLogin({ appNavigator })),
    [route, appNavigator, sessionOptions],
  );
  return <Screen />;
}
