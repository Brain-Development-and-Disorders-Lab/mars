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

  # "APIKey" type
  type APIKey {
    value: String
    expires: String
    scope: String
    workspaces: [String]
  }

  # "APIKeyInput" type
  input APIKeyInput {
    value: String
    expires: String
    scope: String
    workspaces: [String]
  }

  # "User" type
  type User {
    _id: String!
    token: String
    firstName: String
    lastName: String
    affiliation: String
    email: String
    workspaces: [String]
    api_keys: [APIKey]
  }

  # "UserInput" type
  input UserInput {
    _id: String!
    token: String
    firstName: String
    lastName: String
    affiliation: String
    email: String
    workspaces: [String]
    api_keys: [APIKeyInput]
  }

  # "Project" type
  type Project {
    _id: String!
    name: String
    archived: Boolean
    description: String
    timestamp: String
    owner: String
    collaborators: [String]
    created: String
    entities: [String]
    history: [ProjectHistory]
  }

  # "ProjectHistory" type storing iterations of an Entity
  type ProjectHistory {
    _id: String!
    name: String
    timestamp: String
    version: String!
    owner: String
    collaborators: [String]
    archived: Boolean
    created: String
    description: String
    entities: [String]
  }

  # "ProjectCreateInput" type
  input ProjectCreateInput {
    name: String!
    archived: Boolean!
    description: String!
    owner: String!
    created: String!
    entities: [String]!
    collaborators: [String]!
  }

  # "ProjectUpdateInput" type
  input ProjectUpdateInput {
    _id: String!
    name: String
    archived: Boolean
    description: String
    owner: String
    collaborators: [String]
    created: String
    entities: [String]
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
    owner: String
    timestamp: String
    archived: Boolean
    description: String
    values: [Value]
  }

  # "AttributeCreateInput" input
  input AttributeCreateInput {
    name: String
    owner: String
    archived: Boolean
    description: String
    values: [ValueInput]
  }

  # "AttributeInput" type
  input AttributeInput {
    _id: String!
    name: String
    owner: String
    timestamp: String
    archived: Boolean
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
    archived: Boolean
    timestamp: String
    created: String
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
    archived: Boolean!
    created: String!
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
    archived: Boolean
    created: String
    timestamp: String
    owner: String
    description: String
    projects: [String]
    associations: AssociationsInput
    attachments: [ItemInput]
    attributes: [AttributeInput]
  }

  # "EntityHistory" type storing iterations of an Entity
  type EntityHistory {
    _id: String!
    timestamp: String
    version: String!
    name: String
    owner: String
    archived: Boolean
    created: String
    description: String
    projects: [String]
    associations: Associations
    attachments: [Item]
    attributes: [Attribute]
  }

  # "EntityReview" type storing the review state of an Entity to be imported
  type EntityReview {
    name: String
    state: String
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
    timestamp: String
    actor: String
    type: String
    details: String
    target: ActivityTarget
  }

  # "ActivityCreateInput" input
  input ActivityCreateInput {
    timestamp: String
    actor: String
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

  # "Workspace" type
  type Workspace {
    _id: String!
    name: String
    timestamp: String
    description: String
    owner: String
    collaborators: [String]
    entities: [String]
    projects: [String]
    attributes: [String]
    activity: [String]
  }

  # "WorkspaceCreateInput" input
  input WorkspaceCreateInput {
    name: String
    description: String
    owner: String
    collaborators: [String]
    entities: [String]
    projects: [String]
    attributes: [String]
    activity: [String]
  }

  # "WorkspaceUpdateInput" input
  input WorkspaceUpdateInput {
    _id: String!
    name: String
    description: String
    owner: String
    collaborators: [String]
    entities: [String]
    projects: [String]
    attributes: [String]
    activity: [String]
  }

  # "ResponseMessage" type
  type ResponseMessage {
    success: Boolean
    message: String
  }

  # "ResponseData"-type containing data with type "String"
  type ResponseDataString {
    success: Boolean
    message: String
    data: String
  }

  # "ResponseData"-type containing data with type "Auth"
  type ResponseDataAuth {
    success: Boolean
    message: String
    data: Auth
  }

  # "ResponseData"-type containing data with type "Review"
  type ResponseDataEntityReview {
    success: Boolean
    message: String
    data: [EntityReview]
  }

  # "ResponseData"-type containing data with type "APIKey"
  type ResponseDataAPIKey {
    success: Boolean
    message: String
    data: APIKey
  }

  # "Auth" type
  type Auth {
    orcid: String
    name: String
    token: String
    workspace: String
  }

  # "File" type
  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }

  # "EntityMetrics" type
  type EntityMetrics {
    all: Int
    addedDay: Int
  }

  # "ProjectMetrics" type
  type ProjectMetrics {
    all: Int
    addedDay: Int
  }

  # "AttributeMetrics" type
  type AttributeMetrics {
    all: Int
    addedDay: Int
  }

  # "WorkspaceMetrics" type
  type WorkspaceMetrics {
    collaborators: Int
  }

  # "SearchResult" union type
  union SearchResult = Entity | Project

  # Define query types
  type Query {
    # User queries
    users: [User]
    user(_id: String): User

    # Project queries
    projects(limit: Int): [Project]
    project(_id: String): Project
    projectMetrics: ProjectMetrics

    # Entity queries
    entities(limit: Int, archived: Boolean): [Entity]
    entity(_id: String): Entity
    entityNameExists(name: String): Boolean
    entityMetrics: EntityMetrics

    # Attribute queries
    attributes(limit: Int): [Attribute]
    attribute(_id: String): Attribute
    attributeMetrics: AttributeMetrics

    # Activity queries
    activity(limit: Int): [Activity]

    # Workspace queries
    workspace(_id: String): Workspace
    workspaces: [Workspace]
    workspaceEntities(_id: String, limit: Int): [Entity]
    workspaceProjects(_id: String, limit: Int): [Project]
    workspaceActivity(_id: String, limit: Int): [Activity]
    workspaceMetrics: WorkspaceMetrics

    # Export queries
    exportEntity(_id: String, format: String, fields: [String]): String
    exportEntities(entities: [String]): String
    exportProject(_id: String, format: String, fields: [String]): String
    exportProjectEntities(_id: String, format: String): String

    # Authentication queries
    login(code: String): ResponseDataAuth
    generateKey(scope: String, workspaces: [String]): ResponseDataAPIKey

    # Data queries
    downloadFile(_id: String): String

    # Search queries
    search(query: String, resultType: String, isBuilder: Boolean, showArchived: Boolean): [SearchResult]
  }

  # Define mutation types
  type Mutation {
    # Entity mutations
    setEntityDescription(_id: String, description: String): ResponseMessage
    createEntity(entity: EntityCreateInput): ResponseDataString
    updateEntity(entity: EntityUpdateInput): ResponseMessage
    archiveEntity(_id: String, state: Boolean): ResponseMessage
    archiveEntities(toArchive: [String], state: Boolean): ResponseMessage
    deleteEntity(_id: String): ResponseMessage

    # Project mutations
    createProject(project: ProjectCreateInput): ResponseMessage
    updateProject(project: ProjectUpdateInput): ResponseMessage
    archiveProject(_id: String, state: Boolean): ResponseMessage
    archiveProjects(toArchive: [String], state: Boolean): ResponseMessage
    deleteProject(_id: String): ResponseMessage

    # Activity mutations
    createActivity(activity: ActivityCreateInput): ResponseMessage

    # Workspace mutations
    createWorkspace(workspace: WorkspaceCreateInput): ResponseMessage
    updateWorkspace(workspace: WorkspaceUpdateInput): ResponseMessage

    # User mutations
    createUser(user: UserInput): ResponseMessage
    updateUser(user: UserInput): ResponseMessage

    # Attribute mutations
    createAttribute(attribute: AttributeCreateInput): ResponseMessage
    updateAttribute(attribute: AttributeInput): ResponseMessage
    archiveAttribute(_id: String, state: Boolean): ResponseMessage
    archiveAttributes(toArchive: [String], state: Boolean): ResponseMessage
    deleteAttribute(_id: String): ResponseMessage

    # Data mutations
    uploadAttachment(target: String, file: Upload!): ResponseMessage

    # Data import CSV mutations
    prepareCSV(file: [Upload]!): [String]
    reviewCSV(columnMapping: ColumnMappingInput, file: [Upload]!): ResponseDataEntityReview
    importCSV(columnMapping: ColumnMappingInput, file: [Upload]!): ResponseMessage

    # Data import JSON mutations
    reviewJSON(file: [Upload]!): ResponseDataEntityReview
    importJSON(file: [Upload]!, project: String): ResponseMessage

    # API mutations
    revokeKey(key: String): ResponseMessage
  }
`;
