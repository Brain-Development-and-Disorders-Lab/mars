describe("Interface launches", () => {
  beforeEach(() => {
    // Reset the database
    cy.task("database:teardown");
    cy.task("database:setup");

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("#orcidLoginButton").click();
  });

  it("navigation menu items are visible", () => {
    cy.get("#navSearchButtonDesktop").should("have.text", "Search");
    cy.get("#navProjectsButtonDesktop").should("have.text", "Projects");
  });
});
