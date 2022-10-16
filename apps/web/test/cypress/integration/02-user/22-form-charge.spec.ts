describe('User - Charge Form', () => {
  const form = 'form-charge';

  beforeEach(() => {
    cy.login_session('new/charge');
  });

  it('Loaded', () => {
    cy.dataCy(form).should('exist');
  });
});

export {};
