describe('Visitor - Unsubscribe', () => {
  let mail: string;
  before(() => {
    cy.clearLocalStorage();
    cy.visit('/visitor/unsubscribe');
  });

  it('Assert form present', () => {
    cy.get('form').should('exist');
  });

  it('Validate email', () => {
    cy.get('[name=email]').type('noEmail');
    cy.get('[role=alert]').should('be.visible');
    cy.add_demo_mail();
    cy.get('[name=email]')
      .invoke('val')
      .then((val) => {
        mail = val as string;
      });
  });

  it('Unsubscribe', () => {
    cy.intercept({
      method: 'PATCH',
      url: '/api/v1/auth/unsubscribe',
    }).as('patchRequest');

    cy.get('form').submit();

    cy.wait('@patchRequest').then((interception) => {
      assert.isNotNull(interception.response.body);
      assert.isNotNull(interception.response.body.email);
      assert.equal(interception.response.body.email, mail);
    });

    cy.dataCy('notification').should('be.visible');
  });
});

export {};
