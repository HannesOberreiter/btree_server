/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
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
     * @example cy.login_demo('/new/hive', false)
     */
    login_demo(next: string, sso: boolean): Chainable<Element>;
    /**
     * Loads cached session or login user.
     * @example cy.login_session('/new/hive')
     */
    login_session(url: string): Chainable<Element>;
    /**
     * If run fill integration test this will set the login user to use the newly registered user otherwise single tests will use the 'demo_en@btree.at' user.
     */
    isRegistered(): Chainable<Element>;
    /**
     * Edit first row in table
     * @example cy.table_edit_row('form-hive')
     */
    table_edit_row(form: string): Chainable<Element>;
    /**
     * Delete first row in table
     * @example cy.table_delete_row()
     */
    table_delete_row(): Chainable<Element>;
  }
}
