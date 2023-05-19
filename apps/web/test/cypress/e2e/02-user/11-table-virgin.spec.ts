import Chance from 'chance';
const chance = new Chance();

describe('User - Virgin Table', () => {
  const form = 'form-queen';
  beforeEach(() => {
    cy.login_session('/table/virgin');
  });

  it('Create & Edit and Delete', () => {
    cy.get('.q-table').should('exist');

    cy.dataCy('btn-table-new').click();
    cy.dataCy(form).should('exist');
    cy.get('[name=queen]').clear();
    cy.get('[name=queen]').type(chance.name());
    cy.dataCy('btn-repeat').click();
    cy.get('[name=numberQueens]').clear();
    cy.get('[name=numberQueens]').type('2');
    cy.dataCy('btn-form-save').click();
    cy.dataCy(form).should('not.exist');
    cy.table_edit_row(form);
    cy.table_delete_row();
  });
});

export {};
