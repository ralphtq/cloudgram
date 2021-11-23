// these are utils using esm modules and need to be mocked to work in jest
// they are kept in this file to ease mocking

import * as Sentry from '@sentry/browser';
import {Integrations} from '@sentry/tracing';

export const initSentry = () =>
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN as string,
    release: 'cloudgram@' + import.meta.env.PACKAGE_VERSION,
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 1.0,
    environment: import.meta.env.PROD ? 'production' : 'dev',
  });

export const drawVersion = () =>
  (document.getElementById('version')!.innerText = `v${import.meta.env.PACKAGE_VERSION}`);
