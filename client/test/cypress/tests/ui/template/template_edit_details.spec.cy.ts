describe("Template Page", () => {
  beforeEach(() => {
    // Reset the database
    cy.task("database:teardown");
    cy.task("database:setup");

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("#orcidLoginButton").click();

    cy.contains("button", "Templates").click();
    cy.contains("td", "Test Template").siblings().contains("a", "View").click();
  });

  it("renders the Template details correctly", () => {
    cy.get("h2").contains("Test Template");
    cy.get("#attributeNameInput").should("be.visible");
    cy.get("#attributeDescriptionInput").should("be.visible");
  });

  it("allows editing the Template", () => {
    cy.get("#editTemplateButton").click();
    cy.get("#attributeNameInput").clear().type("New Template Name");
    cy.get("#attributeDescriptionInput").clear().type("New Description");
    cy.get("#editTemplateButton").click();
    cy.get(".chakra-toast").contains("Updated Successfully");
  });

  it("archives the Template", () => {
    cy.get("#menu-button-actionsMenu").click();
    cy.contains("button", "Archive").click();
    cy.contains("button", "Confirm").click();
    cy.get(".chakra-toast").contains("Archived Successfully");
  });

  it("exports the Template", () => {
    cy.get("#menu-button-actionsMenu").click();
    cy.contains("button", "Export").click();
    cy.get(".chakra-toast").contains("Generated JSON file");
  });
});
