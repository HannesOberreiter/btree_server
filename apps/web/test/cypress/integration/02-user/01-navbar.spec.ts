describe('User - Navbar', () => {
  beforeEach(() => {
    cy.login_session('/');
  });

  it('Assert icons', () => {
    // We cannot assert fullscreen as it needs user interaction
    cy.dataCy('btn-fullscreen').should('exist');
    // Dark Mode
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
    // Search and return button
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

    // Open Drawer
    cy.dataCy('btn-drawer').click();
    cy.dataCy('drawer').should('be.visible');
  });
});

export {};
