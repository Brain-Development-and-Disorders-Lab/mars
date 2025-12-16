describe("Interface launches", () => {
  before(() => {
    // Reset the database once for the entire suite
    cy.task("database:teardown");
    cy.task("database:setup");
  });

  beforeEach(() => {
    // Use cached login session
    cy.login();
    cy.visit("http://localhost:8080/");
  });

  it("navigation menu items are visible", () => {
    cy.get("#navSearchButtonDesktop").should("have.text", "Search");
    cy.get("#navProjectsButtonDesktop").should("have.text", "Projects");
  });
});
