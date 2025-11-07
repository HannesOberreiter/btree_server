describe('user - Hive Form', () => {
	const form = 'form-hive';

	beforeEach(() => {
		cy.login_session('new/hive');
	});

	it('loaded', () => {
		cy.dataCy(form).should('exist');
	});
});

export {};
