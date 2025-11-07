import Chance from 'chance';

const chance = new Chance();

describe('user - Apiary Map', () => {
	const x = chance.integer({ min: 100, max: 500 });
	const y = chance.integer({ min: 100, max: 500 });
	const name = chance.company();
	beforeEach(() => {
		cy.login_session('/map/apiary');
	});

	it('create and Delete', () => {
		cy.get('.leaflet-container').should('exist');

		cy.get('.leaflet-container').dblclick(x, y);
		cy.dataCy('form-apiary').should('exist');
		cy.get('[name=apiary]').clear();
		cy.get('[name=apiary]').type(name);
		cy.dataCy('btn-form-save').click();
		cy.dataCy('form-apiary').should('not.exist');

		cy.get(`[alt="${name}"]`).click();
		cy.dataCy(`"btn-delete-${name}"`).click();
		cy.get(`[alt="${name}"]`).should('not.exist');
	});
});

export {};
