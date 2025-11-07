describe('user - Quicktool', () => {
	beforeEach(() => {
		cy.login_session('/new/quicktool/feed');
	});

	it('loaded', () => {
		cy.dataCy('form-quicktool').should('exist');
		// No hive selected
		cy.dataCy('btn-form-save').click({ force: true });
		cy.dataCy('notification').should('exist');
		// Save Checkup
		cy.dataCy('select-hive').click();
		cy.get('.q-menu').find('.q-item__section').first().click();
		cy.dataCy('btn-form-save').click({ force: true });
		cy.dataCy('notification').should('exist');
		cy.dataCy('btn-form-undo').click();
		cy.dataCy('notification').should('exist');
	});
});

export {};
