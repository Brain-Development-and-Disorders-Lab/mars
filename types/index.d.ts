// Import external types
import { BoxProps } from "@chakra-ui/react";
import { Html5QrcodeCameraScanConfig } from "html5-qrcode";
import { ReadStream } from "fs";

export namespace State.Entity {
  type Start = {
    location: "none" | "start" | "relationships" | "attributes";
    name: string;
    created: string;
    owner: string;
    description: string;
  };

  type Relationships = Start & {
    projects: string[];
    relationships: IRelationship[];
  };

  type Attributes = Relationships & {
    attributes: IAttribute[];
  };
}

export namespace State.Project {
  type Start = {
    location: "none" | "start";
    name: string;
    created: string;
    owner: string;
    description: string;
  };
}

// Attributes
// Generic Attribute interface containing required Values
export type IAttribute = {
  name: string;
  owner: string;
  description: string;
  values: IValue[];
  archived: boolean;
};

// Database model of Attribute, including assigned ID
export type AttributeModel = IAttribute & {
  _id: string;
  timestamp: string;
  history?: AttributeHistory[];
};

export type AttributeHistory = {
  author: string;
  message: string;
  timestamp: string;
  version: string;

  _id: string;
  name: string;
  owner: string;
  archived: boolean;
  description: string;
  values: IValue[];
};

// Database model of Attribute usage, includes Entity ID and status of modification
export type AttributeUsage = {
  entity: string;
  modifications: ("name" | "description" | "values")[];
};

export type AttributeCardActions = {
  showRemove?: boolean;
  onUpdate?: (data: AttributeCardProps) => void;
  onRemove?: (id: string) => void;
  onValidityChange?: (id: string, isValid: boolean) => void;
};

export type AttributeCardProps = IAttribute &
  AttributeCardActions & {
    _id: string;
    restrictDataValues: boolean;
    permittedDataValues?: ColumnInfo[];
  };

export type AttributeGroupProps = AttributeCardActions & {
  attributes: AttributeModel[];
};

export type ViewAttributeDialogProps = {
  // Dialog state
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;

  // Dialog Attribute information
  attribute: AttributeModel;
  editing?: boolean;
  isTemplate?: boolean;
  permittedDataValues?: ColumnInfo[];

  // Callback functions
  onAttributeUpdate: (updated: AttributeModel) => void;
  removeCallback?: () => void;
  cancelCallback?: () => void;

  // Optional context for comparison display
  entityName?: string;

  // Optional fields for public view
  workspace?: string;
  isPublic?: boolean;
};

export type CompareAttributeDialogProps = {
  // Dialog state
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;

  // Dialog Attribute information
  modifiedAttribute: AttributeModel;
  templateAttributeId: string;

  // Optional callback to apply selected Template changes back to the Entity Attribute
  onUpdate?: (updated: AttributeModel) => void;

  // When true, all changes are pre-selected
  defaultApplyAll?: boolean;

  // Optional context for comparison display
  entityName?: string;
};

export type CompareAttributeDialogCollapsibleProps = {
  sectionKey: string;
  icon: IconNames;
  color: string;
  label: string;
  count: number;
  disabled: boolean;
  children: React.ReactNode;
};

export type CompareAttributeFieldDiffProps = {
  label: string;
  isDifferent: boolean;
  currentValue: string;
  originalValue: string;
  useOriginal: boolean;
  setUseOriginal: (v: boolean) => void;
};

// Column descriptor returned by prepareEntityCSV
export type ColumnInfo = {
  name: string;
  inferredType: IValueType;
};

// Values
export type IValueType = "number" | "text" | "url" | "date" | "entity" | "select";

export type IValue = {
  _id: string;
  name: string;
  type: IValueType;
  data: string;
  source?: "column" | "value";
  disabled?: boolean;
  showRemove?: boolean;
  onRemove?: (id: string) => void;
  onUpdate?: (data: string) => void;
};

export type IValueSelectData = {
  selected: string;
  options: string[];
};

export type Collaborator = {
  _id: string;
  permissions: UserWorkspacePermissions; // Workspace-scoped permissions
};

// "Collaborators" component props
export type CollaboratorsProps = {
  editing: boolean;
  currentUser: string;
  owner: string;
  collaborators: Collaborator[];
  setCollaborators: (value: React.SetStateAction<Collaborator[]>) => void;
};

// "Linky" component props
export type LinkyProps = {
  type: "entities" | "templates" | "projects" | "workspaces";
  id: string;
  fallback?: string;
  color?: string;
  justify?: string;
  size?: string;
  truncate?: boolean | number;
  workspace?: string; // Override the active Workspace, used on unauthenticated public pages
  isPublic?: boolean; // Route the underlying query to the public Workspace endpoint
};

export type LinkyType = LinkyProps["type"];

// Normalized data returned by the "Linky" component's per-type data fetchers
export type LinkyData = {
  name: string;
  archived: boolean;
  description: string;
  items: { _id: string; name: string; type?: IValueType }[];
};

// "Actor" component props
export type ActorTagProps = {
  identifier: string;
  fallback: string;
  size: "sm" | "md";
  inline?: boolean;
  inlineNoAvatar?: boolean;
  avatarOnly?: boolean;
  workspace?: string; // Override the active Workspace, used on unauthenticated public pages
  isPublic?: boolean; // Route the underlying query to the public Workspace endpoint
};

// "VisibilityTagProps" component props
export type VisibilityTagProps = {
  isPublic: boolean;
  setIsPublic?: (value: React.SetStateAction<boolean>) => void;
  disabled?: boolean; // Disable changing the visibility
  isInherited?: boolean; // Specify if this visibility is inherited
};

// "FieldTag" component props, a single field value (Empty, Value, or Attribute) rendered as a colored Tag
export type EmptyTagProps = {
  label: string; // Noun describing the missing content, rendered as "No {label}"
  size?: "sm" | "md";
};

export type ValueTagProps = {
  value: IValue;
  size?: "sm" | "md";
};

export type AttributeTagProps = {
  attribute: IGenericItem;
  size?: "sm" | "md";
};

// "FieldTagList" component props, renders up to `max` `FieldTag`s followed by an "and N more" summary
export type FieldTagListProps = {
  items: any[];
  max: number;
  getKey: (item: any) => string;
  renderTag: (item: any) => React.ReactNode;
  emptyLabel?: string; // When set, an `EmptyTag` is shown in place of an empty list
};

// "PageHeader" component props, the icon, title, and Workspace subtitle shown atop list pages
export type PageHeaderProps = {
  icon: IconNames;
  iconColor?: string;
  title: string;
  subtitle: string; // Workspace name
  loading: boolean;
};

// "TableCell" component props, shared `DataTable` cell renderers repeated across list pages
export type CreatedCellProps = {
  value: string;
};

export type OwnerCellProps = {
  value: string;
  workspace?: string; // Override the active Workspace, used on unauthenticated public pages
  isPublic?: boolean; // Route the underlying query to the public Workspace endpoint
};

export type DescriptionCellProps = {
  value: string | null | undefined;
  maxLength?: number;
};

// Project types
export type IProject = {
  name: string;
  owner: string;
  archived: boolean;
  created: string;
  description: string;
  entities: string[];
  history: ProjectHistory[];
};

export type ProjectModel = IProject & {
  _id: string;
  timestamp: string;
};

export type ProjectHistory = {
  author: string; // Change author identifier
  message: string; // Change message
  timestamp: string; // Timestamp of change
  version: string; // Project version

  _id: string;
  owner: string;
  created: string;
  archived: boolean;
  name: string;
  description: string;
  entities: string[];
};

// Utility type used across other types, typically in a list
export type IGenericItem = {
  _id: string;
  name: string;
};

// Utility type used for `Select` component options
export type ISelectOption = {
  label: string;
  value: string;
};

// Utility type to define set of relationship types
export type RelationshipType = "parent" | "child" | "general";

// Utility type to define relationship between two Entities
export type IRelationship = {
  type: RelationshipType;
  source: IGenericItem;
  target: IGenericItem;
};

export type RelationshipsProps = {
  relationships: IRelationship[];
  setRelationships: (value: React.SetStateAction<IRelationship[]>) => void;
  viewOnly?: boolean;
  sourceName?: string;
  sourceId?: string;
};

// Utility type to specify the props of `AddRelationshipDialog`
export type AddRelationshipDialogProps = {
  open: boolean;
  onClose: () => void;
  sourceId?: string;
  sourceName: string;
  existingRelationships: IRelationship[];
  onAdd: (relationships: IRelationship[]) => void;
};

export type AddAttributeDialogProps = {
  open: boolean;
  onClose: () => void;
  owner: string;
  templates: AttributeModel[];
  entityName: string;
  entityDescription: string;
  permittedDataValues?: ColumnInfo[];
  onAdd: (attribute: AttributeModel) => void;
  /** Optional, shown only when the user is creating from scratch (not from a template). */
  onSaveAsTemplate?: (attribute: IAttribute) => Promise<void>;
};

// Workspace types
export type IWorkspace = {
  name: string;
  owner: string;
  isPublic: boolean;
  description: string;
  collaborators: Collaborator[];
  entities: string[];
  projects: string[];
  templates: string[];
  activity: string[];
};

export type WorkspaceModel = IWorkspace & {
  _id: string;
  timestamp: string;
};

// Secondary identifier assigned to an Entity
export type SecondaryIdentifier = {
  value: string; // Secondary identifier value
  format: string; // Base format value or custom IdentifierFormat id
};

// Entity types
export type IEntity = {
  name: string;
  secondaryIdentifier?: SecondaryIdentifier;
  owner: string;
  archived: boolean;
  created: string;
  description: string;
  projects: string[];
  relationships: IRelationship[];
  attributes: AttributeModel[];
  attachments: IGenericItem[];
  history: EntityHistory[];
};

export type EntityModel = IEntity & {
  _id: string;
  timestamp: string;
};

export type EntityNode = IGenericItem & {
  relationships: IRelationship[];
};

export type EntityHistory = {
  author: string; // Change author identifier
  message: string; // Change message
  timestamp: string; // Timestamp of change
  version: string; // Entity version

  _id: string;
  name: string;
  secondaryIdentifier?: SecondaryIdentifier;
  owner: string;
  archived: boolean;
  created: string;
  description: string;
  projects: string[];
  relationships: IRelationship[];
  attributes: AttributeModel[];
  attachments: IGenericItem[];
};

// Import review summary for Entities being imported
export type EntityImportReview = {
  name: string;
  state: "create" | "update";
  warnings?: string[];
};

// Import review summary for Templates being imported
export type TemplateImportReview = {
  name: string;
  state: "create" | "update";
};

// Column mappings for Entity imports
export type IRow = Record<string, any>;
export type IColumnMapping = Record<string, any>;

// Import options for CSV files
export type CSVImportOptions = {
  counters: { field: string; _id: string }[];
};

// Counter types
export type ICounter = {
  workspace: string; // The Workspace ID assigned the Counter
  name: string;
  format: string; // Format, with one set of `{}` used to position the numerical values
  current: number; // Current value of the numeric component
  increment: number; // Amount to increase the counter by each iteration
  created: string;
};

export type CounterModel = ICounter & {
  _id: string;
};

export type CounterProps = {
  counter: string;
  setCounter: (value: React.SetStateAction<string>) => void;
  showCreate: boolean;
};

export type CreateCounterDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (_id: string) => void;
};

// Identifier format types
export type IIdentifierFormat = {
  name: string;
  created: string;
  workspace: string;
  fixedLength: number;
  alphanumericOnly: boolean;
  lettersOnly: boolean;
  numbersOnly: boolean;
  allowSpecialCharacters: boolean;
  uppercaseRequired: boolean;
};

export type IdentifierFormatModel = IIdentifierFormat & {
  _id: string;
};

export type CreateCustomIdentifierFormatDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (_id: string) => void;
};

// "IdentifierFormatSelect" component props
export type IdentifierFormatSelectProps = {
  format: string[];
  setFormat: (value: React.SetStateAction<string[]>) => void;
  onFormatsChange?: (formats: IdentifierFormatModel[]) => void;
  showCreate?: boolean;
  disabled?: boolean;
};

// Activity types
export type IActivity = {
  timestamp: string;
  type: "create" | "update" | "delete" | "archived";
  details: string;
  target: {
    type: "entities" | "projects" | "templates" | "workspaces";
    _id: string;
    name: string;
  };
  actor?: string;
  medium?: "API" | "Web";
};

export type ActivityModel = IActivity & {
  _id: string;
};

// `ActivityFeed` component props
export type ActivityFeedProps = {
  activities?: ActivityModel[];
  feedLimit?: number; // Number of activities to show in the feed (default: 5)
};

// `RelativeTime` component props
export type RelativeTimeProps = {
  value: string | number | Date;
  format?: (relative: string) => string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
};

// `Content` component
export type ContentProps = {
  children: React.ReactElement | React.ReactElement[];
  isError?: boolean;
  isLoaded?: boolean;
};

// `Page` component
export type PageProps = {
  children?: React.ReactElement | React.ReactElement[];
  isPublic: boolean;
};

// `Navigation` component
export type NavigationProps = {
  isPublic: boolean;
  workspace?: string;
};

// `AlertDialog` component
export type AlertDialogProps = {
  // Ref for placement
  header: string;
  children: React.ReactElement | React.ReactElement[];
  // Dialog actions and state
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;
  // Left and right buttons
  leftButtonLabel?: string;
  leftButtonColor?: string;
  leftButtonAction?: () => void;
  rightButtonLabel?: string;
  rightButtonColor?: string;
  rightButtonAction?: () => void;
};

// DataTable component
export type DataTableProps = {
  columns: any[];
  visibleColumns: Record<string, boolean>;
  selectedRows: any;
  onSelectedRowsChange?: (selectedRows: any[]) => void;
  columnFilters?: any;
  onColumnFiltersChange?: (filters: any) => void;
  data: any[];
  setData?: (value: React.SetStateAction<any[]>) => void;
  viewOnly?: boolean;

  // Interface visibility
  showColumnSelect?: boolean;
  showColumnFilters?: boolean;
  showPagination?: boolean;
  showSelection?: boolean;
  actions?: DataTableAction[];

  // Layout behavior
  fill?: boolean; // If true, table fills available space and scrolls. If false, fits within parent container.

  // Server-side pagination (if pageCount is provided, pagination is handled server-side)
  pageCount?: number; // Total number of pages (enables server-side pagination)
  pageIndex?: number; // Current page index (0-based)
  pageSize?: number; // Current page size
  onPaginationChange?: (pageIndex: number, pageSize: number) => void; // Callback when pagination changes
  onSortChange?: (field: string, direction: "asc" | "desc" | null) => void; // Callback when sorting changes (for server-side sorting)
  sortState?: { field: string; direction: "asc" | "desc" } | null; // Current sort state (for syncing with server-side sorting)
};

export type DataTableAction = {
  label: string | ((selectedCount: number) => string); // Action label, or a function receiving the selected row count
  icon: IconNames; // Icon
  action: (table: any, rows: any) => void; // Action function acting on the provided the table and rows
  disabled?: boolean; // Disable the action
  alwaysEnabled?: boolean; // Enable the action at all times, regardless if any rows selected
};

// `PreviewDialog` props
export type PreviewDialogProps = {
  attachment: IGenericItem;
  trigger?: React.ReactNode;
  workspace?: string;
  isPublic?: boolean;
};

// `ImportDialog` props
export type ImportDialogProps = {
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;
};

// `ExportDialog` props
export type ExportDialogProps = {
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;
  dataType: "entity" | "entities" | "project" | "template";
  // Single-item export (entity, project, or template)
  id?: string;
  // Multi-entity export; undefined means export all entities
  ids?: string[];
};

// `ScanDialog` props
export type ScanDialogProps = {
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;
};

// `ReportDialog` props
export type ReportDialogProps = {
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;
};

// `UnsavedChangesDialog` props
export type UnsavedChangesDialogProps = {
  blocker: Blocker;
  cancelBlockerRef: React.MutableRefObject<null>;
  onClose: () => void;
  callback: () => void;
};

// `Scanner` props
export type ScannerProps = Html5QrcodeCameraScanConfig & {
  fps: number;
  verbose: boolean;
};

// Icon component
export type IconNames =
  // Default
  | "unknown"

  // Locations
  | "dashboard"
  | "entity"
  | "template"
  | "attribute"
  | "project"

  // Signal and action icons
  | "activity"
  | "archive"
  | "attachment"
  | "bug"
  | "check"
  | "close"
  | "counter"
  | "diff"
  | "info"
  | "file"
  | "format"
  | "bell"
  | "add"
  | "remove"
  | "copy"
  | "edit"
  | "expand"
  | "delete"
  | "download"
  | "email"
  | "external"
  | "filter"
  | "grid"
  | "upload"
  | "cross"
  | "institution"
  | "list"
  | "save"
  | "logout"
  | "person"
  | "warning"
  | "exclamation"
  | "key"
  | "lightning"
  | "qr"
  | "reload"
  | "share"
  | "graph"
  | "clock"
  | "rewind"
  | "link"
  | "scan"
  | "lock"
  | "settings"
  | "power"
  | "print"
  | "search"
  | "search_query"
  | "search_text"
  | "visibility_show"
  | "visibility_hide"
  | "workspace"
  | "zoom_in"
  | "zoom_out"

  // Logos
  | "l_box"
  | "l_labarchives"
  | "l_globus"
  | "l_github"

  // Values
  | "v_date"
  | "v_text"
  | "v_number"
  | "v_url"
  | "v_select"

  // Arrows
  | "a_right"
  | "a_right_fill"
  | "a_left_fill"
  | "a_both"
  | "a_both_fill"

  // Chevrons
  | "c_left"
  | "c_double_left"
  | "c_right"
  | "c_double_right"
  | "c_up"
  | "c_down"

  // Sorting
  | "sort"
  | "sort_up"
  | "sort_down";

// SearchQuery types
export type SearchCombinator = "and" | "or";
export type SearchField = "name" | "description" | "projects" | "relationships" | "attributes";

export interface SearchAttributeValue {
  type: IValueType;
  operator: "contains" | "does not contain" | "equals" | ">" | "<";
  data: string;
}

export interface SearchRule {
  id: string;
  field: SearchField;
  operator: string;
  value: string | SearchAttributeValue;
}

export interface SearchQuery {
  combinator: SearchCombinator;
  rules: SearchRule[];
}

// SearchQueryBuilder props
export interface SearchQueryBuilderProps {
  query: SearchQuery;
  onQueryChange: (query: SearchQuery) => void;
  isValid: boolean;
  onSearch: () => void;
  onClear: () => void;
}

// SearchRuleSelect props
export type SearchRuleSelectProps = {
  value: string;
  collection: ListCollection<string>;
  onChange: (value: string) => void;
  minW?: string;
  placeholder?: string;
  testId?: string;
};

// SearchSelect props
export type SearchSelectProps = {
  id?: string;
  value: IGenericItem;
  resultType: "entity" | "project" | "institution";
  placeholder?: string;
  defaultOption?: string;
  onChange?: (value: any) => void;
  disabled?: boolean;
  isEmbedded?: boolean;
};

// MultiEntitySelect props
export type MultiEntitySelectProps = {
  projectEntities: string[];
  selectedEntities: IGenericItem[];
  setSelectedEntities: React.Dispatch<React.SetStateAction<IGenericItem[]>>;
};

// `SaveDialog` props
export type SaveDialogProps = {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  onDone: () => void;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  placeholder?: string;
  showCloseButton?: boolean;
  modifiedType?: "Entity" | "Project" | "Template";
  isPublic?: boolean;
};

// "HistoryDrawer" component props, a version history Drawer shared by Entity, Project, and Template detail pages.
// `type` selects both the drawer title and which type-specific detail panel (Attributes/Attachments, Entities, or
// Values) is rendered for each version
export type HistoryDrawerProps = {
  type: "entity" | "project" | "template";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: (EntityHistory | ProjectHistory | AttributeHistory)[];
  archived: boolean; // Disables Preview while the current item is archived
  previewActive: boolean; // Whether a version is currently being previewed, disables Restore
  canRestore: boolean; // Workspace permission to restore a version
  onPreview: (version: any) => void;
  onRestore: (version: any) => void | Promise<void>;
};

// Generic ResponseMessage type
export type IResponseMessage = {
  success: boolean;
  message: string;
};

// ResponseMessage type carrying a data payload
export type ResponseData<D> = IResponseMessage & {
  data: D;
};

// Storage and local data management types
export type ApplicationStorage = {
  setup: boolean; // Flag if application setup is complete
  workspace: string; // ID of active Workspace
};

// File type
export type IFile = Promise<{
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => ReadStream;
}>;

// Generic GraphQL resolver parent type (for unused parents)
export type IResolverParent = Record<string, any>;

// Context passed through the request headers, includes the ORCID (user) of the user
export type Context = {
  user: string;
  workspace: string;
  userRole: string;
};

// API key data
export type APIKey = {
  value: string;
  expires: string;
  scope: "view" | "edit";
  workspaces: string[];
};

// API response
export type APIData<D> = {
  path: string;
  version: string;
  status: "success" | "warning" | "error" | "unauthorized";
  message: string;
  data: D;
};

// User types
export type IUser = {
  firstName: string;
  lastName: string;
  name: string; // better-auth: Display name
  affiliation: string;
  email: string; // better-auth: Email
  emailVerified: boolean; // better-auth: Email verification
  image: string; // better-auth: Display image URL
  createdAt: string; // better-auth: Created
  updatedAt: string; // better-auth: Last updated
  lastLogin: string; // better-auth: Timestamp of last login
  api_keys: string; // better-auth: Stored as a JSON string
  role: string; // better-auth: "user" or "admin"
  banned: boolean; // better-auth: Overarching access status
  permissions: UserGlobalPermissions; // Global permissions such as AI search or API access
  account_orcid: string; // ORCiD if connected
  hasSeenWalkthrough?: boolean; // If user has seen or skipped the initial walkthrough
  completedProfile?: boolean; // `false` until third-party signup profile is completed
};

export type UserModel = IUser & {
  _id: string;
};

// User Workspace permissions structure
export type UserWorkspacePermissions = {
  administration: {
    edit: boolean;
    invite: boolean;
  };
  entities: {
    create: boolean;
    edit: boolean;
    archive: boolean;
  };
  projects: {
    create: boolean;
    edit: boolean;
    archive: boolean;
  };
  templates: {
    create: boolean;
    edit: boolean;
    archive: boolean;
  };
};

// User global permissions structure
export type UserGlobalPermissions = {
  features: {
    import: boolean;
    scan: boolean;
    ai: boolean;
    api: boolean;
  };
  workspaces: {
    create: boolean;
  };
};

export type UserCollatedPermissions = {
  workspace: UserWorkspacePermissions;
  global: UserGlobalPermissions;
};

// Permissions Dialog props
export type PermissionsDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  user: string;
  editable?: boolean; // If `false`, show a read-only preview instead of editable toggles
  isGlobal: boolean; // Define if modifying "global" permissions or just for the Workspace
  workspace?: string; // Specify the Workspace if modifying Workspace permissions
  workspacePermissions?: UserWorkspacePermissions; // Current local Workspace permissions for `user`, used instead of fetching from the server
  onUpdateWorkspacePermissions?: (permissions: UserWorkspacePermissions) => void; // Called with the edited permissions instead of persisting them immediately
};

// Metrics
export type IContentMetrics = {
  all: number;
  addedDay: number;
};

export type EntityMetrics = IContentMetrics;
export type ProjectMetrics = IContentMetrics;
export type TemplateMetrics = IContentMetrics;
export type CollaboratorMetrics = IContentMetrics;

export type AdminWorkspace = {
  _id: string;
  name: string;
  description: string;
  owner: string;
  entities: number;
  projects: number;
  templates: number;
};

export type AdminMetrics = {
  users: number;
  workspaces: number;
  entities: number;
  projects: number;
  templates: number;
};

export type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  workspaces: number;
  permissions: UserGlobalPermissions;
  banned: boolean;
  lastLogin: string;
};

// Types to assist with test frameworks
// A path on the client where a Workspace permission is enforced
export type ClientPath = {
  name: string;
  verify: (page: Page, granted: boolean) => Promise<void>;
};
