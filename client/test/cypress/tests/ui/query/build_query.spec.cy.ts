describe("Search Query Builder", () => {
  beforeEach(() => {
    // Reset the database
    cy.task("database:teardown");
    cy.task("database:setup");

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("#orcidLoginButton").click();
  });

  it("should build a query with 1 Name inclusion rule", () => {
    cy.get("#navSearchButtonDesktop").click();
    cy.contains("button", "Query Builder").click();

    // Default search result array should be empty
    cy.get(".css-1ofqig9 > .chakra-heading").should("not.exist");

    // Create a test query
    cy.contains("button", "Rule").click();
    cy.get(".rule-operators").select("contains");
    cy.get('[data-testid="value-editor"]').type("Entity");
    cy.get('[aria-label="Run Query"]').click(); // Click the Search button

    // Search result array should contain multiple results
    cy.get("#resultsHeading").should("contain.text", "4 results");
  });

  it("should build a query with 1 Name exclusion rule", () => {
    cy.get("#navSearchButtonDesktop").click();
    cy.contains("button", "Query Builder").click();

    // Default search result array should be empty
    cy.get(".css-1ofqig9 > .chakra-heading").should("not.exist");

    // Create a test query
    cy.contains("button", "Rule").click();
    cy.get(".rule-operators").select("does not contain");
    cy.get('[data-testid="value-editor"]').type("Entity");
    cy.get('[aria-label="Run Query"]').click(); // Click the Search button

    // Search result array should contain multiple results
    cy.get("#resultsContainer").should("contain.text", "No results found");
  });

  it("should build a query with 1 Name inclusion rule and 1 Attribute Value (Text) inclusion rule", () => {
    cy.get("#navSearchButtonDesktop").click();
    cy.contains("button", "Query Builder").click();

    // Default search result array should be empty
    cy.get(".css-1ofqig9 > .chakra-heading").should("not.exist");

    // Create a test query
    cy.contains("button", "Rule").click();
    cy.get(".rule-operators").select("contains");
    cy.get('[data-testid="value-editor"]').type("Entity");

    cy.contains("button", "Rule").click();
    cy.get(".rule-fields").eq(1).select("Attributes");
    cy.get(".rule-operators").eq(1).select("contains");
    cy.get(".rule-value-type").select("Text");
    cy.get(".rule-value-operators").select("contains");
    cy.get('[data-testid="value-editor"]').eq(1).type("Test");

    cy.get('[aria-label="Run Query"]').click(); // Click the Search button

    // Search result array should contain multiple results
    cy.get("#resultsHeading").should("contain.text", "2 results");
  });

  it("should build a query with 1 Name inclusion rule and 1 Attribute Value (Number) inclusion rule", () => {
    cy.get("#navSearchButtonDesktop").click();
    cy.contains("button", "Query Builder").click();

    // Default search result array should be empty
    cy.get(".css-1ofqig9 > .chakra-heading").should("not.exist");

    // Create a test query
    cy.contains("button", "Rule").click();
    cy.get(".rule-operators").select("contains");
    cy.get('[data-testid="value-editor"]').type("Entity");

    cy.contains("button", "Rule").click();
    cy.get(".rule-fields").eq(1).select("Attributes");
    cy.get(".rule-operators").eq(1).select("contains");
    cy.get(".rule-value-type").select("Number");
    cy.get(".rule-value-operators").select(">");
    cy.get('[data-testid="value-editor"]').eq(1).type("120");

    cy.get('[aria-label="Run Query"]').click(); // Click the Search button

    // Search result array should contain multiple results
    cy.get("#resultsHeading").should("contain.text", "1 result");
  });
});
