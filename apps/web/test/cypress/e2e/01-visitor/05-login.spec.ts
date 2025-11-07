describe('visitor - Login', () => {
	beforeEach(() => {
		cy.clearLocalStorage();
		cy.visit('/');
	});

	it('assert form', () => {
		cy.get('[name=email]').should('exist');
		cy.get('[name=password]').should('exist');

		cy.get('[name=email]').type('noEmail');
		cy.get('[role=alert]').should('be.visible');

		cy.get('[name=password]').type('shor');
		cy.get('[role=alert]').should('be.visible');
	});

	it('wrong Login', () => {
		cy.get('[name=email]').clear();
		cy.get('[name=email]').type('test@demo.at');
		cy.get('[name=password]').clear();
		cy.get('[name=password]').type('shorter');
		cy.get('form').submit();
		cy.dataCy('notification').should('be.visible');
	});

	it('login', () => {
		cy.visit('/visitor/login');
		cy.login_demo('', false);
	});
});

export {};
