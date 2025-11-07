import { fasArrowsRotate } from '@quasar/extras/fontawesome-v6';
import { Notify, Platform } from 'quasar';
import { register } from 'register-service-worker';
import { i18n } from '../src/boot/i18n';
import { Router } from '../src/router';

// The ready(), registered(), cached(), updatefound() and updated()
// events passes a ServiceWorkerRegistration instance in their arguments.
// ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration

if (window.location.pathname.startsWith('/pub/')) {
	console.log('Service worker disabled for /pub/ routes');
}
else if (
	Platform.is.ios
	|| document.cookie.includes('iOS')
	|| Platform.is.safari
) {
	// Delete old pending service workers for iOS users
	try {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.getRegistrations().then((registrations) => {
				for (const registration of registrations) {
					registration.unregister();
				}
			});
		}
	}
	catch (error) {
		console.error(error);
	}
}
else {
	register(process.env.SERVICE_WORKER_FILE, {
		// The registrationOptions object will be passed as the second argument
		// to ServiceWorkerContainer.register()
		// https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#Parameter

		// registrationOptions: { scope: './' },

		ready(registration) {
			console.log('Service worker is active.');
			registration.update();
		},

		registered(registration) {
			console.log('Service worker has been registered.');
			Router.afterEach(() => registration.update());
		},

		cached(_registration) {
			console.log('Content has been cached for offline use.');
		},

		updatefound(_registration) {
			console.log('New content is downloading.');
		},

		updated(_registration) {
			console.log('New content is available; please refresh.');

			// swift cookie is set by the iOS app
			// let platformCookie = Cookie(name: "app-platform", value: "iOS App Store")
			if (document.cookie.includes('iOS'))
				return;
			if (Platform.is.safari)
				return;

			Notify.create({
				color: 'negative',
				icon: fasArrowsRotate,
				message: i18n.global.t('serviceWorker.newContent'),
				timeout: 0,
				multiLine: true,
				position: 'top',
				actions: [
					{
						label: i18n.global.t('refresh'),
						color: 'yellow',
						handler: () => {
							window.location.reload();
						},
					},
					{
						label: i18n.global.t('cancel'),
						color: 'white',
						handler: () => {
							// Do nothing
						},
					},
				],
			});
		},

		offline() {
			console.log(
				'No internet connection found. App is running in offline mode.',
			);
		},

		error(err) {
			console.error('Error during service worker registration:', err);
		},
	});
}
