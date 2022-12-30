import Chance from 'chance';
const chance = new Chance();

describe('User - Charge Table', () => {
  const form = 'form-charge';
  beforeEach(() => {
    cy.login_session('/table/charge');
  });

  it('Create & Edit and Delete', () => {
    cy.get('.q-table').should('exist');

    cy.dataCy('btn-table-new').click();
    cy.dataCy(form).should('exist');
    cy.get('[name=chargeName]').clear().type(chance.name());
    cy.dataCy('btn-form-save').click();
    cy.dataCy(form).should('not.exist');
    cy.table_edit_row(form);

    cy.table_delete_row();
  });
});

export {};
