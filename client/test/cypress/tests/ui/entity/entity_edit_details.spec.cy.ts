describe("Entity, edit details", () => {
  beforeEach(() => {
    // Reset the database
    cy.task("database:teardown");
    cy.task("database:setup");

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("#orcidLoginButton").click();
  });

  it("should be able to rename the Entity", () => {
    cy.contains("button", "Entities").click();
    cy.get(".data-table-scroll-container")
      .find('button[aria-label="View Entity"]')
      .first()
      .click();
    cy.get("#editEntityButton").click();

    // Update the Entity name
    cy.get("#entityNameInput").clear().type("Test Entity (Updated)");
    cy.contains("button", "Save").click();
    cy.contains("button", "Done").click();

    // Check that name has been updated
    cy.get("#entityNameTag").contains("Test Entity (Updated)");
    cy.reload();
    cy.get("#entityNameTag").contains("Test Entity (Updated)");
  });

  it("should be able to update the Entity description", () => {
    cy.contains("button", "Entities").click();
    cy.get(".data-table-scroll-container")
      .find('button[aria-label="View Entity"]')
      .first()
      .click();
    cy.get("#editEntityButton").click();

    // Update the Entity name
    cy.get("#entityDescriptionInput")
      .clear()
      .type("Updated Entity description");
    cy.contains("button", "Save").click();
    cy.contains("button", "Done").click();

    // Check that name has been updated
    cy.get("#entityDescriptionInput").contains("Updated Entity description");
    cy.reload();
    cy.get("#entityDescriptionInput").contains("Updated Entity description");
  });
});
