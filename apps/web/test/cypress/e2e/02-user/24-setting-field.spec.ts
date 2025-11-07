describe('user - Setting Fields', () => {
	beforeEach(() => {
		cy.login_session('setting/field');
	});

	it('loaded', () => {
		cy.dataCy('page-setting-field').should('exist');
	});
});

export {};
