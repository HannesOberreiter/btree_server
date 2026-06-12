import { initMatomo } from '@certible/use-matomo';
import { defineBoot } from '#q-app';

export default defineBoot(({ app }) => {
  const matomo = initMatomo({
    host: import.meta.env.MATOMO_HOST ?? '',
    siteId: import.meta.env.MATOMO_SITE_ID ?? '',
    requireCookieConsent: false,
    disableCookies: true,
    requireConsent: false,
    trackRouter: true
  });

  app.provide('matomo', matomo);
});
