describe("Create Project", () => {
  beforeEach(() => {
    // Reset the database
    cy.task("database:teardown");
    cy.task("database:setup");

    // Navigate and login
    cy.visit("http://localhost:8080/");
    cy.get("#orcidLoginButton").click();

    // Wait for login to complete
    cy.url({ timeout: 10000 }).should("not.include", "/login");

    // Navigate to the "Create Project" page
    cy.visit("http://localhost:8080/create/project", { timeout: 10000 });

    // Wait for page to load, check for heading
    cy.contains("h2", "Create Project", { timeout: 10000 }).should(
      "be.visible",
    );
  });

  it("should display the initial page with required fields", () => {
    // Check for the page header
    cy.contains("h2", "Create Project").should("be.visible");

    // Check for the name input using data-testid
    cy.get("[data-testid='create-project-name']", { timeout: 10000 })
      .should("be.visible")
      .should("not.be.disabled");

    // Check for the created date input
    cy.get('input[type="datetime-local"]').should("be.visible");

    // Check for the description input
    cy.get("[data-testid='create-project-description']")
      .should("be.visible")
      .find("textarea")
      .should("exist");
  });

  it("should create a project with required fields", () => {
    // Wait for form to be ready
    cy.get("[data-testid='create-project-name']", { timeout: 10000 })
      .should("be.visible")
      .should("not.be.disabled");

    // Fill in the initial details
    cy.get("[data-testid='create-project-name']")
      .clear()
      .type("Test Project Complete");

    cy.get('input[type="datetime-local"]')
      .should("be.visible")
      .clear()
      .type("2023-10-01T12:00");

    cy.get("[data-testid='create-project-description']")
      .find("textarea")
      .should("be.visible")
      .clear()
      .type("This is a test project description.");

    // Wait for Finish button to be enabled
    cy.get("[data-testid='create-project-finish']", { timeout: 5000 })
      .should("be.visible")
      .should("not.be.disabled");

    // Submit the form
    cy.get("[data-testid='create-project-finish']").click();

    // Wait for navigation to complete
    cy.url({ timeout: 10000 }).should("include", "/projects");
    cy.url().should("not.include", "/create/project");
  });

  it("should validate required fields", () => {
    // Wait for form to be ready
    cy.get("[data-testid='create-project-name']", { timeout: 10000 })
      .should("be.visible")
      .should("not.be.disabled");

    // Finish button should be disabled when name is empty
    cy.get("[data-testid='create-project-finish']")
      .should("be.visible")
      .should("be.disabled");

    // Fill in name only
    cy.get("[data-testid='create-project-name']")
      .clear()
      .type("Test Project Name");

    // Finish button should still be disabled (description is required)
    cy.get("[data-testid='create-project-finish']")
      .should("be.visible")
      .should("be.disabled");

    // Fill in description
    cy.get("[data-testid='create-project-description']")
      .find("textarea")
      .should("be.visible")
      .clear()
      .type("Test description");

    // Fill in date
    cy.get('input[type="datetime-local"]')
      .should("be.visible")
      .clear()
      .type("2023-10-01T12:00");

    // Finish button should now be enabled
    cy.get("[data-testid='create-project-finish']")
      .should("be.visible")
      .should("not.be.disabled");
  });

  it("should handle cancel button", () => {
    // Wait for form to be ready
    cy.get("[data-testid='create-project-name']", { timeout: 10000 }).should(
      "be.visible",
    );

    // Fill in some data
    cy.get("[data-testid='create-project-name']")
      .clear()
      .type("Test Project Cancel");

    // Click cancel, this will trigger a blocker modal if there are unsaved changes
    cy.get("[data-testid='create-project-cancel']")
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    // Handle blocker modal if it appears (when there are unsaved changes)
    cy.get("body").then(($body) => {
      if ($body.find('button:contains("Continue")').length > 0) {
        cy.contains("button", "Continue").click();
      }
    });

    // Should navigate away from create page
    cy.url({ timeout: 10000 }).should("include", "/projects");
    cy.url().should("not.include", "/create/project");
  });
});
