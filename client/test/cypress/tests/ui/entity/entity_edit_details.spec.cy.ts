describe("Entity, edit details", () => {
  it("should be able to rename the Entity", () => {
    cy.contains("button", "Entities").click();
    cy.get("a").contains("View").eq(0).click();
    cy.get("#editEntityButton").click();

    // Update the Entity name
    cy.get("#entityNameInput").clear().type("Test Entity (Updated)");
    cy.get("#editEntityButton").click();

    // Check that name has been updated
    cy.get("#entityNameTag").contains("Test Entity (Updated)");
    cy.reload();
    cy.get("#entityNameTag").contains("Test Entity (Updated)");
  });

  it("should be able to update the Entity description", () => {
    cy.contains("button", "Entities").click();
    cy.get("a").contains("View").eq(0).click();
    cy.get("#editEntityButton").click();

    // Update the Entity name
    cy.get("#entityDescriptionInput")
      .clear()
      .type("Updated Entity description");
    cy.get("#editEntityButton").click();

    // Check that name has been updated
    cy.get("#entityDescriptionInput").contains("Updated Entity description");
    cy.reload();
    cy.get("#entityDescriptionInput").contains("Updated Entity description");
  });
});