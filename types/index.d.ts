// Import external types
import { ListCollection, UseFileUploadReturn } from "@chakra-ui/react";
import { Cell, RowData } from "@tanstack/react-table";
import { Html5QrcodeCameraScanConfig } from "html5-qrcode";
import { ReadStream } from "fs";
import { Blocker } from "react-router-dom";
import { Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Shared utility types
// ---------------------------------------------------------------------------

// Metadata recorded with every history version of an Entity, Project, or Attribute
export type HistoryVersion = {
  author: string; // Change author identifier
  message: string; // Change message
  timestamp: string; // Timestamp of change
  version: string; // Version identifier
};

// Minimal reference to a stored item by ID and name
export type IGenericItem = {
  _id: string;
  name: string;
};

// File name split into its base name and extension
export type FileName = {
  base: string;
  extension: string;
};

// Label and value of a select option
export type ISelectOption = {
  label: string;
  value: string;
};

// Inclusive numeric range, either bound may be omitted
export type CountRange = {
  min?: number;
  max?: number;
};

// Result of an operation, whether it succeeded and a message describing the outcome
export type IResponseMessage = {
  success: boolean;
  message: string;
};

// `IResponseMessage` carrying a data payload
export type ResponseData<D> = IResponseMessage & {
  data: D;
};

// Total count of a Workspace's Entities, Projects, Attributes, or Collaborators, and how many were added in the last day
export type ContentMetrics = {
  all: number;
  addedDay: number;
};

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

// Data types a Value can hold
export type IValueType = "number" | "text" | "url" | "date" | "entity" | "select";

// Single named, typed Value within an Attribute
export type IValue = {
  _id: string;
  name: string;
  type: IValueType;
  data: string;
  source?: "column" | "value"; // Whether `data` names a spreadsheet column or holds a fixed value
};

// Parsed `data` of a "select" Value, the chosen option and the available options
export type IValueSelectData = {
  selected: string;
  options: string[];
};

// Parsed display label for an `IValue`, produced by `formatValueForDisplay`
export type FormattedValueDisplay = { label: string; secondary?: string };

// ---------------------------------------------------------------------------
// Attributes
// ---------------------------------------------------------------------------

// Attribute template, a named collection of Values
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
  usageCount?: number;
  history?: AttributeHistory[];
};

// Snapshot of an Attribute at a previous version
export type AttributeHistory = HistoryVersion & IAttribute & { _id: string };

// Database model of Attribute usage, includes Entity ID and status of modification
export type AttributeUsage = {
  entity: string;
  modifications: ("name" | "description" | "values")[];
};

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

// Utility type to define set of Link types
export type LinkType = "parent" | "child" | "general";

// Utility type to define Link between two Entities
export type ILink = {
  type: LinkType;
  source: IGenericItem;
  target: IGenericItem;
};

// Secondary identifier assigned to an Entity
export type SecondaryIdentifier = {
  value: string; // Secondary identifier value
  format: string; // Base format value or custom IdentifierFormat id
};

// Entity fields, excluding the assigned ID
export type IEntity = {
  name: string;
  secondaryIdentifier?: SecondaryIdentifier;
  owner: string;
  archived: boolean;
  created: string;
  description: string;
  projects: string[];
  links: ILink[];
  attributes: AttributeModel[];
  attachments: IGenericItem[];
  history: EntityHistory[];
};

// Stored Entity, including assigned ID
export type EntityModel = IEntity & {
  _id: string;
  timestamp: string;
};

// Filters accepted when querying Entities
export type EntityFilter = {
  startDate?: string;
  endDate?: string;
  owners?: string[];
  hasAttachments?: boolean;
  hasAttributes?: boolean;
  hasLinks?: boolean;
  attributeCount?: CountRange;
  projectCount?: CountRange;
};

// Entity fields fetched to build a `LinksGraph` node
export type EntityNode = IGenericItem & {
  links: ILink[];
  owner?: string;
  created?: string;
  archived?: boolean;
  projects?: string[];
  attributes?: IGenericItem[];
};

// Snapshot of an Entity at a previous version
export type EntityHistory = HistoryVersion & Omit<IEntity, "history"> & { _id: string };

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

// Project fields, excluding the assigned ID
export type IProject = {
  name: string;
  owner: string;
  archived: boolean;
  created: string;
  description: string;
  entities: string[];
  history: ProjectHistory[];
};

// Stored Project, including assigned ID
export type ProjectModel = IProject & {
  _id: string;
  timestamp: string;
};

// Snapshot of a Project at a previous version
export type ProjectHistory = HistoryVersion & Omit<IProject, "history"> & { _id: string };

// ---------------------------------------------------------------------------
// Workspaces, collaborators, and permissions
// ---------------------------------------------------------------------------

// Workspace collaborator and their Workspace permissions
export type Collaborator = {
  _id: string;
  permissions: UserWorkspacePermissions; // Workspace-scoped permissions
};

// Workspace fields, excluding the assigned ID
export type IWorkspace = {
  name: string;
  owner: string;
  isPublic: boolean;
  description: string;
  collaborators: Collaborator[];
  entities: string[];
  projects: string[];
  attributes: string[];
  activity: string[];
};

// Individual permission within `UserWorkspacePermissions`, derived as `category.action` paths
export type UserWorkspacePermission = {
  [K in keyof UserWorkspacePermissions]: `${K}.${keyof UserWorkspacePermissions[K] & string}`;
}[keyof UserWorkspacePermissions];

// General level of access to a Workspace, independent of specific permissions
export type WorkspaceAccessLevel = "read" | "member";

// Access a check requires, either a general level or a specific permission
export type WorkspaceRequirement = WorkspaceAccessLevel | UserWorkspacePermission;

// Collections of Workspace contents that can be checked for membership
export type WorkspaceCollection = "entities" | "projects" | "attributes";

// Client-supplied fields accepted when creating a Workspace
export type WorkspaceCreateInput = {
  name: string;
  description: string;
  isPublic?: boolean;
  collaborators?: Collaborator[];
};

// Stored Workspace, including assigned ID
export type WorkspaceModel = IWorkspace & {
  _id: string;
  timestamp: string;
};

// `UserWorkspacePermissions` permissions structure
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
  attributes: {
    create: boolean;
    edit: boolean;
    archive: boolean;
  };
};

// `UserGlobalPermissions` permissions structure
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

// User's Workspace and global permissions combined
export type UserCollatedPermissions = {
  workspace: UserWorkspacePermissions;
  global: UserGlobalPermissions;
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

// User fields, excluding the assigned ID
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

// Stored User, including assigned ID
export type UserModel = IUser & {
  _id: string;
};

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

// Activity entry recording a change to Workspace contents
export type IActivity = {
  timestamp: string;
  type: "create" | "update" | "delete" | "archived";
  details: string;
  target: {
    type: "entities" | "projects" | "attributes" | "workspaces";
    _id: string;
    name: string;
  };
  actor?: string;
  medium?: "API" | "Web";
};

// Stored Activity entry, including assigned ID
export type ActivityModel = IActivity & {
  _id: string;
};

// Filter values on the Activity page
export type ActivityFilterValues = {
  startDate: string;
  endDate: string;
  activityTypes: string[];
  targetTypes: string[];
  mediums: string[];
};

// ---------------------------------------------------------------------------
// Counters and identifier formats
// ---------------------------------------------------------------------------

// Counter generating sequential values for Entity names
export type ICounter = {
  workspace: string; // The Workspace ID assigned the Counter
  name: string;
  format: string; // Format, with one set of `{}` used to position the numerical values
  current: number; // Current value of the numeric component
  increment: number; // Amount to increase the counter by each iteration
  created: string;
};

// Stored Counter, including assigned ID
export type CounterModel = ICounter & {
  _id: string;
};

// Custom format rules for Entity secondary identifiers
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

// Stored identifier format, including assigned ID
export type IdentifierFormatModel = IIdentifierFormat & {
  _id: string;
};

// ---------------------------------------------------------------------------
// Import and export
// ---------------------------------------------------------------------------

// `ColumnInfo` type, the Column descriptor returned by `prepareEntitySpreadsheet`
export type ColumnInfo = {
  name: string;
  inferredType: IValueType;
};

// File formats supported when exporting Entities and Projects
export type ExportFormat = "json" | "csv" | "xlsx";

// Spreadsheet subset of `ExportFormat`
export type SpreadsheetFormat = Exclude<ExportFormat, "json">;

// Review summary of an Entity or Attribute being imported, `warnings` only applies to Entities
export type ImportReview = {
  name: string;
  state: "create" | "update";
  warnings?: string[];
};

// A single parsed spreadsheet row
export type IRow = Record<string, any>;

// Maps Entity fields to spreadsheet column names (or fixed values) for a spreadsheet import
export type IColumnMapping = {
  namePrefix: string;
  name?: string;
  secondaryIdentifier?: {
    value?: string; // Column name providing the secondary identifier value
    format: string;
  };
  description?: string;
  created: string;
  owner: string;
  project: string;
  attributes: AttributeModel[];
};

// Entity built from a spreadsheet row, paired with any data validation warnings for that row
export type EntityMappingResult = {
  entity: IEntity;
  warnings: string[];
};

// Result of parsing an uploaded JSON file: either the parsed contents, or an error message
export type ParsedJSONFile = { parsed: IRow } | { error: string };

// Import options for spreadsheet files
export type SpreadsheetImportOptions = {
  counters: { field: string; _id: string }[];
};

// `SampleFile` type representing a downloadable example file
export type SampleFile = { label: string; filename: string; mimeType: string; content: string };

// AI-suggested column mapping for the Entity name/description fields
export type ColumnMappingSuggestion = {
  name: string | null;
  description: string | null;
};

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

// Logical operator joining `SearchRule`s
export type SearchCombinator = "and" | "or";

// Entity field a `SearchRule` matches against
export type SearchField = "name" | "description" | "projects" | "links" | "attributes";

// Attribute Value condition within a `SearchRule`
export type SearchAttributeValue = {
  type: IValueType;
  operator: "contains" | "does not contain" | "equals" | ">" | "<";
  data: string;
};

// Single condition in a `SearchQuery`
export type SearchRule = {
  id: string;
  field: SearchField;
  operator: string;
  value: string | SearchAttributeValue;
};

// Query built with `SearchQueryBuilder`, converted to MongoDB by `buildMongoQuery`
export type SearchQuery = {
  combinator: SearchCombinator;
  rules: SearchRule[];
};

// ---------------------------------------------------------------------------
// Administration
// ---------------------------------------------------------------------------

// Workspace summary shown on the administration page
export type AdminWorkspace = {
  _id: string;
  name: string;
  description: string;
  owner: string;
  entities: number;
  projects: number;
  attributes: number;
};

// Instance-wide totals shown on the administration page
export type AdminMetrics = {
  users: number;
  workspaces: number;
  entities: number;
  projects: number;
  attributes: number;
};

// User summary shown on the administration page
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

// ---------------------------------------------------------------------------
// Server, GraphQL context, and API
// ---------------------------------------------------------------------------

// File type
export type IFile = Promise<{
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => ReadStream;
}>;

// Generic GraphQL resolver parent type (for unused parents)
export type IResolverParent = Record<string, any>;

// GraphQL request context, the authenticated user and active Workspace
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

// ---------------------------------------------------------------------------
// Client data shapes and hooks
// ---------------------------------------------------------------------------

// Resolves the icon shown beside a styled select option
type StyledSelectIconGetter<T> = (data: T) => { name: IconNames; color?: string } | undefined;

// Styling for the select components built by `makeStyledSelectComponents`
export type StyledSelectConfig<T> = {
  getIcon?: StyledSelectIconGetter<T>;
  optionHeight: string;
  optionPadding: string;
  optionMargin?: string;
  controlPaddingLeft: string;
  controlHasBorder: boolean;
  valueContainerHeight: string;
};

// Kinds of item `Linky` can link to
export type LinkyType = LinkyProps["type"];

// Normalized data returned by the "Linky" component's per-type data fetchers
export type LinkyData = {
  name: string;
  archived: boolean;
  description: string;
  items: { _id: string; name: string; type?: IValueType }[];
};

// `ProjectEntityTableRow`, row shape for the `ProjectEntitiesTable`
export type ProjectEntityTableRow = {
  _id: string;
  description?: string;
  attributes?: AttributeModel[];
};

// Value provided by `WorkspaceProvider` through `useWorkspace`
export type WorkspaceContextValue = {
  workspace: string;
  workspaces: WorkspaceModel[];
  loading: boolean;
  activateWorkspace: (workspace: string) => Promise<IResponseMessage>;
  refreshWorkspaces: () => Promise<WorkspaceModel[]>;
  signOut: () => Promise<void>;
};

// Details known about an Entity when building its `LinksGraph` node
export type LinksGraphNodeInput = {
  id: string;
  name: string;
  isPrimary: boolean;
  linkCount?: number;
  owner?: string;
  created?: string;
  projectCount?: number;
  attributeCount?: number;
  archived?: boolean;
};

// Item shape backing the `DataTableColumnSelect` collection
export type DataTableColumnOption = ISelectOption & { disabled: boolean };

// Count range input values, empty strings are unbounded
export type DataTableFilterRange = {
  min: string;
  max: string;
};

// Filter values produced by `DataTableFilters`, keyed `ranges` and `toggles` match the filter definitions
export type DataTableFilterValues = {
  startDate: string;
  endDate: string;
  owners: string[];
  ranges: Record<string, DataTableFilterRange>;
  toggles: Record<string, boolean>;
};

// Count range filter shown by `DataTableFilters`
export type DataTableRangeFilter = {
  key: string;
  label: string;
};

// Checkbox filter shown by `DataTableFilters`
export type DataTableToggleFilter = {
  key: string;
  label: string;
  checkboxLabel: string;
};

// Accessors used to apply `DataTableFilterValues` to rows on the client
export type DataTableFilterAccessors<T> = {
  created: (row: T) => string;
  owner: (row: T) => string;
  counts: Record<string, (row: T) => number>;
};

// `useEntityImport` hook parameters
export type UseEntityImportParams = {
  open: boolean;
  fileUpload: UseFileUploadReturn;
  fileType: string;
  setContinueDisabled: (value: boolean) => void;
};

// `useAttributeImport` hook parameters
export type UseAttributeImportParams = {
  fileUpload: UseFileUploadReturn;
  setContinueDisabled: (value: boolean) => void;
};

// Client state persisted to local storage by `useStorage`
export type ApplicationStorage = {
  setup: boolean; // Flag if application setup is complete
  workspace: string; // ID of active Workspace
};

// ---------------------------------------------------------------------------
// Component props: layout and navigation
// ---------------------------------------------------------------------------

// `PageHeader` component props, the icon, title, and Workspace subtitle shown atop list pages
export type PageHeaderProps = {
  icon: IconNames;
  iconColor?: string;
  title: string;
  subtitle: string; // Workspace name
  loading: boolean;
};

// `Content` component props
export type ContentProps = {
  children: React.ReactElement | React.ReactElement[];
  isError?: boolean;
  isLoaded?: boolean;
};

// `Page` component props
export type PageProps = {
  children?: React.ReactElement | React.ReactElement[];
  isPublic: boolean;
};

// `Navigation` component props
export type NavigationProps = {
  isPublic: boolean;
  workspace?: string;
};

// ---------------------------------------------------------------------------
// Component props: tags, fields, and selects
// ---------------------------------------------------------------------------

// `Select` component props, shared native `Select` wrapper
export type SelectProps<T> = {
  collection: ListCollection<T>;
  value?: string[];
  onValueChange: (details: { value: string[]; items: T[] }) => void;
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  width?: string;
  minW?: string;
  fontSize?: string;
  testId?: string;
  groupBy?: (item: T) => string;
  itemDisabled?: (item: T) => boolean;
};

// `Collaborators` component props
export type CollaboratorsProps = {
  editing: boolean;
  currentUser: string;
  owner: string;
  collaborators: Collaborator[];
  setCollaborators: (value: React.SetStateAction<Collaborator[]>) => void;
};

// `CollaboratorEmail` component props
export type CollaboratorEmailProps = {
  userId: string;
  email?: string;
};

// `Linky` component props
export type LinkyProps = {
  type: "entities" | "attributes" | "projects" | "workspaces";
  id: string;
  fallback?: string;
  color?: string;
  justify?: string;
  size?: string;
  truncate?: boolean | number;
  workspace?: string; // Override the active Workspace, used on unauthenticated public pages
  isPublic?: boolean; // Route the underlying query to the public Workspace endpoint
};

// `TagActor` component props
export type TagActorProps = {
  identifier: string;
  fallback: string;
  size: "sm" | "md";
  inline?: boolean;
  inlineNoAvatar?: boolean;
  avatarOnly?: boolean;
  workspace?: string; // Override the active Workspace, used on unauthenticated public pages
  isPublic?: boolean; // Route the underlying query to the public Workspace endpoint
};

// `TagVisibility` component props
export type TagVisibilityProps = {
  isPublic: boolean;
  setIsPublic?: (value: React.SetStateAction<boolean>) => void;
  disabled?: boolean; // Disable changing the visibility
  isInherited?: boolean; // Specify if this visibility is inherited
};

// `TagTimestamp` component props
export type TagTimestampProps = {
  timestamp: string;
  description?: string;
};

// `TagEmpty` component props
export type TagEmptyProps = {
  label: string; // Noun describing the missing content, rendered as "No {label}"
  size?: "sm" | "md";
};

// `TagValue` component props
export type TagValueProps = {
  value: IValue;
  size?: "sm" | "md";
};

// `TagAttribute` component props
export type TagAttributeProps = {
  attribute: IGenericItem;
  size?: "sm" | "md";
};

// `FieldTagList` component props, renders up to `max` `TagField`s followed by an "and N more" summary
export type FieldTagListProps = {
  items: any[];
  max: number;
  getKey: (item: any) => string;
  renderTag: (item: any) => React.ReactNode;
  emptyLabel?: string; // When set, an `TagEmpty` is shown in place of an empty list
};

// `SelectCounter` component props
export type SelectCounterProps = {
  counter: string;
  setCounter: (value: React.SetStateAction<string>) => void;
  showCreate: boolean;
};

// `SelectIdentifierFormat` component props
export type SelectIdentifierFormatProps = {
  format: string[];
  setFormat: (value: React.SetStateAction<string[]>) => void;
  onFormatsChange?: (formats: IdentifierFormatModel[]) => void;
  showCreate?: boolean;
  disabled?: boolean;
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

// `Scanner` component props
export type ScannerProps = Html5QrcodeCameraScanConfig & {
  fps: number;
  verbose: boolean;
};

// `SelectMultiEntity` component props
export type SelectMultiEntityProps = {
  projectEntities: string[];
  selectedEntities: IGenericItem[];
  setSelectedEntities: React.Dispatch<React.SetStateAction<IGenericItem[]>>;
};

// `HistoryDrawer` component props, a version history Drawer shared by Entity, Project, and Attribute detail pages
export type HistoryDrawerProps = {
  type: "entity" | "project" | "attribute";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: (EntityHistory | ProjectHistory | AttributeHistory)[];
  archived: boolean; // Disables Preview while the current item is archived
  previewActive: boolean; // Whether a version is currently being previewed, disables Restore
  canRestore: boolean; // Workspace permission to restore a version
  onPreview: (version: any) => void;
  onRestore: (version: any) => void | Promise<void>;
};

// ---------------------------------------------------------------------------
// Component props: `DataTable` and filters
// ---------------------------------------------------------------------------

// `CellGeneric` component props
export type CellGenericProps = {
  cell: Cell<RowData, unknown>;
};

// `CellCreatedField` component props, shared `DataTable` cell renderers repeated across list pages
export type CellCreatedFieldProps = {
  value: string;
};

// `CellOwnerField` component props
export type CellOwnerFieldProps = {
  value: string;
  workspace?: string; // Override the active Workspace, used on unauthenticated public pages
  isPublic?: boolean; // Route the underlying query to the public Workspace endpoint
};

// `CellDescriptionField` component props
export type CellDescriptionFieldProps = {
  value: string | null | undefined;
  maxLength?: number;
};

// `DataTable` component props
export type DataTableProps = {
  columns: any[];
  visibleColumns: Record<string, boolean>;
  selectedRows: any;
  onSelectedRowsChange?: (selectedRows: any[]) => void;
  columnFilters?: any;
  onColumnFiltersChange?: (filters: any) => void;
  data: any[];
  viewOnly?: boolean;

  // Interface visibility
  showColumnSelect?: boolean;
  showColumnFilters?: boolean;
  showPagination?: boolean;
  showSelection?: boolean;
  actions?: DataTableAction[];

  // Layout behavior
  fill?: boolean; // If true, table fills available space and scrolls. If false, fits within parent container.
  resizableColumns?: boolean; // If true, header columns can be resized by dragging their right edge
  footerAction?: { label: string; icon: IconNames; onClick: () => void }; // Renders a full-width action button below the rows

  // Server-side pagination (if pageCount is provided, pagination is handled server-side)
  pageCount?: number; // Total number of pages (enables server-side pagination)
  pageIndex?: number; // Current page index (0-based)
  pageSize?: number; // Current page size
  onPaginationChange?: (pageIndex: number, pageSize: number) => void; // Callback when pagination changes
  onSortChange?: (field: string, direction: "asc" | "desc" | null) => void; // Callback when sorting changes (for server-side sorting)
  sortState?: { field: string; direction: "asc" | "desc" } | null; // Current sort state (for syncing with server-side sorting)
};

// Bulk action shown above a `DataTable` for the selected rows
export type DataTableAction = {
  label: string | ((selectedCount: number) => string); // Action label, or a function receiving the selected row count
  icon: IconNames; // Icon
  action: (table: any, rows: any) => void; // Action function acting on the provided the table and rows
  disabled?: boolean; // Disable the action
  alwaysEnabled?: boolean; // Enable the action at all times, regardless if any rows selected
};

// `DataTablePaginationNav` component props
export type DataTablePaginationNavProps = {
  table: any;
};

// `DataTablePageSizeSelect` component props
export type DataTablePageSizeSelectProps = {
  table: any;
  pageLength: string[];
  setPageLength: (value: string[]) => void;
  pageLengthsCollection: ListCollection<ISelectOption>;
};

// `DataTableColumnSelect` component props
export type DataTableColumnSelectProps = {
  columnNamesCollection: ListCollection<DataTableColumnOption>;
  visibleColumnsForSelect: string[];
  alwaysVisibleColumns: string[];
  updateColumnVisibility: (toggleableColumns: string[]) => void;
};

// `FilterInput` component props
export type FilterInputProps = {
  label: string;
  type: "date" | "number";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

// `FilterCheckbox` component props
export type FilterCheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

// `FilterSection` component props
export type FilterSectionProps = {
  label: string;
  children: React.ReactNode;
};

// `DataTableFilterPanel` component props, `onApply` is omitted when filters apply immediately
export type DataTableFilterPanelProps = {
  label: string;
  activeFilterCount: number;
  onApply?: () => void;
  onReset: () => void;
  children: React.ReactNode;
};

// `DataTableFilters` component props
export type DataTableFiltersProps = {
  entityLabel: string;
  owners: string[];
  workspace?: string;
  isPublic?: boolean;
  ranges?: DataTableRangeFilter[];
  toggles?: DataTableToggleFilter[];
  values: DataTableFilterValues;
  onApply: (values: DataTableFilterValues) => void;
};

// ---------------------------------------------------------------------------
// Component props: dialogs
// ---------------------------------------------------------------------------

// Open state shared by dialog components
export type DialogGenericProps = {
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;
};

// `DialogViewAttribute` component props
export type DialogViewAttributeProps = DialogGenericProps & {
  // Dialog Attribute information
  attribute: AttributeModel;
  editing?: boolean;
  originalAttributeId?: string;
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

// `DialogCompareAttribute` component props
export type DialogCompareAttributeProps = DialogGenericProps & {
  // Dialog Attribute information
  modifiedAttribute: AttributeModel;
  originalAttributeId: string;

  // Optional callback to apply selected Attribute changes back to the Entity Attribute
  onUpdate?: (updated: AttributeModel) => void;

  // When true, all changes are pre-selected
  defaultApplyAll?: boolean;

  // Optional context for comparison display
  entityName?: string;
};

// Collapsible section props within `DialogCompareAttribute`
export type DialogCompareAttributeCollapsibleProps = {
  sectionKey: string;
  icon: IconNames;
  color: string;
  label: string;
  count: number;
  disabled: boolean;
  children: React.ReactNode;
};

// Field comparison row props within `DialogCompareAttribute`
export type DialogCompareAttributeFieldDiffProps = {
  label: string;
  isDifferent: boolean;
  currentValue: string;
  originalValue: string;
  useOriginal: boolean;
  setUseOriginal: (v: boolean) => void;
};

// Utility type to specify the props of `DialogAddLinks`
export type DialogAddLinksProps = {
  open: boolean;
  onClose: () => void;
  sourceId?: string;
  sourceName: string;
  existingLinks: ILink[];
  onAdd: (links: ILink[]) => void;
};

// `DialogAddAttribute` component props
export type DialogAddAttributeProps = {
  open: boolean;
  onClose: () => void;
  owner: string;
  attributes: AttributeModel[];
  entityName: string;
  entityDescription: string;
  permittedDataValues?: ColumnInfo[];
  onAdd: (attribute: AttributeModel) => void;
  onSaveAsAttribute?: (attribute: IAttribute) => Promise<void>; // Shown only when the user is creating from scratch
};

// `DialogCreateCounter` component props
export type DialogCreateCounterProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (_id: string) => void;
};

// `DialogCreateIdentifierFormat` component props
export type DialogCreateIdentifierFormatProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (_id: string) => void;
};

// `DialogAlert` component props
export type DialogAlertProps = DialogGenericProps & {
  header: string;
  children: React.ReactElement | React.ReactElement[];
  // Left and right buttons
  leftButtonLabel?: string;
  leftButtonColor?: string;
  leftButtonAction?: () => void;
  rightButtonLabel?: string;
  rightButtonColor?: string;
  rightButtonAction?: () => void;
};

// `DialogPreview` component props
export type DialogPreviewProps = {
  attachment: IGenericItem;
  trigger?: React.ReactNode;
  workspace?: string;
  isPublic?: boolean;
  onRename?: (id: string, name: string) => void;
};

// `PreviewContent` component props, used within `DialogPreview`
export type DialogPreviewContentProps = Pick<DialogPreviewProps, "attachment" | "workspace" | "isPublic"> & {
  nameField?: React.ReactNode;
};

// `DialogExport` component props
export type DialogExportProps = DialogGenericProps & {
  dataType: "entity" | "entities" | "project" | "attribute";
  // Single-item export (Entity, Project, or Attribute)
  id?: string;
  // Multi-entity export; undefined means export all Entities
  ids?: string[];
};

// `DialogUnsavedChanges` component props
export type DialogUnsavedChangesProps = {
  blocker: Blocker;
  cancelBlockerRef: React.MutableRefObject<null>;
  onClose: () => void;
  callback: () => void;
};

// `DialogUpload` component props
export type DialogUploadProps = DialogGenericProps & {
  target: string;
  uploads: string[];
  setUploads: React.Dispatch<React.SetStateAction<string[]>>;
  onUploadSuccess?: () => void;
};

// `DialogSave` component props
export type DialogSaveProps = {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  onDone: () => void;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  placeholder?: string;
  showCloseButton?: boolean;
  modifiedType?: "Entity" | "Project" | "Attribute";
  isPublic?: boolean;
};

// `DialogPermissions` component props
export type DialogPermissionsProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  user: string;
  editable?: boolean; // If `false`, show a read-only preview instead of editable toggles
  isGlobal: boolean; // Define if modifying "global" permissions or just for the Workspace
  workspace?: string; // Specify the Workspace if modifying Workspace permissions
  workspacePermissions?: UserWorkspacePermissions; // Current local Workspace permissions for `user`, used instead of fetching from the server
  onUpdateWorkspacePermissions?: (permissions: UserWorkspacePermissions) => void; // Called with the edited permissions instead of persisting them immediately
};

// ---------------------------------------------------------------------------
// Component props: `DialogImport` steps
// ---------------------------------------------------------------------------

// `DialogImportReviewTable` component props
export type DialogImportReviewTableProps = {
  items: ImportReview[];
  icon: IconNames;
  iconColor: string;
  bg: string;
  borderColor: string;
  nameHeader: string;
  singular: string;
  plural: string;
  showWarnings?: boolean;
};

// `UploadStep` component props, the `DialogImport` step used to select the import type and upload a file
export type DialogImportUploadStepProps = {
  importType: "entities" | "attribute" | undefined;
  isTypeSelectDisabled: boolean;
  onSelectImportType: (type: "entities" | "attribute") => void;
  fileUpload: UseFileUploadReturn;
};

// `DialogImportEntityDetailsStep` component props, the `DialogImport` step used to configure name/description/project/owner fields
export type DialogImportEntityDetailsStepProps = {
  fileType: string;
  columns: ColumnInfo[];
  namePrefixField: string;
  onNamePrefixFieldChange: (value: string) => void;
  nameField: ColumnInfo | undefined;
  onNameFieldChange: React.Dispatch<React.SetStateAction<ColumnInfo | undefined>>;
  nameUseCounter: boolean;
  onNameUseCounterChange: (value: boolean) => void;
  counter: string;
  onCounterChange: React.Dispatch<React.SetStateAction<string>>;
  onContinueDisabledChange: (value: boolean) => void;
  suggestions: ColumnMappingSuggestion | null;
  isSuggesting: boolean;
  descriptionField: ColumnInfo | undefined;
  onDescriptionFieldChange: React.Dispatch<React.SetStateAction<ColumnInfo | undefined>>;
  identifierField: ColumnInfo | undefined;
  onIdentifierFieldChange: React.Dispatch<React.SetStateAction<ColumnInfo | undefined>>;
  identifierFormat: string[];
  onIdentifierFormatChange: React.Dispatch<React.SetStateAction<string[]>>;
  projectField: string;
  onProjectFieldChange: (value: string) => void;
  projectsCollection: ListCollection<IGenericItem>;
  ownerField: string;
  getSelectComponent: (
    key: string,
    currentValue: ColumnInfo | undefined,
    onValueChange: React.Dispatch<React.SetStateAction<ColumnInfo | undefined>>,
  ) => React.ReactElement;
};

// `DialogImportEntityMappingStep` component props, the `DialogImport` step used to add Attributes applied to all imported Entities
export type DialogImportEntityMappingStepProps = {
  attributesField: AttributeModel[];
  onAttributesFieldChange: (value: AttributeModel[]) => void;
  addAttributeOpen: boolean;
  onAddAttributeOpenChange: (value: boolean) => void;
  ownerField: string;
  attributes: AttributeModel[];
  fileType: string;
  columns: ColumnInfo[];
};

// `AttributeNameCell` component props, the "Name" column cell within `DialogImportEntityMappingStep`'s attribute table
export type AttributeNameCellProps = {
  attribute: AttributeModel;
  fileType: string;
  columns: ColumnInfo[];
  onRemove: (identifier: string) => void;
  onUpdate: (updated: AttributeModel) => void;
};

// `EntityReviewStep` component props, the final `DialogImport` review step for an Entity import
export type DialogImportEntityReviewStepProps = {
  reviewEntities: ImportReview[];
};

// `AttributeReviewStep` component props, the final `DialogImport` review step for a Attribute import
export type DialogImportAttributeReviewStepProps = {
  reviewAttributes: ImportReview[];
};

// ---------------------------------------------------------------------------
// Component props: Attribute pages
// ---------------------------------------------------------------------------

// `AttributeBreadcrumb` component props, the breadcrumb trail and name tag
export type AttributeBreadcrumbProps = {
  loading: boolean;
  workspaceName: string;
  onNavigateHome: () => void;
  onNavigateAttributes: () => void;
  archived: boolean;
  name: string;
};

// `AttributeOverviewCard` component props, Attribute Name/Owner/Timestamp/Visibility/Description fields
export type AttributeOverviewCardProps = {
  name: string;
  onNameChange?: (value: string) => void;
  nameReadOnly: boolean;
  owner: string;
  timestamp: string;
  visibilityIsPublic: boolean;
  description: string;
  onDescriptionChange?: (value: string) => void;
  descriptionReadOnly: boolean;
  workspace?: string;
  isPublic?: boolean;
};

// `AttributeUsageTable` component props, Entities using an Attribute
export type AttributeUsageTableProps = {
  attributeUsage: AttributeUsage[];
  onViewEntity: (entityId: string) => void;
  workspace?: string;
  isPublic?: boolean;
};

// ---------------------------------------------------------------------------
// Component props: Entity pages and links
// ---------------------------------------------------------------------------

// `Links` component props
export type LinksProps = {
  links: ILink[];
  setLinks: (value: React.SetStateAction<ILink[]>) => void;
  viewOnly?: boolean;
  sourceName?: string;
  sourceId?: string;
};

// Utility type to specify the props of `LinksGraphNode`
export type LinksGraphNodeProps = LinksGraphNodeInput & {
  onView: (id: string) => void;
};

// `EntityBreadcrumb` component props, the breadcrumb trail and name tag shared by the Entity detail page
export type EntityBreadcrumbProps = {
  loading: boolean;
  workspaceName: string;
  onNavigateHome: () => void;
  onNavigateEntities: () => void;
  archived: boolean;
  name: string;
};

// `EntityOverviewCard` component props, Entity Name/Secondary Identifier/Owner/Timestamp/Visibility/Description fields
export type EntityOverviewCardProps = {
  name: string;
  onNameChange?: (value: string) => void;
  nameReadOnly: boolean;

  showSecondaryIdentifier: boolean;
  onShowSecondaryIdentifierChange?: (value: boolean) => void;
  showSecondaryIdentifierDisabled: boolean;

  secondaryIdentifierValue: string;
  onSecondaryIdentifierChange?: (value: string) => void;
  secondaryIdentifierReadOnly: boolean;
  secondaryIdentifierDisabled: boolean;

  identifierFormat: string[];
  onIdentifierFormatChange?: (value: string[]) => void;
  identifierFormats: ListCollection;
  identifierFormatDisabled: boolean;
  customIdentifierFormats: IdentifierFormatModel[];
  // Value-field validation errors are only meaningful when the field is actually editable
  showValidationErrors: boolean;

  owner: string;
  created: string;
  visibilityIsPublic: boolean;

  description: string;
  onDescriptionChange?: (value: string) => void;
  descriptionReadOnly: boolean;

  workspace?: string;
  isPublic?: boolean;
};

// `EntityAttributesTable` component props, the Attributes on an Entity
export type EntityAttributesTableProps = {
  attributes: AttributeModel[];
  availableAttributes: AttributeModel[];
  editing: boolean;
  entityName: string;
  onUpdate: (updated: AttributeModel) => void;
  onRemove?: (id: string) => void;
  onAddClick?: () => void;
  workspace?: string;
  isPublic?: boolean;
};

// `EntityAttributeNameCell` component props, the "Name" column cell within `EntityAttributesTable`
export type EntityAttributeNameCellProps = {
  attribute: AttributeModel;
  availableAttributes: AttributeModel[];
  editing: boolean;
  entityName: string;
  onUpdate: (updated: AttributeModel) => void;
  onRemove?: (id: string) => void;
  workspace?: string;
  isPublic?: boolean;
};

// `CreateEntityAttributesTable` component props, the Entity creation flow's attributes table
export type CreateEntityAttributesTableProps = {
  attributes: AttributeModel[];
  availableAttributes: AttributeModel[];
  onUpdate: (updated: AttributeModel) => void;
  onRemove: (id: string) => void;
  onAddClick: () => void;
};

// `CreateEntityAttributeNameCell` component props, the "Name" column cell within `CreateEntityAttributesTable`
export type CreateEntityAttributeNameCellProps = {
  attribute: AttributeModel;
  availableAttributes: AttributeModel[];
  onUpdate: (updated: AttributeModel) => void;
  onRemove: (id: string) => void;
};

// `EntityProjectsTable` component props, the Projects an Entity belongs to
export type EntityProjectsTableProps = {
  projects: string[];
  editing: boolean;
  workspace?: string;
  isPublic?: boolean;
  onView: (projectId: string) => void;
  onRemove?: (projectId: string) => void;
  onRemoveMany?: (projectIds: string[]) => void;
  onAddClick?: () => void;
};

// `EntityAttachmentsTable` component props, the files attached to an Entity
export type EntityAttachmentsTableProps = {
  attachments: IGenericItem[];
  editing: boolean;
  workspace?: string;
  isPublic?: boolean;
  onDownload: (id: string, name: string) => void;
  onRename?: (id: string, name: string) => void;
  onRemove?: (id: string) => void;
  onRemoveMany?: (ids: string[]) => void;
  onUploadClick?: () => void;
};

// ---------------------------------------------------------------------------
// Component props: Project pages
// ---------------------------------------------------------------------------

// `ProjectBreadcrumb` component props, Project breadcrumb trail and name tag
export type ProjectBreadcrumbProps = {
  loading: boolean;
  workspaceName: string;
  onNavigateHome: () => void;
  onNavigateProjects: () => void;
  archived: boolean;
  name: string;
};

// `ProjectOverviewCard` component props, Project Name/Owner/Timestamp/Visibility/Description fields
export type ProjectOverviewCardProps = {
  name: string;
  onNameChange?: (value: string) => void;
  nameReadOnly: boolean;
  owner: string;
  created: string;
  visibilityIsPublic: boolean;
  description: string;
  onDescriptionChange?: (value: string) => void;
  descriptionReadOnly: boolean;
  workspace?: string;
  isPublic?: boolean;
};

// `ProjectEntitiesTable` component props, the Entities within a Project, shared by the Project detail page
export type ProjectEntitiesTableProps = {
  entities: ProjectEntityTableRow[];
  entityCount: number;
  editing: boolean;
  workspace?: string;
  isPublic?: boolean;
  onView: (entityId: string) => void;
  onRemove?: (entityId: string) => void;
  onRemoveMany?: (entityIds: string[]) => void;
  onAddClick?: () => void;
  addDisabled?: boolean;
};

// ---------------------------------------------------------------------------
// Component props: search
// ---------------------------------------------------------------------------

// `SearchQueryBuilder` component props
export type SearchQueryBuilderProps = {
  query: SearchQuery;
  onQueryChange: (query: SearchQuery) => void;
  isValid: boolean;
  onSearch: () => void;
  onClear: () => void;
};

// `SearchRuleSelect` component props
export type SearchRuleSelectProps = {
  value: string;
  collection: ListCollection<string>;
  onChange: (value: string) => void;
  minW?: string;
  placeholder?: string;
  testId?: string;
};

// `SelectSearch` component props
export type SelectSearchProps = {
  id?: string;
  value: IGenericItem;
  resultType: "entity" | "project" | "institution";
  placeholder?: string;
  defaultOption?: string;
  onChange?: (value: any) => void;
  disabled?: boolean;
  isEmbedded?: boolean;
};

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

// Names of the icons available to `Icon`
export type IconNames =
  // Default
  | "unknown"

  // Locations
  | "dashboard"
  | "entity"
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
  | "url"
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

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

// Client route and the check verifying access to it
export type ClientPath = {
  name: string;
  verify: (page: Page, granted: boolean) => Promise<void>;
};
