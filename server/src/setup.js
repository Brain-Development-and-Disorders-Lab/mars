// Script to setup "metadata" database
// Step 1: Create a user to create collections
db.createUser({
  user: "client",
  pwd: "metadataclient",
  roles: [
    {
      role: "readWrite",
      db: "metadata",
    },
  ],
});

// Step 2: Create collections to manage metadata within the overall "metadata" database
db.createCollection("entities");
db.createCollection("collections");
db.createCollection("attributes");

// Step 3: Add indexes to allow searching through all fields
db["entities"].createIndex({ "$**": "text" });
db["collections"].createIndex({ "$**": "text" });
db["attributes"].createIndex({ "$**": "text" });
