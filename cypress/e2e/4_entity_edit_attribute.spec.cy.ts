describe("In entity page, edit attribute", () => {
  beforeEach(() => {
    // Clear the localstorage
    cy.clearLocalStorage();

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("button").click();
  });

  it("should be able to add and edit attribute", () => {
    cy.contains("button", "Dashboard").click();
    cy.get("button").contains("View").eq(-1).click();
    cy.get("button").contains("View").eq(0).click();
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

    cy.contains("button", "Done").click();

    cy.contains("No Attributes").should("not.exist");
    cy.reload();

    // Check that Attribute is added
    cy.contains("No Attributes").should("not.exist");

    // Edit Attribute
    cy.get("#editEntityButton").click();

    // Delete the Attribute
    cy.get('button[aria-label="Delete attribute"]').click();
    cy.contains("button", "Done").click();

    // Check that Attribute is deleted
    cy.contains("No Attributes").should("exist");
    cy.reload();
    cy.contains("No Attributes").should("exist");
  });
});
