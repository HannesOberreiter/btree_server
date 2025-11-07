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

// DO NOT REMOVE
// Imports Quasar Cypress AE predefined commands
import { registerCommands } from '@quasar/quasar-app-extension-testing-e2e-cypress';
import find from 'lodash-es/find';

registerCommands();

const currentTimestamp = new Date().getTime();
const newMail = `test${currentTimestamp}@btree.at`;
let noRegistration = true;

Cypress.Commands.add('table_edit_row', (form: string) => {
	cy.get('tbody > tr > td').first().click();
	cy.dataCy('btn-table-edit').click();
	cy.dataCy(form).should('exist');
	cy.dataCy('btn-form-update').click();
	cy.dataCy(form).should('not.exist');
	cy.get('tbody > tr > td').first().click();
});

Cypress.Commands.add('table_delete_row', () => {
	cy.get('tbody > tr > td').first().click();
	cy.dataCy('btn-table-dropdown').click();
	cy.dataCy('btn-table-delete').click();
	cy.get('.q-dialog').should('exist');
	cy.get('.btn-confirm').click();
	cy.get('.q-dialog').should('not.exist');
});

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

Cypress.Commands.add('login_demo', (next = '', sso = false) => {
	const userFixture = noRegistration ? 'user_demo' : 'user_new';
	if (!sso)
		cy.visit(next ? `/visitor/login?next=${next}` : '/visitor/login');
	cy.fixture(userFixture).then((user) => {
		cy.get('[name=email]').type(noRegistration ? user.mail : newMail);
		cy.get('[name=password]').type(user.password);
		cy.get('form').submit();
		if (!sso)
			cy.get('header', { timeout: 50000 }).should('be.visible');
	});
});

Cypress.Commands.add('login_session', (url: string) => {
	const userFixture = noRegistration ? 'user_demo' : 'user_new';
	cy.fixture(userFixture).then((user) => {
		cy.session(
			[userFixture === 'user_demo' ? 'user_demo' : newMail, url],
			() => {
				cy.request({
					url: 'http://localhost:8101/api/v1/auth/login',
					method: 'POST',

					headers: {
						origin: 'http://localhost:8001',
					},
					body: {
						email: userFixture === 'user_demo' ? user.mail : newMail,
						password: user.password,
					},
				}).then((response) => {
					// window.localStorage.setItem('token', JSON.stringify(response.body.token));
					window.localStorage.setItem(
						'user',
						JSON.stringify(response.body.data),
					);
					const curId = response.body.data.saved_company || 0;
					const companies = response.body.data.company;
					let currentCompany: any = companies[0];
					if (curId !== 0) {
						currentCompany = find(companies, { id: curId });
					}
					// In case the user got removed from the saved company
					if (!currentCompany) {
						currentCompany = companies[0];
					}
					localStorage.setItem('company', JSON.stringify(currentCompany));
					const cookie: string = response.headers!['set-cookie']![0]!;
					const firstPart = cookie.split(';')[0]!;
					const separator = firstPart.indexOf('=');
					const name = firstPart.substring(0, separator);
					const value = firstPart.substring(separator + 1);
					cy.setCookie(name, value);
				});
				// cy.saveLocalStorage();
			},
		);

		// cy.login_demo(url);
		/* cy.url().then((currentUrl) => {
    if (!currentUrl.includes(url)) {
      cy.visit(url);
    }
  }); */
	});
	cy.visit(url);

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
  ); */
});
