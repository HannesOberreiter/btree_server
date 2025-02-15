declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
    DROPBOX_CLIENT_ID: string;
    OPENWEATHER_APP_ID: string;
    BACKEND_URL: string;
    BACKEND_URL_US: string;
    MATOMO_HOST: string;
    MATOMO_SITE_ID: number;
    PAYPAL_CLIENT_ID: string;
    BEEKEEPING_NEWS_BEARER: string;
  }
}
