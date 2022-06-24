import Chance from 'chance';
const chance = new Chance();

describe('User - Scale Data Table', () => {
  const form = 'form-scale-data';
  before(() => {
    cy.login_session('/table/scale_data');
  });

  it('Loaded', () => {
    cy.get('.q-table').should('exist');
  });

  it('Create Scale', () => {
    cy.dataCy('btn-dropdown-scale').click();
    cy.dataCy('btn-new-scale').click();
    cy.dataCy('form-scale').should('exist');
    cy.get('[name=scale]').clear().type(chance.province());
    cy.dataCy('btn-form-save').click();
    cy.dataCy(form).should('not.exist');
  });

  it('Create', () => {
    cy.dataCy('btn-table-new').click();
    cy.dataCy(form).should('exist');
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
