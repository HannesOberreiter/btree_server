import Chance from 'chance';
const chance = new Chance();

describe('User - Option Table', () => {
  const form = 'form-option';

  beforeEach(() => {
    cy.login_session('setting/option/checkup_types');
  });

  it('Create', () => {
    cy.get('.q-table').should('exist');

    cy.dataCy('btn-table-new').click();
    cy.dataCy(form).should('exist');
    cy.get('[name=checkup_types]').clear();
    cy.get('[name=checkup_types]').type(chance.word());
    cy.get('.checkbox-favorite').click();
    cy.dataCy('btn-form-save').click();
    cy.dataCy(form).should('not.exist');
    cy.table_edit_row(form);
    cy.table_delete_row();
  });
});

export {};
