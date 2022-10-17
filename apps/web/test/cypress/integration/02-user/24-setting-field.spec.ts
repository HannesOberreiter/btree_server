describe('User - Setting Fields', () => {
  beforeEach(() => {
    cy.login_session('setting/field');
  });

  it('Loaded', () => {
    cy.dataCy('page-setting-field').should('exist');
  });
});

export {};
