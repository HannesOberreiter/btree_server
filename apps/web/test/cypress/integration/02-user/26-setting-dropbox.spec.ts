describe('User - Setting Dropbox', () => {
  before(() => {
    cy.login_session('setting/dropbox');
  });

  it('Loaded', () => {
    cy.dataCy('page-setting-dropbox').should('exist');
  });
});

export {};
