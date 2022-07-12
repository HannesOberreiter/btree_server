import Chance from 'chance';
const chance = new Chance();

describe('User - Apiary Map', () => {
  const x = chance.integer({ min: 100, max: 500 }),
    y = chance.integer({ min: 100, max: 500 }),
    name = chance.company();
  before(() => {
    cy.login_session('/map/apiary');
  });

  it('Loaded', () => {
    cy.get('.leaflet-container').should('exist');
  });

  it('Create', () => {
    cy.get('.leaflet-container').dblclick(x, y);
    cy.dataCy('form-apiary').should('exist');
    cy.get('[name=apiary]').clear().type(name);
    cy.dataCy('btn-form-save').click();
    cy.dataCy('form-apiary').should('not.exist');
  });

  it('Delete', () => {
    cy.get(`[alt="${name}"]`).click();
    cy.dataCy(`"btn-delete-${name}"`).click();
    cy.get(`[alt="${name}"]`).should('not.be.visible');
  });
});

export {};
