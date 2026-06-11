// Configuration for your app
// https://quasar.dev/quasar-cli-vite/quasar-config-file

import { fileURLToPath } from 'node:url';
import { defineConfig } from '#q-app';

/* expose selected environment variables to client code */
const env = {
  DROPBOX_CLIENT_ID: import.meta.env.DROPBOX_CLIENT_ID ?? '',
  OPENWEATHER_APP_ID: import.meta.env.OPENWEATHER_APP_ID ?? '',

  BACKEND_URL: import.meta.env.BACKEND_URL ?? 'http://localhost:3000/api',
  BACKEND_URL_US:
    import.meta.env.BACKEND_URL_US ??
    import.meta.env.BACKEND_URL ??
    'http://localhost:3000/api',

  MATOMO_HOST: import.meta.env.MATOMO_HOST ?? '',
  MATOMO_SITE_ID: import.meta.env.MATOMO_SITE_ID ?? '',
  PAYPAL_CLIENT_ID: import.meta.env.PAYPAL_CLIENT_ID ?? ''
};

export default defineConfig(ctx => {
  /* Exceptions for local development and CSP */
  const devContentPolicySrc =
    import.meta.env.BRANCH === 'dev'
      ? ['ws://localhost:*', 'http://localhost:*', 'https://localhost:*']
      : [];

  return {
    // https://quasar.dev/quasar-cli-vite/prefetch-feature
    // preFetch: true,

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://quasar.dev/quasar-cli-vite/boot-files
    boot: [
      'i18n',
      'quasar-lang-pack',
      'quasar-loading-bar',
      'vue-query',
      'vue-matomo'
    ],
    // https://quasar.dev/quasar-cli-vite/quasar-config-js#css
    css: ['app.scss'],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      // 'ionicons-v4',
      // 'mdi-v7',
      'fontawesome-v7'
      // 'eva-icons',
      // 'themify',
      // 'line-awesome',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

      // 'roboto-font', // optional, you are not bound to it
      // 'material-icons', // optional, you are not bound to it
    ],

    // Full list of options: https://quasar.dev/quasar-cli-vite/quasar-config-js#build
    build: {
      target: {
        browser: 'baseline-widely-available',
        node: 'node22'
      },

      typescript: {
        strict: true
        // extendTsConfig (tsConfig) {}
      },

      vueOptionsAPI: true,
      vueRouterMode: 'history', // available values: 'hash', 'history'
      // vueRouterBase,
      // vueDevtools,
      filenameBasedRouting: false,

      publicPath: '/',
      showProgress: true,
      // analyze: true,
      defineEnv: env,
      // ignorePublicFolder: true,
      // minify: false,
      // distDir

      extendViteConf(viteConf) {
        if (ctx.dev) {
          viteConf.resolve = viteConf.resolve || {};
          viteConf.resolve.alias = viteConf.resolve.alias || {};
          (viteConf.resolve.alias as any).vue$ = fileURLToPath(
            new URL('./node_modules/vue', import.meta.url)
          );
          viteConf.optimizeDeps = {
            ...viteConf.optimizeDeps,
            force: ctx.dev,
            include: [
              '@fullcalendar/vue3',
              '@fullcalendar/core',
              '@fullcalendar/daygrid',
              '@fullcalendar/interaction',
              '@fullcalendar/list',
              '@fullcalendar/multimonth',
              '@fullcalendar/core/locales-all',
              'leaflet'
            ],
            // Exclude from optimization to avoid cache issues
            exclude: [
              '@vue-leaflet/vue-leaflet',
              'echarts',
              'vue-echarts',
              '@vueuse/core'
            ]
          };
        }
      },
      viteVuePluginOptions: {
        template: {
          compilerOptions: {
            isCustomElement: tag => tag === 'pwa-install'
          }
        }
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
            include: [fileURLToPath(new URL('./src/i18n', import.meta.url))]
          }
        ],

        [
          'vite-plugin-checker',
          {
            vueTsc: true
          },
          { server: false }
        ],

        [
          'vite-plugin-csp-guard',
          {
            dev: {
              run: false,
              outlierSupport: ['vue', 'tailwind', 'scss']
            },
            policy: {
              'default-src': [
                "'self'",
                'https://*.btree.at',
                ...devContentPolicySrc
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
                ...devContentPolicySrc
              ],
              'script-src-elem': [
                "'self'",
                'https://*.btree.at',
                'https://*.paypal.com',
                "'unsafe-inline'"
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
                'https://*.inaturalist.org'
              ],
              'style-src-elem': ["'self'", "'unsafe-inline'"],
              'style-src': ["'self'", "'unsafe-inline'"],
              'font-src': ["'self'", 'https://*.btree.at', 'data:'],
              'frame-src': ['https://*.meteoblue.com', 'https://*.paypal.com']
            },
            build: {
              sri: false,
              outlierSupport: ['vue', 'tailwind', 'scss']
            }
          }
        ]
      ]
    },

    // Full list of options: https://quasar.dev/quasar-cli-vite/quasar-config-js#devServer
    devServer: {
      proxy: {
        '/api': {
          target: env.BACKEND_URL,
          changeOrigin: true,
          secure: false,
          rewrite: path => path.replace(/^\/api/, '')
        },
        '/us/api': {
          target: env.BACKEND_URL_US,
          changeOrigin: true,
          secure: false,
          rewrite: path => path.replace(/^\/us\/api/, '')
        }
      },
      open: false, // opens browser window automatically
      hmr: true
    },

    // https://quasar.dev/quasar-cli-vite/quasar-config-js#framework
    framework: {
      config: {
        screen: { bodyClasses: true },
        notify: { timeout: 2_000 },
        loading: { delay: 100 },
        dark: 'auto'
      },

      iconSet: 'fontawesome-v7', // Quasar icon set
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
        'Meta'
      ]
    },

    // animations: 'all', // --- includes all animations
    // https://quasar.dev/options/animations
    animations: [],

    sourceFiles: {
      pwaRegisterServiceWorker: 'src-pwa/register-service-worker'
    },

    // https://quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
    pwa: {
      workboxMode: 'GenerateSW',
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,
      injectPWAMetaTags: true,
      extendPWAGenerateSWOptions(conf) {
        conf.clientsClaim = true;
        conf.skipWaiting = true;
        conf.cleanupOutdatedCaches = true;
      }
    }
  };
});
