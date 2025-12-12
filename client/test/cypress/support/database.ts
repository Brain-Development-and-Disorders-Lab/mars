import "./commands";

afterEach(() => {
  // Clear the localstorage
  cy.clearAllLocalStorage();
  cy.clearAllCookies();
});
