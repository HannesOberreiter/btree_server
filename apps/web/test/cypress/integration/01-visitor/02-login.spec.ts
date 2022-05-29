describe('Visitor - Login', () => {
  before(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('Assert form present', () => {
    cy.get('[name=email]').should('exist');
    cy.get('[name=password]').should('exist');
  });

  it('Validate email', () => {
    cy.get('[name=email]').type('noEmail');
    cy.get('[role=alert]').should('be.visible');
  });

  it('Validate password', () => {
    cy.get('[name=password]').type('shor');
    cy.get('[role=alert]').should('be.visible');
  });

  it('Wrong Login', () => {
    cy.get('[name=email]').clear().type('test@demo.at');
    cy.get('[name=password]').clear().type('shorter');
    cy.get('form').submit();
    cy.get('#q-notify').find('[role=alert]').should('be.visible');
  });

  it('Login', () => {
    cy.login_demo();
  });
});
