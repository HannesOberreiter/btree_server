describe('User - Setting Dropbox', () => {
  beforeEach(() => {
    cy.login_session('setting/dropbox');
  });

  it('Loaded', () => {
    cy.dataCy('page-setting-dropbox').should('exist');
  });
});

export {};
