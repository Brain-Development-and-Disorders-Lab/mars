describe("search query builder", () => {
  beforeEach(() => {
    // Clear the localstorage
    cy.clearLocalStorage();

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("button").click();
  });

  it("should go to search page and test query builder", () => {
    cy.get("#navSearchButton").click();
    cy.contains("button", "Query Builder").click();

    // Default search result array should be empty
    cy.get(".css-1ofqig9 > .chakra-heading").should("not.exist");

    // Create a test query
    cy.contains("button", "Rule").click();
    cy.get(".rule-operators").select("contains");
    cy.get('[data-testid="value-editor"]').type("box");
    cy.get('[aria-label="Run Query"]').click(); // Click the Search button

    // Search result array should contain multiple results
    cy.get("#resultsHeading").should("contain.text", "7 results");
  });
});
