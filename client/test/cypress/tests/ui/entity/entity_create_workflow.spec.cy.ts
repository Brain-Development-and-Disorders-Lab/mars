describe("Create Entities", () => {
  beforeEach(() => {
    // Reset the database
    cy.task("database:teardown");
    cy.task("database:setup");

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("#orcidLoginButton").click();

    // Navigate to the "Create Entity" page
    cy.visit("http://localhost:8080/create/entity");
  });

  it("should display the initial page with required fields", () => {
    cy.get("h2").contains("Create Entity"); // Check for the page header
    cy.get('input[name="name"]').should("be.visible"); // Check for the name input
    cy.get('input[type="date"]').should("be.visible"); // Check for the created date input
    cy.get("textarea").should("be.visible"); // Check for the description input
  });

  it("should navigate through the steps", () => {
    // Fill in the initial details
    cy.get("[data-testid='create-entity-name']").type("Test Entity");
    cy.get('input[type="date"]').type("2023-10-01");
    cy.get("textarea").type("This is a test entity.");

    // Click on the "Continue" button to go to the Relationships step
    cy.get("button").contains("Continue").click();
    cy.get(".chakra-empty-state__description").contains("No Relationships");

    // Click on the "Back" button to return to the start step
    cy.get("button").contains("Back").click();
    cy.get("h2").contains("Create Entity");

    // Click on the "Continue" button to go to the Relationships step
    cy.get("button").contains("Continue").click();
    cy.get(".chakra-empty-state__description").contains("No Relationships");

    // Click on the "Continue" button to go to the Attributes step
    cy.get("button").contains("Continue").click();
    cy.get(".chakra-empty-state__description").contains("No Attributes");

    // Click on the "Back" button to return to the Relationships step
    cy.get("button").contains("Back").click();
    cy.get(".chakra-empty-state__description").contains("No Relationships");

    // Click on the "Continue" button to go to the Attributes step
    cy.get("button").contains("Continue").click();
    cy.get(".chakra-empty-state__description").contains("No Attributes");
  });

  it("should allow adding Relationships", () => {
    // Fill in the initial details
    cy.get('input[name="name"]').type("Test Entity");
    cy.get('input[type="date"]').type("2023-10-01");
    cy.get("textarea").type("This is a test entity.");

    // Click on the "Continue" button to go to the Relationships step
    cy.get("button").contains("Continue").click();

    // Add a relationship
    cy.get("[data-testid='search-select']").click();
    cy.get("button").contains("Test Entity").click();
    cy.get("button").contains("Add").click();

    // Check if the relationship is displayed in a table
    cy.get(".data-table-scroll-container").should("exist");
    cy.get("#0_target").should("exist");
    cy.get("#0_target").contains("Test Entity");
  });

  it("should allow adding Template Attributes", () => {
    // Fill in the initial details
    cy.get("[data-testid='create-entity-name']").type("Test Entity");
    cy.get('input[type="date"]').type("2023-10-01");
    cy.get("textarea").type("This is a test entity.");

    // Click on the "Continue" button to go to the relationships step
    cy.get("button").contains("Continue").click();

    // Click on "Continue" to go to the Attributes step
    cy.get("button").contains("Continue").click();

    // Wait for templates to be loaded and select to be enabled
    cy.get("[data-testid='select-template-trigger']").should("not.be.disabled");

    // Add an Attribute
    cy.get("[data-testid='select-template-trigger']").click();

    // Wait for dropdown to be visible and select the template
    cy.contains('[role="option"]', "Test Template")
      .should("be.visible")
      .click();

    // Check if the Attribute is displayed (wait for it to be visible)
    cy.get("[data-testid='create-entity-attributes']").should("be.visible");

    // Save the Attribute and finish creating the Entity
    cy.get("button").contains("Save").should("be.visible").click();
    cy.get("button").contains("Finish").should("be.visible").click();

    // Check redirection
    cy.url().should("include", "/entities"); // Check if redirected to Entities page
  });

  it("should complete Entity creation", () => {
    // Fill in the initial details
    cy.get("[data-testid='create-entity-name']").type("Test Entity");
    cy.get('input[type="date"]').type("2023-10-01");
    cy.get("textarea").type("This is a test entity.");

    // Click on the "Continue" button to go to the Relationships step
    cy.get("button").contains("Continue").click();
    cy.get(".chakra-empty-state__description").contains("No Relationships");

    // Click on the "Continue" button to go to the Attributes step
    cy.get("button").contains("Continue").click();
    cy.get(".chakra-empty-state__description").contains("No Attributes");

    // Click the button to finish creating the Entity
    cy.get("button").contains("Finish").click();

    // Check redirection
    cy.url().should("include", "/entities"); // Check if redirected to Entities page
  });
});
