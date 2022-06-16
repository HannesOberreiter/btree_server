describe('User - Setting Fields', () => {
  before(() => {
    cy.login_session('setting/field');
  });

  it('Loaded', () => {
    cy.dataCy('page-setting-field').should('exist');
  });
});
