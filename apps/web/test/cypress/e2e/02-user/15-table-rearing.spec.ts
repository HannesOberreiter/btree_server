describe('user - Rearing Table', () => {
	const form = 'form-rearing';

	beforeEach(() => {
		cy.login_session('/table/rearing');
	});

	it('create, Edit, Delete', () => {
		cy.get('.q-table').should('exist');

		cy.dataCy('btn-table-new').click();
		cy.dataCy(form).should('exist');
		cy.wait(1000);
		cy.dataCy('btn-form-save').click();
		cy.dataCy(form).should('not.exist');
		cy.table_edit_row(form);
		cy.table_delete_row();
	});
});

export {};
