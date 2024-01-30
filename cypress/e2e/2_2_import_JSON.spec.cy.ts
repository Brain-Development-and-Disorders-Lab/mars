
describe('JSON Import Test', () => {
  it('should import a CSV file successfully', () => {
    // Visit the page where you can import CSV files
    cy.clearLocalStorage()

    cy.visit('http://localhost:8080/');

    cy.contains('div', 'Import').click(); // click to import JSON file

    // cy.get('input[type=file]').first().selectFile(Cypress.Buffer.from('text'));


    cy.fixture('export_entities.json', 'binary').then((fileContent) => {
      // Directly use fileContent if it's already in the correct format
      cy.get('input[type=file]').first().selectFile({
        fileName: 'export_entities.json',
        mimeType: 'application/json',
        contents: fileContent,
      });

      cy.wait(100);
      cy.get('.css-jut409').scrollIntoView().click();
      cy.wait(500);
      cy.get('.css-15vhhhd > .css-h211ee').click({force: true}); // go to importe step 2
      cy.get('.css-15vhhhd > .css-h211ee').click({force: true}); //  finalize import

      cy.contains('FROMJSON').should('exist');
    });
  });
});
