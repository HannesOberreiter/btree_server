/* eslint-disable @typescript-eslint/no-namespace */
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Add generated demo email address to an email form field.
       */
      add_demo_mail(): Chainable<Element>;
      /**
       * Fills in correct password based on loaded user.
       */
      add_demo_password(): Chainable<Element>;
      /**
       * Redirect to login page and login the demo user.
       */
      login_demo(): Chainable<Element>;
      /**
       * Loads cached session or login user.
       */
      login_session(): Chainable<Element>;
      /**
       * If run fill integration test this will set the login user to use the newly registered user otherwise single tests will use the 'demo_en@btree.at' user.
       */
      isRegistered(): Chainable<Element>;
    }
  }
}

const currentTimestamp = new Date().getTime();
const newMail = `test${currentTimestamp}@btree.at`;
let noRegistration = true;

Cypress.Commands.add('isRegistered', () => {
  noRegistration = false;
});

Cypress.Commands.add('add_demo_mail', () => {
  const userFixture = noRegistration ? 'user_demo' : 'user_new';
  cy.fixture(userFixture).then((user) => {
    cy.get('[name=email]')
      .clear()
      .type(noRegistration ? user.mail : newMail);
  });
});

Cypress.Commands.add('add_demo_password', () => {
  const userFixture = noRegistration ? 'user_demo' : 'user_new';
  cy.fixture(userFixture).then((user) => {
    cy.get('[name=password]').clear().type(user.password);
    cy.get('[name=confirmPassword]').clear().type(user.password);
  });
});

Cypress.Commands.add('login_demo', () => {
  const userFixture = noRegistration ? 'user_demo' : 'user_new';
  cy.visit('/visitor/login');
  cy.fixture(userFixture).then((user) => {
    cy.get('[name=email]').type(noRegistration ? user.mail : newMail);
    cy.get('[name=password]').type(user.password);
    cy.get('form').submit();
    cy.get('header', { timeout: 50000 }).should('be.visible');
  });
});

Cypress.Commands.add('login_session', () => {
  cy.login_demo();
  cy.saveLocalStorage();
  /*
  cy.session(
    ['main'],
    () => {
      cy.login_demo();
    },
    {
      validate() {
        cy.visit('/');
        cy.get('header', { timeout: 50000 }).should('be.visible');
        cy.dataCy('dialog-session-timeout').should('not.exist');
      },
    }
  );*/
});

// DO NOT REMOVE
// Imports Quasar Cypress AE predefined commands
import { registerCommands } from '@quasar/quasar-app-extension-testing-e2e-cypress';
registerCommands();
