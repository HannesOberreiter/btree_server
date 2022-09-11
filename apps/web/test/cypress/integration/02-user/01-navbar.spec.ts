describe('User - Navbar', () => {
  before(() => {
    cy.login_session('/');
  });

  /**
    We cannot assert fullscreen as it needs user interaction
   */
  it('Fullscreen icon exist', () => {
    cy.dataCy('btn-fullscreen').should('exist');
  });

  it('Dark mode', () => {
    cy.get('body').then(($el) => {
      const isDarkMode = $el.hasClass('body--dark');
      cy.dataCy('btn-dark-mode')
        .click()
        .click()
        .then(() => {
          assert.isTrue(!isDarkMode === $el.hasClass('body--dark'));
        })
        .click();
    });
  });

  it('Search and return button', () => {
    cy.url().then((oldUrl) => {
      cy.dataCy('select-search-hive-apiary').click();
      cy.get('.q-menu').find('.q-item__section').first().click();
      cy.dataCy('page-detail-apiary').should('exist');

      cy.dataCy('btn-return')
        .click()
        .then(() => {
          cy.url().should('equal', oldUrl);
        });
    });
  });

  it('Open drawer', () => {
    cy.dataCy('btn-drawer').click();
    cy.dataCy('drawer').should('be.visible');
  });
});

export {};
