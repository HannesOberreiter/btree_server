describe('user - Setting Profile', () => {
	const form = 'form-user';
	beforeEach(() => {
		cy.login_session('setting/profile');
	});

	it('loaded', () => {
		cy.dataCy(form).should('exist');
	});
});

export {};
