describe("Security, check endpoint access", () => {
  beforeEach(() => {
    // Before each test, log out and clear localStorage
    cy.get("#workspaceSwitcherButton").click();
    cy.get("#logoutButton").click();
    cy.clearLocalStorage();
  });

  it("should not be able to access /", () => {
    cy.visit("https://localhost:8080");
    cy.location("pathname").should("eq", "/login");
  });
});
