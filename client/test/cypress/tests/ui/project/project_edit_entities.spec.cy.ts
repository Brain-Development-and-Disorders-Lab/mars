describe("Project, edit Entities", () => {
  beforeEach(() => {
    // Reset the database
    cy.task("database:teardown");
    cy.task("database:setup");

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("#orcidLoginButton").click();
  });

  it("should be able to add an Entity", () => {
    cy.contains("button", "Projects").click();
    cy.get("a").contains("View").eq(0).click();
    cy.get("#editProjectButton").click();

    // Add an Entity
    cy.get("#addEntityButton").click();
    cy.get("#entitySearchSelect").click();
    cy.get("#entitySearchSelect").contains("button", "Test Entity").click();
    cy.get("#addEntityDoneButton").click();
    cy.contains("button", "Save").click();
    cy.contains("button", "Done").click();

    // Validate the Entity was added
    cy.get("table").eq(0).contains("Test Entity");
    cy.reload();
    cy.get("table").eq(0).contains("Test Entity");
  });

  it("should be able to remove an Entity", () => {
    cy.contains("button", "Projects").click();
    cy.get("a").contains("View").eq(0).click();
    cy.get("#editProjectButton").click();

    // Add an Entity
    cy.get("#addEntityButton").click();
    cy.get("#entitySearchSelect").click();
    cy.get("#entitySearchSelect").contains("button", "Test Entity").click();
    cy.get("#addEntityDoneButton").click();
    cy.contains("button", "Save").click();
    cy.contains("button", "Done").click();
    cy.reload();

    // Remove the Entity
    cy.get("#editProjectButton").click();
    cy.get("tr > td > div > button").click();
    cy.contains("button", "Save").click();
    cy.contains("button", "Done").click();

    // Validate the Entity was removed
    cy.contains("table").should("not.exist");
    cy.reload();
    cy.contains("table").should("not.exist");
  });

  it("should be updated after removing the Project via the Entity", () => {
    cy.contains("button", "Projects").click();
    cy.get("a").contains("View").eq(0).click();
    cy.get("#editProjectButton").click();

    // Add an Entity
    cy.get("#addEntityButton").click();
    cy.get("#entitySearchSelect").click();
    cy.get("#entitySearchSelect").contains("button", "Test Entity").click();
    cy.get("#addEntityDoneButton").click();
    cy.contains("button", "Save").click();
    cy.contains("button", "Done").click();
    cy.reload();

    // Remove the the Entity
    cy.get("tr > td > div > div > a").click();
    cy.get("#editEntityButton").click();
    cy.get("tr > td > div > button").eq(0).click();
    cy.contains("button", "Save").click();
    cy.contains("button", "Done").click();

    // Navigate to the Project
    cy.contains("button", "Projects").click();
    cy.get("a").contains("View").eq(0).click();
    cy.get("#editProjectButton").click();

    // Validate the Entity was removed
    cy.contains("table").should("not.exist");
  });
});
