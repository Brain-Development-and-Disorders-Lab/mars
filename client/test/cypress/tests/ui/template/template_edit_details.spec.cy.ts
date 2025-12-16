describe("Template Page", () => {
  before(() => {
    // Reset the database once for the entire suite
    cy.task("database:teardown");
    cy.task("database:setup");
  });

  beforeEach(() => {
    cy.login();
    cy.visit("http://localhost:8080/");

    cy.contains("button", "Templates").click();
    // Wait for the data table to be visible and loaded
    cy.get(".data-table-scroll-container", { timeout: 10000 }).should(
      "be.visible",
    );
    // Find template by position (first one) rather than name to avoid dependency on previous test changes
    cy.get(".data-table-scroll-container")
      .find('button[aria-label="View Template"]')
      .first()
      .click();
  });

  it("renders the Template details correctly", () => {
    // Check that template details are visible (name may vary due to previous tests)
    cy.get("h2").should("exist");
    cy.get("#attributeNameInput").should("be.visible");
    cy.get("#attributeDescriptionInput").should("be.visible");
  });

  it("allows editing the Template", () => {
    // Get the current template name to revert it later
    cy.get("h2")
      .invoke("text")
      .then((originalName) => {
        cy.get("#editTemplateButton").click();
        cy.get("#attributeNameInput").clear().type("New Template Name");
        cy.get("#attributeDescriptionInput").clear().type("New Description");
        cy.get("#editTemplateButton").click();
        cy.get(".chakra-toast__root").contains("Updated Successfully");

        // Revert the name back to original to avoid breaking subsequent tests
        cy.get("#editTemplateButton").click();
        cy.get("#attributeNameInput").clear().type(originalName);
        cy.get("#attributeDescriptionInput")
          .clear()
          .type("Description for test Template");
        cy.get("#editTemplateButton").click();
        cy.get(".chakra-toast__root").contains("Updated Successfully");
      });
  });

  it("exports the Template", () => {
    cy.get("[data-testid='templateActionsButton']").click();
    cy.get("[data-value='export']").click();
    cy.get(".chakra-toast__root").contains("Generated JSON file");
  });

  it("archives the Template", () => {
    cy.get("[data-testid='templateActionsButton']").click();

    cy.get("[data-value='archive']").click();
    cy.contains("button", "Confirm").click();
    cy.get(".chakra-toast__root").contains("Archived Successfully");
  });
});
