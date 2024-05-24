/**
 * GraphQL type definitions
 */
export const typedefs = `#graphql
  scalar Date

  # "Item" interface containing minimal data shared with many stored records
  interface Item {
    _id: String
    name: String
  }

  # "User" type
  type User implements Item {
    _id: String
    name: String
    email: String
    id_token: String
  }

  # "Project" type
  type Project implements Item {
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
  type Value implements Item {
    _id: String
    name: String
    type: String
    data: String
  }

  # "Attribute" type
  type Attribute implements Item {
    _id: String
    name: String
    description: String
    values: [Value]
  }

  # Representation of Origins and Products
  type Associations {
    origins: [Item]
    products: [Item]
  }

  # "Entity" type
  type Entity implements Item {
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
    history: [EntityHistory]
  }

  # "EntityHistory" type storing iterations of an Entity
  type EntityHistory {
    timestamp: String
    deleted: Boolean
    owner: String
    description: String
    projects: [String]
    associations: Associations
    attributes: [Attribute]
  }

  # "ActivityTarget" type
  type ActivityTarget implements Item {
    _id: String
    name: String
    type: String
  }

  # "Activity" type
  type Activity {
    _id: String
    timestamp: Date
    type: String
    target: ActivityTarget
  }

  # "Response" type
  type Response {
    success: Boolean
    message: String
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

    # Attribute queries
    attributes(limit: Int): [Attribute]
    attribute(_id: String): Attribute

    # Activity queries
    activity(limit: Int): [Activity]
  }

  # Define mutation types
  type Mutation {
    # Entity mutations
    setEntityDescription(_id: String, description: String): Response
  }
`;
