import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { stripTransientParams } from './lib/url';
import './styles/global.css';

// PRESERVED CONTRACT: the OwnerRez booking handoff returns the guest with
// transient `or_*` query parameters attached. This app renders at `/` and
// navigates by query parameter, so they would otherwise stay in the address bar
// for the rest of the session. Strip them before the first paint.
stripTransientParams();

const container = document.getElementById('root');
if (!container) throw new Error('Root container #root is missing from index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
