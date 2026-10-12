import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { AppNavigator } from './app/AppNavigator';
import { createPluginRegistry } from './core/plugins';
import { SCREENS } from './modules/shell/ShellController';
import { ApiClient } from './shared/api/client';
import { AuthService } from './shared/services/authService';
import './styles/fonts.css';
import './styles/global.css';
import './styles/interactions.css';
// Frontend plugins chosen at build time (IVMS_FRONTEND_PLUGINS, see vite.config.js); none in the core build
import plugins from 'virtual:ivms-plugins';

// A rejected token (401) ends the session, which sends the user back to the login screen
const api = new ApiClient({ getToken: () => auth.token(), onUnauthorized: () => auth.signOut() });
const auth = new AuthService({ api });
// Throws (blank page + console error) when a plugin tries to replace a core screen: caught on the first run
const sessionOptions = { plugins: createPluginRegistry(plugins, Object.keys(SCREENS)) };

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App appNavigator={new AppNavigator({ auth })} api={api} auth={auth} sessionOptions={sessionOptions} />
  </StrictMode>,
);
