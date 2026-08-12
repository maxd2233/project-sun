import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import Root from './App';
import './styles/tokens.css';
import './styles/global.css';
import './styles/components.css';
import './styles/sun.css';
import './styles/home.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

createRoot(rootElement).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);

// Offline-first: the service worker is registered after first paint and
// updates in the background on subsequent visits.
registerSW({ immediate: true });
