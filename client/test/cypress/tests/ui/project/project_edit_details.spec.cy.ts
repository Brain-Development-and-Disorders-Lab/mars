describe("Project, edit details", () => {
  beforeEach(() => {
    // Reset the database
    cy.task("database:teardown");
    cy.task("database:setup");

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("#orcidLoginButton").click();
  });

  it("should be able to rename the Project", () => {
    cy.contains("button", "Projects").click();
    cy.get(".data-table-scroll-container")
      .find('button[aria-label="View Project"]')
      .first()
      .click();
    cy.get("#editProjectButton").click();

    // Update the Project name
    cy.get("#projectNameInput").clear().type("Test Project (Updated)");
    cy.contains("button", "Save").click();
    cy.contains("button", "Done").click();

    // Check that name has been updated
    cy.get("#projectNameTag").contains("Test Project (Updated)");
    cy.reload();
    cy.get("#projectNameTag").contains("Test Project (Updated)");
  });

  it("should be able to update the Project description", () => {
    cy.contains("button", "Projects").click();
    cy.get(".data-table-scroll-container")
      .find('button[aria-label="View Project"]')
      .first()
      .click();
    cy.get("#editProjectButton").click();

    // Update the Entity name
    cy.get("#projectDescriptionInput")
      .clear()
      .type("Updated Project description");
    cy.contains("button", "Save").click();
    cy.contains("button", "Done").click();

    // Check that name has been updated
    cy.get("#projectDescriptionInput").contains("Updated Project description");
    cy.reload();
    cy.get("#projectDescriptionInput").contains("Updated Project description");
  });
});
