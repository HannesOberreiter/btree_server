describe('User - Rearing Form', () => {
  const form = 'form-rearing';

  before(() => {
    cy.login_session('new/rearing');
  });

  it('Loaded', () => {
    cy.dataCy(form).should('exist');
  });
});
