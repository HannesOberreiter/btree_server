describe('user - Movement Table', () => {
	const form = 'form-movement';

	beforeEach(() => {
		cy.login_session('/table/movement');
	});

	it('create, Edit, Delete', () => {
		cy.get('.q-table').should('exist');

		cy.dataCy('btn-table-new').click();
		cy.dataCy(form).should('exist');
		cy.dataCy('select-hive').click();
		cy.get('.q-menu').find('.q-item__section').first().click();
		cy.dataCy('btn-form-save').click({ force: true });
		cy.dataCy(form).should('not.exist');
		cy.table_edit_row(form);
		cy.table_delete_row();
	});
});

export {};
