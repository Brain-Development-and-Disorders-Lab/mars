/**
 * GraphQL type definitions
 */
export const typedefs = `#graphql
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

  # "User" type
  type User {
    _id: String!
    firstName: String
    lastName: String
    name: String
    affiliation: String
    email: String
    emailVerified: Boolean
    image: String
    createdAt: String
    updatedAt: String
    api_keys: String
    account_orcid: String
    role: String
  }

  # "AdminMetrics" type
  type AdminMetrics {
    users: Int
    workspaces: Int
    entities: Int
    projects: Int
    attributes: Int
  }

  # All "Global" permissions ("features" and "workspaces")
  # "UserGlobalFeaturesPermissions" type
  type UserGlobalFeaturesPermissions {
    import: Boolean
    scan: Boolean
    ai: Boolean
    api: Boolean
  }

  # "UserGlobalFeaturesPermissionsInput" input
  input UserGlobalFeaturesPermissionsInput {
    import: Boolean
    scan: Boolean
    ai: Boolean
    api: Boolean
  }

  # "UserGlobalWorkspacesPermissions" type
  type UserGlobalWorkspacesPermissions {
    create: Boolean
  }

  # "UserGlobalWorkspacesPermissionsInput" input
  input UserGlobalWorkspacesPermissionsInput {
    create: Boolean
  }

  # "UserGlobalPermissions" type
  type UserGlobalPermissions {
    features: UserGlobalFeaturesPermissions
    workspaces: UserGlobalWorkspacesPermissions
  }

  # "UserGlobalPermissionsInput" input
  input UserGlobalPermissionsInput {
    features: UserGlobalFeaturesPermissionsInput
    workspaces: UserGlobalWorkspacesPermissionsInput
  }

  # All "Workspace" permissions ("administration", "entities", "projects", "attributes")
  # "UserWorkspaceAdministrationPermissions" type
  type UserWorkspaceAdministrationPermissions {
    edit: Boolean
    invite: Boolean
  }

  # "UserWorkspaceAdministrationPermissionsInput" input
  input UserWorkspaceAdministrationPermissionsInput {
    edit: Boolean
    invite: Boolean
  }

  # "UserWorkspaceEntitiesPermissions" type
  type UserWorkspaceEntitiesPermissions {
    create: Boolean
    edit: Boolean
    archive: Boolean
  }

  # "UserWorkspaceEntitiesPermissionsInput" input
  input UserWorkspaceEntitiesPermissionsInput {
    create: Boolean
    edit: Boolean
    archive: Boolean
  }

  # "UserWorkspaceProjectsPermissions" type
  type UserWorkspaceProjectsPermissions {
    create: Boolean
    edit: Boolean
    archive: Boolean
  }

  # "UserWorkspaceProjectsPermissionsInput" input
  input UserWorkspaceProjectsPermissionsInput {
    create: Boolean
    edit: Boolean
    archive: Boolean
  }

  # "UserWorkspaceAttributesPermissions" type
  type UserWorkspaceAttributesPermissions {
    create: Boolean
    edit: Boolean
    archive: Boolean
  }

  # "UserWorkspaceAttributesPermissionsInput" input
  input UserWorkspaceAttributesPermissionsInput {
    create: Boolean
    edit: Boolean
    archive: Boolean
  }

  # "UserWorkspacePermissions" type
  type UserWorkspacePermissions {
    administration: UserWorkspaceAdministrationPermissions
    entities: UserWorkspaceEntitiesPermissions
    projects: UserWorkspaceProjectsPermissions
    attributes: UserWorkspaceAttributesPermissions
  }

  # "UserWorkspacePermissionsInput" input
  input UserWorkspacePermissionsInput {
    administration: UserWorkspaceAdministrationPermissionsInput
    entities: UserWorkspaceEntitiesPermissionsInput
    projects: UserWorkspaceProjectsPermissionsInput
    attributes: UserWorkspaceAttributesPermissionsInput
  }

  # Collated permissions
  # "UserCollatedPermissions" type
  type UserCollatedPermissions {
    workspace: UserWorkspacePermissions
    global: UserGlobalPermissions
  }

  # "AdminWorkspace" type
  type AdminWorkspace {
    _id: String!
    name: String
    description: String
    owner: String
    entities: Int
    projects: Int
    attributes: Int
  }

  # "AdminUser" type
  type AdminUser {
    _id: String!
    name: String
    email: String
    role: String
    workspaces: Int
    permissions: UserGlobalPermissions
    banned: Boolean
    lastLogin: String
  }

  # "UserUpdateInput" input
  input UserUpdateInput {
    _id: String!
    firstName: String
    lastName: String
    name: String
    affiliation: String
    email: String
    emailVerified: Boolean
    image: String
    createdAt: String
    updatedAt: String
    hasSeenWalkthrough: Boolean
    completedProfile: Boolean
  }

  # "Project" type
  type Project {
    _id: String!
    name: String
    archived: Boolean
    description: String
    timestamp: String
    owner: String
    created: String
    entities: [String]
    history: [ProjectHistory]
  }

  # "ProjectHistory" type storing iterations of a Project
  type ProjectHistory {
    author: String
    message: String
    timestamp: String
    version: String!

    _id: String!
    name: String
    owner: String
    archived: Boolean
    created: String
    description: String
    entities: [String]
  }

  # "ProjectCreateInput" input
  input ProjectCreateInput {
    name: String!
    archived: Boolean!
    description: String!
    owner: String!
    created: String!
    entities: [String]!
  }

  # "ProjectUpdateInput" input
  input ProjectUpdateInput {
    _id: String!
    name: String
    archived: Boolean
    description: String
    owner: String
    created: String
    entities: [String]
  }

  # "Value" type
  type Value {
    _id: String!
    name: String
    type: String
    data: String
    source: String
  }

  # "ValueInput" input
  input ValueInput {
    _id: String!
    name: String
    type: String
    data: String
    source: String
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
    usageCount: Int
    history: [AttributeHistory]
  }

  # "AttributeHistory" type storing iterations of an Attribute
  type AttributeHistory {
    author: String
    message: String
    timestamp: String
    version: String!

    _id: String!
    name: String
    owner: String
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

  # "AttributeInput" input
  input AttributeInput {
    _id: String!
    name: String
    owner: String
    timestamp: String
    archived: Boolean
    description: String
    values: [ValueInput]
  }

  # "Link" type between two Entities
  type Link {
    source: Item
    target: Item
    type: String
  }

  # "LinkInput" input
  input LinkInput {
    source: ItemInput
    target: ItemInput
    type: String
  }

  # "SecondaryIdentifier" type storing a secondary identifier value and its format
  type SecondaryIdentifier {
    value: String
    format: String
  }

  # "SecondaryIdentifierInput" input
  input SecondaryIdentifierInput {
    value: String
    format: String
  }

  # "Entity" type
  type Entity {
    _id: String!
    name: String
    secondaryIdentifier: SecondaryIdentifier
    archived: Boolean
    timestamp: String
    created: String
    owner: String
    description: String
    projects: [String]
    links: [Link]
    attachments: [Item]
    attributes: [Attribute]
    history: [EntityHistory]
  }

  # "EntityCreateInput" input
  input EntityCreateInput {
    name: String!
    secondaryIdentifier: SecondaryIdentifierInput
    archived: Boolean!
    created: String!
    owner: String!
    description: String!
    projects: [String]!
    links: [LinkInput]!
    attachments: [ItemInput]!
    attributes: [AttributeInput]!
  }

  # "EntityUpdateInput" input
  input EntityUpdateInput {
    _id: String!
    name: String
    secondaryIdentifier: SecondaryIdentifierInput
    archived: Boolean
    created: String
    timestamp: String
    owner: String
    description: String
    projects: [String]
    links: [LinkInput]!
    attachments: [ItemInput]
    attributes: [AttributeInput]
  }

  # "EntityHistory" type storing iterations of an Entity
  type EntityHistory {
    author: String
    message: String
    timestamp: String
    version: String!

    _id: String!
    name: String
    secondaryIdentifier: SecondaryIdentifier
    owner: String
    archived: Boolean
    created: String
    description: String
    projects: [String]
    links: [Link]
    attachments: [Item]
    attributes: [Attribute]
  }

  # "ColumnInfo" type describing a spreadsheet column and its inferred data type
  type ColumnInfo {
    name: String
    inferredType: String
  }

  # "ImportReview" type storing the review state of an Entity or Attribute to be imported
  type ImportReview {
    name: String
    state: String
    warnings: [String]
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
    medium: String
  }

  # "ActivityCreateInput" input
  input ActivityCreateInput {
    timestamp: String
    actor: String
    type: String
    details: String
    target: ActivityTargetInput
    medium: String
  }

  # "ColumnMappingInput" input
  input ColumnMappingInput {
    namePrefix: String
    name: String
    secondaryIdentifier: SecondaryIdentifierInput
    description: String
    created: String
    owner: String
    project: String
    attributes: [AttributeInput]
  }

  # "SpreadsheetImportCounterInput" input assigning a Counter to an imported field
  input SpreadsheetImportCounterInput {
    field: String
    _id: String
  }

  # "SpreadsheetImportOptionsInput" input
  input SpreadsheetImportOptionsInput {
    counters: [SpreadsheetImportCounterInput]
  }

  # "Collaborator" type
  type Collaborator {
    _id: String
    permissions: UserWorkspacePermissions
  }

  # "CollaboratorInput" input
  input CollaboratorInput {
    _id: String
    permissions: UserWorkspacePermissionsInput
  }

  # "Workspace" type
  type Workspace {
    _id: String!
    name: String
    timestamp: String
    isPublic: Boolean
    description: String
    owner: String
    collaborators: [Collaborator]
    entities: [String]
    projects: [String]
    attributes: [String]
    activity: [String]
  }

  # "WorkspaceCreateInput" input
  input WorkspaceCreateInput {
    name: String
    description: String
    isPublic: Boolean
    collaborators: [CollaboratorInput]
  }

  # "WorkspaceUpdateInput" input
  input WorkspaceUpdateInput {
    _id: String!
    name: String
    isPublic: Boolean
    description: String
    owner: String
    collaborators: [CollaboratorInput]
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

  # "ResponseData"-type containing data with type "String[]"
  type ResponseDataStringArray {
    success: Boolean
    message: String
    data: [String]
  }

  # "ResponseData"-type containing data with type "[ImportReview]"
  type ResponseDataImportReview {
    success: Boolean
    message: String
    data: [ImportReview]
  }

  # "ResponseData"-type containing data with type "APIKey"
  type ResponseDataAPIKey {
    success: Boolean
    message: String
    data: APIKey
  }

  # "ContentMetrics" type, total count of Workspace contents and how many were added in the last day
  type ContentMetrics {
    all: Int
    addedDay: Int
  }

  # "EntitiesResponse" type for paginated results
  type EntitiesResponse {
    entities: [Entity]
    total: Int
  }

  # "CountRangeInput" input for an inclusive numeric range
  input CountRangeInput {
    min: Int
    max: Int
  }

  # "EntityFilterInput" input for filtering entities
  input EntityFilterInput {
    startDate: String
    endDate: String
    owners: [String]
    hasAttachments: Boolean
    hasAttributes: Boolean
    hasLinks: Boolean
    attributeCount: CountRangeInput
    projectCount: CountRangeInput
  }

  # "EntitySortInput" input for sorting entities
  input EntitySortInput {
    field: String!
    direction: String!
  }

  # "AttributeUsage" type
  type AttributeUsage {
    entity: String!
    modifications: [String]
  }

  # "ColumnMappingSuggestion" type for AI-suggested column mappings
  type ColumnMappingSuggestion {
    name: String
    description: String
  }

  # "AttributeSuggestionInput" input for Attribute suggestion queries
  input AttributeSuggestionInput {
    _id: String!
    name: String!
    description: String!
  }

  # "SearchResult" union type
  union SearchResult = Entity | Project

  # "Counter" type
  type Counter {
    _id: String!
    workspace: String
    name: String
    format: String
    current: Int
    increment: Int
    created: String
  }

  # "CounterCreateInput" input
  input CounterCreateInput {
    workspace: String
    name: String
    format: String
    current: Int
    increment: Int
    created: String
  }

  # "IdentifierFormat" type
  type IdentifierFormat {
    _id: String!
    workspace: String
    name: String
    created: String
    fixedLength: Int
    alphanumericOnly: Boolean
    lettersOnly: Boolean
    numbersOnly: Boolean
    allowSpecialCharacters: Boolean
    uppercaseRequired: Boolean
  }

  # "IdentifierFormatCreateInput" input
  input IdentifierFormatCreateInput {
    workspace: String
    name: String
    created: String
    fixedLength: Int
    alphanumericOnly: Boolean
    lettersOnly: Boolean
    numbersOnly: Boolean
    allowSpecialCharacters: Boolean
    uppercaseRequired: Boolean
  }

  # Define query types
  type Query {
    # Admin queries
    adminMetrics: AdminMetrics
    adminUsers: [AdminUser]
    adminWorkspaces: [AdminWorkspace]

    # User queries
    user(_id: String): User
    userByEmail(email: String): ResponseDataString
    userGlobalPermissions(_id: String): UserGlobalPermissions
    userWorkspacePermissions(_id: String, workspace: String): UserWorkspacePermissions
    userCollatedPermissions: UserCollatedPermissions

    # Project queries
    projects(limit: Int, archived: Boolean): [Project]
    project(_id: String): Project
    projectEntities(_id: String): [Entity]
    projectMetrics: ContentMetrics

    # Entity queries
    entities(limit: Int, archived: Boolean, reverse: Boolean, page: Int, pageSize: Int, filter: EntityFilterInput, sort: EntitySortInput): EntitiesResponse
    entity(_id: String): Entity
    entityNameExists(name: String): Boolean
    entityMetrics: ContentMetrics

    # Attribute queries
    attributes(limit: Int): [Attribute]
    attribute(_id: String): Attribute
    attributeUsage(_id: String): [AttributeUsage]
    attributeMetrics: ContentMetrics

    # Activity queries
    activity(limit: Int): [Activity]

    # Workspace queries
    workspace(_id: String): Workspace
    workspaces: [Workspace]
    workspaceEntities(_id: String, limit: Int): [Entity]
    workspaceProjects(_id: String, limit: Int): [Project]
    workspaceActivity(_id: String, limit: Int): [Activity]
    collaboratorMetrics(_id: String): ContentMetrics

    # Export queries
    exportEntity(_id: String, format: String, fields: [String], includeHistory: Boolean): String
    exportEntities(entities: [String], format: String, includeAttributes: Boolean, includeHistory: Boolean): String
    exportEntitiesAll(format: String, includeAttributes: Boolean, includeHistory: Boolean): String
    exportProject(_id: String, format: String, fields: [String], includeHistory: Boolean): String
    exportProjectEntities(_id: String, format: String): String
    exportAttribute(_id: String, fields: [String], includeHistory: Boolean): String

    # API key queries
    generateKey(scope: String, workspaces: [String]): ResponseDataAPIKey

    # Data queries
    downloadFile(_id: String): String

    # Search queries
    search(query: String, resultType: String, isBuilder: Boolean, showArchived: Boolean, filters: EntityFilterInput): [SearchResult]
    translateSearch(query: String!): String
    suggestColumnMapping(columns: [String]!): ColumnMappingSuggestion
    suggestAttribute(name: String!, description: String, attributes: [AttributeSuggestionInput!]!): String

    # Counters queries
    counter(_id: String): Counter
    counters: [Counter]
    currentCounterValue(_id: String): ResponseDataString
    nextCounterValue(_id: String): ResponseDataString
    nextCounterValues(_id: String, count: Int): ResponseDataStringArray

    # Identifier Format queries
    identifierFormat(_id: String): IdentifierFormat
    identifierFormats: [IdentifierFormat]
  }

  # Define mutation types
  type Mutation {
    # Entity mutations
    setEntityDescription(_id: String, description: String): ResponseMessage
    createEntity(entity: EntityCreateInput): ResponseDataString
    updateEntity(entity: EntityUpdateInput, message: String): ResponseMessage
    archiveEntity(_id: String, state: Boolean): ResponseMessage
    archiveEntities(toArchive: [String], state: Boolean): ResponseMessage

    # Project mutations
    createProject(project: ProjectCreateInput): ResponseMessage
    updateProject(project: ProjectUpdateInput, message: String): ResponseMessage
    archiveProject(_id: String, state: Boolean): ResponseMessage
    archiveProjects(toArchive: [String], state: Boolean): ResponseMessage
    deleteProject(_id: String): ResponseMessage

    # Activity mutations
    createActivity(activity: ActivityCreateInput): ResponseMessage

    # Workspace mutations
    createWorkspace(workspace: WorkspaceCreateInput): ResponseDataString
    updateWorkspace(workspace: WorkspaceUpdateInput): ResponseMessage

    # Admin mutations
    setUserGlobalPermissions(_id: String, permissions: UserGlobalPermissionsInput): ResponseMessage
    setUserWorkspacePermissions(_id: String, workspace: String, permissions: UserWorkspacePermissionsInput): ResponseMessage
    setBanStatus(_id: String, banned: Boolean): ResponseMessage

    # User mutations
    updateUser(user: UserUpdateInput): ResponseMessage
    reportIssue(description: String, path: String, userName: String, userId: String, userEmail: String, consoleErrors: [String]): ResponseMessage

    # Attribute mutations
    createAttribute(attribute: AttributeCreateInput): ResponseMessage
    updateAttribute(attribute: AttributeInput, message: String): ResponseMessage
    archiveAttribute(_id: String, state: Boolean): ResponseMessage
    archiveAttributes(toArchive: [String], state: Boolean): ResponseMessage

    # Data mutations
    uploadAttachment(target: String, file: Upload!, name: String): ResponseDataString

    # Data import spreadsheet mutations
    prepareEntitySpreadsheet(file: [Upload]!): [ColumnInfo]
    reviewEntitySpreadsheet(columnMapping: ColumnMappingInput, file: [Upload]!): ResponseDataImportReview
    importEntitySpreadsheet(columnMapping: ColumnMappingInput, file: [Upload]!, options: SpreadsheetImportOptionsInput): ResponseMessage

    # Data import JSON mutations
    reviewEntityJSON(file: [Upload]!): ResponseDataImportReview
    importEntityJSON(file: [Upload]!, project: String, attributes: [AttributeInput]): ResponseMessage
    reviewAttributeJSON(file: [Upload]!): ResponseDataImportReview
    importAttributeJSON(file: [Upload]!): ResponseMessage

    # API mutations
    revokeKey(key: String): ResponseMessage

    # Counters mutations
    createCounter(counter: CounterCreateInput): ResponseDataString
    incrementCounter(_id: String): ResponseDataString

    # Identifier Format mutations
    createIdentifierFormat(format: IdentifierFormatCreateInput): ResponseDataString
  }
`;
