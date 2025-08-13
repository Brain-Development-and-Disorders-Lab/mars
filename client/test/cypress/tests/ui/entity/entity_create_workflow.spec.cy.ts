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
    cy.get('input[name="name"]').type("Test Entity");
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
    cy.get(".chakra-table__root").should("exist");
    cy.get("#0_target").should("exist");
    cy.get("#0_target").contains("Test Entity");
  });

  it("should allow adding Template Attributes", () => {
    // Fill in the initial details
    cy.get('input[name="name"]').type("Test Entity");
    cy.get('input[type="date"]').type("2023-10-01");
    cy.get("textarea").type("This is a test entity.");

    // Click on the "Continue" button to go to the relationships step
    cy.get("button").contains("Continue").click();

    // Click on "Continue" to go to the Attributes step
    cy.get("button").contains("Continue").click();

    // Add an Attribute
    cy.get("[data-testid='select-template-trigger']").click();
    cy.get(".chakra-select__content").contains("Test Template").click();

    // Check if the Attribute is displayed
    cy.get("[data-testid='create-entity-attributes']").should("exist");

    // Save the Attribute and finish creating the Entity
    cy.get("button").contains("Save").click();
    cy.get("button").contains("Finish").click();

    // Check redirection
    cy.url().should("include", "/entities"); // Check if redirected to Entities page
  });

  it("should complete Entity creation", () => {
    // Fill in the initial details
    cy.get('input[name="name"]').type("Test Entity");
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
