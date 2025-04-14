describe("Create Project", () => {
  beforeEach(() => {
    // Reset the database
    cy.task("database:teardown");
    cy.task("database:setup");

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("#orcidLoginButton").click();

    // Navigate to the "Create Project" page
    cy.visit("http://localhost:8080/create/project");
  });

  it("should display the initial page with required fields", () => {
    cy.get("h2").contains("Create Project"); // Check for the page header
    cy.get('input[name="name"]').should("be.visible"); // Check for the name input
    cy.get('input[type="datetime-local"]').should("be.visible"); // Check for the created date input
    cy.get("textarea").should("be.visible"); // Check for the description input
  });

  it("should navigate through the steps", () => {
    // Fill in the initial details
    cy.get('input[name="name"]').type("Test Project");
    cy.get('input[type="datetime-local"]').type("2023-10-01T12:00:00");
    cy.get("textarea").type("This is a test Project.");

    // Submit the form
    cy.get("button").contains("Finish").click(); // Click to finish creating the Project

    // Check for success message or redirection
    cy.url().should("include", "/projects"); // Check if redirected to Projects page
  });
});
