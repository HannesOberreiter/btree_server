describe('User - Setting Company', () => {
  before(() => {
    cy.login_session('setting/company');
  });

  it('Loaded', () => {
    cy.dataCy('page-setting-company').should('exist');
  });
});

export {};
