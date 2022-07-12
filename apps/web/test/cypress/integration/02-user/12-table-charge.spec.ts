import Chance from 'chance';
const chance = new Chance();

describe('User - Charge Table', () => {
  const form = 'form-charge';
  before(() => {
    cy.login_session('/table/charge');
  });

  it('Loaded', () => {
    cy.get('.q-table').should('exist');
  });

  it('Create', () => {
    cy.dataCy('btn-table-new').click();
    cy.dataCy(form).should('exist');
    cy.get('[name=chargeName]').clear().type(chance.name());
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
