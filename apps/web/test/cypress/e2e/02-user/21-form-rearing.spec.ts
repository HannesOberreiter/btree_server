describe('user - Rearing Form', () => {
	const form = 'form-rearing';

	beforeEach(() => {
		cy.login_session('new/rearing');
	});

	it('loaded', () => {
		cy.dataCy(form).should('exist');
	});
});

export {};
