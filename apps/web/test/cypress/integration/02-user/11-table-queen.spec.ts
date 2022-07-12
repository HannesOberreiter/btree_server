import Chance from 'chance';
const chance = new Chance();

describe('User - Queen Table', () => {
  const form = 'form-queen';
  before(() => {
    cy.login_session('/table/queen');
  });

  it('Loaded', () => {
    cy.get('.q-table').should('exist');
  });

  it('Create', () => {
    cy.dataCy('btn-table-new').click();
    cy.dataCy(form).should('exist');
    cy.get('[name=queen]').clear().type(chance.name());
    cy.dataCy('btn-repeat').click();
    cy.get('[name=numberQueens]').clear().type('2');
    cy.dataCy('btn-form-save').click();
    cy.dataCy(form).should('not.exist');
  });

  it('Change View', () => {
    cy.dataCy('btn-table-modus').click();
  });

  it('Edit row', () => {
    cy.table_edit_row(form);
  });

  it('Delete row', () => {
    cy.table_delete_row();
  });
});

export {};
