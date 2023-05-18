import Chance from 'chance';
const chance = new Chance();

describe('User - Hive Table', () => {
  beforeEach(() => {
    cy.login_session('/table/hive');
  });

  it('Loaded', () => {
    cy.get('.q-table').should('exist');

    cy.dataCy('btn-table-new').click();
    cy.dataCy('form-hive').should('exist');
    cy.get('[name=hive]').clear();
    cy.get('[name=hive]').type(chance.animal().substring(0, 24));
    cy.dataCy('btn-repeat').click();
    cy.get('[name=numberHives]').clear();
    cy.get('[name=numberHives]').type('2');
    cy.dataCy('btn-form-save').click();
    cy.dataCy('form-hive').should('not.exist');

    cy.table_edit_row('form-hive');

    cy.table_delete_row();
  });
});

export {};
