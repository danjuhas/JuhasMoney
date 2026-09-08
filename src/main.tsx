import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from "@sentry/react";
import App from './App';
import './index.css';
import './lib/i18n';
import { PreferencesProvider } from './contexts/PreferencesContext';

Sentry.init({
  dsn: "https://78cf9f3a75814948559f6ff7cb4dfd85@o4512052444790784.ingest.de.sentry.io/4512052478476368",
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/react/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: []
  }
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <PreferencesProvider>
        <App />
      </PreferencesProvider>
    </BrowserRouter>
  </React.StrictMode>
);
