describe('User - Setting Company', () => {
  beforeEach(() => {
    cy.login_session('setting/company');
  });

  it('Loaded', () => {
    cy.dataCy('page-setting-company').should('exist');
  });
});

export {};
