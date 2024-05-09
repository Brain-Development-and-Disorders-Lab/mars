/**
 * GraphQL type definitions
 */
export const typedefs = `#graphql
  # "Item" type containing minimal data shared with many stored records
  type Item {
    _id: String
    name: String
  }

  # "User" type
  type User {
    _id: String
    name: String
    email: String
    id_token: String
  }

  # "Project" type
  type Project {
    _id: String
    name: String
    description: String
    owner: String
    shared: [String]
    created: String
    entities: [String]
    # To-Do: History
  }

  # "Value" type
  type Value {
    _id: String
    name: String
    type: String
    data: String
  }

  # "Attribute" type
  type Attribute {
    _id: String
    name: String
    description: String
    values: [Value]
  }

  # "Entity" type
  type Entity {
    _id: String
    name: String
    created: String
    timestamp: String
    deleted: Boolean
    locked: Boolean
    owner: String
    description: String
    projects: [String]
    associations: Associations
    attachments: [Item]
    attributes: [Attribute]
    # To-Do: History, Attributes
  }

  # Representation of Origins and Products
  type Associations {
    origins: [Item]
    products: [Item]
  }

  # Define query types
  type Query {
    # User queries
    users: [User]
    user(_id: String): User
    # Project queries
    projects(limit: Int): [Project]
    project(_id: String): Project
    # Entity queries
    entities(limit: Int): [Entity]
    entity(_id: String): Entity
  }
`;
