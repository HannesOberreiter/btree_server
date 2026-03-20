# AGENTS.md

This file provides guidance for AI coding agents working in this repository.

## Project Overview

**b.tree** is a beekeeping management web application built with [Quasar](https://quasar.dev/) (Vue 3) and distributed as both a **PWA** (Progressive Web App) and **TWA** (Trusted Web Activity for Android). It connects to a separate backend server ([btree_server](https://github.com/HannesOberreiter/btree_server)).

The app supports EU and US backend regions, four languages (German, English, French, Italian), and features hive management, apiary mapping, calendars, scales, treatments, harvests, and more.

---

## Repository Structure

```
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

- The **backend server must be running** locally for API calls to work (see below)

### Environment Variables

Copy `example.env` to `.env` and fill in the values:

```env
DROPBOX_CLIENT_ID=
OPENWEATHER_APP_ID=
BACKEND_URL=http://localhost:3000   # Local backend URL (EU)
BACKEND_URL_US=http://localhost:3000 # Local backend URL (US, can be same)
MATOMO_HOST=https://your-matomo
MATOMO_SITE_ID=
PAYPAL_CLIENT_ID=
```

> If a `.env` file is present, Quasar loads it automatically. In CI (no `.env`), environment variables are read from the system.

### Backend Server (Required for Local Dev)

The dev server proxies all API calls to the backend — **the backend must be running** before starting the frontend dev server.

- **Remote repo:** https://github.com/HannesOberreiter/btree_server
- **Expected local path:** `../btree_server` (sibling directory)

Start the backend server first per its own README, then start this frontend.

### Proxy Rewrites

The Quasar dev server (`quasar.config.ts`) rewrites API requests:

| Frontend path | Proxied to | Rewrite |
|---|---|---|
| `/api/*` | `BACKEND_URL` | `/api` prefix stripped |
| `/us/api/*` | `BACKEND_URL_US` | `/us/api` prefix stripped |

Both proxies use `changeOrigin: true` and `secure: false`. This means a request to `/api/hives` in the browser hits `BACKEND_URL/hives` on the backend.

### Install & Run

```bash
npm install
npm run dev        # Dev server at http://localhost:9000 (default Quasar port)
```

---

## Common Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR (requires backend running) |
| `npm run build` | Build SPA for production |
| `npm run build:pwa` | Build PWA/TWA for production |
| `npm run lint` | Check for lint errors |
| `npm run lint:fix` | Auto-fix lint errors |
| `npm run test:e2e` | Run all Playwright E2E tests |
| `npm run test:e2e:ui` | Run E2E tests with interactive Playwright UI |
| `npm run test:e2e:ci` | Run E2E tests in CI mode |

---

## Code Style & Conventions

This project uses **Antfu ESLint config** with the Quasar plugin.

**Always run `npm run lint` before committing.** Fix errors with `npm run lint:fix` where possible, but review auto-fixes manually.

### Import Path Aliases

Use these aliases instead of relative paths:

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
- **Base URL:** `http://localhost:9000` (dev server must be running)
- **Backend:** Also required — tests make real API calls
- **Workers:** 1 (sequential, not parallel)
- **Retries:** 1 on failure
- **Auth setup:** `test/playwright/e2e/auth.setup.ts` — runs first to establish an authenticated session stored in `test/playwright/.auth/`

Test categories:

- `01-visitor/` — unauthenticated flow tests
- `02-user/` — authenticated user flow tests (depends on auth setup)

```bash
# Run all tests (dev server + backend must be running):
npm run test:e2e

# Debug interactively:
npm run test:e2e:ui
```

Screenshots on failure and traces are captured to `test/playwright/test-results/`. HTML reports go to `test/playwright/report/`.

---

## PWA / TWA Notes

- **PWA build:** `npm run build:pwa` — outputs to `dist/pwa/`
- **Service worker:** Uses Workbox `GenerateSW` mode; `skipWaiting` and `clientsClaim` are both enabled (updates activate immediately)
- **TWA:** The PWA build is used to generate the Android Trusted Web Activity. Do not change the manifest or service worker behaviour without considering TWA compatibility.
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

- **API layer:** All API requests go through `src/services/`. In development they are transparently proxied to the backend. Never hard-code backend URLs in components.
- **Stores:** Pinia stores in `src/stores/` manage global state. Prefer composables for local/shared logic without global state. Prefer in future composables over pinia store.
- **Translations:** When adding UI text, add keys to all four locale files under `src/i18n/` (`de`, `en`, `fr`, `it`).
- **Two regions:** The app supports EU (`/api`) and US (`/us/api`) backends. Region-aware API calls route through the correct proxy prefix.
- **Content Security Policy:** Managed via `vite-plugin-csp-guard` in `quasar.config.ts`. External services allowed include `*.btree.at`, PayPal, Dropbox, OpenWeather, iNaturalist, OpenStreetMap, ArcGIS, and Meteoblue.
