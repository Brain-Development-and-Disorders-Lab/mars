describe("JSON Import Test", () => {
  it("should import a JSON file successfully", () => {
    // Open import modal and import JSON file
    cy.get("#navImportButton").click();

    cy.fixture("export_entities.json", "binary").then((fileContent) => {
      // Directly use fileContent if it's already in the correct format
      cy.get("input[type=file]").first().selectFile({
        fileName: "export_entities.json",
        mimeType: "application/json",
        contents: fileContent,
      });
      cy.get("#importContinueButton").scrollIntoView().click();

      // Skip the remaining import screens
      cy.wait(500);
      cy.get("#importContinueButton").click(); // Go to Attributes page
      cy.get("#importContinueButton").click(); // Go to Review page
      cy.wait(1000); // Wait for GraphQL request to complete
      cy.get("#importContinueButton").click(); // Finalize import
      cy.wait(1000); // Wait for GraphQL request to complete

      // Validate the Entity has been imported successfully
      cy.get("#navEntitiesButton").click();
      cy.contains("(JSON)").should("exist");
    });
  });
});
