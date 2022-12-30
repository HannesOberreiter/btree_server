import Chance from 'chance';
const chance = new Chance();

describe('User - Scale Data Table', () => {
  const form = 'form-scale-data';
  beforeEach(() => {
    cy.login_session('/table/scale_data');
  });

  it('Create Scale', () => {
    cy.get('.q-table').should('exist');

    cy.dataCy('btn-dropdown-scale').click();
    cy.dataCy('btn-new-scale').click();
    cy.dataCy('form-scale').should('exist');
    cy.get('[name=scale]').clear().type(chance.province());
    cy.dataCy('btn-form-save').click();
    cy.dataCy(form).should('not.exist');
  });

  it('Create, Edit, Delete', () => {
    cy.dataCy('btn-table-new').click();
    cy.dataCy(form).should('exist');
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.dataCy('btn-form-save').click();
    cy.dataCy(form).should('not.exist');
    cy.table_edit_row(form);
    cy.table_delete_row();
  });
});

export {};
