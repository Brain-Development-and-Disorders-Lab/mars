describe("search query builder", () => {
  beforeEach(() => {
    // Clear the localstorage
    cy.clearLocalStorage();

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("button").click();
  });

  it("should go to search page and test query builder", () => {
    cy.contains("button", "Search").click();
    cy.contains("button", "Query Builder").click();
    // result array should be empty/not exist
    cy.get(".css-1ofqig9 > .chakra-heading").should("not.exist");
    cy.contains("button", "Rule").click();
    cy.get(".rule-operators").select("contains");
    cy.get('[data-testid="value-editor"]').type("box");
    // press search button
    cy.get('[aria-label="Run Query"]').click();
    // result array should exist
    cy.get(".css-aybym5 > .chakra-heading").should("contain.text", "7 results");
  });
});
