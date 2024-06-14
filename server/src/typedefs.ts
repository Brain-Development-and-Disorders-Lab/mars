/**
 * GraphQL type definitions
 */
export const typedefs = `#graphql
  scalar Date

  # "Item" type containing minimal data shared with many stored records
  type Item {
    _id: String!
    name: String
  }

  # "ItemInput" input
  input ItemInput {
    _id: String!
    name: String!
  }

  # "User" type
  type User {
    _id: String!
    name: String
    email: String
    id_token: String
  }

  # "Project" type
  type Project {
    _id: String!
    name: String
    description: String
    owner: String
    shared: [String]
    created: String
    entities: [String]
    # To-Do: History
  }

  # "ProjectCreateInput" type
  input ProjectCreateInput {
    name: String!
    description: String!
    owner: String!
    shared: [String]!
    created: String!
    entities: [String]!
    # To-Do: History
  }

  # "ProjectUpdateInput" type
  input ProjectUpdateInput {
    _id: String!
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
    _id: String!
    name: String
    type: String
    data: String
  }

  # "ValueInput" input
  input ValueInput {
    _id: String!
    name: String
    type: String
    data: String
  }

  # "Attribute" type
  type Attribute {
    _id: String!
    name: String
    description: String
    values: [Value]
  }

  # "AttributeCreateInput" input
  input AttributeCreateInput {
    name: String
    description: String
    values: [ValueInput]
  }

  # "AttributeInput" type
  input AttributeInput {
    _id: String!
    name: String
    description: String
    values: [ValueInput]
  }

  # Representation of Origins and Products
  type Associations {
    origins: [Item]
    products: [Item]
  }

  # Input representation of Origins and Products
  input AssociationsInput {
    origins: [ItemInput]
    products: [ItemInput]
  }

  # "Entity" type
  type Entity {
    _id: String!
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

  # "EntityCreateInput" input, includes -"Input" types
  input EntityCreateInput {
    name: String!
    created: String!
    timestamp: String!
    deleted: Boolean!
    locked: Boolean!
    owner: String!
    description: String!
    projects: [String]!
    associations: AssociationsInput!
    attachments: [ItemInput]!
    attributes: [AttributeInput]!
  }

  # "EntityUpdateInput"
  input EntityUpdateInput {
    _id: String!
    name: String
    created: String
    timestamp: String
    deleted: Boolean
    locked: Boolean
    owner: String
    description: String
    projects: [String]
    associations: AssociationsInput
    attachments: [ItemInput]
    attributes: [AttributeInput]
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
  type ActivityTarget {
    _id: String!
    name: String
    type: String
  }

  # "ActivityTargetInput" input
  input ActivityTargetInput {
    _id: String!
    name: String
    type: String
  }

  # "Activity" type
  type Activity {
    _id: String!
    timestamp: Date
    type: String
    target: ActivityTarget
  }

  # "ActivityCreateInput" input
  input ActivityCreateInput {
    timestamp: Date
    type: String
    target: ActivityTargetInput
  }

  # "Response" type
  type Response {
    success: Boolean
    message: String
  }

  # "Auth" type
  type Auth {
    orcid: String
    name: String
    token: String
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
    attributeExists(_id: String): Boolean

    # Activity queries
    activity(limit: Int): [Activity]

    # Export queries
    exportEntity(_id: String, format: String, fields: [String]): String

    # Authentication queries
    login(code: String): Auth
  }

  # Define mutation types
  type Mutation {
    # Entity mutations
    setEntityDescription(_id: String, description: String): Response
    createEntity(entity: EntityCreateInput): Response
    updateEntity(entity: EntityUpdateInput): Response
    addEntityProject(_id: String, project_id: String): Response
    removeEntityProject(_id: String, project_id: String): Response
    addEntityProduct(_id: String, product: ItemInput): Response
    addEntityProducts(_id: String, products: [ItemInput]): Response
    removeEntityProduct(_id: String, product: ItemInput): Response
    addEntityOrigin(_id: String, origin: ItemInput): Response
    addEntityOrigins(_id: String, origins: [ItemInput]): Response
    removeEntityOrigin(_id: String, origin: ItemInput): Response
    addEntityAttribute(_id: String, attribute: AttributeInput): Response
    removeEntityAttribute(_id: String, attribute: String): Response
    updateEntityAttribute(_id: String, attribute: AttributeInput): Response
    # Project mutations
    createProject(project: ProjectCreateInput): Response
    updateProject(project: ProjectUpdateInput): Response
    addProjectEntity(_id: String, entity: String): Response
    addProjectEntities(_id: String, entities: [String]): Response
    removeProjectEntity(_id: String, entity: String): Response
    # Activity mutations
    createActivity(activity: ActivityCreateInput): Response
    # Attribute mutations
    createAttribute(attribute: AttributeCreateInput): Response
    updateAttribute(attribute: AttributeInput): Response
  }
`;
