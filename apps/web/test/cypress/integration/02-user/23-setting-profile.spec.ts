describe('User - Setting Profile', () => {
  const form = 'form-user';
  before(() => {
    cy.login_session('setting/profile');
  });

  it('Loaded', () => {
    cy.dataCy(form).should('exist');
  });
});

export {};
