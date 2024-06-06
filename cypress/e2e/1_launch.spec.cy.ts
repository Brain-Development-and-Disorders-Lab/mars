describe("checking app does launch ", () => {
  it("checking Search and Projects box", () => {
    cy.visit("http://localhost:8080/");
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
