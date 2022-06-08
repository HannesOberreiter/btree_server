describe('User - Footer', () => {
  before(() => {
    cy.login_session('/');
  });

  it('Share dialog', () => {
    cy.dataCy('btn-share').click();
    cy.dataCy('dialog-share').should('be.visible');
    cy.dataCy('input-url')
      .invoke('val')
      .then((val) => {
        cy.url().then((url) => assert.equal(val, url));
      });
    cy.dataCy('btn-close-dialog').click();
    cy.dataCy('dialog-share').should('not.exist');
  });
});
