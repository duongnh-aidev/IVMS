import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { AppNavigator } from './app/AppNavigator';
import './styles/fonts.css';
import './styles/global.css';
import './styles/interactions.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App appNavigator={new AppNavigator()} />
  </StrictMode>,
);
