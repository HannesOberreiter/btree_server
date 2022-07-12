describe('User - Rearing Table', () => {
  const form = 'form-rearing';

  before(() => {
    cy.login_session('/table/rearing');
  });

  it('Loaded', () => {
    cy.get('.q-table').should('exist');
  });

  it('Create', () => {
    cy.dataCy('btn-table-new').click();
    cy.dataCy(form).should('exist');
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.dataCy('btn-form-save').click();
    cy.dataCy(form).should('not.exist');
  });

  it('Edit row', () => {
    cy.table_edit_row(form);
  });

  it('Delete row', () => {
    cy.table_delete_row();
  });
});

export {};
