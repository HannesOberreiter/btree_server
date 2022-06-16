describe('User - Todo Form', () => {
  const form = 'form-todo';

  before(() => {
    cy.login_session('new/todo');
  });

  it('Loaded', () => {
    cy.dataCy(form).should('exist');
  });
});
