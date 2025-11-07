describe('user - Setting Dropbox', () => {
	beforeEach(() => {
		cy.login_session('setting/dropbox');
	});

	it('loaded', () => {
		cy.dataCy('page-setting-dropbox').should('exist');
	});
});

export {};
