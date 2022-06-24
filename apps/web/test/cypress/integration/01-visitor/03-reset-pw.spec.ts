describe('Visitor - Password reset', () => {
  let token: string, mail: string;
  before(() => {
    cy.clearLocalStorage();
    cy.visit('/visitor/recover');
  });

  it('Recover - Assert form present', () => {
    cy.get('form').should('exist');
  });

  it('Recover - Validate email', () => {
    cy.get('[name=email]').type('noEmail');
    cy.get('[role=alert]').should('be.visible');
    cy.add_demo_mail();
    cy.get('[name=email]')
      .invoke('val')
      .then((val) => {
        mail = val as string;
      });
  });

  it('Recover', () => {
    cy.intercept({
      method: 'POST',
      url: '/api/v1/auth/reset',
    }).as('postRequest');

    cy.get('form').submit();

    cy.wait('@postRequest').then((interception) => {
      assert.isNotNull(interception.response.body);
      assert.isNotNull(interception.response.body.token);
      token = interception.response.body.token;
    });
  });

  it('Reset - Move to reset form', () => {
    cy.visit(`/visitor/reset/${token}`);
  });

  it('Reset - Assert form present', () => {
    cy.get('form').should('exist');
  });

  it('Reset - Assert param token is correctly taken into form field', () => {
    cy.get('[name=resetKey]').should('have.value', token);
  });

  it('Reset - Validate password', () => {
    cy.get('[name=password]').type('shor');
    cy.get('[role=alert]').should('be.visible');
    cy.get('[name=password]').clear().type('firstPassword');
    cy.get('[name=confirmPassword]').clear().type('secondPassword');
    cy.get('[role=alert]').should('be.visible');
    cy.add_demo_password();
  });

  it('Reset', () => {
    cy.intercept({
      method: 'PATCH',
      url: '/api/v1/auth/reset',
    }).as('patchRequest');

    cy.get('form').submit();

    cy.wait('@patchRequest').then((interception) => {
      assert.isNotNull(interception.response.body.email);
      assert.equal(interception.response.body.email, mail);
    });

    cy.dataCy('notification').should('be.visible');
  });
});

export {};
