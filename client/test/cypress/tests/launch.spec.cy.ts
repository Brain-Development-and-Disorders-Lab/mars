describe("Interface launches", () => {
  it("navigation menu items are visible", () => {
    cy.get("#navSearchButton").should("have.text", "Search");
    cy.get("#navProjectsButton").should("have.text", "Projects");
  });
});
