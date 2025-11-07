describe('user - Footer', () => {
	beforeEach(() => {
		cy.login_session('/');
	});

	it('footer Icons', () => {
		cy.dataCy('btn-share').click();
		cy.dataCy('dialog-share').should('be.visible');
		cy.dataCy('input-url')
			.invoke('val')
			.then((val) => {
				cy.url().then(url => assert.equal(val, url));
			});
		cy.dataCy('btn-close-dialog').click();
		cy.dataCy('dialog-share').should('not.exist');
	});
});

export {};
