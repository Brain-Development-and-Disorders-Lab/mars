describe("Search Query Builder", () => {
  before(() => {
    // Reset the database once for the entire suite
    cy.task("database:teardown");
    cy.task("database:setup");
  });

  beforeEach(() => {
    // Use cached login session
    cy.login();
    cy.visit("http://localhost:8080/");
  });

  it("should build a query with 1 Name inclusion rule", () => {
    cy.get("#navSearchButtonDesktop").click();
    cy.contains("button", "Query Builder").click();

    // Default search result array should be empty
    cy.get(".css-1ofqig9 > .chakra-heading").should("not.exist");

    // Create a test query
    cy.contains("button", "Rule").click();
    cy.get(".rule-operators > select").select("contains");
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
    cy.get(".rule-operators > select").select("does not contain");
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
    cy.get(".rule-operators > select").select("contains");
    cy.get('[data-testid="value-editor"]').type("Entity");

    cy.contains("button", "Rule").click();
    cy.get(".rule-fields > select").eq(1).select("Attributes");
    cy.get(".rule-operators > select").eq(1).select("contains");

    // Select the "Text" value type
    cy.get('[data-testid="rule-value-type-trigger"]').click();
    cy.contains('[role="option"]', "Text").click();

    // Select the "contains" operator
    cy.get('[data-testid="rule-value-operators-trigger"]').click();
    cy.contains('[role="option"]', "contains").click();

    // Type the value "Test" into the value input
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
    cy.get(".rule-operators > select").select("contains");
    cy.get('[data-testid="value-editor"]').type("Entity");

    cy.contains("button", "Rule").click();
    cy.get(".rule-fields > select").eq(1).select("Attributes");
    cy.get(".rule-operators > select").eq(1).select("contains");

    // Select the "Number" value type
    cy.get('[data-testid="rule-value-type-trigger"]').click();
    cy.contains('[role="option"]', "Number").click();

    // Select the ">" operator
    cy.get('[data-testid="rule-value-operators-trigger"]').click();
    cy.contains('[role="option"]', ">").click();

    // Type the value "120" into the value input
    cy.get('[data-testid="value-editor"]').eq(1).type("120");

    cy.get('[aria-label="Run Query"]').click(); // Click the Search button

    // Search result array should contain multiple results
    cy.get("#resultsHeading").should("contain.text", "1 result");
  });
});
