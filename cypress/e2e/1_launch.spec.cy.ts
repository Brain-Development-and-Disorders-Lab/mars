describe("Interface launches", () => {
  beforeEach(() => {
    // Clear the localstorage
    cy.clearLocalStorage();

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("button").click();

    // Complete User information
    cy.get("#userFirstNameInput").type("Test");
    cy.get("#userLastNameInput").type("User");
    cy.get("#userEmailInput").type("test.user@metadatify.com");
    cy.get("#userAffiliationInput").type("Test Affiliation");
    cy.get("#userDoneButton").click();

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
