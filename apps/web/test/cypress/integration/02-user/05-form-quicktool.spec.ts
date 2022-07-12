describe('User - Quicktool', () => {
  before(() => {
    cy.login_session('/new/quicktool/feed');
  });

  it('Loaded', () => {
    cy.dataCy('form-quicktool').should('exist');
  });

  it('No hive', () => {
    cy.dataCy('btn-form-save').click();
    cy.dataCy('notification').should('exist');
  });

  it('Save checkup and undo', () => {
    cy.dataCy('select-hive').click();
    cy.get('.q-menu').find('.q-item__section').first().click();
    cy.dataCy('btn-form-save').click();
    cy.dataCy('notification').should('exist');
    cy.dataCy('btn-form-undo').click();
    cy.dataCy('notification').should('exist');
  });
});

export {};
