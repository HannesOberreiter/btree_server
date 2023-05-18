describe('Visitor - Discourse SSO', () => {
  const sso =
    'sso=bm9uY2U9OTJkYWQ0NTMxZTBhZDIwMmY4MWMxYWM0NzVmYjQ5MDMmcmV0dXJuX3Nzb191cmw9aHR0cHMlM0ElMkYlMkZmb3J1bS5idHJlZS5hdCUyRnNlc3Npb24lMkZzc29fbG9naW4%3D&sig=e18fcf73285bdf65610b43ca2e80712175e660571d1d934c08d9499679a52ad0';

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/visitor/forum');
  });

  it('Assert empty form', () => {
    cy.dataCy('sso-error').should('exist');
  });

  it('Assert form', () => {
    cy.visit('/visitor/forum?' + sso);
    cy.get('[name=email]').should('exist');
    cy.get('[name=password]').should('exist');

    cy.get('[name=email]').type('noEmail');
    cy.get('[role=alert]').should('be.visible');

    cy.get('[name=password]').type('shor');
    cy.get('[role=alert]').should('be.visible');
  });

  it('Wrong Credentials', () => {
    cy.visit('/visitor/forum?' + sso);
    cy.get('[name=email]').clear();
    cy.get('[name=email]').type('test@demo.at');
    cy.get('[name=password]').clear();
    cy.get('[name=password]').type('shorter');
    cy.get('form').submit();
    cy.dataCy('notification').should('be.visible');
  });

  it('Wrong Login', () => {
    cy.visit('/visitor/forum?' + sso);
    cy.login_demo('', true);
    cy.url().should('contain', 'forum.btree.at');
  });
});

export {};
