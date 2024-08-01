describe("Interface launches", () => {
  beforeEach(() => {
    // Clear the localstorage
    cy.clearLocalStorage();

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("button").click();
  });

  it("Search and Projects box are visible", () => {
    cy.get(".css-50hugx > :nth-child(2) > button:nth-child(3)").should(
      "have.text",
      "Search",
    );
    cy.get(".css-50hugx > :nth-child(2) > button:nth-child(4)").should(
      "have.text",
      "Projects",
    );
  });
});
