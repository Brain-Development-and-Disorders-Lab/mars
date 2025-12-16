/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Login command with session caching for faster test execution
     * Uses cy.session() to cache login state across tests
     * Ensures workspace is properly activated after login
     */
    login(): Chainable<void>;
  }
}
