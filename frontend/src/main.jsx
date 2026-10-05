import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { AppNavigator } from './app/AppNavigator';
import { ApiClient } from './shared/api/client';
import { AuthService } from './shared/services/authService';
import './styles/fonts.css';
import './styles/global.css';
import './styles/interactions.css';

// A rejected token (401) ends the session, which sends the user back to the login screen
const api = new ApiClient({ getToken: () => auth.token(), onUnauthorized: () => auth.signOut() });
const auth = new AuthService({ api });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App appNavigator={new AppNavigator({ auth })} api={api} auth={auth} />
  </StrictMode>,
);
