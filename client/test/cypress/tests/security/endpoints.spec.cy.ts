describe("Security, check endpoint access", () => {
  beforeEach(() => {
    // Before each test, log out and clear localStorage
    cy.get("#workspaceSwitcher > button").click();
    cy.get("#accountLogoutItem").parent().click();
    cy.clearLocalStorage();
  });

  it("should not be able to access /", () => {
    cy.visit("http://localhost:8080");
    cy.location("pathname").should("eq", "/login");
  });
});
