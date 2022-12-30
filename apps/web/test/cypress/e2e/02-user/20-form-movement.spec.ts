describe('User - Movement Form', () => {
  const form = 'form-movement';

  beforeEach(() => {
    cy.login_session('new/movement');
  });

  it('Loaded', () => {
    cy.dataCy(form).should('exist');
  });
});

export {};
