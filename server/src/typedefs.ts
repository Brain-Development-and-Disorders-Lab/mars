/**
 * GraphQL type definitions
 */
export const typedefs = `#graphql
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
    # To-Do: Entities
    # To-Do: History
  }

  # "Entity" type
  type Entity {
    _id: String
    name: String
    created: String
    deleted: Boolean
    locked: Boolean
    owner: String
    description: String
    associations: Associations
  }

  # Representation of Origins and Products
  type Associations {
    origins: [AssociationEntity]
    products: [AssociationEntity]
  }

  # Abridged type of minimal
  type AssociationEntity {
    id: String
    name: String
  }

  # Define query types
  type Query {
    # User queries
    users: [User]
    user(_id: String): User
    # Project queries
    projects: [Project]
    project(_id: String): Project
  }
`;
