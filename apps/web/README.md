# Frontend for b.tree Beekeeping Webapplication

[![beta](https://github.com/HannesOberreiter/btree_vue/actions/workflows/beta.yml/badge.svg)](https://github.com/HannesOberreiter/btree_vue/actions/workflows/beta.yml)
[![live](https://github.com/HannesOberreiter/btree_vue/actions/workflows/live.yml/badge.svg)](https://github.com/HannesOberreiter/btree_vue/actions/workflows/live.yml)

Written in typescript build with Vue.js and Quasar. The b.tree application is for managing your honey bee colonies in a modern way. More infos at <https://www.btree.at>.

- [Repo - b.tree Server API](https://github.com/HannesOberreiter/btree_server)
  - Live: <https://api.btree.at>
  - Beta: <https://api-beta.btree.at>
- [Private Repo - b.tree Frontend](https://github.com/HannesOberreiter/btree_vue)
  - Live: <https://app.btree.at>
  - Beta: <https://beta.btree.at>
- [Repo - b.tree Database](https://github.com/HannesOberreiter/btree_database)
- [Repo - b.tree iOS](https://github.com/HannesOberreiter/btree_ios)

## Install the dependencies

```bash
npm install
```

`npm postinstall` is implement because of a TypeScript bug with FullCalendar. It is run automatically, you may need to restart your IDE after running `npm` or updating FullCalendar.

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
npm run quasar dev
npm run quasar dev -m pwa
```

We use auto-import plugins to import common libraries and components, see definitions at [src/auto-\*.d.ts](src/).

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

### PWA service worker development

Chrome should be fine with `localhost` and non SSL. If testing over network with IP address it must run over SSL. See quasar config `devServer: ... https: false`.

### Translation (vue-i18n)

The translation in `.json` format can be found in [src/i18n](src/i18n/). On developer mode the console warning can be ignored:

> You are running the esm-bundler build of vue-i18n. ...

### Lint & Format (eslint & prettier)

```bash
npm run lint
npm run format
```

### Build the app for production

```bash
npm run quasar build
npm run quasar build -m pwa
```

#### Server

Currently running with Ngnix service, demo config files for `etc/nginx/sites-available/btree_at_app.conf`.

- Live Server: [btree_at_app.conf](btree_at_app.conf)
- Beta Server: [btree_at_beta.conf](btree_at_beta.conf)

Settings up Nginx:

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

#### Deployment & Staging

The beta url and api are our staging and testing url. GitHub action is automatically uploading the latest PWA build version to the servers `var/www` folder with sftp. The [master] branch uploads to <https://beta.btree.at> and is connected to `api-beta.btree.at`. The [live] branch uploads the live version for <https://app.btree.at> and is connected to the live backend `api.btree.at`.

#### .env

The example [example.env](example.env) show the needed environmental variables. On production this can be set via `.env` file or as `process.env.*` in build (e.g. GitHub secret on build). Defined types can be found in [src/env.d.ts](src/env.d.ts). In development we use `/api` as backend url, see **API Proxy** section.

#### Version Number

Changes and version number are documented in [src/assets/news.json](src/assets/news.json). This news are somewhat only for the end-user. This is a legacy thing and may be replaced with GitHub commints in future.

#### Icons

Icons generated with Icongenie for commands see: <https://quasar.dev/icongenie/command-list>

```bash
icongenie generate --icon public/logo.png --padding 5,5 --skip-trim --theme-color 2b957a --splashscreen-color f5f7fa --splashscreen-icon-ratio 60
```

## TWA (Trusted Web Activity)

We do not generate a native application for iOS or Android, as alternative we use a [TWA](https://developer.chrome.com/docs/android/trusted-web-activity/).

- Simple online interface creates our `.apk` file: [pwabuilder.com/publish?site=https://app.btree.at](https://www.pwabuilder.com/publish?site=https://app.btree.at)
- Alternative: Bubblewrap CLI: [github.com/GoogleChromeLabs/bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)

PlayStore Link: [https://play.google.com/console/u/0/developers](https://play.google.com/console/u/0/developers)

Settings:

```json
  "package": "com.bnative", // needs to be the same as in store otherwise a new app will be created
  "name": "b.tree Beekeeping Database",
  "launcherName": "btree",
  "version": "6.0.0" // for the enduser
  "versionsCode": 6X // check PlayStore for latest release
  "features": {
    "locationDelegation": {
      "enabled": true
    }
  },
  // Using our own signed key
  "signingKey": {
    "path": "android.keystore",
    "alias": "bNative"
  },
  "enableSiteSettingsShortcut": true,
```

Important that the TWA works in Google PlayStore a the `.well-known/assetlinks.json` must be present on the apps root folder. Fingerprint is from our signed key.

```json
// .well-known/assetlinks.json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.bnative",
      "sha256_cert_fingerprints": [
        "53:EB:89:D6:22:51:71:D9:04:BB:5B:E1:92:AA:8E:93:28:21:52:2F:B9:CE:68:62:33:38:F9:5B:61:7E:8F:51"
      ]
    }
  }
]
```
