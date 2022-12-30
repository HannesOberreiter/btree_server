describe('User - Hive Form', () => {
  const form = 'form-hive';

  beforeEach(() => {
    cy.login_session('new/hive');
  });

  it('Loaded', () => {
    cy.dataCy(form).should('exist');
  });
});

export {};
