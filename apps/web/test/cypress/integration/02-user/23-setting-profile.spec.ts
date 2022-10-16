describe('User - Setting Profile', () => {
  const form = 'form-user';
  beforeEach(() => {
    cy.login_session('setting/profile');
  });

  it('Loaded', () => {
    cy.dataCy(form).should('exist');
  });
});

export {};
