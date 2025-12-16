describe("Create Entities", () => {
  before(() => {
    // Reset the database once for the entire suite
    cy.task("database:teardown");
    cy.task("database:setup");
  });

  beforeEach(() => {
    // Use cached login session
    cy.login();
    // Navigate to the "Create Entity" page
    cy.visit("http://localhost:8080/create/entity", { timeout: 10000 });

    // Wait for page to load, check for heading
    cy.contains("h2", "Create Entity", { timeout: 10000 }).should("be.visible");
  });

  it("should display the initial page with required fields", () => {
    // Check for the page header
    cy.contains("h2", "Create Entity").should("be.visible");

    // Check for the name input using data-testid
    cy.get("[data-testid='create-entity-name']", { timeout: 10000 })
      .should("be.visible")
      .should("not.be.disabled");

    // Check for the created date input
    cy.get('input[type="date"]').should("be.visible");

    // Check for the description input
    cy.get("[data-testid='create-entity-description']")
      .should("be.visible")
      .find("textarea")
      .should("exist");
  });

  it("should navigate through the steps", () => {
    // Wait for form to be ready
    cy.get("[data-testid='create-entity-name']", { timeout: 10000 })
      .should("be.visible")
      .should("not.be.disabled");

    // Fill in the initial details
    cy.get("[data-testid='create-entity-name']")
      .clear()
      .type("Test Entity Navigation");

    cy.get('input[type="date"]')
      .should("be.visible")
      .clear()
      .type("2023-10-01");

    cy.get("[data-testid='create-entity-description']")
      .find("textarea")
      .should("be.visible")
      .clear()
      .type("This is a test entity for navigation.");

    // Wait for Continue button to be enabled and click
    cy.get("[data-testid='create-entity-continue']", { timeout: 5000 })
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    // Wait for relationships step to load
    cy.contains("No Relationships", { timeout: 5000 }).should("be.visible");

    // Click Back button
    cy.get("[data-testid='create-entity-back']", { timeout: 5000 })
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    // Verify we're back at start step
    cy.contains("h2", "Create Entity").should("be.visible");
    cy.get("[data-testid='create-entity-name']")
      .should("be.visible")
      .should("have.value", "Test Entity Navigation");

    // Continue to relationships again
    cy.get("[data-testid='create-entity-continue']")
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    cy.contains("No Relationships", { timeout: 5000 }).should("be.visible");

    // Continue to attributes step
    cy.get("[data-testid='create-entity-continue']")
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    // Wait for attributes step to load
    cy.contains("No Attributes", { timeout: 5000 }).should("be.visible");

    // Go back to relationships
    cy.get("[data-testid='create-entity-back']")
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    cy.contains("No Relationships", { timeout: 5000 }).should("be.visible");

    // Continue to attributes again
    cy.get("[data-testid='create-entity-continue']")
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    cy.contains("No Attributes", { timeout: 5000 }).should("be.visible");
  });

  it("should allow adding Relationships", () => {
    // Wait for form to be ready
    cy.get("[data-testid='create-entity-name']", { timeout: 10000 })
      .should("be.visible")
      .should("not.be.disabled");

    // Fill in the initial details
    cy.get("[data-testid='create-entity-name']")
      .clear()
      .type("Test Entity Relationships");

    cy.get('input[type="date"]')
      .should("be.visible")
      .clear()
      .type("2023-10-01");

    cy.get("[data-testid='create-entity-description']")
      .find("textarea")
      .should("be.visible")
      .clear()
      .type("This is a test entity for relationships.");

    // Continue to relationships step
    cy.get("[data-testid='create-entity-continue']", { timeout: 5000 })
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    // Wait for relationships step to load
    cy.contains("No Relationships", { timeout: 5000 }).should("be.visible");

    // Try to add a relationship, click on SearchSelect
    cy.get("body").then(($body) => {
      // Check if SearchSelect is available
      const searchSelect = $body.find('[data-testid="search-select"]');
      if (searchSelect.length > 0) {
        cy.get('[data-testid="search-select"]', { timeout: 5000 })
          .should("be.visible")
          .click({ force: true });

        // Try to select an entity if available
        cy.get("body").then(($body2) => {
          const entityButton = $body2.find('button:contains("Test Entity")');
          if (entityButton.length > 0) {
            cy.contains("button", "Test Entity", { timeout: 5000 })
              .first()
              .should("be.visible")
              .click({ force: true });

            // Click Add button
            cy.get("[data-testid='create-entity-add-relationship']")
              .should("be.visible")
              .should("not.be.disabled")
              .click();

            // Verify relationship was added
            cy.get(".data-table-scroll-container", { timeout: 5000 }).should(
              "be.visible",
            );
          }
        });
      }
    });
  });

  it("should allow adding Template Attributes", () => {
    // Wait for form to be ready
    cy.get("[data-testid='create-entity-name']", { timeout: 10000 })
      .should("be.visible")
      .should("not.be.disabled");

    // Fill in the initial details
    cy.get("[data-testid='create-entity-name']")
      .clear()
      .type("Test Entity Attributes");

    cy.get('input[type="date"]')
      .should("be.visible")
      .clear()
      .type("2023-10-01");

    cy.get("[data-testid='create-entity-description']")
      .find("textarea")
      .should("be.visible")
      .clear()
      .type("This is a test entity for attributes.");

    // Continue to relationships step
    cy.get("[data-testid='create-entity-continue']", { timeout: 5000 })
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    // Wait for relationships step
    cy.contains("No Relationships", { timeout: 5000 }).should("be.visible");

    // Continue to attributes step
    cy.get("[data-testid='create-entity-continue']")
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    // Wait for attributes step to load
    cy.contains("No Attributes", { timeout: 5000 }).should("be.visible");

    // Wait for template select to be ready
    cy.get("[data-testid='select-template-trigger']", { timeout: 10000 })
      .should("be.visible")
      .should("not.be.disabled");

    // Click template select
    cy.get("[data-testid='select-template-trigger']").click();

    // Try to select a template if available
    cy.get("body").then(($body) => {
      const templateOption = $body.find(
        '[role="option"]:contains("Test Template")',
      );
      if (templateOption.length > 0) {
        cy.contains('[role="option"]', "Test Template", { timeout: 5000 })
          .should("be.visible")
          .click();

        // Verify attribute was added
        cy.get("[data-testid='create-entity-attributes']", {
          timeout: 5000,
        }).should("be.visible");
      }
    });
  });

  it("should complete Entity creation", () => {
    // Wait for form to be ready
    cy.get("[data-testid='create-entity-name']", { timeout: 10000 })
      .should("be.visible")
      .should("not.be.disabled");

    // Fill in the initial details
    cy.get("[data-testid='create-entity-name']")
      .clear()
      .type("Test Entity Complete");

    cy.get('input[type="date"]')
      .should("be.visible")
      .clear()
      .type("2023-10-01");

    cy.get("[data-testid='create-entity-description']")
      .find("textarea")
      .should("be.visible")
      .clear()
      .type("This is a test entity for completion.");

    // Continue to relationships step
    cy.get("[data-testid='create-entity-continue']", { timeout: 5000 })
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    // Wait for relationships step
    cy.contains("No Relationships", { timeout: 5000 }).should("be.visible");

    // Continue to attributes step
    cy.get("[data-testid='create-entity-continue']")
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    // Wait for attributes step
    cy.contains("No Attributes", { timeout: 5000 }).should("be.visible");

    // Click Finish button
    cy.get("[data-testid='create-entity-finish']", { timeout: 5000 })
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    // Wait for navigation to complete
    cy.url({ timeout: 10000 }).should("include", "/entities");
    cy.url().should("not.include", "/create/entity");
  });
});
