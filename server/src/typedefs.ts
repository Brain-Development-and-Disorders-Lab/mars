/**
 * GraphQL type definitions
 */
export const typedefs = `#graphql
  scalar Date
  scalar Object
  scalar Upload

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
    collaborators: [String]
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
    collaborators: [String]
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
    data: Object
  }

  # "ValueInput" input
  input ValueInput {
    _id: String!
    name: String
    type: String
    data: Object
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

  type ActivityActor {
    _id: String!
    name: String
  }

  input ActivityActorInput {
    _id: String!
    name: String
  }

  # "Activity" type
  type Activity {
    _id: String!
    timestamp: Date
    actor: ActivityActor
    type: String
    details: String
    target: ActivityTarget
  }

  # "ActivityCreateInput" input
  input ActivityCreateInput {
    timestamp: Date
    actor: ActivityActorInput
    type: String
    details: String
    target: ActivityTargetInput
  }

  # "ColumnMappingInput" input
  input ColumnMappingInput {
    name: String
    description: String
    created: String
    owner: String
    project: String
    attributes: [AttributeInput]
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

  # "File" type
  type File {
    filename: String!
    mimetype: String!
    encoding: String!
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
    entityExists(_id: String): Boolean
    entityNameExists(name: String): Boolean
    searchEntities(search: String, limit: Int): [Entity]

    # Attribute queries
    attributes(limit: Int): [Attribute]
    attribute(_id: String): Attribute
    attributeExists(_id: String): Boolean

    # Activity queries
    activity(limit: Int): [Activity]

    # Export queries
    exportEntity(_id: String, format: String, fields: [String]): String
    exportEntities(entities: [String]): String
    exportProject(_id: String, format: String, fields: [String]): String
    exportProjectEntities(_id: String, format: String): String

    # Authentication queries
    login(code: String): Auth

    # Data queries
    downloadFile(_id: String): String
  }

  # Define mutation types
  type Mutation {
    # Entity mutations
    setEntityDescription(_id: String, description: String): Response
    createEntity(entity: EntityCreateInput): Response
    updateEntity(entity: EntityUpdateInput): Response
    deleteEntity(_id: String): Response
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
    setEntityLock(_id: String, lock: Boolean): Response

    # Project mutations
    createProject(project: ProjectCreateInput): Response
    updateProject(project: ProjectUpdateInput): Response
    deleteProject(_id: String): Response
    addProjectEntity(_id: String, entity: String): Response
    addProjectEntities(_id: String, entities: [String]): Response
    removeProjectEntity(_id: String, entity: String): Response

    # Activity mutations
    createActivity(activity: ActivityCreateInput): Response

    # Attribute mutations
    createAttribute(attribute: AttributeCreateInput): Response
    updateAttribute(attribute: AttributeInput): Response
    deleteAttribute(_id: String): Response

    # Data mutations
    uploadAttachment(target: String, file: Upload!): Response
    prepareColumns(file: [Upload]!): [String]
    mapColumns(columnMapping: ColumnMappingInput, file: [Upload]!): Response
    importObjects(file: [Upload]!, owner: String, project: String): Response
  }
`;
