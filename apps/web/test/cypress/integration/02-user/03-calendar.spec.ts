import Chance from 'chance';
const chance = new Chance();

describe('User - Calendar', () => {
  before(() => {
    cy.login_session('/');
  });

  it('Fullcalendar loaded', () => {
    cy.get('.calendar-container').find('.fc').should('exist');
  });

  it('Change date', () => {
    cy.get('.fc-today-button').as('btn-today');
    cy.get('.fc-next-button').as('btn-next');

    cy.get('@btn-today').should('have.attr', 'disabled');
    cy.get('@btn-next').click();
    cy.get('@btn-today').should('not.have.attr', 'disabled');
    cy.get('@btn-today').click();
  });

  it('Add todo', () => {
    cy.get('.fc-day-today')
      .find('.fc-daygrid-day-bg')
      .dblclick({ force: true });
    cy.dataCy('form-todo').should('exist');
    cy.get('[name=todo]').clear().type(chance.animal());
    cy.dataCy('btn-form-save').click();
    cy.dataCy('form-todo').should('not.exist');
  });

  it('Change view format', () => {
    cy.get('.fc-dayGridMonth-button').as('btn-grid-month');
    cy.get('.fc-dayGridWeek-button').as('btn-grid-week');
    cy.get('.fc-listWeek-button').as('btn-list-week');

    cy.get('.fc-dayGridWeek-button')
      .click()
      .then(() => {
        cy.get('.fc-dayGridWeek-view').should('exist');
      });

    cy.get('.fc-listWeek-button')
      .click()
      .then(() => {
        cy.get('.fc-listWeek-view').should('exist');
      });

    cy.get('.fc-dayGridMonth-button')
      .click()
      .then(() => {
        cy.get('.fc-dayGridMonth-view').should('exist');
      });
  });

  it('Remove todo', () => {
    cy.get('.fc-day-today')
      .find('.fc-daygrid-day-events')
      .find('.fa-clipboard')
      .first()
      .click({ force: true });

    cy.dataCy('dialog-event').should('exist');
    cy.dataCy('btn-dialog-event-delete').click();
    cy.get('.btn-confirm').click();
    cy.dataCy('form-todo').should('not.exist');
  });

  it('Dialog source', () => {
    cy.get('.fc-sources-button').click();
    cy.dataCy('dialog-calendar-setting').should('exist');
    cy.dataCy('btn-close-dialog').click();
    cy.dataCy('dialog-calendar-setting').should('not.exist');
  });
});

export {};
