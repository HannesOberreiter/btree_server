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
      mail_new(): Chainable<Element>;
      login_new(): Chainable<Element>;
      login_demo(): Chainable<Element>;
    }
  }
}

const currentTimestamp = new Date().getTime();
const newMail = `test${currentTimestamp}@btree.at`;

Cypress.Commands.add('mail_new', () => {
  cy.get('[name=email]').clear().type(newMail);
});

Cypress.Commands.add('login_demo', () => {
  cy.visit('/visitor/login');
  cy.fixture('user_new').then((user) => {
    cy.get('[name=email]').type(newMail);
    cy.get('[name=password]').type(user.password);
    cy.get('form').submit();
    cy.get('header').should('be.visible');
  });
});

// DO NOT REMOVE
// Imports Quasar Cypress AE predefined commands
import { registerCommands } from '@quasar/quasar-app-extension-testing-e2e-cypress';
registerCommands();
