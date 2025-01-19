describe('Visitor - Password reset', () => {
  let token: string, mail: string;
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/visitor/recover');
  });

  it('Recover - Assert form', () => {
    cy.get('form').should('exist');

    cy.get('[name=email]').type('noEmail');
    cy.get('[role=alert]').should('be.visible');
    cy.add_demo_mail();
    cy.get('[name=email]')
      .invoke('val')
      .then((val) => {
        mail = val as string;
      });

    cy.intercept({
      method: 'POST',
      url: '/api/v1/auth/reset',
    }).as('postRequest');

    cy.get('form').submit();

    cy.wait('@postRequest').then((interception) => {
      assert.isNotNull(interception.response?.body);
      assert.isNotNull(interception.response?.body.token);
      token = interception.response?.body.token;
    });
  });

  it('Reset - Assert Form', () => {
    cy.visit(`/visitor/reset/${token}`);
    cy.get('form').should('exist');

    cy.get('[name=resetKey]').should('have.value', token);

    cy.get('[name=password]').type('shor');
    cy.get('[role=alert]').should('be.visible');
    cy.get('[name=password]').clear();
    cy.get('[name=password]').type('firstPassword');
    cy.get('[name=confirmPassword]').clear();
    cy.get('[name=confirmPassword]').type('secondPassword');
    cy.get('[role=alert]').should('be.visible');
    cy.add_demo_password();

    cy.intercept({
      method: 'PATCH',
      url: '/api/v1/auth/reset',
    }).as('patchRequest');

    cy.get('form').submit();

    cy.wait('@patchRequest').then((interception) => {
      assert.isNotNull(interception.response?.body.email);
      assert.equal(interception.response?.body.email, mail);
    });

    cy.dataCy('notification').should('be.visible');
  });
});

export {};
