import Chance from 'chance';
const chance = new Chance();

describe('User - Calendar', () => {
  beforeEach(() => {
    cy.login_session('/');
  });

  it('Fullcalendar', () => {
    cy.get('.calendar-container').find('.fc').should('exist');
    // Change Date
    cy.get('.fc-today-button').as('btn-today');
    cy.get('.fc-next-button').as('btn-next');

    cy.get('@btn-today').should('have.attr', 'disabled');
    cy.get('@btn-next').click();
    cy.get('@btn-today').should('not.have.attr', 'disabled');
    cy.get('@btn-today').click();

    // Add Todo
    cy.get('.fc-day-today')
      .find('.fc-daygrid-day-bg')
      .dblclick({ force: true });
    cy.dataCy('form-todo').should('exist');
    cy.get('[name=todo]').clear();
    cy.get('[name=todo]').type(chance.animal());
    cy.dataCy('btn-form-save').click();
    cy.dataCy('form-todo').should('not.exist');

    // Change View
    cy.get('.fc-dayGridMonth-button').as('btn-grid-month');
    cy.get('.fc-dayGridWeek-button').as('btn-grid-week');
    cy.get('.fc-listWeek-button').as('btn-list-week');

    cy.get('.fc-dayGridWeek-button').click();
    cy.get('.fc-dayGridWeek-view').should('exist');

    cy.get('.fc-listWeek-button').click();
    cy.get('.fc-listWeek-view').should('exist');

    cy.get('.fc-dayGridMonth-button').click();
    cy.get('.fc-dayGridMonth-view').should('exist');

    // Remove Todo
    cy.get('.fc-day-today')
      .find('.fc-daygrid-day-events')
      .find('.fa-clipboard')
      .first()
      .click({ force: true });

    cy.dataCy('dialog-event').should('exist');
    cy.dataCy('btn-dialog-event-delete').click();
    cy.get('.btn-confirm').click();
    cy.dataCy('form-todo').should('not.exist');

    // Dialog Settings
    cy.get('.fc-sources-button').click();
    cy.dataCy('dialog-calendar-setting').should('exist');
    cy.dataCy('btn-close-dialog').click();
    cy.dataCy('dialog-calendar-setting').should('not.exist');
  });
});

export {};
