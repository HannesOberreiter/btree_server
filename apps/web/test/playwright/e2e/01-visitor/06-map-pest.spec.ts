import { expect, test } from '../../support/helpers';

const observationUrl = 'https://asiatischehornisse.ch/karte';

test.describe('visitor - credential-free public pest datasets', () => {
  test.use({ serviceWorkers: 'block' });

  for (const [taxa, path, signedIn] of [
    ['velutina', '/pub/vespa-velutina/map/', false],
    ['aethina_tumida', '/pub/aethina-tumida/map/', false],
    ['velutina', '/map/vespa_velutina', true],
    ['aethina_tumida', '/map/aethina_tumida', true]
  ] as const) {
    test(`${taxa} ${signedIn ? 'signed-in' : 'public'} map datasets omit credentials with a session cookie present`, async ({
      page,
      context,
      baseURL
    }) => {
      const frontendOrigin = new URL(baseURL!).origin;
      const cookie = { name: 'session', value: 'fake-session-for-public-map' };
      await context.addCookies([
        { ...cookie, url: frontendOrigin, httpOnly: true, sameSite: 'Lax' }
      ]);

      await page.clock.setFixedTime(new Date('2026-09-29T10:00:00Z'));
      if (signedIn) {
        // Exercise the signed-in UI without real accounts or a backend login.
        await page.addInitScript(() => {
          localStorage.setItem(
            'user',
            JSON.stringify({
              id: 101,
              name: 'Synthetic viewer',
              lang: 'en',
              format: 'YYYY-MM-DD'
            })
          );
          localStorage.setItem(
            'company',
            JSON.stringify({
              id: 202,
              name: 'Synthetic company',
              rank: 1,
              paid: '2099-01-01'
            })
          );
          localStorage.setItem(
            'refresh',
            JSON.stringify(new Date().toISOString())
          );
        });
      }

      // Keep assets local and prevent unmocked API or external requests.
      await page.route('**/*', route => {
        const url = new URL(route.request().url());
        return url.origin === frontendOrigin && !url.pathname.includes('/v1/')
          ? route.continue()
          : route.abort();
      });
      await page.route(`**/v1/public/${taxa}/observations/recent`, route =>
        route.fulfill({ json: [] })
      );
      await page.route(`**/v1/public/${taxa}/observations/stats`, route =>
        route.fulfill({ json: { count: 0 } })
      );

      await page.route(`**/v1/public/${taxa}/observations/year/2025`, route =>
        route.fulfill({ json: [] })
      );
      if (signedIn) {
        await page.route('**/v1/apiary?*', route =>
          route.fulfill({ json: { results: [], total: 0 } })
        );
      }

      const fetches: Array<{ url: string; credentials: string }> = [];
      await page.exposeFunction(
        'recordPublicMapFetch',
        (url: string, credentials: string) => {
          fetches.push({ url, credentials });
        }
      );
      await page.addInitScript(() => {
        const originalFetch = window.fetch;
        const record = (
          window as typeof window & {
            recordPublicMapFetch: (
              url: string,
              credentials: RequestCredentials
            ) => Promise<void>;
          }
        ).recordPublicMapFetch;
        window.fetch = async (input, init) => {
          const request = new Request(input, init);
          if (
            /\/v1\/public\/[^/]+\/observations\/|\/v1\/apiary(?:\?|$)/.test(
              request.url
            )
          ) {
            await record(request.url, request.credentials);
          }
          return originalFetch(input, init);
        };
      });

      const recentRequest = page.waitForRequest(
        `**/v1/public/${taxa}/observations/recent`
      );
      const statsRequest = page.waitForRequest(
        `**/v1/public/${taxa}/observations/stats`
      );
      const apiaryRequest = signedIn
        ? page.waitForRequest('**/v1/apiary?*')
        : undefined;
      await page.goto(path);
      for (const request of await Promise.all([recentRequest, statsRequest])) {
        // Prove the cookie applies to this URL, not merely an unrelated origin.
        expect(await context.cookies(request.url())).toEqual(
          expect.arrayContaining([expect.objectContaining(cookie)])
        );
        expect(await request.headerValue('cookie')).toBeNull();
        expect(fetches).toContainEqual({
          url: request.url(),
          credentials: 'omit'
        });
      }
      if (apiaryRequest) {
        const request = await apiaryRequest;
        expect(await request.headerValue('cookie')).toContain(
          `${cookie.name}=${cookie.value}`
        );
        expect(fetches).toContainEqual({
          url: request.url(),
          credentials: 'include'
        });

        const yearlyRequest = page.waitForRequest(
          `**/v1/public/${taxa}/observations/year/2025`
        );
        await page.locator('.leaflet-control-attribution .q-select').click();
        await page.getByRole('option', { name: '2025', exact: true }).click();
        const yearly = await yearlyRequest;
        expect(await context.cookies(yearly.url())).toEqual(
          expect.arrayContaining([expect.objectContaining(cookie)])
        );
        expect(await yearly.headerValue('cookie')).toBeNull();
        expect(fetches).toContainEqual({
          url: yearly.url(),
          credentials: 'omit'
        });
      }
      await expect(page.locator('.leaflet-control-attribution')).toContainText([
        'Recent observations: 0'
      ]);
    });
  }
});

test.describe('visitor - pest map UTC timestamps', () => {
  test.use({ timezoneId: 'Europe/Lisbon', locale: 'en-GB' });

  test('uses explicit UTC response timestamps for local dates and seven-day markers', async ({
    page
  }) => {
    await page.clock.setFixedTime(new Date('2026-09-20T23:00:00Z'));
    await page.route('**/v1/public/velutina/observations/recent', route =>
      route.fulfill({
        json: [
          {
            location: { x: 49.4582838, y: 15.2718234 },
            uri: JSON.stringify('https://stopvespa.icnf.pt/geovisualizador/'),
            observed_at: '2026-09-13T23:30:00Z',
            observation_type: 'nest'
          }
        ]
      })
    );
    await page.route('**/v1/public/velutina/observations/stats', route =>
      route.fulfill({ json: { count: 1 } })
    );
    await page.route('**.tile.openstreetmap.org/**', route => route.abort());
    await page.goto('/pub/vespa-velutina/map/');
    const marker = page.locator('.leaflet-interactive').first();
    await expect(marker).toHaveAttribute('stroke', 'red');
    await marker.click({ force: true });
    await expect(page.locator('.leaflet-popup-content')).toContainText(
      '14/09/2026'
    );
  });
});

test.describe('visitor - pest map', () => {
  for (const observation of [
    { type: 'nest', label: 'Nest', url: 'https://www.stopvelutina.it/dove/' },
    {
      type: 'hornet',
      label: 'Single hornet',
      url: 'https://stopvespa.icnf.pt/geovisualizador/'
    }
  ]) {
    test(`shows ${observation.type} markers with European source links`, async ({
      page
    }) => {
      await page.route('**/v1/public/velutina/observations/recent', route =>
        route.fulfill({
          json: [
            {
              location: { x: 49.4582838, y: 15.2718234 },
              uri: JSON.stringify(observation.url),
              observed_at: new Date().toISOString(),
              observation_type: observation.type
            }
          ]
        })
      );
      await page.route('**/v1/public/velutina/observations/stats', route =>
        route.fulfill({ json: { count: 1 } })
      );
      await page.route('**.tile.openstreetmap.org/**', route => route.abort());
      await page.goto('/pub/vespa-velutina/map/');
      const marker = page.locator('.leaflet-interactive').first();
      await expect(marker).toBeVisible();
      await marker.click({ force: true });
      const popup = page.locator('.leaflet-popup-content');
      await expect(popup).toContainText(`Type: ${observation.label}`);
      await expect(popup.getByRole('link')).toHaveAttribute(
        'href',
        observation.url
      );
      await page.locator('.leaflet-popup-close-button').click();
      await page.locator('.leaflet-control-attribution a[href="#"]').click();
      const dialog = page.getByRole('dialog');
      for (const [name, url] of [
        ['asiatischehornisse.ch / info fauna', observationUrl],
        ['Stop Velutina / CREA', 'https://www.stopvelutina.it/dove/'],
        [
          'Beewatching',
          'https://www.beewatching.it/sito-stopvelutina-mappa-segnalazioni-embedded/'
        ],
        [
          'Beewatching — CC BY-NC-ND 4.0',
          'https://creativecommons.org/licenses/by-nc-nd/4.0/'
        ],
        ['ICNF STOPvespa', 'https://stopvespa.icnf.pt/geovisualizador/']
      ] as const) {
        await expect(
          dialog.getByRole('link', { name, exact: true })
        ).toHaveAttribute('href', url);
      }
    });
  }

  test('excludes Italian and Portuguese providers from Aethina sources', async ({
    page
  }) => {
    await page.route('**/v1/public/aethina_tumida/observations/recent', route =>
      route.fulfill({ json: [] })
    );
    await page.route('**/v1/public/aethina_tumida/observations/stats', route =>
      route.fulfill({ json: { count: 0 } })
    );
    await page.route('**.tile.openstreetmap.org/**', route => route.abort());
    await page.goto('/pub/aethina-tumida/map/');
    await page.locator('.leaflet-control-attribution a[href="#"]').click();
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('link', { name: 'infofauna.ch', exact: true })
    ).toBeVisible();
    await expect(
      dialog.getByRole('link', { name: /Stop Velutina|Beewatching|ICNF/ })
    ).toHaveCount(0);
  });

  test('shows the observation type in a Velutina popup', async ({ page }) => {
    await page.route('**/v1/public/velutina/observations/recent', route =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([
          {
            location: { x: 49.4582838, y: 15.2718234 },
            uri: JSON.stringify(observationUrl),
            observed_at: new Date().toISOString(),
            observation_type: 'hornet_and_nest'
          }
        ])
      })
    );
    await page.route('**/v1/public/velutina/observations/stats', route =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ count: 1 })
      })
    );
    await page.route('**.tile.openstreetmap.org/**', route => route.abort());

    await page.goto('/pub/vespa-velutina/map/');
    const marker = page.locator('.leaflet-interactive').first();
    await expect(marker).toBeVisible();
    await marker.click({ force: true });

    const popup = page.locator('.leaflet-popup-content');
    await expect(popup).toContainText('Type: Single hornet and nest');
    await expect(popup.getByRole('link')).toHaveAttribute(
      'href',
      observationUrl
    );
  });
});
