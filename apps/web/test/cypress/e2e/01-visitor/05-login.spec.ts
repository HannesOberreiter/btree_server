describe('Visitor - Login', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('Assert form', () => {
    cy.get('[name=email]').should('exist');
    cy.get('[name=password]').should('exist');

    cy.get('[name=email]').type('noEmail');
    cy.get('[role=alert]').should('be.visible');

    cy.get('[name=password]').type('shor');
    cy.get('[role=alert]').should('be.visible');
  });

  it('Wrong Login', () => {
    cy.get('[name=email]').clear().type('test@demo.at');
    cy.get('[name=password]').clear().type('shorter');
    cy.get('form').submit();
    cy.dataCy('notification').should('be.visible');
  });

  it('Login', () => {
    cy.visit('/visitor/login');
    cy.login_demo('', false);
  });
});

export {};
