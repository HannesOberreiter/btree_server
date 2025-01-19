import { injectQuasarDevServerConfig } from '@quasar/quasar-app-extension-testing-e2e-cypress/cct-dev-server';
import { defineConfig } from 'cypress';

export default defineConfig({
  fixturesFolder: 'test/cypress/fixtures',
  screenshotsFolder: 'test/cypress/screenshots',
  videosFolder: 'test/cypress/videos',
  chromeWebSecurity: false,
  video: false,
  defaultCommandTimeout: 10_000,
  watchForFileChanges: false,
  e2e: {
    experimentalRunAllSpecs: true,
    // setupNodeEvents(on, config) {},
    baseUrl: 'http://localhost:9200/',
    supportFile: 'test/cypress/support/e2e.ts',
    specPattern: 'test/cypress/e2e/**/*.spec.{js,jsx,ts,tsx}',
  },
  component: {
    // setupNodeEvents(on, config) {},
    supportFile: 'test/cypress/support/component.ts',
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    indexHtmlFile: 'test/cypress/support/component-index.html',
    devServer: injectQuasarDevServerConfig(),
  },
});
