import "./commands";

afterEach(() => {
  // Clear the localstorage
  cy.clearAllLocalStorage();
  cy.clearAllCookies();

  // Clear the database
  cy.task("database:teardown");
});
