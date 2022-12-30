describe('User - Todo Form', () => {
  const form = 'form-todo';

  beforeEach(() => {
    cy.login_session('new/todo');
  });

  it('Loaded', () => {
    cy.dataCy(form).should('exist');
  });
});

export {};
