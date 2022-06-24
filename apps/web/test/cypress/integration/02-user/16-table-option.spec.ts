import Chance from 'chance';
const chance = new Chance();

describe('User - Option Table', () => {
  const form = 'form-option';

  before(() => {
    cy.login_session('setting/option/checkup_types');
  });

  it('Loaded', () => {
    cy.get('.q-table').should('exist');
  });

  it('Create', () => {
    cy.dataCy('btn-table-new').click();
    cy.dataCy(form).should('exist');
    cy.get('[name=name]').clear().type(chance.word());
    cy.get('.checkbox-favorite').click();
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
