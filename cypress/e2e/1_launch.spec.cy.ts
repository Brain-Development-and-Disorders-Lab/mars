describe("checking app does launch ", () => {
  beforeEach(() => {
    // Clear the localstorage
    cy.clearLocalStorage();

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("button").click();
  });

  it("checking Search and Projects box", () => {
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
