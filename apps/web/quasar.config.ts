// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js

import { defineConfig } from '#q-app/wrappers';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config(); // on the dev server we use the .env file therefore I still need dotenv, ToDo remove this if possible

/* pipeline does not contain an env file, therefore we load environment */
const env = existsSync('.env')
  ? {}
  : ({
      DROPBOX_CLIENT_ID: process.env.DROPBOX_CLIENT_ID,
      OPENWEATHER_APP_ID: process.env.OPENWEATHER_APP_ID,

      BACKEND_URL: process.env.BACKEND_URL,
      BACKEND_URL_US: process.env.BACKEND_URL_US,

      MATOMO_HOST: process.env.MATOMO_HOST,
      MATOMO_SITE_ID: process.env.MATOMO_SITE_ID,
      PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
      BEEKEEPING_NEWS_BEARER: process.env.BEEKEEPING_NEWS_BEARER,
    } as any);

export default defineConfig((ctx) => {
  /* Exceptions for local development and CSP */
  const devContentPolicySrc =
    process.env.BRANCH === 'dev'
      ? ['ws://localhost:*', 'http://localhost:*', 'https://localhost:*']
      : [];

  return {
    // https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
    // preFetch: true,

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://v2.quasar.dev/quasar-cli-vite/boot-files
    boot: [
      'i18n',
      'quasar-lang-pack',
      'quasar-loading-bar',
      'vue-query',
      'vue-matomo',
    ],
    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#css
    css: ['app.scss'],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      // 'ionicons-v4',
      // 'mdi-v7',
      'fontawesome-v6',
      // 'eva-icons',
      // 'themify',
      // 'line-awesome',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

      // 'roboto-font', // optional, you are not bound to it
      // 'material-icons', // optional, you are not bound to it
    ],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#build
    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
        node: 'node20',
      },

      typescript: {
        strict: true,
        vueShim: true,
        // extendTsConfig (tsConfig) {}
      },

      vueRouterMode: 'history', // available values: 'hash', 'history'
      // vueRouterBase,
      // vueDevtools,
      // vueOptionsAPI: false,

      rebuildCache: true, // rebuilds Vite/linter/etc cache on startup

      publicPath: '/',
      showProgress: true,
      // analyze: true,
      env: env,
      // rawDefine: {}
      // ignorePublicFolder: true,
      // minify: false,
      // polyfillModulePreload: true,
      // distDir

      // extendViteConf (viteConf) {},
      viteVuePluginOptions: {
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag === 'pwa-install',
          },
        },
      },

      vitePlugins: [
        [
          '@intlify/unplugin-vue-i18n/vite',
          {
            // if you want to use Vue I18n Legacy API, you need to set `compositionOnly: false`
            // compositionOnly: false,

            // if you want to use named tokens in your Vue I18n messages, such as 'Hello {name}',
            // you need to set `runtimeOnly: false`
            // runtimeOnly: false,

            ssr: ctx.modeName === 'ssr',

            // you need to set i18n resource including paths !
            include: [fileURLToPath(new URL('./src/i18n', import.meta.url))],
          },
        ],

        [
          'vite-plugin-checker',
          {
            vueTsc: true,
            eslint: {
              lintCommand:
                'eslint -c ./eslint.config.js "./src*/**/*.{ts,js,mjs,cjs,vue}"',
              useFlatConfig: true,
            },
          },
          { server: false },
        ],

        [
          'vite-plugin-csp-guard',
          {
            dev: {
              run: true,
              outlierSupport: ['vue', 'tailwind', 'scss'],
            },
            policy: {
              'default-src': [
                "'self'",
                'https://*.btree.at',
                ...devContentPolicySrc,
              ],
              'connect-src': [
                "'self'",
                'https://*.btree.at',
                'https://*.paypal.com',
                'https://*.dropboxapi.com',
                'https://*.beekeeping-news.com',
                'https://*.openstreetmap.org',
                'https://*.arcgisonline.com',
                'https://*.openweathermap.org',
                ...devContentPolicySrc,
              ],
              'script-src-elem': [
                "'self'",
                'https://*.btree.at',
                'https://*.paypal.com',
                "'unsafe-inline'",
              ],
              'img-src': [
                "'self'",
                'data:',
                'blob:',
                'https://*.btree.at',
                'https://*.paypalobjects.com',
                'https://*.openstreetmap.org',
                'https://*.arcgisonline.com',
                'https://*.openweathermap.org',
                'https://*.inaturalist.org',
              ],
              'style-src-elem': ["'self'", "'unsafe-inline'"],
              'style-src': ["'self'", "'unsafe-inline'"],
              'font-src': ["'self'", 'https://*.btree.at', 'data:'],
              'frame-src': ['https://*.meteoblue.com', 'https://*.paypal.com'],
            },
            build: {
              sri: false,
              outlierSupport: ['vue', 'tailwind', 'scss'],
            },
          },
        ],
      ],
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#devServer
    devServer: {
      proxy: {
        '/api': {
          target: process.env.BACKEND_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/us/api': {
          target: process.env.BACKEND_URL_US,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/us\/api/, ''),
        },
      },
      open: false, // opens browser window automatically
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#framework
    framework: {
      config: {
        screen: { bodyClasses: true },
        notify: { timeout: 2_000 },
        loading: { delay: 100 },
        dark: 'auto',
      },

      iconSet: 'fontawesome-v6', // Quasar icon set
      // lang: 'en-US', // Quasar language pack

      // For special cases outside of where the auto-import strategy can have an impact
      // (like functional components as one of the examples),
      // you can manually specify Quasar components/directives to be available everywhere:
      //
      // components: [],
      // directives: [],

      // Quasar plugins
      plugins: [
        'Notify',
        'AppFullscreen',
        'Dialog',
        'Loading',
        'LoadingBar',
        'Meta',
      ],
    },

    // animations: 'all', // --- includes all animations
    // https://v2.quasar.dev/options/animations
    animations: [],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#sourcefiles
    sourceFiles: {
      //   rootComponent: 'src/App.vue',
      //   router: 'src/router/index',
      //   store: 'src/store/index',
      pwaRegisterServiceWorker: 'src-pwa/register-service-worker',
      pwaServiceWorker: 'src-pwa/custom-service-worker',
      pwaManifestFile: 'src-pwa/manifest.json',
      //   electronMain: 'src-electron/electron-main',
      //   electronPreload: 'src-electron/electron-preload'
      //   bexManifestFile: 'src-bex/manifest.json
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-ssr/configuring-ssr
    ssr: {
      prodPort: 3000, // The default port that the production server should use
      // (gets superseded if process.env.PORT is specified at runtime)

      middlewares: [
        'render', // keep this as last one
      ],

      // extendPackageJson (json) {},
      // extendSSRWebserverConf (esbuildConf) {},

      // manualStoreSerialization: true,
      // manualStoreSsrContextInjection: true,
      // manualStoreHydration: true,
      // manualPostHydrationTrigger: true,

      pwa: false,
      // pwaOfflineHtmlFilename: 'offline.html', // do NOT use index.html as name!

      // pwaExtendGenerateSWOptions (cfg) {},
      // pwaExtendInjectManifestOptions (cfg) {}
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
    pwa: {
      workboxMode: 'GenerateSW', // 'GenerateSW' or 'InjectManifest'
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      // extendManifestJson (json) {},
      useCredentialsForManifestTag: false,
      injectPwaMetaTags: true,
      // extendPWACustomSWConf (esbuildConf) {},
      extendGenerateSWOptions(cfg) {
        cfg.clientsClaim = true;
        cfg.skipWaiting = true;
        cfg.cleanupOutdatedCaches = true;
      },
      // extendInjectManifestOptions (cfg) {}
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-cordova-apps/configuring-cordova
    cordova: {
      // noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-capacitor-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true,
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
    electron: {
      // extendElectronMainConf (esbuildConf) {},
      // extendElectronPreloadConf (esbuildConf) {},

      // extendPackageJson (json) {},

      // Electron preload scripts (if any) from /src-electron, WITHOUT file extension
      preloadScripts: ['electron-preload'],

      // specify the debugging port to use for the Electron app when running in development mode
      inspectPort: 5858,

      bundler: 'packager', // 'packager' or 'builder'

      packager: {
        // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options
        // OS X / Mac App Store
        // appBundleId: '',
        // appCategoryType: '',
        // osxSign: '',
        // protocol: 'myapp://path',
        // Windows only
        // win32metadata: { ... }
      },

      builder: {
        // https://www.electron.build/configuration/configuration

        appId: 'btree-vue',
      },
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
    bex: {
      // extendBexScriptsConf (esbuildConf) {},
      // extendBexManifestJson (json) {},

      /**
       * The list of extra scripts (js/ts) not in your bex manifest that you want to
       * compile and use in your browser extension. Maybe dynamic use them?
       *
       * Each entry in the list should be a relative filename to /src-bex/
       *
       * @example [ 'my-script.ts', 'sub-folder/my-other-script.js' ]
       */
      extraScripts: [],
    },
  };
});
