/* eslint-disable */

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
    DROPBOX_CLIENT_ID: string;
    OPENWEATHER_APP_ID: string;
    BACKEND_URL: string;
    MATOMO_HOST: string;
    MATOMO_SITE_ID: number;
  }
}
