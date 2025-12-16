// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/**
 * Login command, performs login without session caching
 */
Cypress.Commands.add("login", () => {
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
  cy.visit("http://localhost:8080/");
  cy.get("#orcidLoginButton").click();
  // Wait for login to complete and Workspace to be activated
  cy.url({ timeout: 10000 }).should("not.include", "/login");
  // Wait for Dashboard to load (Workspace should be activated by this point)
  cy.url({ timeout: 10000 }).should("satisfy", (url) => {
    return (
      url.includes("/") && !url.includes("/login") && !url.includes("/setup")
    );
  });
});
