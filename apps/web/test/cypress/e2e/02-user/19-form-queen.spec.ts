describe('user - Queen Form', () => {
	const form = 'form-queen';

	beforeEach(() => {
		cy.login_session('new/queen');
	});

	it('loaded', () => {
		cy.dataCy(form).should('exist');
	});
});

export {};
