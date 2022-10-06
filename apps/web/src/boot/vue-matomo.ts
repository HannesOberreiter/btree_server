import { boot } from 'quasar/wrappers';
import VueMatomo from 'vue-matomo';
import { useAuthUserStore } from '~/stores/auth';

export default boot(({ app, router }) => {
  const storeUser = useAuthUserStore();
  const uniqueIdentifier = computed(() => {
    let identifier = '';
    if (storeUser.user) identifier += `bee_id:${storeUser.user.id}`;
    if (storeUser.company) identifier += `.user_id:${storeUser.company.id}`;
    return identifier;
  });
  app.use(VueMatomo, {
    // Configure your matomo server and site by providing
    host: process.env.MATOMO_HOST,
    siteId: process.env.MATOMO_SITE_ID,
    userId: uniqueIdentifier.value,
    router: router,
    // Require consent before sending tracking information to matomo
    // Default: false
    requireConsent: false,
    // Whether to track the initial page view
    // Default: true
    trackInitialView: true,
    // Run Matomo without cookies
    // Default: false
    disableCookies: true,
    // Whether or not to log debug information
    // Default: false
    debug: process.env.NODE_ENV === 'development' ? true : false,
    // Set this to include crossorigin attribute on the matomo script import
    // Default: undefined, possible values : 'anonymous', 'use-credentials'
    crossOrigin: undefined,
  });
});
