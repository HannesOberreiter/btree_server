describe('Visitor - Register', () => {
  let user: any, token: string, newMail: string;
  before(() => {
    cy.clearLocalStorage();
    cy.visit('/visitor/register');
    cy.isRegistered();
    cy.fixture('user_new').then((user_data) => {
      user = user_data;
    });
  });

  it('Assert form present', () => {
    cy.get('form', { timeout: 50000 }).should('exist');
  });

  it('Validate Company', () => {
    cy.get('[name="company.name"]').type('Company').clear();
    cy.get('[role=alert]').should('be.visible');
    cy.get('[name="company.name"]').clear().type(user.company);
  });

  it('Validate email', () => {
    cy.get('[name=email]').type('noEmail');
    cy.get('[role=alert]').should('be.visible');
    cy.add_demo_mail();
    cy.get('[name=email]')
      .invoke('val')
      .then((val) => {
        newMail = val as string;
      });
  });

  it('Validate password', () => {
    cy.get('[name=password]').type('shor');
    cy.get('[role=alert]').should('be.visible');
    cy.get('[name=password]').clear().type('firstPassword');
    cy.get('[name=confirmPassword]').clear().type('secondPassword');
    cy.get('[role=alert]').should('be.visible');
    cy.get('[name=password]').clear().type(user.password);
    cy.get('[name=confirmPassword]').clear().type(user.password);
  });

  it('Terms Dialog', () => {
    cy.dataCy('terms').click();
    cy.get('.q-dialog').should('exist');
    cy.dataCy('btn-terms').click();
  });

  it('Register', () => {
    cy.intercept({
      method: 'POST',
      url: '/api/v1/auth/register',
    }).as('postRequest');

    cy.get('form').submit();

    cy.wait('@postRequest').then((interception) => {
      assert.isNotNull(interception.response.body);
      assert.isNotNull(interception.response.body.activate);
      token = interception.response.body.activate;
    });
  });

  it('Activate Account', () => {
    cy.visit('/visitor/activate/' + token);
    cy.get('[name=resetKey]').should('exist');
    cy.get('form').submit();
    cy.get('[name=email]').should('have.value', newMail);
  });
});

export {};
