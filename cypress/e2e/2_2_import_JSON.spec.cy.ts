describe("JSON Import Test", () => {
  beforeEach(() => {
    // Clear the localstorage
    cy.clearLocalStorage();

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("button").click();
  });

  it("should import a JSON file successfully", () => {
    // Visit the page where you can import CSV files
    cy.contains("button", "Import").click(); // click to import CSV file

    // cy.get('input[type=file]').first().selectFile(Cypress.Buffer.from('text'));

    cy.fixture("export_entities.json", "binary").then((fileContent) => {
      // Directly use fileContent if it's already in the correct format
      cy.get("input[type=file]").first().selectFile({
        fileName: "export_entities.json",
        mimeType: "application/json",
        contents: fileContent,
      });

      cy.wait(100);
      cy.get(".css-15vhhhd > .css-hipoo1").scrollIntoView().click();
      cy.wait(500);
      cy.get(".css-15vhhhd > .css-hipoo1").click({ force: true }); // Go to import step 2
      cy.get(".css-15vhhhd > .css-lgnrpw").click({ force: true }); // Finalize import
      cy.reload();

      cy.contains("FROMJSON").should("exist");
    });
  });
});
