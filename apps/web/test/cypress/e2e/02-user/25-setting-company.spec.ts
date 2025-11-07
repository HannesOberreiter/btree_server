describe('user - Setting Company', () => {
	beforeEach(() => {
		cy.login_session('setting/company');
	});

	it('loaded', () => {
		cy.dataCy('page-setting-company').should('exist');
	});
});

export {};
