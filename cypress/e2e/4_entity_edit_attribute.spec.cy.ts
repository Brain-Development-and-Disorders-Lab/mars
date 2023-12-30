
describe('In entity page, edit attribute', () => {
  it('should be able to add and edit attribute', () => {
    cy.visit('http://localhost:8080/');
    cy.contains('button', 'Dashboard').click();

    cy.get('button').contains('View').eq(-1).click();
    cy.get('button').contains('View').eq(0).click();
    cy.contains('No Attributes.').should('exist');

    cy.contains('button', 'Edit').click();

    // add attribute
    cy.get(':nth-child(2) > .css-sdf56e > .css-1ialerq > .chakra-button').click();
    cy.get('#formName').type('Attribute Name');
    cy.get('#formDescription').type('Attribute Description');

    // cy.get('button').contains('Add').eq(4).click();
    cy.get('.add-value-button-form').click();
    // cy.contains('button', 'Add').click();
    
    cy.get('#add-value-button-text').click();

    cy.get('input').eq(-2).type('Value Name');
    cy.get('input').eq(-1).type('Value Data');
    cy.get('input').eq(-1).click();

    cy.get('.chakra-modal__body').click();

    cy.get('.chakra-modal__body')
    .get('button').eq(-1).click();
    
    cy.contains('button', 'Done').click();

    cy.contains('No Attributes.').should('not.exist');
    cy.reload();
    // check if attribute is added
    cy.contains('No Attributes.').should('not.exist');

    // edit attribute
    cy.contains('button', 'Edit').click();

    cy.get('button[aria-label="Delete attribute"]').click();
    cy.contains('button', 'Done').click();
    // check if attribute is deleted
    cy.contains('No Attributes.').should('exist');
    cy.reload();
    cy.contains('No Attributes.').should('exist');


  });
});
