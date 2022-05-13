# Frontend for b.tree Beekeeping Webapplication

Written in typescript build with Vue.js and Quasar. The b.tree application is for managing your honeybee colonies in a modern way. More infos at <https://info.btree.at>.

## Install the dependencies

```bash
yarn
```

`yarn postinstall` is implement because of a TypeScript bug with FullCalendar. It is run automatically, you may need to restart your IDE after running `yarn` or updating FullCalendar.

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
yarn quasar dev
yarn quasar dev -m pwa
```

We use auto-import plugins to import common libraries and components, see definitions at [src/auto-*.d.ts](src/).

### API proxy development

The `dev` server is running with a proxy to the backend ([quasar.config.js](quasar.config.js)), this solves the CORS problem on development. You may need to change the localhost port if you have the backend running on a different port.

```javascript
 devServer: {
      proxy: {
        '/api': {
          target: 'http://localhost:8101',
          changeOrigin: true,
          secure: false,
        },
      },
    },
```

### Translation (vue-i18n)

The translation in `.json` format can be found in [src/i18n](src/i18n/). On developer mode the console warning can be ignored:

> You are running the esm-bundler build of vue-i18n. ...

### Lint & Format (eslint & prettier)

```bash
yarn lint
yarn format
```

### Build the app for production

```bash
yarn quasar build
yarn quasar build -m pwa
```

#### Server

Currently running with ngnix service, demo config files `etc/nginx/sites-available/btree_at_app.conf`.

Settings up nginx:

```bash
# Create Config File inside /etc/nginx/sites-available
touch your_url.conf
# Create Symlink in /etc/nginx/sites-enabled
ln -s ../sites-available/your_url.conf .
# Restart ngnix
systemctl reload nginx
```

SSL certificates are managed with certbot: <https://certbot.eff.org/instructions?ws=nginx&os=ubuntufocal>

```bash
sudo certbot --nginx
```

#### .env

The example [example.env](example.env) show the needed environmental variables. On production this can be set via `.env` file or as `process.env.*` in build (e.g. GitHub secret on build). Defined types can be found in [src/env.d.ts](src/env.d.ts). In development we use `/api` as backend url, see **API Proxy** section.

#### Version Number

Changes and version number are documented in [src/assets/news.json](src/assets/news.json). This news are somewhat for the end-user and also used to update service workers to a new version. This process is not optimal but a legacy burden from my old app which may be replaced with automatic news from GitHub commits.

#### Icons

Icons generated with Icongenie for commands see: <https://quasar.dev/icongenie/command-list>

```bash
icongenie generate --icon public/logo.png --padding 5,5 --skip-trim --theme-color 2b957a --splashscreen-color f5f7fa --splashscreen-icon-ratio 60
```
