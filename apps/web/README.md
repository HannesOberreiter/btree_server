# Frontend for b.tree Beekeeping Webapplication

Written in TypeScript with Vue 3 and Quasar. The b.tree application is for managing your honey bee colonies in a modern way. More infos at <https://www.btree.at>. See the [repository README](../../README.md) for the other parts of b.tree.

## Install the dependencies

```bash
pnpm install
```

`pnpm postinstall` runs `quasar prepare` automatically to generate Quasar's TypeScript configuration and declarations under `.quasar/`. Run `pnpm exec quasar prepare` if these generated files are missing.

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
pnpm dev
```

Quasar app-vite v3 provides the `@/` alias for `src/`. Use `@/components/...`, `@/stores/...`, and `@/helpers/...` imports.

### API proxy development

The development server proxies `/api` requests to the backend through [quasar.config.ts](quasar.config.ts), avoiding cross-origin browser requests. Set `BACKEND_URL` in `.env` to an absolute URL ending in `/api`, such as `http://localhost:3000/api`, using the actual backend port. The client derives `/api` from this URL; the proxy strips that prefix before forwarding to the configured target, which already includes `/api`.

The US backend environment exposure and `/us/api` proxy are currently disabled. If enabling US support, update both together.

### PWA service worker development

Chrome should be fine with `localhost` and non SSL. If testing over network with IP address it must run over SSL. See quasar config `devServer: ... https: false`.

### Translation (vue-i18n)

The translation in `.json` format can be found in [src/i18n](src/i18n/). On developer mode the console warning can be ignored:

> You are running the esm-bundler build of vue-i18n. ...

### Format, lint, and typecheck

We use [oxfmt](https://github.com/oxc-project/oxc/tree/main/crates/oxfmt) for formatting and [oxlint](https://oxc.rs/docs/guide/usage/linter.html) for linting.

```bash
pnpm lint        # format and auto-fix lint issues
pnpm lint:check  # check formatting and lint without writing
pnpm typecheck   # Vue/TypeScript typecheck
```

### Build the app for production

```bash
pnpm build
pnpm build:pwa
```

#### Server

The frontend is hosted on Bunny Storage behind Bunny CDN. The Nginx instructions below describe the former origin and are retained for rollback reference; they are not required for Bunny hosting.

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

Work on `beta` and promote changes to `main` through pull requests from `beta`. The existing automated release-please PRs are the exception; do not commit directly or merge locally into `main`.

Both environments upload PWA builds to Bunny S3 Storage in Frankfurt and purge their existing Bunny CDN pull zones. The APIs remain hosted separately.

- Beta: pushes to `beta` deploy to storage zone `beta-btree-at`, served at <https://beta.btree.at>, using `api-beta.btree.at`. The workflow uses `BUNNY_STORAGE_PASSWORD` and pull zone `1496328`.
- Production: releases on `main` call `live.yml`, which also supports manual dispatch. It deploys to storage zone `app-btree-at`, served at <https://app.btree.at>, using `api.btree.at`. The workflow uses the separate secret `BUNNY_STORAGE_PASSWORD_LIVE` and pull zone `1513251`.

Both workflows use `BUNNY_KEY` for CDN purges. Production deployments are serialized. They upload assets before `sw.js` and `index.html` and retain older assets for open clients. Only content-hashed files under `assets/` receive immutable caching; other files use `no-cache`.

Bunny infrastructure, SPA fallback, production edge caching rules, and the staged cutover/rollback procedure are managed in the separate `infra` repository under `bunny/btree/`. Do not switch the production origin until the storage zone has a verified production build. SFTP credentials are no longer used by `live.yml`; retain the old origin during the rollback window.

#### .env

The template [example.env](example.env) lists the environment variables. Quasar loads `.env`, and values can also be supplied through the process environment in CI. [quasar.config.ts](quasar.config.ts) selects which values are exposed to the browser. In development, configure an absolute `BACKEND_URL` ending in `/api`; browser requests use the same-origin proxy path described under **API proxy development**.

#### Version Number

Release-please manages the release version in [.release-please-manifest.json](.release-please-manifest.json) and release notes in [CHANGELOG.md](CHANGELOG.md), using [release-please-config.json](release-please-config.json).

### PWA service worker

PWA uses Quasar Workbox `GenerateSW`. PWA-specific dependencies are isolated in [src-pwa/package.json](src-pwa/package.json); run `pnpm --dir src-pwa install` if they are missing locally.

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
{
  "package": "com.bnative", // needs to be the same as in store otherwise a new app will be created
  "name": "b.tree Beekeeping Database",
  "launcherName": "btree",
  "version": "6.0.0", // for the enduser
  "versionsCode": "6X", // check PlayStore for latest release
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
  "enableSiteSettingsShortcut": true
}
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
