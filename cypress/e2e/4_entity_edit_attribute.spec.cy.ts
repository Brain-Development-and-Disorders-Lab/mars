describe("In entity page, edit attribute", () => {
  it("should be able to add and edit attribute", () => {
    cy.visit("http://localhost:8080/");
    cy.contains("button", "Dashboard").click();
    cy.get("button").contains("View").eq(-1).click();
    cy.get("button").contains("View").eq(0).click();
    cy.contains("This Entity does not have any Attributes.").should("exist");
    cy.contains("button", "Edit").click();

    // add attribute
    cy.get(
      ":nth-child(2) > .css-1acctax > .css-1ialerq > .chakra-button",
    ).click();
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

    cy.contains("This Entity does not have any Attributes.").should(
      "not.exist",
    );
    cy.reload();
    // check if attribute is added
    cy.contains("This Entity does not have any Attributes.").should(
      "not.exist",
    );

    // edit attribute
    cy.contains("button", "Edit").click();

    cy.get('button[aria-label="Delete attribute"]').click();
    cy.contains("button", "Done").click();
    // check if attribute is deleted
    cy.contains("This Entity does not have any Attributes.").should("exist");
    cy.reload();
    cy.contains("This Entity does not have any Attributes.").should("exist");
  });
});
