import { defineBoot } from '#q-app/wrappers';
import { initMatomo } from '@certible/use-matomo';

export default defineBoot(({ app }) => {
	const matomo = initMatomo({
		host: process.env.MATOMO_HOST,
		siteId: process.env.MATOMO_SITE_ID,
		requireCookieConsent: false,
		disableCookies: true,
		requireConsent: false,
		trackRouter: true,
	});

	app.provide('matomo', matomo);
});
