describe("JSON Import Test", () => {
  beforeEach(() => {
    // Clear the localstorage
    cy.clearLocalStorage();

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("button").click();
  });

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
      cy.get("#importContinueButton").click({ force: true }); // Go to import step 2
      cy.get("#importContinueButton").click({ force: true }); // Finalize import

      // Validate the Entity has been imported successfully
      cy.get("#navEntitiesButton").click();
      cy.contains("FROMJSON").should("exist");
    });
  });
});
