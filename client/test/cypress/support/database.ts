import "./commands";

beforeEach(() => {
  // Clear the localstorage
  cy.clearLocalStorage();

  // Clear the database
  cy.task("database:teardown");

  // Seed the database
  cy.task("database:setup");

  // Navigate the "Login" page
  cy.visit("http://localhost:8080/");

  cy.get("#orcidLoginButton").click();
});

afterEach(() => {
  // Clear the database
  cy.task("database:teardown");
});
