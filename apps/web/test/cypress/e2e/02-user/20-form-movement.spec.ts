describe('user - Movement Form', () => {
	const form = 'form-movement';

	beforeEach(() => {
		cy.login_session('new/movement');
	});

	it('loaded', () => {
		cy.dataCy(form).should('exist');
	});
});

export {};
