import "./commands";

beforeEach(() => {
  // Clear all storage before each test to ensure test isolation
  cy.clearAllLocalStorage();
  cy.clearAllCookies();
  // Clear sessionStorage to prevent workspace state from persisting
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
});

afterEach(() => {
  // Clear all storage after each test as well for cleanup
  cy.clearAllLocalStorage();
  cy.clearAllCookies();
  // Clear sessionStorage to prevent workspace state from persisting
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
});
