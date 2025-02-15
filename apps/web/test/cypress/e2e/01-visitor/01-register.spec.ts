describe('Visitor - Register', () => {
  let user: any, token: string, newMail: string;
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/visitor/register');
    cy.isRegistered();
    cy.fixture('user_new').then((user_data) => {
      user = user_data;
    });
  });

  it('Assert Register Form', () => {
    cy.get('form', { timeout: 50000 }).should('exist');
    cy.get('[name="company.name"]').clear();
    cy.get('[name="company.name"]').type('Com');

    cy.get('[role=alert]').should('be.visible');

    cy.get('[name="company.name"]').clear();
    cy.get('[name="company.name"]').type(user.company);
    cy.get('[name=email]').type('noEmail');
    cy.get('[role=alert]').should('be.visible');
    cy.add_demo_mail();
    cy.get('[name=email]')
      .invoke('val')
      .then((val) => {
        newMail = val as string;
      });

    cy.get('[name=password]').type('shor');
    cy.get('[role=alert]').should('be.visible');
    cy.get('[name=password]').clear();
    cy.get('[name=password]').type('firstPassword');
    cy.get('[name=confirmPassword]').clear();
    cy.get('[name=confirmPassword]').type('secondPassword');
    cy.get('[role=alert]').should('be.visible');
    cy.get('[name=password]').clear();
    cy.get('[name=password]').type(user.password);
    cy.get('[name=confirmPassword]').clear();
    cy.get('[name=confirmPassword]').type(user.password);

    cy.dataCy('terms').click();
    cy.get('.q-dialog').should('exist');
    cy.dataCy('btn-terms').click();

    cy.intercept({
      method: 'POST',
      url: '/api/v1/auth/register',
    }).as('postRequest');

    cy.get('form').submit();

    cy.wait('@postRequest').then((interception) => {
      assert.isNotNull(interception.response?.body);
      assert.isNotNull(interception.response?.body.activate);
      token = interception.response?.body.activate;
    });
  });

  it('Activate Account', () => {
    cy.wrap(token).should('not.be.undefined');
    cy.visit('/visitor/activate/' + token);
    cy.get('[name=resetKey]').should('exist');
    cy.get('form').submit();
    cy.get('[name=email]').should('have.value', newMail);
  });
});

export {};
