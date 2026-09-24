import { expect, test } from '../../support/helpers';

const observationUrl = 'https://asiatischehornisse.ch/karte';

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
