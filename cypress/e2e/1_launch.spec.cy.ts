describe('checking app does launch ', () => {
  it('checking Project and Entities box', () => {
    cy.visit('http://localhost:8080/');
    cy.get(':nth-child(1) > .css-r4opcp > .chakra-heading').should('have.text', 'Projects');
    cy.get(':nth-child(2) > .css-r4opcp > .chakra-heading').should('have.text', 'Entities');
  })
  
})