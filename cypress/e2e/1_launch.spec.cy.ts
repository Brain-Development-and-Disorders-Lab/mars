describe("Interface launches", () => {
  beforeEach(() => {
    // Clear the localstorage
    cy.clearLocalStorage();

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("#orcidLoginButton").click();

    // Create a Workspace
    cy.get("#modalWorkspaceName").type("Test Workspace");
    cy.get("#modalWorkspaceDescription").type("Description for Workspace");
    cy.get("#modalWorkspaceCreateButton").click();
  });

  it("navigation menu items are visible", () => {
    cy.get("#navSearchButton").should("have.text", "Search");
    cy.get("#navProjectsButton").should("have.text", "Projects");
  });
});
