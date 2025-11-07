describe('user - Charge Form', () => {
	const form = 'form-charge';

	beforeEach(() => {
		cy.login_session('new/charge');
	});

	it('loaded', () => {
		cy.dataCy(form).should('exist');
	});
});

export {};
