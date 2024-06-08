describe("CSV Import Test", () => {
  it("should import a CSV file successfully", () => {
    // Visit the page where you can import CSV files
    cy.clearLocalStorage();

    cy.visit("http://localhost:8080/");

    cy.contains("div", "Create").click();
    cy.get(
      ":nth-child(1) > .chakra-card__footer > .css-ldo4d5 > .chakra-button",
    ).click(); // create project
    cy.get("#name").type("Test Mock Project");
    cy.get("#description").type("Test Mock Project Description");

    cy.get(".css-h211ee").click({ force: true }); // click to finish creating project
    cy.wait(1000);

    cy.contains("div", "Import").click(); // click to import CSV file

    cy.get("input[type=file]").first().selectFile(Cypress.Buffer.from("text"));

    cy.fixture("export_entities.csv").then((fileContent) => {
      cy.get("input[type=file]")
        .first()
        .selectFile({
          fileName: "export_entities.csv",
          mimeType: "text/csv",
          contents: Cypress.Buffer.from(fileContent),
        });
      cy.wait(3000); // Allow toast to disappear
      cy.get(".css-jut409").scrollIntoView().click();
      cy.wait(100);
      cy.get("select#import_name")
        .find('option[value="Name"]')
        .first()
        .parent()
        .select("Name");
      cy.wait(3000); // Allow toast to disappear
      cy.get("select#import_projects")
        .find("option")
        .first()
        .parent()
        .select("Test Mock Project")
        .first();
      cy.get(".css-15vhhhd > .css-jut409").click({ force: true }); // Go to import step 2
      cy.get(".css-15vhhhd > .css-h211ee").click({ force: true }); // Finalize import

      cy.get("#0_entities").should("not.have.text", "0");
    });
  });
});
