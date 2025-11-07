describe('user - Todo Form', () => {
	const form = 'form-todo';

	beforeEach(() => {
		cy.login_session('new/todo');
	});

	it('loaded', () => {
		cy.dataCy(form).should('exist');
	});
});

export {};
