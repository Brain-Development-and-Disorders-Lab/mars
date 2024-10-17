describe("Security, check endpoint access", () => {
  beforeEach(() => {
    // Before each test, log out and clear localStorage
    cy.get("#workspaceSwitcher > button").click();
    cy.get("#accountLogoutItem").parent().click();
    cy.clearLocalStorage();
  });

  it("should not be able to access /", () => {
    cy.visit("http://localhost:8080");
    cy.location("pathname").should("eq", "/login");
  });

  it("should not be able to access /entities", () => {
    cy.visit("http://localhost:8080/entities");
    cy.location("pathname").should("eq", "/login");
  });

  it("should not be able to access /projects", () => {
    cy.visit("http://localhost:8080/projects");
    cy.location("pathname").should("eq", "/login");
  });

  it("should not be able to access /attributes", () => {
    cy.visit("http://localhost:8080/attributes");
    cy.location("pathname").should("eq", "/login");
  });

  it("should not be able to access /search", () => {
    cy.visit("http://localhost:8080/search");
    cy.location("pathname").should("eq", "/login");
  });

  it("should not be able to access /profile", () => {
    cy.visit("http://localhost:8080/profile");
    cy.location("pathname").should("eq", "/login");
  });

  it("should not be able to access /create", () => {
    cy.visit("http://localhost:8080/create");
    cy.location("pathname").should("eq", "/login");
  });

  it("should not be able to access /create/entity", () => {
    cy.visit("http://localhost:8080/create/entity");
    cy.location("pathname").should("eq", "/login");
  });

  it("should not be able to access /create/attribute", () => {
    cy.visit("http://localhost:8080/create/attribute");
    cy.location("pathname").should("eq", "/login");
  });

  it("should not be able to access /create/project", () => {
    cy.visit("http://localhost:8080/create/project");
    cy.location("pathname").should("eq", "/login");
  });

  it("should not be able to access /create/workspace", () => {
    cy.visit("http://localhost:8080/create/workspace");
    cy.location("pathname").should("eq", "/login");
  });
});
