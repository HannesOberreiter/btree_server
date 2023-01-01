describe('User - Rearing Form', () => {
  const form = 'form-rearing';

  beforeEach(() => {
    cy.login_session('new/rearing');
  });

  it('Loaded', () => {
    cy.dataCy(form).should('exist');
  });
});

export {};
