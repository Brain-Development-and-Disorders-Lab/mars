describe("CSV Import Test", () => {
  beforeEach(() => {
    // Reset the database
    cy.task("database:teardown");
    cy.task("database:setup");

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("#orcidLoginButton").click();
  });

  it("should import a CSV file successfully", () => {
    // Open import modal and import CSV file
    cy.get("#navImportButtonDesktop").click();
    cy.get("input[type=file]").first().selectFile(Cypress.Buffer.from("text"));
    cy.fixture("export_entities.csv").then((fileContent) => {
      cy.get("input[type=file]")
        .first()
        .selectFile({
          fileName: "export_entities.csv",
          mimeType: "text/csv",
          contents: Cypress.Buffer.from(fileContent),
        });
      cy.wait(3000); // Wait for toast to disappear
      cy.get('[data-testid="import-type-select-trigger"]').click();
      cy.contains('[role="option"]', "Entities").click();
      cy.get("#importContinueButton").scrollIntoView().click();
      cy.wait(100);
      cy.get('[data-testid="import-column-select-trigger-name"]').click();
      cy.contains('[role="option"]', "Name").click();
      cy.get('[data-testid="import-column-select-trigger-project"]').click();
      cy.contains('[role="option"]', "My First Project").click();
      cy.get("#importContinueButton").click(); // Go to Attributes page
      cy.get("#importContinueButton").click(); // Go to Review page
      cy.wait(1000); // Wait for GraphQL request to complete
      cy.get("#importContinueButton").click(); // Finalize import
      cy.wait(1000); // Wait for GraphQL request to complete

      // Validate that the Project contains an Entity named "Mini Box 1 (CSV)"
      cy.get("#navProjectsButtonDesktop").click();
      cy.get("#0__id > div > a").first().click(); // Button to view the first Project
      cy.contains("Mini Box 1 (CSV)");
    });
  });
});
