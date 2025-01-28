describe("Entity, edit Attributes", () => {
  beforeEach(() => {
    // Reset the database
    cy.task("database:teardown");
    cy.task("database:setup");

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("#orcidLoginButton").click();
  });

  it("should be able to add and edit Attributes", () => {
    cy.contains("button", "Entities").click();
    cy.contains("td", "Test Child Entity")
      .siblings()
      .contains("a", "View")
      .click();
    cy.contains("No Attributes").should("exist");
    cy.get("#editEntityButton").click();

    // Add Attribute
    cy.get("#addAttributeModalButton").click();
    cy.get("#formName").type("Attribute Name");
    cy.get("#formDescription").type("Attribute Description");
    cy.get(".add-value-button-form").click();
    cy.get("#add-value-button-text").click();
    cy.get("input").eq(-2).type("Value Name");
    cy.get("input").eq(-1).type("Value Data");
    cy.get("input").eq(-1).click();

    cy.get(".chakra-modal__body").click();

    cy.get(".chakra-modal__body").get("button").eq(-1).click();

    cy.contains("button", "Save").click();
    cy.contains("button", "Done").click();

    cy.contains("No Attributes").should("not.exist");
    cy.reload();

    // Check that Attribute is added
    cy.contains("No Attributes").should("not.exist");

    // Edit Attribute
    cy.get("#editEntityButton").click();

    // Delete the Attribute
    cy.get('button[aria-label="Delete attribute"]').click();
    cy.contains("button", "Save").click();
    cy.contains("button", "Done").click();

    // Check that Attribute is deleted
    cy.contains("No Attributes").should("exist");
    cy.reload();
    cy.contains("No Attributes").should("exist");
  });
});
