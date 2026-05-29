# AGENTS.md

Guidance for AI coding agents in this repo.

## Project Overview

**b.tree** = beekeeping management web app. Built with [Quasar](https://quasar.dev/) (Vue 3). Ships as **PWA** (Progressive Web App) + **TWA** (Trusted Web Activity for Android). Connects to backend server ([btree_server](https://github.com/HannesOberreiter/btree_server)).

Supports EU + US backend regions, four languages (German, English, French, Italian), hive management, apiary mapping, calendars, scales, treatments, harvests, more.

---

## Repository Structure

```txt
btree_vue/
├── src/                    # Main application source
│   ├── boot/               # Quasar boot files (i18n, analytics, vue-query, etc.)
│   ├── components/         # Reusable Vue components
│   ├── composables/        # Vue composables (reusable logic)
│   ├── helpers/            # Utility functions
│   ├── i18n/               # Translations: de, en, fr, it
│   ├── layouts/            # Page layout components
│   ├── pages/              # Route-level page components
│   ├── router/             # Vue Router configuration
│   ├── services/           # API/service layer
│   ├── stores/             # Pinia stores
│   ├── constants.ts
│   ├── types.ts
│   └── env.d.ts
├── src-pwa/                # PWA-specific files (service worker, manifest)
├── test/playwright/        # Playwright E2E tests
│   ├── e2e/
│   │   ├── 01-visitor/     # Tests for unauthenticated users
│   │   └── 02-user/        # Tests for authenticated users
│   ├── fixtures/
│   └── support/
├── public/                 # Static assets
├── quasar.config.ts        # Quasar + Vite build/dev configuration
├── eslint.config.js        # ESLint (Antfu config + Quasar plugin)
├── playwright.config.ts    # Playwright E2E test configuration
├── example.env             # Template for local .env
└── tsconfig.json           # TypeScript config (extends .quasar/tsconfig.json)
```

---

## Development Setup

### Prerequisites

- **backend server must be running** locally for API calls.

### Environment Variables

Copy `example.env` to `.env`, fill values:

```env
DROPBOX_CLIENT_ID=
OPENWEATHER_APP_ID=
BACKEND_URL=http://localhost:3000   # Local backend URL (EU)
BACKEND_URL_US=http://localhost:3000 # Local backend URL (US, can be same)
MATOMO_HOST=https://your-matomo
MATOMO_SITE_ID=
PAYPAL_CLIENT_ID=
```

> If `.env` exists, Quasar loads it automatically. In CI (no `.env`), env vars read from system.

### Backend Server (Required for Local Dev)

Dev server proxies all API calls to backend — **backend must run** before frontend dev server.

- **Remote repo:** https://github.com/HannesOberreiter/btree_server
- **Expected local path:** `../btree_server` (sibling directory)

Start backend per its README, then start frontend.

### Proxy Rewrites

Quasar dev server (`quasar.config.ts`) rewrites API requests:

| Frontend path | Proxied to | Rewrite |
|---|---|---|
| `/api/*` | `BACKEND_URL` | `/api` prefix stripped |
| `/us/api/*` | `BACKEND_URL_US` | `/us/api` prefix stripped |

Both proxies use `changeOrigin: true` + `secure: false`. Request `/api/hives` in browser hits `BACKEND_URL/hives` on backend.

### Install & Run

```bash
pnpm install
pnpm dev        # Dev server at http://localhost:9000 (default Quasar port)
```

---

## Common Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with HMR (requires backend running) |
| `pnpm build` | Build SPA for production |
| `pnpm build:pwa` | Build PWA/TWA for production |
| `pnpm lint` | Check for lint errors |
| `pnpm lint:fix` | Auto-fix lint errors |
| `pnpm test:e2e` | Run all Playwright E2E tests |
| `pnpm test:e2e:ui` | Run E2E tests with interactive Playwright UI |
| `pnpm test:e2e:ci` | Run E2E tests in CI mode |

---

## Code Style & Conventions

Uses **Antfu ESLint config** + Quasar plugin.

**Always run `pnpm lint` before committing.** Fix with `pnpm lint:fix` when safe; review auto-fixes manually.

### Import Path Aliases

Use aliases instead of relative paths:

```ts
import MyComponent from 'components/MyComponent.vue';
import { useMyStore } from 'stores/myStore';
import { helper } from 'src/helpers/helper';
```

Available aliases: `src`, `components`, `layouts`, `pages`, `assets`, `boot`, `stores`.

---

## Testing

### E2E Tests (Playwright)

- **Test directory:** `test/playwright/e2e/`
- **Base URL:** `http://localhost:9000` (dev server must run)
- **Backend:** required — tests make real API calls
- **Workers:** 1 (sequential, not parallel)
- **Retries:** 1 on failure
- **Auth setup:** `test/playwright/e2e/auth.setup.ts` — runs first, stores auth session in `test/playwright/.auth/`

Test categories:

- `01-visitor/` — unauthenticated flow tests
- `02-user/` — authenticated user flow tests (depends on auth setup)

```bash
# Run all tests (dev server + backend must be running):
pnpm test:e2e

# Debug interactively:
pnpm test:e2e:ui
```

Failure screenshots + traces: `test/playwright/test-results/`. HTML reports: `test/playwright/report/`.

---

## PWA / TWA Notes

- **PWA build:** `pnpm build:pwa` — outputs to `dist/pwa/`
- **Service worker:** Workbox `GenerateSW`; `skipWaiting` + `clientsClaim` enabled (updates activate immediately)
- **TWA:** PWA build generates Android Trusted Web Activity. Do not change manifest/service worker behaviour without TWA compatibility check.
- **Manifest:** `src-pwa/manifest.json`
- **Custom service worker logic:** `src-pwa/custom-service-worker.ts`

---

## Key Dependencies

| Package | Purpose |
|---|---|
| Quasar 2.x | UI framework + PWA/TWA support |
| Vue 3 | Frontend framework (Composition API) |
| Pinia | State management |
| TanStack Query | Server state / data fetching |
| Vue Router 5 | Client-side routing (history mode) |
| Vue I18n 11 | Internationalisation (de, en, fr, it) |
| Vuelidate | Form validation |
| FullCalendar 6 | Event calendar |
| Leaflet + Vue-Leaflet | Interactive maps |
| ECharts | Data visualisation / charts |
| Day.js | Date/time handling |
| Axios | HTTP client for API calls |

---

## Architecture Notes

- **API layer:** All API requests via `src/services/`. Dev transparently proxies to backend. Never hard-code backend URLs in components.
- **Stores:** Pinia stores in `src/stores/` manage global state. Prefer composables for local/shared logic without global state. Prefer future composables over pinia store.
- **Translations:** Add UI text keys to all four locales under `src/i18n/` (`de`, `en`, `fr`, `it`).
- **Two regions:** App supports EU (`/api`) + US (`/us/api`) backends. Region-aware API calls route through correct proxy prefix.
- **Content Security Policy:** Managed via `vite-plugin-csp-guard` in `quasar.config.ts`. Allowed external services include `*.btree.at`, PayPal, Dropbox, OpenWeather, iNaturalist, OpenStreetMap, ArcGIS, Meteoblue.
