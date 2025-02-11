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
    cy.get("label").contains("Relationships");

    // Click on the "Back" button to return to the start step
    cy.get("button").contains("Back").click();
    cy.get("h2").contains("Create Entity");

    // Click on the "Continue" button to go to the Relationships step
    cy.get("button").contains("Continue").click();
    cy.get("label").contains("Relationships");

    // Click on the "Continue" button to go to the Attributes step
    cy.get("button").contains("Continue").click();
    cy.get("select").get("option").contains("Template");

    // Click on the "Back" button to return to the Relationships step
    cy.get("button").contains("Back").click();
    cy.get("label").contains("Relationships");

    // Click on the "Continue" button to go to the Attributes step
    cy.get("button").contains("Continue").click();
    cy.get("select").get("option").contains("Template");
  });

  // it("should allow adding Relationships", () => {
  //   // Fill in the initial details
  //   cy.get("input[name=\"name\"]").type("Test Entity");
  //   cy.get("input[type=\"date\"]").type("2023-10-01");
  //   cy.get("textarea").type("This is a test entity.");

  //   // Click on the "Continue" button to go to the Relationships step
  //   cy.get("button").contains("Continue").click();

  //   // Add a relationship
  //   cy.get("#relationshipTargetSelect").click();
  //   cy.get("button").contains("Test Entity").click();
  //   cy.get("button").contains("Add").click();

  //   // Check if the relationship is displayed in a table
  //   cy.get(".chakra-table").should("exist");
  //   cy.get("#0_target").should("exist");
  //   cy.get("#0_target").contains("Test Entity");
  // });

  // it("should allow adding Attributes", () => {
  //   // Fill in the initial details
  //   cy.get("input[name=\"name\"]").type("Test Entity");
  //   cy.get("input[type=\"date\"]").type("2023-10-01");
  //   cy.get("textarea").type("This is a test entity.");

  //   // Click on the "Continue" button to go to the relationships step
  //   cy.get("button").contains("Continue").click();

  //   // Click on "Continue" to go to the attributes step
  //   cy.get("button").contains("Continue").click();

  //   // Add an attribute
  //   cy.get("select").select("Template 1"); // Select a template
  //   cy.get("button").contains("Create").click(); // Click to create an attribute

  //   // Check if the attribute is displayed
  //   cy.get(".attribute-card").should("exist"); // Adjust selector based on actual attribute display
  // });

  // it("should submit the entity creation form", () => {
  //   // Fill in the initial details
  //   cy.get("input[name=\"name\"]").type("Test Entity");
  //   cy.get("input[type=\"date\"]").type("2023-10-01");
  //   cy.get("textarea").type("This is a test entity.");

  //   // Click on the "Continue" button to go to the relationships step
  //   cy.get("button").contains("Continue").click();

  //   // Click on "Continue" to go to the attributes step
  //   cy.get("button").contains("Continue").click();

  //   // Add an attribute
  //   cy.get("select").select("Template 1"); // Select a template
  //   cy.get("button").contains("Create").click(); // Click to create an attribute

  //   // Submit the form
  //   cy.get("button").contains("Finish").click(); // Click to finish creating the entity

  //   // Check for success message or redirection
  //   cy.url().should("include", "/entities"); // Check if redirected to entities page
  //   cy.get(".toast").contains("Entity created successfully"); // Adjust selector based on success notification
  // });
});
