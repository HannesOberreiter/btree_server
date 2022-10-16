describe('User - Queen Form', () => {
  const form = 'form-queen';

  beforeEach(() => {
    cy.login_session('new/queen');
  });

  it('Loaded', () => {
    cy.dataCy(form).should('exist');
  });
});

export {};
