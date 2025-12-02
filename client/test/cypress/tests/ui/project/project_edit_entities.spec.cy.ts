describe("Project, edit Entities", () => {
  beforeEach(() => {
    // Reset the database
    cy.task("database:teardown");
    cy.task("database:setup");

    // Navigate the "Login" page
    cy.visit("http://localhost:8080/");
    cy.get("#orcidLoginButton").click();
  });

  it("should be able to add an Entity", () => {
    cy.contains("button", "Projects").click();
    cy.get(".data-table-scroll-container")
      .find('button[aria-label="View Project"]')
      .first()
      .click();
    cy.get("#editProjectButton").click();

    // Add an Entity
    cy.get("#addEntityButton").click();
    cy.get("#entitySearchSelect").click();
    cy.get("#entitySearchSelect").contains("button", "Test Entity").click();
    cy.get("#addEntityDoneButton").click();
    cy.contains("button", "Save").click();
    cy.contains("button", "Done").click();

    // Validate the Entity was added
    cy.get(".data-table-scroll-container").contains("Test Entity");
    cy.reload();
    cy.get(".data-table-scroll-container").contains("Test Entity");
  });

  it("should be able to remove an Entity", () => {
    cy.contains("button", "Projects").click();
    cy.get(".data-table-scroll-container")
      .find('button[aria-label="View Project"]')
      .first()
      .click();
    cy.get("#editProjectButton").click();

    // Add an Entity
    cy.get("#addEntityButton").click();
    cy.get("#entitySearchSelect").click();
    cy.get("#entitySearchSelect").contains("button", "Test Entity").click();
    cy.get("#addEntityDoneButton").click();
    cy.contains("button", "Save").click();
    cy.contains("button", "Done").click();
    cy.reload();

    // Remove the Entity
    cy.get("#editProjectButton").click();
    cy.get(".data-table-scroll-container").within(() => {
      cy.contains("Test Entity")
        .parents()
        .filter((_, el) => {
          // Find the row element (id is just a number, not containing underscore)
          return !!(el.id && /^\d+$/.test(el.id));
        })
        .first()
        .find('button[aria-label="Remove Entity"]')
        .click();
    });
    cy.contains("button", "Save").click();
    cy.contains("button", "Done").click();

    // Validate the Entity was removed
    cy.get(".data-table-scroll-container").should("not.exist");
    cy.reload();
    cy.get(".data-table-scroll-container").should("not.exist");
  });

  it("should be updated after removing the Project via the Entity", () => {
    cy.contains("button", "Projects").click();
    cy.get(".data-table-scroll-container")
      .find('button[aria-label="View Project"]')
      .first()
      .click();
    cy.get("#editProjectButton").click();

    // Add an Entity
    cy.get("#addEntityButton").click();
    cy.get("#entitySearchSelect").click();
    cy.get("#entitySearchSelect").contains("button", "Test Entity").click();
    cy.get("#addEntityDoneButton").click();
    cy.contains("button", "Save").click();
    cy.contains("button", "Done").click();
    cy.reload();

    // Remove the Entity
    cy.get(".data-table-scroll-container")
      .first()
      .within(() => {
        cy.contains("Test Entity")
          .parents()
          .filter((_, el) => {
            // Find the row element (id is just a number, not containing underscore)
            return !!(el.id && /^\d+$/.test(el.id));
          })
          .first()
          .find('button[aria-label="View Entity"]')
          .last()
          .click();
      });
    cy.get("#editEntityButton").click();
    cy.get(".data-table-scroll-container")
      .first()
      .within(() => {
        cy.contains("My First Project")
          .parents()
          .filter((_, el) => {
            // Find the row element (id is just a number, not containing underscore)
            return !!(el.id && /^\d+$/.test(el.id));
          })
          .first()
          .find('button[aria-label="Remove Project"]')
          .click();
      });
    cy.contains("button", "Save").click();
    cy.contains("button", "Done").click();

    // Navigate to the Project
    cy.contains("button", "Projects").click();
    cy.get(".data-table-scroll-container")
      .find('button[aria-label="View Project"]')
      .first()
      .click();
    cy.get("#editProjectButton").click();

    // Validate the Entity was removed
    cy.get(".data-table-scroll-container").should("not.exist");
  });
});
