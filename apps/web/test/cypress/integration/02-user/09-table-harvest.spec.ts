describe('User - Harvest Table', () => {
  const form = 'form-quicktool';

  before(() => {
    cy.login_session('/table/harvest');
  });

  it('Loaded', () => {
    cy.get('.q-table').should('exist');
  });

  it('Create', () => {
    cy.dataCy('btn-table-new').click();
    cy.dataCy(form).should('exist');
    cy.dataCy('select-hive').click();
    cy.get('.q-menu').find('.q-item__section').first().click();
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
