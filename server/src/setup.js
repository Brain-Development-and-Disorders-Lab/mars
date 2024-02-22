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
db.createCollection("projects");
db.createCollection("attributes");
db.createCollection("updates");
db.createCollection("users");
