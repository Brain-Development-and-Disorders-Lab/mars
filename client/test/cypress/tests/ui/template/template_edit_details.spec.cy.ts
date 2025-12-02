describe("Template Page", () => {
  beforeEach(() => {
    // Reset the database
    cy.task("database:teardown");
    cy.task("database:setup");

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("#orcidLoginButton").click();

    cy.contains("button", "Templates").click();
    cy.get(".data-table-scroll-container").within(() => {
      cy.contains("Test Template")
        .parents()
        .filter((_, el) => {
          // Find the row element (id is just a number, not containing underscore)
          return !!(el.id && /^\d+$/.test(el.id));
        })
        .first()
        .find('button[aria-label="View Template"]')
        .click();
    });
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
    cy.get(".chakra-toast__root").contains("Updated Successfully");
  });

  it("archives the Template", () => {
    cy.get("[data-testid='templateActionsButton']").click();

    cy.get("[data-value='archive']").click();
    cy.contains("button", "Confirm").click();
    cy.get(".chakra-toast__root").contains("Archived Successfully");
  });

  it("exports the Template", () => {
    cy.get("[data-testid='templateActionsButton']").click();
    cy.get("[data-value='export']").click();
    cy.get(".chakra-toast__root").contains("Generated JSON file");
  });
});
