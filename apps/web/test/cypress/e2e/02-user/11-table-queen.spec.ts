import Chance from 'chance';
const chance = new Chance();

describe('User - Queen Table', () => {
  const form = 'form-queen';
  beforeEach(() => {
    cy.login_session('/table/queen');
  });

  it('Create & Edit and Delete', () => {
    cy.get('.q-table').should('exist');

    cy.dataCy('btn-table-new').click();
    cy.dataCy(form).should('exist');
    cy.get('[name=queen]').clear().type(chance.name());
    cy.dataCy('btn-repeat').click();
    cy.get('[name=numberQueens]').clear().type('2');
    cy.dataCy('btn-form-save').click();
    cy.dataCy(form).should('not.exist');

    cy.dataCy('btn-table-modus').click();
    cy.table_edit_row(form);
    cy.table_delete_row();
  });

  it('Open Dialog Pedigree', () => {
    cy.dataCy('btn-table-modus').click();
    cy.dataCy('col-pedigree').first().click();
    cy.dataCy('dialog-pedigree').should('exist');
    cy.dataCy('btn-close-dialog').click();
  });
});

export {};
