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
    // Reload to verify persistence
    cy.reload();
    cy.get(".data-table-scroll-container", { timeout: 10000 }).should(
      "be.visible",
    );
    cy.get(".data-table-scroll-container").contains("Test Entity");
  });

  it("should be able to remove an Entity", () => {
    const entityName = "Test Entity";

    // Navigate to Projects
    cy.contains("button", "Projects").click();
    cy.get(".data-table-scroll-container").should("be.visible");

    // Find and click any View Project button (order-independent)
    cy.get(".data-table-scroll-container")
      .find('button[aria-label="View Project"]')
      .should("exist")
      .first()
      .click();

    cy.get("#editProjectButton").should("be.visible").click();

    // Add an Entity
    cy.get("#addEntityButton").should("be.visible").click();
    cy.get("#entitySearchSelect").should("be.visible").click();
    cy.get("#entitySearchSelect")
      .contains("button", entityName)
      .should("be.visible")
      .click();
    cy.get("#addEntityDoneButton").should("be.visible").click();
    cy.contains("button", "Save").should("be.visible").click();
    cy.contains("button", "Done").should("be.visible").click();

    // Wait for the page to update
    cy.url().should("not.include", "/edit");
    cy.reload();

    // Wait for page to load after reload
    cy.get("#editProjectButton").should("be.visible");

    // Remove the Entity - find by entity name, not by position
    cy.get("#editProjectButton").click();

    // Wait for the data table to be visible
    cy.get(".data-table-scroll-container").should("be.visible");

    cy.get(".data-table-scroll-container").within(() => {
      // Find the row containing the entity name
      cy.contains(entityName)
        .should("be.visible")
        .parents()
        .filter((_, el) => {
          // Find the row element (id is just a number, not containing underscore)
          return !!(el.id && /^\d+$/.test(el.id));
        })
        .should("have.length.at.least", 1)
        .first()
        .within(() => {
          cy.get('button[aria-label="Remove Entity"]')
            .should("be.visible")
            .click();
        });
    });

    cy.contains("button", "Save").should("be.visible").click();
    cy.contains("button", "Done").should("be.visible").click();

    // Wait for navigation away from edit mode
    cy.url().should("not.include", "/edit");

    cy.reload();

    // Wait for page to load and verify entity is still removed
    cy.get("#editProjectButton").should("be.visible").click();

    // Verify entity is not in the table
    cy.get("body").then(($body) => {
      if ($body.find(".data-table-scroll-container").length > 0) {
        cy.get(".data-table-scroll-container").within(() => {
          cy.contains(entityName).should("not.exist");
        });
      }
    });
  });

  it("should be updated after removing the Project via the Entity", () => {
    const entityName = "Test Entity";
    const projectName = "My First Project";

    // Navigate to Projects
    cy.contains("button", "Projects")
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    // Wait for navigation to Projects page
    cy.url().should("include", "/projects");
    cy.get(".data-table-scroll-container", { timeout: 10000 }).should(
      "be.visible",
    );

    // Find the project by name, not by position
    cy.get(".data-table-scroll-container").within(() => {
      cy.contains(projectName)
        .should("be.visible")
        .parents()
        .filter((_, el) => {
          return !!(el.id && /^\d+$/.test(el.id));
        })
        .first()
        .within(() => {
          cy.get('button[aria-label="View Project"]')
            .should("be.visible")
            .should("not.be.disabled")
            .click();
        });
    });

    // Wait for project page to load
    cy.url().should("include", "/projects/");
    cy.get("#editProjectButton", { timeout: 10000 })
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    // Add an Entity
    cy.get("#addEntityButton").should("be.visible").click();
    cy.get("#entitySearchSelect").should("be.visible").click();
    cy.get("#entitySearchSelect")
      .contains("button", entityName)
      .should("be.visible")
      .click();
    cy.get("#addEntityDoneButton").should("be.visible").click();

    // Wait for modal to close (use assertion instead of arbitrary wait)
    cy.get("#addEntityDoneButton").should("not.exist");

    cy.contains("button", "Save")
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    // Save button opens a save modal - click Done in the modal
    cy.contains("button", "Done")
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    // After save, exit edit mode, button should show "Edit"
    cy.get("#editProjectButton", { timeout: 10000 })
      .should("be.visible")
      .should("contain", "Edit");

    // Verify still on the project page (URL doesn't change)
    cy.url().should("include", "/projects/");
    cy.url().should("not.include", "/edit");
    cy.reload();

    // Wait for page to load after reload
    cy.get("#editProjectButton").should("be.visible");

    // Navigate to the Entity from the Project page
    cy.get(".data-table-scroll-container")
      .should("be.visible")
      .within(() => {
        // Find the entity row by name, not by position
        cy.contains(entityName)
          .should("be.visible")
          .parents()
          .filter((_, el) => {
            return !!(el.id && /^\d+$/.test(el.id));
          })
          .should("have.length.at.least", 1)
          .first()
          .within(() => {
            // Find any View Entity button in this row (order-independent)
            cy.get('button[aria-label="View Entity"]')
              .should("be.visible")
              .first()
              .click();
          });
      });

    // Wait for Entity page to load
    cy.url().should("include", "/entities/");
    cy.get("#editEntityButton", { timeout: 10000 })
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    // Find the Linked Projects DataTable
    cy.contains(".data-table-scroll-container", projectName)
      .should("be.visible")
      .within(() => {
        cy.contains(projectName)
          .should("be.visible")
          .parents()
          .filter((_, el) => {
            return !!(el.id && /^\d+$/.test(el.id));
          })
          .should("have.length.at.least", 1)
          .first()
          .within(() => {
            cy.get('button[aria-label="Remove Project"]')
              .should("be.visible")
              .should("not.be.disabled")
              .as("removeProjectButton");
          });
      });

    cy.get("@removeProjectButton").click();

    // Wait for the remove action to complete
    cy.get("@removeProjectButton").should("not.exist");

    cy.contains("button", "Save")
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    // Save button opens a save modal - click Done in the modal
    cy.contains("button", "Done")
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    // After save, exit edit mode, button should show "Edit"
    // We're still on the Entity page, so check for editEntityButton
    cy.get("#editEntityButton", { timeout: 10000 })
      .should("be.visible")
      .should("contain", "Edit");

    // Verify still on the entity page (URL doesn't change)
    cy.url().should("include", "/entities/");
    cy.url().should("not.include", "/edit");

    // Navigate to the Projects page
    cy.contains("button", "Projects")
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    // Wait for navigation to Projects page
    cy.url().should("include", "/projects");
    cy.get(".data-table-scroll-container", { timeout: 10000 }).should(
      "be.visible",
    );

    // Find the project by name again
    cy.get(".data-table-scroll-container").within(() => {
      cy.contains(projectName)
        .should("be.visible")
        .parents()
        .filter((_, el) => {
          return !!(el.id && /^\d+$/.test(el.id));
        })
        .first()
        .within(() => {
          cy.get('button[aria-label="View Project"]')
            .should("be.visible")
            .should("not.be.disabled")
            .click();
        });
    });

    // Wait for project page to load
    cy.url().should("include", "/projects/");
    cy.get("#editProjectButton", { timeout: 10000 })
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    // Validate the Entity was removed from the project
    cy.get("body").then(($body) => {
      if ($body.find(".data-table-scroll-container").length > 0) {
        cy.get(".data-table-scroll-container").within(() => {
          cy.contains(entityName).should("not.exist");
        });
      }
    });
  });
});
